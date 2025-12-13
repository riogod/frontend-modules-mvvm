/**
 * Плагин Vite для удаления dev-полей из конфигов модулей в production режиме
 * 
 * Удаляет следующие поля из конфигов модулей:
 * - mockModuleInfo - информация о модуле для манифеста (используется только в dev/server)
 * - mockModuleData - mock данные модуля (features, permissions, params) - используются только в dev/server
 * 
 * Эти поля не нужны в production, так как:
 * - mockModuleInfo используется только ManifestBuilder для генерации манифеста
 * - mockModuleData используется только dev-server для моков
 * 
 * В production модули загружаются через манифест с сервера, поэтому эти поля не используются
 */

/**
 * Удаляет свойство объекта из строки кода
 * Использует простой подход с регулярными выражениями для безопасности
 * @param {string} code - Исходный код
 * @param {string} propertyName - Имя свойства для удаления
 * @returns {string} Код без указанного свойства
 */
function removeProperty(code, propertyName) {
  // Простой паттерн для поиска свойства с объектом
  // Ищем: propertyName: { ... } где ... может быть любой текст до закрывающей скобки
  // Используем жадное совпадение с учетом вложенности через подсчет скобок
  
  let result = code;
  let changed = true;
  let iterations = 0;
  const maxIterations = 5; // Защита от бесконечного цикла
  
  while (changed && iterations < maxIterations) {
    iterations++;
    changed = false;
    
    // Паттерн для поиска свойства: propertyName: { ... }
    // Ищем начало свойства (может быть запятая или начало строки перед ним)
    const pattern = new RegExp(
      `([,\\s]*${propertyName}\\s*:\\s*\\{)([^}]*\\{[^}]*\\}[^}]*)*([^}]*\\})`,
      'gs'
    );
    
    const match = result.match(pattern);
    if (match) {
      // Находим точные границы объекта через подсчет скобок
      const fullMatch = match[0];
      const propertyStart = fullMatch.indexOf(`${propertyName}:`);
      
      if (propertyStart >= 0) {
        const startPos = match.index + propertyStart;
        let braceCount = 0;
        let foundOpenBrace = false;
        let pos = startPos;
        let objectStart = -1;
        let objectEnd = -1;
        
        // Находим открывающую скобку объекта
        while (pos < result.length) {
          if (result[pos] === '{') {
            objectStart = pos;
            braceCount = 1;
            foundOpenBrace = true;
            pos++;
            break;
          }
          pos++;
        }
        
        if (foundOpenBrace) {
          // Находим закрывающую скобку, учитывая вложенность
          let inString = false;
          let stringChar = null;
          let escaped = false;
          
          while (pos < result.length && braceCount > 0) {
            const char = result[pos];
            
            if (!escaped) {
              if ((char === '"' || char === "'" || char === '`') && !inString) {
                inString = true;
                stringChar = char;
              } else if (char === stringChar && inString) {
                inString = false;
                stringChar = null;
              } else if (!inString) {
                if (char === '{') braceCount++;
                else if (char === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    objectEnd = pos + 1;
                    break;
                  }
                }
              }
              escaped = char === '\\';
            } else {
              escaped = false;
            }
            
            pos++;
          }
          
          if (objectStart >= 0 && objectEnd > objectStart) {
            // Находим начало удаления (включая запятую и пробелы перед свойством)
            let removeStart = startPos;
            while (removeStart > 0) {
              const char = result[removeStart - 1];
              if (char === ',' || char === ';') {
                removeStart--;
                break;
              } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
                removeStart--;
              } else {
                break;
              }
            }
            
            // Находим конец удаления (включая запятую после объекта)
            let removeEnd = objectEnd;
            while (removeEnd < result.length) {
              const char = result[removeEnd];
              if (char === ',' || char === ';') {
                removeEnd++;
                break;
              } else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
                removeEnd++;
              } else {
                break;
              }
            }
            
            // Удаляем свойство
            const before = result.substring(0, removeStart).trimEnd();
            const after = result.substring(removeEnd).trimStart();
            
            // Убираем запятую в конце before, если есть
            const cleanedBefore = before.endsWith(',') 
              ? before.slice(0, -1).trimEnd() 
              : before;
            
            // Убираем запятую в начале after, если есть
            const cleanedAfter = after.startsWith(',') 
              ? after.slice(1).trimStart() 
              : after;
            
            result = cleanedBefore + (cleanedBefore && cleanedAfter ? ' ' : '') + cleanedAfter;
            changed = true;
          }
        }
      }
    }
  }
  
  return result;
}

export function removeDevFieldsPlugin() {
  return {
    name: 'remove-dev-fields',
    enforce: 'post', // Выполняем после всех других плагинов
    renderChunk(code, chunk, options) {
      // Работаем только в production режиме
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }

      // Обрабатываем только файлы конфигов модулей
      // Конфиги экспортируются как './Config' через Module Federation
      // и собираются в файлы вида Config-*.js или module_config-*.js
      const isConfigFile =
        chunk.fileName.includes('Config') ||
        chunk.fileName.includes('module_config') ||
        chunk.moduleIds.some((id) =>
          id.includes('module_config.ts') || id.includes('module_config.js'),
        );

      if (!isConfigFile) {
        return null;
      }

      try {
        let modifiedCode = code;

        // Удаляем mockModuleInfo
        modifiedCode = removeProperty(modifiedCode, 'mockModuleInfo');

        // Удаляем mockModuleData
        modifiedCode = removeProperty(modifiedCode, 'mockModuleData');

        // Очищаем лишние запятые и пробелы
        // Убираем запятую перед закрывающей скобкой объекта
        modifiedCode = modifiedCode.replace(/,(\s*})/g, '$1');
        // Убираем запятую в начале объекта после открывающей скобки
        modifiedCode = modifiedCode.replace(/({\s*),/g, '$1');
        // Убираем двойные запятые
        modifiedCode = modifiedCode.replace(/,\s*,/g, ',');
        // Убираем запятую после комментария перед закрывающей скобкой
        modifiedCode = modifiedCode.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*,(\s*})/g, '$1$2');

        return {
          code: modifiedCode,
          map: chunk.map,
        };
      } catch (error) {
        // В случае ошибки возвращаем исходный код без изменений
        // eslint-disable-next-line no-console
        console.warn(
          `[remove-dev-fields] Failed to process ${chunk.fileName}, keeping original code:`,
          error.message,
        );
        return null; // Возвращаем null, чтобы использовать исходный код
      }
    },
  };
}
