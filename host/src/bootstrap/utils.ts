import { type IMenuItem } from '@platform/core';

/**
 * Рекурсивная функция поиска сегмента в меню
 *
 * @param {Array<IMenuItem>} obj - The object to search within.
 * @param {Array<string>} item - The item to search for.
 * @param {Array<string>} result - The array to store the result.
 * @return {Array<string>} - Возвращает массив найденных сегментов.
 */
export function findSegment(
  obj: Array<IMenuItem>,
  item: Array<string>,
  result: Array<string> = [],
): Array<string> {
  for (const key in obj) {
    const route = obj[key].path.split('.');
    const routeLast = route[route.length - 1];

    if (routeLast === item[0]) {
      if (obj[key].children && obj[key].children?.length && item.length > 1) {
        result.push(key);
        return findSegment(obj[key].children || [], item.slice(1), result);
      } else {
        result.push(key);
        return result;
      }
    }
  }
  return [];
}
