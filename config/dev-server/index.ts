import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { type RequestHandler } from 'msw';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_SERVER_PORT = 1337;
const ROOT_DIR = path.resolve(__dirname, '../..');
const MANIFEST_PATH = path.resolve(ROOT_DIR, '.launcher/current-manifest.json');
const CONFIGS_PATH = path.resolve(ROOT_DIR, '.launcher/configs.json');

/**
 * Фильтрует заголовки запроса для проксирования
 * Удаляет заголовки, которые могут конфликтовать или мешать установке cookies
 */
function filterHeadersForProxy(headers: any): Record<string, any> {
  const filtered = { ...headers };
  delete filtered.host; // axios сам установит правильный host
  delete filtered['content-length']; // axios сам пересчитает

  // КРИТИЧНО: Удаляем Accept: application/json, чтобы бэкенд считал клиента браузером
  // Иначе бэкенд не устанавливает cookies (см. utils.IsBrowserClient в Go коде)
  delete filtered.accept;

  return filtered;
}

/**
 * Копирует заголовки ответа от бэкенда к клиенту
 * Пропускает заголовки, которые могут конфликтовать с Express
 */
function copyResponseHeaders(backendHeaders: any, res: Response): void {
  Object.entries(backendHeaders).forEach(([key, value]) => {
    if (value) {
      // Пропускаем заголовки, которые могут конфликтовать с Express
      // content-encoding нужно пропустить, т.к. axios автоматически декодирует gzip/deflate
      const skipHeaders = [
        'transfer-encoding',
        'connection',
        'content-length',
        'content-encoding',
        'etag', // Express генерирует свой etag
        'content-type', // Express установит правильный content-type через .json()
      ];
      if (skipHeaders.includes(key.toLowerCase())) {
        return;
      }

      // Пропускаем Vary: Accept-Encoding, т.к. мы не передаем content-encoding
      if (
        key.toLowerCase() === 'vary' &&
        String(value).includes('Accept-Encoding')
      ) {
        return;
      }

      // Set-Cookie может быть массивом
      if (key.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
        value.forEach((cookie) => {
          // Модифицируем cookie для работы с прокси
          // Убираем Secure flag если есть, т.к. прокси работает по http
          const modifiedCookie = cookie.replace(/;\s*Secure/gi, '');
          res.append('Set-Cookie', modifiedCookie);
        });
      } else {
        res.setHeader(key, String(value));
      }
    }
  });
}

interface Manifest {
  modules: Array<{
    name: string;
    loadType: string;
    loadPriority: number;
    remoteEntry: string;
    dependencies?: string[];
    featureFlags?: string[];
    accessPermissions?: string[];
  }>;
  data?: {
    features?: Record<string, boolean>;
    permissions?: Record<string, boolean>;
    params?: Record<string, unknown>;
  };
  timestamp?: string;
}

interface Config {
  version: string;
  lastUsed: string | null;
  remoteServerUrl: string;
  // Глобальные настройки (fallback)
  apiUrl?: string;
  useLocalMocks?: boolean;
  logLevel?: string;
  appStartEndpoint?: string;
  configurations: Record<
    string,
    {
      name: string;
      description?: string;
      modules: Record<
        string,
        {
          source: string;
          priority?: number;
          useLocalMocks?: boolean;
          path?: string;
          url?: string;
          customUrl?: string;
          apiUrl?: string;
        }
      >;
      settings?: {
        logLevel?: string;
        useLocalMocks?: boolean;
        apiUrl?: string;
      };
    }
  >;
}

/**
 * Загружает манифест из файла
 */
function loadManifest(): Manifest | null {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return null;
    }
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch (error) {
    return null;
  }
}

/**
 * Загружает конфигурацию из файла
 */
function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIGS_PATH)) {
      return null;
    }
    const content = fs.readFileSync(CONFIGS_PATH, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    return null;
  }
}

/**
 * Получает активную конфигурацию
 */
function getActiveConfig(): Config['configurations'][string] | null {
  const config = loadConfig();
  if (!config || !config.lastUsed) {
    return null;
  }
  return config.configurations[config.lastUsed] || null;
}

/**
 * Загружает handlers модуля напрямую из mocks/index.ts
 * Поддерживает как локальные модули (host/src/modules), так и MFE модули (packages)
 * Это позволяет избежать проблем с декораторами в module_config.ts
 */
async function loadModuleHandlers(
  moduleName: string,
): Promise<RequestHandler[] | null> {
  // Сначала пробуем загрузить из локального модуля (host/src/modules)
  const localMocksPath = path.resolve(
    ROOT_DIR,
    'host',
    'src',
    'modules',
    moduleName,
    'config',
    'mocks',
    'index.ts',
  );

  if (fs.existsSync(localMocksPath)) {
    try {
      const moduleUrl = `file://${localMocksPath}?${Date.now()}`;
      const module = await import(moduleUrl);
      if (module.handlers && Array.isArray(module.handlers)) {
        return module.handlers;
      }
    } catch (error) {
      // Игнорируем ошибки и пробуем MFE модуль
    }
  }

  // Если не найдено в локальных модулях, пробуем MFE модуль (packages)
  const mfeMocksPath = path.resolve(
    ROOT_DIR,
    'packages',
    moduleName,
    'src',
    'config',
    'mocks',
    'index.ts',
  );

  if (!fs.existsSync(mfeMocksPath)) {
    return null;
  }

  try {
    // Импортируем handlers напрямую из mocks/index.ts
    // Это проще, чем импортировать весь module_config.ts
    const moduleUrl = `file://${mfeMocksPath}?${Date.now()}`;
    const module = await import(moduleUrl);
    if (module.handlers && Array.isArray(module.handlers)) {
      return module.handlers;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Определяет модуль по пути запроса
 * Автоматически извлекает эндпоинты из загруженных handlers
 * Поддерживает MSW v2 структуру handlers
 */
function getModuleByPath(
  urlPath: string,
  moduleHandlers: Map<string, RequestHandler[]>,
): string | null {
  // Проходим по всем модулям с handlers
  for (const [moduleName, handlers] of moduleHandlers.entries()) {
    // Проверяем каждый handler
    for (const handler of handlers) {
      const handlerAny = handler as any;
      const handlerInfo = handlerAny.info || {};

      // В MSW v2 path может быть строкой или объектом PathPattern
      let handlerPath = '';
      if (typeof handlerInfo.path === 'string') {
        handlerPath = handlerInfo.path;
      } else if (handlerInfo.path && typeof handlerInfo.path === 'object') {
        // PathPattern объект - пробуем извлечь строку разными способами
        if (handlerInfo.path.pathname) {
          handlerPath = handlerInfo.path.pathname; // MSW v2 PathPattern
        } else if (handlerInfo.path.pattern) {
          handlerPath = handlerInfo.path.pattern; // Альтернативное свойство
        } else {
          handlerPath = String(handlerInfo.path); // Fallback
        }
      }

      // Проверяем, совпадает ли путь запроса с путем handler
      if (handlerPath && urlPath.startsWith(handlerPath)) {
        return moduleName;
      }
    }
  }

  return null;
}

/**
 * Обогащает ответ эндпоинта стартового манифеста данными из манифеста.
 * Приводит remoteEntry к абсолютному URL с учетом remoteServerUrl.
 */
function enrichAppStartResponse(
  originalResponse: any,
  remoteServerUrl: string,
): any {
  const manifest = loadManifest();
  if (!manifest) {
    return originalResponse;
  }

  // Нормализуем remoteEntry до абсолютного URL при наличии remoteServerUrl
  const normalizeRemoteEntry = (remoteEntry?: string) => {
    if (!remoteEntry) return remoteEntry;

    // Уже абсолютный URL
    if (/^https?:\/\//i.test(remoteEntry)) {
      return remoteEntry;
    }

    // Нет настроенного удаленного хоста — оставляем как есть
    if (!remoteServerUrl || remoteServerUrl.trim() === '') {
      return remoteEntry;
    }

    try {
      const base = remoteServerUrl.trim().replace(/\/+$/, '');
      return new URL(remoteEntry, `${base}/`).toString();
    } catch {
      // В случае ошибки парсинга не ломаем ответ
      return remoteEntry;
    }
  };

  // Если ответ уже имеет структуру с data, обогащаем её
  if (originalResponse.data) {
    // Объединяем features
    if (manifest.data?.features) {
      originalResponse.data.features = {
        ...originalResponse.data.features,
        ...manifest.data.features,
      };
    }

    // Объединяем permissions
    if (manifest.data?.permissions) {
      originalResponse.data.permissions = {
        ...originalResponse.data.permissions,
        ...manifest.data.permissions,
      };
    }

    // Объединяем params
    if (manifest.data?.params) {
      originalResponse.data.params = {
        ...originalResponse.data.params,
        ...manifest.data.params,
      };
    }

    // Мержим модули: backend + manifest (manifest может добавлять/оверрайдить)
    if (originalResponse.data.modules || manifest.modules) {
      const merged = new Map<string, any>();

      // Сначала бэкендовые модули
      (originalResponse.data.modules || []).forEach((module: any) => {
        merged.set(module.name, {
          ...module,
          remoteEntry: normalizeRemoteEntry(module.remoteEntry),
        });
      });

      // Затем модули из манифеста (могут добавлять или переопределять)
      (manifest.modules || []).forEach((module) => {
        merged.set(module.name, {
          name: module.name,
          loadType: module.loadType,
          loadPriority: module.loadPriority,
          remoteEntry: normalizeRemoteEntry(module.remoteEntry),
          dependencies: module.dependencies || [],
          featureFlags: module.featureFlags || [],
          accessPermissions: module.accessPermissions || [],
        });
      });

      originalResponse.data.modules = Array.from(merged.values());
    }
  }

  return originalResponse;
}

/**
 * Создает и запускает dev server
 */
async function createDevServer() {
  const app = express();

  // CORS middleware - поддерживает все HTTP методы
  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
      ],
      credentials: false,
    }),
  );

  // Парсинг JSON body для POST/PUT/PATCH запросов
  app.use(express.json());

  // Парсинг URL-encoded body
  app.use(express.urlencoded({ extended: true }));

  // Загружаем конфигурацию и манифест
  const config = loadConfig();
  const activeConfig = getActiveConfig();
  const manifest = loadManifest();

  if (!config || !activeConfig) {
    process.exit(1);
  }

  // Настройки для host
  // Приоритет: settings.apiUrl > глобальный apiUrl
  const hostUseLocalMocks = activeConfig.settings?.useLocalMocks !== false;
  const hostApiUrl = activeConfig.settings?.apiUrl || config.apiUrl || '';
  const remoteServerUrl = config.remoteServerUrl || '';
  const appStartEndpoint = config.appStartEndpoint || '/app/start';

  // Загружаем handlers для host, если моки включены
  let hostHandlers: RequestHandler[] = [];
  if (hostUseLocalMocks) {
    try {
      const hostMocksUrl = `file://${path.resolve(ROOT_DIR, 'host/src/mocks/index.ts')}`;
      const hostMocks = await import(hostMocksUrl);
      if (hostMocks.handlers && Array.isArray(hostMocks.handlers)) {
        hostHandlers = hostMocks.handlers;
      }
    } catch (error) {
      // Игнорируем ошибки загрузки моков
    }
  }

  // Загружаем handlers для модулей

  // 1. Собираем список модулей из конфигурации (MFE модули из packages/)
  const configuredModules = Object.entries(activeConfig.modules || {});

  // 2. Собираем список локальных модулей из host/src/modules/
  const localModulesPath = path.resolve(ROOT_DIR, 'host/src/modules');
  let localModules: string[] = [];
  try {
    if (fs.existsSync(localModulesPath)) {
      const entries = fs.readdirSync(localModulesPath, { withFileTypes: true });
      localModules = entries
        .filter(
          (entry) =>
            entry.isDirectory() &&
            !entry.name.startsWith('.') &&
            entry.name !== 'node_modules',
        )
        .map((entry) => entry.name);
      console.log(
        `[DevServer] Found ${localModules.length} local module(s): ${localModules.join(', ')}`,
      );
    }
  } catch (error) {
    console.error('[DevServer] Error scanning local modules:', error);
  }

  const moduleHandlers = new Map<string, RequestHandler[]>();

  // 3. Загружаем handlers для модулей из конфигурации (MFE)
  for (const [moduleName, moduleConfig] of configuredModules) {
    if (moduleConfig.useLocalMocks !== false) {
      const handlers = await loadModuleHandlers(moduleName);
      if (handlers && handlers.length > 0) {
        moduleHandlers.set(moduleName, handlers);
        console.log(
          `[DevServer] Loaded ${handlers.length} mock handler(s) for MFE module: ${moduleName}`,
        );
      } else {
        console.log(
          `[DevServer] No mock handlers found for MFE module: ${moduleName}`,
        );
      }
    } else {
      console.log(`[DevServer] Mocks disabled for MFE module: ${moduleName}`);
    }
  }

  // 4. Загружаем handlers для локальных модулей (если моки включены глобально)
  if (hostUseLocalMocks) {
    for (const moduleName of localModules) {
      // Пропускаем модули, которые уже загружены из конфигурации
      if (moduleHandlers.has(moduleName)) {
        continue;
      }

      const handlers = await loadModuleHandlers(moduleName);
      if (handlers && handlers.length > 0) {
        moduleHandlers.set(moduleName, handlers);
        console.log(
          `[DevServer] Loaded ${handlers.length} mock handler(s) for local module: ${moduleName}`,
        );
      }
    }
  }

  // Обработка эндпоинта стартового манифеста (настраиваемый)
  app.all(appStartEndpoint, async (req: Request, res: Response) => {
    try {
      if (hostUseLocalMocks && hostHandlers.length > 0) {
        // Используем данные напрямую из appStartData.json
        try {
          const appStartDataPath = path.resolve(
            ROOT_DIR,
            'host/src/mocks/data/appStartData.json',
          );
          const appStartDataContent = fs.readFileSync(
            appStartDataPath,
            'utf-8',
          );
          const data = JSON.parse(appStartDataContent);
          const enriched = enrichAppStartResponse(data, remoteServerUrl);
          console.log(
            `[DevServer] ${req.method} ${appStartEndpoint} → MOCK (host) [200]`,
          );
          res.status(200).json(enriched);
          return;
        } catch (error) {
          // Игнорируем ошибки загрузки appStartData
        }
      }

      // Если моки выключены, проксируем на реальный сервер
      if (hostApiUrl) {
        const targetUrl = `${hostApiUrl.replace(/\/$/, '')}${appStartEndpoint}`;
        const filteredHeaders = filterHeadersForProxy(req.headers);

        // Для OPTIONS запросов (preflight)
        if (req.method === 'OPTIONS') {
          try {
            const response = await axios({
              method: 'OPTIONS',
              url: targetUrl,
              headers: filteredHeaders,
              params: req.query,
            });
            copyResponseHeaders(response.headers, res);
            res.status(response.status).send();
            return;
          } catch (error: any) {
            res.status(204).send();
            return;
          }
        }

        // Для остальных методов
        // validateStatus: 304 (Not Modified) - это нормальный ответ, не ошибка
        const response = await axios({
          method: req.method as any,
          url: targetUrl,
          headers: filteredHeaders,
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
            ? req.body
            : undefined,
          params: req.query,
          validateStatus: (status) => {
            // Считаем успешными статусы 200-299 и 304 (Not Modified)
            return (status >= 200 && status < 300) || status === 304;
          },
        });

        console.log(
          `[DevServer] ${req.method} ${appStartEndpoint} → PROXY (host) ${targetUrl} [${response.status}]`,
        );

        // Копируем заголовки из ответа
        copyResponseHeaders(response.headers, res);

        // Для 304 (Not Modified) обогащаем базовым ответом
        if (response.status === 304) {
          const baseResponse = {
            status: 'success',
            data: {
              features: {},
              permissions: {},
              params: {},
              modules: [],
            },
          };
          const enriched = enrichAppStartResponse(
            baseResponse,
            remoteServerUrl,
          );
          res.status(304).json(enriched);
          return;
        }

        const enriched = enrichAppStartResponse(response.data, remoteServerUrl);
        res.status(response.status).json(enriched);
        return;
      }

      // Если нет API URL, возвращаем базовый ответ
      const baseResponse = {
        status: 'success',
        data: {
          features: {},
          permissions: {},
          params: {},
          modules: [],
        },
      };
      const enriched = enrichAppStartResponse(baseResponse, remoteServerUrl);
      res.json(enriched);
    } catch (error: any) {
      // Если ошибка связана с ответом (например, 304 без validateStatus)
      if (error.response) {
        const status = error.response.status;
        // Копируем заголовки из ответа
        copyResponseHeaders(error.response.headers, res);

        // Для 304 (Not Modified) обогащаем базовым ответом
        if (status === 304) {
          const baseResponse = {
            status: 'success',
            data: {
              features: {},
              permissions: {},
              params: {},
              modules: [],
            },
          };
          const enriched = enrichAppStartResponse(
            baseResponse,
            remoteServerUrl,
          );
          res.status(304).json(enriched);
          return;
        }

        // Для других статусов отправляем данные
        const enriched = enrichAppStartResponse(
          error.response.data || {},
          remoteServerUrl,
        );
        res.status(status).json(enriched);
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  // Обработка всех остальных запросов
  app.all('*', async (req: Request, res: Response) => {
    const urlPath = req.path;

    // Определяем модуль по пути, используя загруженные handlers
    const moduleName = getModuleByPath(urlPath, moduleHandlers);

    // Если модуль не распознан — пробуем просто проксировать на backend
    if (!moduleName) {
      if (hostApiUrl) {
        try {
          const targetUrl = `${hostApiUrl.replace(/\/$/, '')}${urlPath}`;
          const filteredHeaders = filterHeadersForProxy(req.headers);
          const response = await axios({
            method: req.method as any,
            url: targetUrl,
            headers: filteredHeaders,
            data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
              ? req.body
              : undefined,
            params: req.query,
            validateStatus: () => true, // Принимаем любой статус
            withCredentials: true, // Важно для cookies
            maxRedirects: 0, // Не следуем редиректам автоматически
          });

          console.log(
            `[DevServer] ${req.method} ${urlPath} → PROXY (no module) ${targetUrl} [${response.status}]`,
          );

          // Копируем заголовки от бэкенда к клиенту
          copyResponseHeaders(response.headers, res);

          // Определяем Content-Type и отправляем данные соответственно
          const contentType = response.headers['content-type'] || '';

          // Убедимся что отправляем объект для JSON
          if (contentType.includes('application/json')) {
            // Если data строка, пытаемся распарсить
            const jsonData =
              typeof response.data === 'string'
                ? JSON.parse(response.data)
                : response.data;

            res.status(response.status).json(jsonData);
          } else if (contentType.includes('text/')) {
            res.status(response.status).send(response.data);
          } else {
            res.status(response.status).send(response.data);
          }
        } catch (error: any) {
          const status = error.response?.status || 500;
          res
            .status(status)
            .json(error.response?.data || { error: 'Proxy error' });
        }
      } else {
        res.status(404).json({ error: 'Not found' });
      }
      return;
    }

    const moduleConfig = activeConfig.modules[moduleName];

    // Проверяем, является ли это локальным модулем с handlers
    const isLocalModuleWithHandlers =
      moduleHandlers.has(moduleName) && !moduleConfig;

    if (!moduleConfig && !isLocalModuleWithHandlers) {
      // Если модуль отсутствует в конфиге, но backend задан — проксируем
      if (hostApiUrl) {
        try {
          const targetUrl = `${hostApiUrl.replace(/\/$/, '')}${urlPath}`;
          const response = await axios({
            method: req.method as any,
            url: targetUrl,
            headers: req.headers,
            data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
              ? req.body
              : undefined,
            params: req.query,
            validateStatus: () => true,
          });

          console.log(
            `[DevServer] ${req.method} ${urlPath} → PROXY  ${targetUrl} [${response.status}]`,
          );

          // Копируем все заголовки включая Set-Cookie
          copyResponseHeaders(response.headers, res);
          const contentType = response.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            res.status(response.status).json(response.data);
          } else {
            res.status(response.status).send(response.data);
          }
        } catch (error: any) {
          const status = error.response?.status || 500;
          res
            .status(status)
            .json(error.response?.data || { error: 'Proxy error' });
        }
        return;
      }

      res.status(404).json({ error: 'Module not configured' });
      return;
    }

    // Для локальных модулей с handlers используем моки, если глобально включены
    // Для модулей из конфигурации проверяем useLocalMocks
    const useLocalMocks = isLocalModuleWithHandlers
      ? hostUseLocalMocks
      : moduleConfig.useLocalMocks !== false;

    try {
      if (useLocalMocks) {
        // Проверяем, есть ли handlers для этого модуля
        const handlers = moduleHandlers.get(moduleName);
        if (handlers && handlers.length > 0) {
          // Ищем подходящий handler и вызываем его напрямую
          try {
            // Создаем URL для матчинга
            const url = new URL(urlPath, 'http://localhost');
            Object.entries(req.query).forEach(([key, value]) => {
              if (value) {
                url.searchParams.append(key, String(value));
              }
            });

            // Подготавливаем body
            let requestBody: string | undefined = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
              if (req.body) {
                requestBody =
                  typeof req.body === 'string'
                    ? req.body
                    : JSON.stringify(req.body);
              }
            }

            // Создаем Request для передачи в handler
            const mockRequest = new Request(url.toString(), {
              method: req.method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: requestBody,
            });

            // Ищем подходящий handler по методу и пути
            let matchedResponse: globalThis.Response | null = null;
            for (const handler of handlers) {
              // Проверяем совпадение метода и пути
              // MSW handler.info содержит header (method) и path
              const handlerAny = handler as any;
              const handlerInfo = handlerAny.info || {};
              const handlerMethod = (
                handlerInfo.method ||
                handlerInfo.header ||
                'GET'
              ).toUpperCase();

              // В MSW v2 path может быть строкой или объектом PathPattern
              let handlerPath = '';
              if (typeof handlerInfo.path === 'string') {
                handlerPath = handlerInfo.path;
              } else if (
                handlerInfo.path &&
                typeof handlerInfo.path === 'object'
              ) {
                // PathPattern объект - пробуем извлечь строку разными способами
                if (handlerInfo.path.pathname) {
                  handlerPath = handlerInfo.path.pathname; // MSW v2 PathPattern
                } else if (handlerInfo.path.pattern) {
                  handlerPath = handlerInfo.path.pattern; // Альтернативное свойство
                } else {
                  handlerPath = String(handlerInfo.path); // Fallback
                }
              }

              // Проверяем метод
              if (
                handlerMethod !== 'ALL' &&
                handlerMethod !== req.method.toUpperCase()
              ) {
                continue;
              }

              // Проверяем путь (простое сравнение)
              if (urlPath === handlerPath || urlPath.startsWith(handlerPath)) {
                // Вызываем resolver напрямую
                const resolver = handlerAny.resolver;
                if (typeof resolver === 'function') {
                  const result = await resolver({
                    request: mockRequest,
                    params: {},
                    cookies: {},
                  });
                  if (result instanceof globalThis.Response) {
                    matchedResponse = result;
                    break;
                  }
                }
              }
            }

            if (matchedResponse) {
              const contentType =
                matchedResponse.headers.get('content-type') || '';
              let data: any;

              if (contentType.includes('application/json')) {
                data = await matchedResponse.json();
              } else if (contentType.includes('text/')) {
                data = await matchedResponse.text();
              } else {
                data = await matchedResponse.arrayBuffer();
              }

              matchedResponse.headers.forEach((value: string, key: string) => {
                res.setHeader(key, value);
              });

              const status = matchedResponse.status;
              console.log(
                `[DevServer] ${req.method} ${urlPath} → MOCK (${moduleName}) [${status}]`,
              );

              if (contentType.includes('application/json')) {
                res.status(status).json(data);
              } else if (contentType.includes('text/')) {
                res.status(status).send(data);
              } else {
                res.status(status).send(Buffer.from(data));
              }
              return;
            }
          } catch (error) {
            // Игнорируем ошибки обработчиков
          }
          // Если мока нет — пробуем проксировать на backend
          if (hostApiUrl) {
            try {
              const targetUrl = `${hostApiUrl.replace(/\/$/, '')}${urlPath}`;
              const response = await axios({
                method: req.method as any,
                url: targetUrl,
                headers: req.headers,
                data: ['POST', 'PUT', 'PATCH'].includes(
                  req.method.toUpperCase(),
                )
                  ? req.body
                  : undefined,
                params: req.query,
                validateStatus: () => true,
              });

              const proxyTargetUrl = `${hostApiUrl.replace(/\/$/, '')}${urlPath}`;
              console.log(
                `[DevServer] ${req.method} ${urlPath} → PROXY ${proxyTargetUrl} [${response.status}]`,
              );

              // Копируем все заголовки включая Set-Cookie
              copyResponseHeaders(response.headers, res);

              const contentType = response.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                res.status(response.status).json(response.data);
              } else {
                res.status(response.status).send(response.data);
              }
              return;
            } catch (error: any) {
              const status = error.response?.status || 500;
              res
                .status(status)
                .json(error.response?.data || { error: 'Proxy error' });
              return;
            }
          }
          res.status(404).json({ error: 'No matching mock handler found' });
          return;
        } else {
          // Нет моков — пробуем проксировать на backend
          if (hostApiUrl) {
            try {
              const targetUrl = `${hostApiUrl.replace(/\/$/, '')}${urlPath}`;
              const response = await axios({
                method: req.method as any,
                url: targetUrl,
                headers: req.headers,
                data: ['POST', 'PUT', 'PATCH'].includes(
                  req.method.toUpperCase(),
                )
                  ? req.body
                  : undefined,
                params: req.query,
                validateStatus: () => true,
              });

              console.log(
                `[DevServer] ${req.method} ${urlPath} → PROXY ${targetUrl} [${response.status}]`,
              );

              // Копируем все заголовки включая Set-Cookie
              copyResponseHeaders(response.headers, res);

              const contentType = response.headers['content-type'] || '';
              if (contentType.includes('application/json')) {
                res.status(response.status).json(response.data);
              } else {
                res.status(response.status).send(response.data);
              }
              return;
            } catch (error: any) {
              const status = error.response?.status || 500;
              res
                .status(status)
                .json(error.response?.data || { error: 'Proxy error' });
              return;
            }
          }
          res.status(404).json({ error: 'No mock handlers available' });
          return;
        }
      } else {
        // Проксируем на удаленный сервер
        // Для локальных модулей без конфигурации просто возвращаем 404
        if (isLocalModuleWithHandlers) {
          res.status(404).json({
            error: `Mocks disabled for local module ${moduleName} and no backend configured`,
          });
          return;
        }

        // Поддерживаем все HTTP методы: GET, POST, PUT, DELETE, PATCH, OPTIONS
        // Приоритет: apiUrl модуля > customUrl модуля > settings.apiUrl > глобальный apiUrl
        // url модуля может указывать на remoteEntry.js, поэтому явно исключаем такие ссылки
        const isRemoteEntryUrl =
          typeof moduleConfig.url === 'string' &&
          /remoteEntry\.js($|\?)/.test(moduleConfig.url);
        const apiUrl =
          moduleConfig.apiUrl ||
          moduleConfig.customUrl ||
          (!isRemoteEntryUrl ? moduleConfig.url : undefined) ||
          activeConfig.settings?.apiUrl ||
          config.apiUrl ||
          '';
        if (!apiUrl) {
          res.status(500).json({
            error: `API URL not configured for module ${moduleName}`,
          });
          return;
        }

        const targetUrl = `${apiUrl.replace(/\/$/, '')}${urlPath}`;

        // Для OPTIONS запросов (preflight)
        if (req.method === 'OPTIONS') {
          try {
            const response = await axios({
              method: 'OPTIONS',
              url: targetUrl,
              headers: req.headers,
              params: req.query,
            });
            console.log(
              `[DevServer] ${req.method} ${urlPath} → PROXY ${targetUrl} [${response.status}]`,
            );
            copyResponseHeaders(response.headers, res);
            res.status(response.status).send();
            return;
          } catch (error: any) {
            console.log(
              `[DevServer] ${req.method} ${urlPath} → PROXY ${targetUrl} [204]`,
            );
            res.status(204).send();
            return;
          }
        }

        // Для остальных методов проксируем с body (если есть)
        // validateStatus: 304 (Not Modified) - это нормальный ответ, не ошибка
        const response = await axios({
          method: req.method as any,
          url: targetUrl,
          headers: req.headers,
          // Передаем body только для методов, которые его поддерживают
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
            ? req.body
            : undefined,
          params: req.query,
          validateStatus: (status) => {
            // Считаем успешными статусы 200-299 и 304 (Not Modified)
            return (status >= 200 && status < 300) || status === 304;
          },
        });

        console.log(
          `[DevServer] ${req.method} ${urlPath} → PROXY ${targetUrl} [${response.status}]`,
        );

        // Копируем заголовки из ответа
        copyResponseHeaders(response.headers, res);

        // Для 304 (Not Modified) не нужно тело ответа
        if (response.status === 304) {
          res.status(304).send();
          return;
        }

        // Определяем Content-Type ответа и отправляем соответствующим образом
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          res.status(response.status).json(response.data);
        } else if (contentType.includes('text/')) {
          res.status(response.status).send(response.data);
        } else {
          res.status(response.status).send(response.data);
        }
        return;
      }
    } catch (error: any) {
      // Если ошибка связана с ответом (например, 304 без validateStatus)
      if (error.response) {
        const status = error.response.status;
        // Копируем заголовки из ответа
        copyResponseHeaders(error.response.headers, res);

        // Для 304 (Not Modified) не нужно тело ответа
        if (status === 304) {
          res.status(304).send();
          return;
        }

        // Для других статусов отправляем данные
        res.status(status).json(error.response.data || {});
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  const server = app.listen(DEV_SERVER_PORT);

  // Обработка сигналов для корректного завершения
  const gracefulShutdown = () => {
    server.close(() => {
      process.exit(0);
    });

    // Принудительное завершение через 5 секунд
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => gracefulShutdown());
  process.on('SIGTERM', () => gracefulShutdown());
}

// Запускаем сервер
createDevServer().catch(() => {
  process.exit(1);
});
