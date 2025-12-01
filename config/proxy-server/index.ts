import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { setupServer } from 'msw/node';
import { http, HttpResponse, type RequestHandler } from 'msw';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROXY_PORT = 1337;
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
      console.warn(`[ProxyServer] Manifest not found: ${MANIFEST_PATH}`);
      return null;
    }
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch (error) {
    console.error(`[ProxyServer] Failed to load manifest:`, error);
    return null;
  }
}

/**
 * Загружает конфигурацию из файла
 */
function loadConfig(): Config | null {
  try {
    if (!fs.existsSync(CONFIGS_PATH)) {
      console.warn(`[ProxyServer] Config not found: ${CONFIGS_PATH}`);
      return null;
    }
    const content = fs.readFileSync(CONFIGS_PATH, 'utf-8');
    return JSON.parse(content) as Config;
  } catch (error) {
    console.error(`[ProxyServer] Failed to load config:`, error);
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
      `[ProxyServer] Failed to load handlers for ${moduleName}:`,
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
 * Обогащает ответ /app/start данными из манифеста
 */
function enrichAppStartResponse(originalResponse: any): any {
  const manifest = loadManifest();
  if (!manifest) {
    return originalResponse;
  }

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

    // Добавляем модули из манифеста
    if (manifest.modules && manifest.modules.length > 0) {
      originalResponse.data.modules = manifest.modules.map((module) => ({
        name: module.name,
        loadType: module.loadType,
        loadPriority: module.loadPriority,
        remoteEntry: module.remoteEntry,
        dependencies: module.dependencies || [],
        featureFlags: module.featureFlags || [],
        accessPermissions: module.accessPermissions || [],
      }));
    }
  }

  return originalResponse;
}

/**
 * Создает и запускает proxy server
 */
async function createProxyServer() {
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
    console.error('[ProxyServer] Failed to load configuration');
    process.exit(1);
  }

  console.log(
    `[ProxyServer] Config: ${activeConfig.name} | Mocks: ${activeConfig.settings?.useLocalMocks !== false ? 'ON' : 'OFF'} | API: ${activeConfig.settings?.apiUrl || 'not set'}`,
  );

  // Настройки для host
  const hostUseLocalMocks = activeConfig.settings?.useLocalMocks !== false;
  const hostApiUrl = activeConfig.settings?.apiUrl || '';

  // Создаем MSW server для обработки моков
  const mswServer = setupServer();

  // Загружаем handlers для host, если моки включены
  let hostHandlers: RequestHandler[] = [];
  if (hostUseLocalMocks) {
    try {
      const hostMocksUrl = `file://${path.resolve(ROOT_DIR, 'host/src/mocks/index.ts')}`;
      const hostMocks = await import(hostMocksUrl);
      if (hostMocks.handlers && Array.isArray(hostMocks.handlers)) {
        hostHandlers = hostMocks.handlers;
        mswServer.use(...hostMocks.handlers);
        console.log(
          `[ProxyServer] Host mocks: ${hostMocks.handlers.length} handlers`,
        );
      }
    } catch (error) {
      console.warn(`[ProxyServer] Failed to load host mocks:`, error);
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
        mswServer.use(...handlers);
        console.log(
          `[ProxyServer] Module ${moduleName}: ${handlers.length} handlers`,
        );
      }
    }
  }

  // Запускаем MSW server
  // Важно: MSW перехватывает глобальный fetch, поэтому нужно быть осторожным
  // чтобы не создавать бесконечные циклы
  mswServer.listen({ onUnhandledRequest: 'bypass' });

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
          const enriched = enrichAppStartResponse(data);
          res.status(200).json(enriched);
          return;
        } catch (error) {
          console.error(`[ProxyServer] Failed to load appStartData:`, error);
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
        const response = await axios({
          method: req.method as any,
          url: targetUrl,
          headers: req.headers,
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
            ? req.body
            : undefined,
          params: req.query,
        });
        const enriched = enrichAppStartResponse(response.data);
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
      const enriched = enrichAppStartResponse(baseResponse);
      res.json(enriched);
    } catch (error: any) {
      console.error(`[ProxyServer] Error handling /app/start:`, error);
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
    if (!moduleName) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const moduleConfig = activeConfig.modules[moduleName];
    if (!moduleConfig) {
      res.status(404).json({ error: 'Module not configured' });
      return;
    }

    const useLocalMocks = moduleConfig.useLocalMocks !== false;

    try {
      if (useLocalMocks) {
        // Проверяем, есть ли handlers для этого модуля
        const handlers = moduleHandlers.get(moduleName);
        if (handlers && handlers.length > 0) {
          // Для модулей используем MSW через fetch с внешним URL
          // чтобы избежать бесконечного цикла
          // Поддерживаем все HTTP методы: GET, POST, PUT, DELETE, PATCH
          try {
            const externalUrl = `http://127.0.0.1:${PROXY_PORT}${urlPath}`;

            // Подготавливаем body для методов с телом запроса
            let requestBody: string | undefined = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
              if (req.body) {
                requestBody =
                  typeof req.body === 'string'
                    ? req.body
                    : JSON.stringify(req.body);
              }
            }

            // Создаем Request с правильным body для всех методов
            const request = new Request(externalUrl, {
              method: req.method,
              headers: {
                ...(req.headers as Record<string, string>),
                // Убеждаемся, что Content-Type установлен для методов с body
                ...(requestBody && !req.headers['content-type']
                  ? { 'Content-Type': 'application/json' }
                  : {}),
              },
              body: requestBody,
            });

            // MSW перехватывает fetch, используем 127.0.0.1 чтобы избежать цикла
            const response = await fetch(request);

            if (response) {
              // Получаем данные в зависимости от Content-Type ответа
              const contentType = response.headers.get('content-type') || '';
              let data: any;

              if (contentType.includes('application/json')) {
                data = await response.json();
              } else if (contentType.includes('text/')) {
                data = await response.text();
              } else {
                // Для бинарных данных или других типов
                data = await response.arrayBuffer();
              }

              // Копируем заголовки из MSW response
              response.headers.forEach((value: string, key: string) => {
                res.setHeader(key, value);
              });

              // Отправляем ответ с правильным типом контента
              if (contentType.includes('application/json')) {
                res.status(response.status).json(data);
              } else if (contentType.includes('text/')) {
                res.status(response.status).send(data);
              } else {
                res.status(response.status).send(Buffer.from(data));
              }
              return;
            }
          } catch (error) {
            console.error(`[ProxyServer] MSW failed for ${moduleName}:`, error);
          }
          res.status(404).json({ error: 'No mock handlers available' });
          return;
        } else {
          res.status(404).json({ error: 'No mock handlers available' });
          return;
        }
      } else {
        // Проксируем на удаленный сервер
        // Поддерживаем все HTTP методы: GET, POST, PUT, DELETE, PATCH, OPTIONS
        const apiUrl = activeConfig.settings?.apiUrl || '';
        if (!apiUrl) {
          res.status(500).json({ error: 'API URL not configured' });
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
        const response = await axios({
          method: req.method as any,
          url: targetUrl,
          headers: req.headers,
          // Передаем body только для методов, которые его поддерживают
          data: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())
            ? req.body
            : undefined,
          params: req.query,
        });

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
      console.error(`[ProxyServer] Error handling ${urlPath}:`, error);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  });

  app.listen(PROXY_PORT, () => {
    console.log(`[ProxyServer] Running on port ${PROXY_PORT}`);
  });
}

// Запускаем сервер
createProxyServer().catch((error) => {
  console.error('[ProxyServer] Failed to start server:', error);
  process.exit(1);
});
