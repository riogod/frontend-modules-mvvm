/* eslint-env node */
/**
 * Плагин Vite для удаления dev-полей из конфигов модулей в production режиме
 *
 * Удаляет следующие поля из конфигов модулей:
 * - mockHandlers - MSW handlers для моков (используются только в dev/server)
 * - mockModuleInfo - информация о модуле для манифеста (используется только в dev/server)
 * - mockModuleData - mock данные модуля (features, permissions, params) - используются только в dev/server
 *
 * Эти поля не нужны в production, так как:
 * - mockHandlers используются только dev-server для моков API
 * - mockModuleInfo используется только ManifestBuilder для генерации манифеста
 * - mockModuleData используется только dev-server для моков
 *
 * В production модули загружаются через манифест с сервера, поэтому эти поля не используются
 */

/**
 * Удаляет свойство объекта из строки кода
 * Поддерживает удаление свойств с любыми значениями: объекты, массивы, переменные, примитивы
 * @param {string} code - Исходный код
 * @param {string} propertyName - Имя свойства для удаления
 * @returns {string} Код без указанного свойства
 */
function removePropertyUniversal(code, propertyName) {
  let result = code;
  let changed = true;
  let iterations = 0;
  const maxIterations = 10; // Защита от бесконечного цикла

  while (changed && iterations < maxIterations) {
    iterations++;
    changed = false;

    // Ищем паттерн: propertyName: ... (любое значение)
    const propertyPattern = new RegExp(`\\b${propertyName}\\s*:`, 'g');

    let match;
    while ((match = propertyPattern.exec(result)) !== null) {
      const propertyStart = match.index;
      const colonPos = match.index + match[0].length;

      // Пропускаем пробелы после двоеточия
      let pos = colonPos;
      while (pos < result.length && /\s/.test(result[pos])) {
        pos++;
      }

      if (pos >= result.length) break;

      const valueStart = pos;
      let valueEnd = -1;
      const firstChar = result[pos];

      // Определяем тип значения и находим его конец
      if (firstChar === '{') {
        // Объект: { ... }
        valueEnd = findMatchingBrace(result, pos, '{', '}');
      } else if (firstChar === '[') {
        // Массив: [ ... ]
        valueEnd = findMatchingBrace(result, pos, '[', ']');
      } else if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
        // Строка: "..." или '...' или `...`
        valueEnd = findStringEnd(result, pos, firstChar);
      } else {
        // Переменная, число, boolean, null, undefined и т.д.
        // Находим конец до запятой или закрывающей скобки
        valueEnd = findValueEnd(result, pos);
      }

      if (valueEnd > valueStart) {
        // Находим начало удаления (включая запятую и пробелы перед свойством)
        let removeStart = propertyStart;
        while (removeStart > 0) {
          const char = result[removeStart - 1];
          if (char === ',' || char === ';') {
            removeStart--;
            break;
          } else if (/\s/.test(char)) {
            removeStart--;
          } else {
            break;
          }
        }

        // Находим конец удаления (включая запятую после значения)
        let removeEnd = valueEnd;
        while (removeEnd < result.length) {
          const char = result[removeEnd];
          if (char === ',' || char === ';') {
            removeEnd++;
            break;
          } else if (/\s/.test(char)) {
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

        result =
          cleanedBefore +
          (cleanedBefore && cleanedAfter ? ' ' : '') +
          cleanedAfter;
        changed = true;
        break; // Начинаем заново после изменения
      }
    }
  }

  return result;
}

/**
 * Находит закрывающую скобку, соответствующую открывающей
 */
function findMatchingBrace(code, start, openBrace, closeBrace) {
  let pos = start + 1;
  let depth = 1;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  while (pos < code.length && depth > 0) {
    const char = code[pos];

    if (!escaped) {
      if ((char === '"' || char === "'" || char === '`') && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        if (char === openBrace) depth++;
        else if (char === closeBrace) {
          depth--;
          if (depth === 0) {
            return pos + 1;
          }
        }
      }
      escaped = char === '\\';
    } else {
      escaped = false;
    }

    pos++;
  }

  return pos;
}

/**
 * Находит конец строки
 */
function findStringEnd(code, start, quoteChar) {
  let pos = start + 1;
  let escaped = false;

  while (pos < code.length) {
    const char = code[pos];

    if (!escaped) {
      if (char === quoteChar) {
        return pos + 1;
      }
      escaped = char === '\\';
    } else {
      escaped = false;
    }

    pos++;
  }

  return pos;
}

/**
 * Находит конец значения (переменная, число, boolean и т.д.)
 * Останавливается на запятой, закрывающей скобке или точке с запятой
 */
function findValueEnd(code, start) {
  let pos = start;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  while (pos < code.length) {
    const char = code[pos];

    if (!escaped) {
      if ((char === '"' || char === "'" || char === '`') && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        if (char === ',' || char === '}' || char === ']' || char === ';') {
          return pos;
        }
      }
      escaped = char === '\\';
    } else {
      escaped = false;
    }

    pos++;
  }

  return pos;
}

export function removeDevFieldsPlugin() {
  return {
    name: 'remove-dev-fields',
    enforce: 'post', // Выполняем после всех других плагинов
    renderChunk(code, chunk) {
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
        chunk.moduleIds.some(
          (id) =>
            id.includes('module_config.ts') || id.includes('module_config.js'),
        );

      if (!isConfigFile) {
        return null;
      }

      try {
        let modifiedCode = code;

        // Удаляем mockHandlers (может быть массивом или переменной)
        modifiedCode = removePropertyUniversal(modifiedCode, 'mockHandlers');

        // Удаляем mockModuleInfo
        modifiedCode = removePropertyUniversal(modifiedCode, 'mockModuleInfo');

        // Удаляем mockModuleData
        modifiedCode = removePropertyUniversal(modifiedCode, 'mockModuleData');

        // Очищаем лишние запятые и пробелы
        // Убираем запятую перед закрывающей скобкой объекта
        modifiedCode = modifiedCode.replace(/,(\s*})/g, '$1');
        // Убираем запятую в начале объекта после открывающей скобки
        modifiedCode = modifiedCode.replace(/({\s*),/g, '$1');
        // Убираем двойные запятые
        modifiedCode = modifiedCode.replace(/,\s*,/g, ',');
        // Убираем запятую после комментария перед закрывающей скобкой
        modifiedCode = modifiedCode.replace(
          /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*,(\s*})/g,
          '$1$2',
        );

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
