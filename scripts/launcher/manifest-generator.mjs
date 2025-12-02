import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Генератор манифеста для Module Federation
 * Создает структуру манифеста на основе конфигурации модулей
 * Обогащает манифест данными из локальных модулей (mockModuleData, mockModuleInfo)
 */
export class ManifestGenerator {
  /**
   * Загружает конфиг локального модуля и извлекает mockModuleData и mockModuleInfo
   * Использует более надежный парсинг с поддержкой вложенных объектов
   * @param {string} moduleName - Имя модуля
   * @param {string} rootDir - Корневая директория проекта
   * @returns {Object|null} Объект с mockModuleData и mockModuleInfo или null
   */
  loadLocalModuleConfig(moduleName, rootDir) {
    const moduleConfigPath = path.resolve(
      rootDir,
      'packages',
      moduleName,
      'src',
      'config',
      'module_config.ts',
    );

    if (!fs.existsSync(moduleConfigPath)) {
      return null;
    }

    try {
      // Всегда читаем файл заново, чтобы получить актуальные данные
      // (не используем кэширование, так как конфиги модулей могут изменяться)
      const content = fs.readFileSync(moduleConfigPath, 'utf-8');

      // Извлекаем mockModuleInfo и mockModuleData используя более надежный парсинг
      // Функция для извлечения объекта с учетом вложенности
      const extractObject = (fieldName, content) => {
        const fieldPattern = new RegExp(`${fieldName}:\\s*\\{`, 's');
        const fieldMatch = content.match(fieldPattern);
        if (!fieldMatch) return null;

        const startPos = fieldMatch.index + fieldMatch[0].length;
        let braceCount = 1;
        let pos = startPos;
        let objectContent = '';

        while (pos < content.length && braceCount > 0) {
          const char = content[pos];
          if (char === '{') braceCount++;
          else if (char === '}') braceCount--;
          if (braceCount > 0) objectContent += char;
          pos++;
        }

        return objectContent;
      };

      const mockModuleInfoContent = extractObject('mockModuleInfo', content);
      const mockModuleDataContent = extractObject('mockModuleData', content);

      const mockModuleInfoMatch = mockModuleInfoContent
        ? { 1: mockModuleInfoContent }
        : null;
      const mockModuleDataMatch = mockModuleDataContent
        ? { 1: mockModuleDataContent }
        : null;

      if (!mockModuleInfoMatch && !mockModuleDataMatch) {
        return null;
      }

      // Парсим mockModuleInfo
      let mockModuleInfo = null;
      if (mockModuleInfoMatch) {
        try {
          const infoContent = mockModuleInfoMatch[1];

          // Извлекаем поля с поддержкой многострочных значений
          const extractString = (field) => {
            const match = infoContent.match(
              new RegExp(`${field}:\\s*['"]([^'"]+)['"]`, 's'),
            );
            return match ? match[1] : null;
          };

          const extractNumber = (field) => {
            const match = infoContent.match(
              new RegExp(`${field}:\\s*(\\d+)`, 's'),
            );
            return match ? parseInt(match[1], 10) : null;
          };

          const extractArray = (field) => {
            const match = infoContent.match(
              new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`, 's'),
            );
            if (!match) return [];
            return match[1]
              .split(',')
              .map((item) => item.trim().replace(/['"]/g, ''))
              .filter((item) => item);
          };

          mockModuleInfo = {
            name: extractString('name') || moduleName,
            version: extractString('version') || '1.0.0',
            loadType: extractString('loadType') || 'normal',
            loadPriority: extractNumber('loadPriority') || 1,
            remoteEntry: '',
            dependencies: extractArray('dependencies'),
            featureFlags: extractArray('featureFlags'),
            accessPermissions: extractArray('accessPermissions'),
          };
        } catch (error) {
          // Игнорируем ошибки парсинга mockModuleInfo
        }
      }

      // Парсим mockModuleData
      let mockModuleData = null;
      if (mockModuleDataMatch) {
        try {
          const dataContent = mockModuleDataMatch[1];

          mockModuleData = {
            features: {},
            permissions: {},
            params: {},
          };

          // Функция для извлечения содержимого объекта с учетом вложенности
          const extractObjectContent = (fieldName, content) => {
            const fieldPattern = new RegExp(`${fieldName}:\\s*\\{`, 's');
            const fieldMatch = content.match(fieldPattern);
            if (!fieldMatch) return null;

            const startPos = fieldMatch.index + fieldMatch[0].length;
            let braceCount = 1;
            let pos = startPos;
            let objectContent = '';

            while (pos < content.length && braceCount > 0) {
              const char = content[pos];
              if (char === '{') braceCount++;
              else if (char === '}') braceCount--;
              if (braceCount > 0) objectContent += char;
              pos++;
            }

            return objectContent;
          };

          // Парсим features
          const featuresContent = extractObjectContent('features', dataContent);
          if (featuresContent) {
            const featureEntries = featuresContent.matchAll(
              /['"]([^'"]+)['"]:\s*(true|false)/g,
            );
            for (const match of featureEntries) {
              mockModuleData.features[match[1]] = match[2] === 'true';
            }
          }

          // Парсим permissions
          const permissionsContent = extractObjectContent(
            'permissions',
            dataContent,
          );
          if (permissionsContent) {
            const permissionEntries = permissionsContent.matchAll(
              /['"]([^'"]+)['"]:\s*(true|false)/g,
            );
            for (const match of permissionEntries) {
              mockModuleData.permissions[match[1]] = match[2] === 'true';
            }
          }

          // Парсим params (поддержка строк и чисел)
          const paramsContent = extractObjectContent('params', dataContent);
          if (paramsContent) {
            // Строковые значения
            const stringParams = paramsContent.matchAll(
              /['"]([^'"]+)['"]:\s*['"]([^'"]*)['"]/g,
            );
            for (const match of stringParams) {
              mockModuleData.params[match[1]] = match[2];
            }
            // Числовые значения
            const numberParams = paramsContent.matchAll(
              /['"]([^'"]+)['"]:\s*(\d+)/g,
            );
            for (const match of numberParams) {
              mockModuleData.params[match[1]] = parseInt(match[2], 10);
            }
          }
        } catch (error) {
          // Игнорируем ошибки парсинга mockModuleData
        }
      }

      return {
        mockModuleInfo,
        mockModuleData,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Генерирует манифест на основе конфигурации
   * @param {Object} config - Конфигурация модулей
   * @param {Object} config.modules - Объект с конфигурацией модулей
   * @param {ModuleDiscovery} moduleDiscovery - Экземпляр ModuleDiscovery для проверки существования модулей
   * @returns {Object} Манифест для Module Federation
   */
  generate(config, moduleDiscovery = null) {
    const rootDir = path.resolve(__dirname, '../..');
    // Всегда создаем новый манифест с актуальным timestamp
    // Это гарантирует, что манифест всегда содержит свежие данные из модулей
    const manifest = {
      modules: [],
      data: {
        features: {},
        permissions: {},
        params: {},
      },
      timestamp: new Date().toISOString(),
    };

    // INIT модули (core, core.layout) всегда загружаются и не включаются в манифест
    // NORMAL модули на основе конфигурации
    if (config.modules) {
      for (const [name, moduleConfig] of Object.entries(config.modules)) {
        // Проверяем существование модуля, если передан moduleDiscovery
        if (moduleDiscovery) {
          // Для LOCAL модулей проверяем физическое существование
          if (
            moduleConfig.source === 'local' &&
            !moduleDiscovery.moduleExists(name)
          ) {
            continue;
          }
          // Для REMOTE модулей не проверяем (они загружаются удаленно)
        }

        // Определяем remoteEntry в зависимости от source
        let remoteEntry = '';
        if (moduleConfig.source === 'remote') {
          // Стандартный путь для REMOTE
          remoteEntry = moduleConfig.url || '';
        } else if (moduleConfig.source === 'remote_custom') {
          // Кастомный URL для REMOTE_CUSTOM
          remoteEntry = moduleConfig.customUrl || moduleConfig.url || '';
        }
        // Для LOCAL remoteEntry остается пустым

        // Базовые данные модуля
        const moduleEntry = {
          name,
          loadType: 'normal',
          loadPriority: moduleConfig.priority || 1,
          remoteEntry,
          dependencies: moduleConfig.dependencies || [],
          featureFlags: moduleConfig.featureFlags || [],
          accessPermissions: moduleConfig.accessPermissions || [],
        };

        // Если модуль LOCAL, обогащаем данными из module_config.ts
        // Обогащаем манифест данными из конфига модуля независимо от useLocalMocks,
        // так как эти данные нужны для правильной работы приложения
        if (moduleConfig.source === 'local') {
          const localConfig = this.loadLocalModuleConfig(name, rootDir);

          if (localConfig) {
            // Обогащаем запись модуля данными из mockModuleInfo
            if (localConfig.mockModuleInfo) {
              // Обновляем loadType из mockModuleInfo, если он указан
              if (localConfig.mockModuleInfo.loadType) {
                moduleEntry.loadType = localConfig.mockModuleInfo.loadType;
              }
              moduleEntry.loadPriority =
                localConfig.mockModuleInfo.loadPriority ||
                moduleEntry.loadPriority;
              moduleEntry.dependencies = [
                ...new Set([
                  ...moduleEntry.dependencies,
                  ...localConfig.mockModuleInfo.dependencies,
                ]),
              ];
              moduleEntry.featureFlags = [
                ...new Set([
                  ...moduleEntry.featureFlags,
                  ...localConfig.mockModuleInfo.featureFlags,
                ]),
              ];
              moduleEntry.accessPermissions = [
                ...new Set([
                  ...moduleEntry.accessPermissions,
                  ...localConfig.mockModuleInfo.accessPermissions,
                ]),
              ];
            }

            // Обогащаем манифест данными из mockModuleData
            if (localConfig.mockModuleData) {
              if (localConfig.mockModuleData.features) {
                Object.assign(
                  manifest.data.features,
                  localConfig.mockModuleData.features,
                );
              }
              if (localConfig.mockModuleData.permissions) {
                Object.assign(
                  manifest.data.permissions,
                  localConfig.mockModuleData.permissions,
                );
              }
              if (localConfig.mockModuleData.params) {
                Object.assign(
                  manifest.data.params,
                  localConfig.mockModuleData.params,
                );
              }
            }
          }
        }

        manifest.modules.push(moduleEntry);
      }
    }

    return manifest;
  }
}
