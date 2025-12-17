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
      console.warn(`[DevServer] Manifest not found: ${MANIFEST_PATH}`);
      return null;
    }
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch (error) {
    console.error(`[DevServer] Failed to load manifest:`, error);
    return null;
  }
}

/**
 * Загружает конфигурацию из файла
 */
function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIGS_PATH)) {
      console.warn(`[DevServer] Config not found: ${CONFIGS_PATH}`);
      return null;
    }
    const content = fs.readFileSync(CONFIGS_PATH, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    console.error(`[DevServer] Failed to load config:`, error);
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
 * Это позволяет избежать проблем с декораторами в module_config.ts
 */
async function loadModuleHandlers(
  moduleName: string,
): Promise<RequestHandler[] | null> {
  const mocksPath = path.resolve(
    ROOT_DIR,
    'packages',
    moduleName,
    'src',
    'config',
    'mocks',
    'index.ts',
  );

  if (!fs.existsSync(mocksPath)) {
    return null;
  }

  try {
    // Импортируем handlers напрямую из mocks/index.ts
    // Это проще, чем импортировать весь module_config.ts
    const moduleUrl = `file://${mocksPath}?${Date.now()}`;
    const module = await import(moduleUrl);
    if (module.handlers && Array.isArray(module.handlers)) {
      return module.handlers;
    }
    return null;
  } catch (error) {
    console.error(
      `[DevServer] Failed to load handlers for ${moduleName}:`,
      error,
    );
    return null;
  }
}

/**
 * Определяет модуль по пути запроса
 * Пока используем простую логику: проверяем известные эндпоинты модулей
 */
function getModuleByPath(urlPath: string): string | null {
  // Известные эндпоинты модулей
  const moduleEndpoints: Record<string, string[]> = {
    api_example: ['/jokes'],
    // Добавить другие модули по мере необходимости
  };

  for (const [moduleName, endpoints] of Object.entries(moduleEndpoints)) {
    if (endpoints.some((endpoint) => urlPath.startsWith(endpoint))) {
      return moduleName;
    }
  }

  return null;
}

/**
 * Обогащает ответ /app/start данными из манифеста.
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
    console.error('[DevServer] Failed to load configuration');
    process.exit(1);
  }

  // Настройки для host
  // Приоритет: settings.apiUrl > глобальный apiUrl
  const hostUseLocalMocks = activeConfig.settings?.useLocalMocks !== false;
  const hostApiUrl = activeConfig.settings?.apiUrl || config.apiUrl || '';
  const remoteServerUrl = config.remoteServerUrl || '';

  console.log(
    `[DevServer] Config: ${activeConfig.name} | Mocks: ${hostUseLocalMocks ? 'ON' : 'OFF'} | API: ${hostApiUrl || 'not set'}`,
  );

  // Загружаем handlers для host, если моки включены
  let hostHandlers: RequestHandler[] = [];
  if (hostUseLocalMocks) {
    try {
      const hostMocksUrl = `file://${path.resolve(ROOT_DIR, 'host/src/mocks/index.ts')}`;
      const hostMocks = await import(hostMocksUrl);
      if (hostMocks.handlers && Array.isArray(hostMocks.handlers)) {
        hostHandlers = hostMocks.handlers;
        console.log(
          `[DevServer] Host mocks: ${hostMocks.handlers.length} handlers`,
        );
      }
    } catch (error) {
      console.warn(`[DevServer] Failed to load host mocks:`, error);
    }
  }

  // Загружаем handlers для модулей
  const moduleHandlers = new Map<string, RequestHandler[]>();
  for (const [moduleName, moduleConfig] of Object.entries(
    activeConfig.modules || {},
  )) {
    if (moduleConfig.useLocalMocks !== false) {
      const handlers = await loadModuleHandlers(moduleName);
      if (handlers && handlers.length > 0) {
        moduleHandlers.set(moduleName, handlers);
        console.log(
          `[DevServer] Module ${moduleName}: ${handlers.length} handlers`,
        );
      }
    }
  }

  // Обработка /app/start
  app.all('/app/start', async (req: Request, res: Response) => {
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
          res.status(200).json(enriched);
          return;
        } catch (error) {
          console.error(`[DevServer] Failed to load appStartData:`, error);
        }
      }

      // Если моки выключены, проксируем на реальный сервер
      if (hostApiUrl) {
        const targetUrl = `${hostApiUrl.replace(/\/$/, '')}/app/start`;

        // Для OPTIONS запросов (preflight)
        if (req.method === 'OPTIONS') {
          try {
            const response = await axios({
              method: 'OPTIONS',
              url: targetUrl,
              headers: req.headers,
              params: req.query,
            });
            Object.entries(response.headers).forEach(([key, value]) => {
              if (value) res.setHeader(key, String(value));
            });
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
          headers: req.headers,
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
            ? req.body
            : undefined,
          params: req.query,
          validateStatus: (status) => {
            // Считаем успешными статусы 200-299 и 304 (Not Modified)
            return (status >= 200 && status < 300) || status === 304;
          },
        });

        // Копируем заголовки из ответа
        Object.entries(response.headers).forEach(([key, value]) => {
          if (value) res.setHeader(key, String(value));
        });

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
        Object.entries(error.response.headers).forEach(([key, value]) => {
          if (value) res.setHeader(key, String(value));
        });

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

      // Компактный вывод ошибки
      const errorUrl = error.config?.url || hostApiUrl || '/app/start';
      const errorCode = error.code || 'UNKNOWN';

      // Для ECONNREFUSED выводим более компактное сообщение
      if (errorCode === 'ECONNREFUSED') {
        console.error(
          `[DevServer] Backend server unavailable: ${errorUrl} (${errorCode})`,
        );
      } else {
        console.error(
          `[DevServer] Error handling /app/start: ${errorCode} - ${error.message || 'Unknown error'}`,
        );
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

    // Определяем модуль по пути
    const moduleName = getModuleByPath(urlPath);
    // Если модуль не распознан — пробуем просто проксировать на backend
    if (!moduleName) {
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
          });

          Object.entries(response.headers).forEach(([key, value]) => {
            if (value) res.setHeader(key, String(value));
          });

          res.status(response.status).send(response.data);
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
    if (!moduleConfig) {
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
          });
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value) res.setHeader(key, String(value));
          });
          res.status(response.status).send(response.data);
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

    const useLocalMocks = moduleConfig.useLocalMocks !== false;

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
              const handlerMethod = (
                handlerAny.info?.method ||
                handlerAny.info?.header ||
                'GET'
              ).toUpperCase();
              const handlerPath = handlerAny.info?.path || '';

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
            console.error(
              `[DevServer] Handler failed for ${moduleName}:`,
              error,
            );
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
              });

              Object.entries(response.headers).forEach(([key, value]) => {
                if (value) res.setHeader(key, String(value));
              });

              res.status(response.status).send(response.data);
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
              });

              Object.entries(response.headers).forEach(([key, value]) => {
                if (value) res.setHeader(key, String(value));
              });

              res.status(response.status).send(response.data);
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
            Object.entries(response.headers).forEach(([key, value]) => {
              if (value) res.setHeader(key, String(value));
            });
            res.status(response.status).send();
            return;
          } catch (error: any) {
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

        // Копируем заголовки из ответа
        Object.entries(response.headers).forEach(([key, value]) => {
          if (value) res.setHeader(key, String(value));
        });

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
        Object.entries(error.response.headers).forEach(([key, value]) => {
          if (value) res.setHeader(key, String(value));
        });

        // Для 304 (Not Modified) не нужно тело ответа
        if (status === 304) {
          res.status(304).send();
          return;
        }

        // Для других статусов отправляем данные
        res.status(status).json(error.response.data || {});
        return;
      }

      console.error(`[DevServer] Error handling ${urlPath}:`, error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  });

  const server = app.listen(DEV_SERVER_PORT, () => {
    console.log(`[DevServer] Running on port ${DEV_SERVER_PORT}`);
  });

  // Обработка сигналов для корректного завершения
  const gracefulShutdown = (signal: string) => {
    console.log(`\n[DevServer] Получен ${signal}, завершаем работу...`);
    server.close(() => {
      console.log('[DevServer] Сервер остановлен');
      process.exit(0);
    });

    // Принудительное завершение через 5 секунд
    setTimeout(() => {
      console.error('[DevServer] Принудительное завершение');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Запускаем сервер
createDevServer().catch((error) => {
  console.error('[DevServer] Failed to start server:', error);
  process.exit(1);
});
