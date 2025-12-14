import type { HttpMethod } from './enums';

/**
 * Утилита для нормализации URL.
 * Преобразует URL в нормализованный вид для группировки похожих запросов.
 */
export class UrlNormalizer {
  /**
   * Нормализует URL, заменяя динамические части на шаблоны.
   * Игнорирует query-параметры.
   *
   * @param url - URL для нормализации
   * @param method - HTTP метод (опционально, для различения GET/POST к одному URL)
   * @returns Нормализованный URL
   */
  normalize(url: string, method?: HttpMethod | string): string {
    // Удаляем query-параметры
    let normalizedUrl = url;
    try {
      const urlObj = new URL(url, 'http://dummy');
      normalizedUrl = urlObj.pathname;
    } catch {
      // Если URL невалидный, пытаемся удалить query-параметры вручную
      const queryIndex = normalizedUrl.indexOf('?');
      if (queryIndex !== -1) {
        normalizedUrl = normalizedUrl.substring(0, queryIndex);
      }
    }

    // Разбиваем на части
    const parts = normalizedUrl.split('/').filter((part) => part.length > 0);

    // Нормализуем каждую часть
    const normalizedParts = parts.map((part) => {
      // Декодируем для проверки кириллицы
      const decodedPart = decodeURIComponent(part);

      // Проверяем UUID (версии 1-5)
      if (this.isUUID(part)) {
        return 'uuid';
      }

      // Проверяем числа
      if (this.isNumber(part)) {
        return 'number';
      }

      // Проверяем кириллицу
      if (this.isCyrillic(decodedPart)) {
        return 'string';
      }

      return part;
    });

    // Собираем нормализованный URL
    let result = '/' + normalizedParts.join('/');

    // Добавляем метод к ID, если указан
    if (method) {
      result = `${method.toUpperCase()}:${result}`;
    }

    return result;
  }

  /**
   * Проверяет, является ли строка UUID (версии 1-5).
   */
  private isUUID(str: string): boolean {
    // UUID версии 1-5: xxxxxxxx-xxxx-[1-5]xxx-[89AB]xxx-xxxxxxxxxxxx
    const uuidRegex =
      /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Проверяет, является ли строка числом.
   */
  private isNumber(str: string): boolean {
    return /^\d+$/.test(str);
  }

  /**
   * Проверяет, содержит ли строка кириллические символы.
   */
  private isCyrillic(str: string): boolean {
    return /[А-Яа-яЁё]/.test(str);
  }
}
