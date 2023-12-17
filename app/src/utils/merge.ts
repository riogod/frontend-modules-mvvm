type TAllKeys<T> = T extends unknown ? keyof T : never;

type TIndexValue<T, K extends PropertyKey, D = never> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : D
  : never;

type TPartialKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>> extends infer O
  ? { [P in keyof O]: O[P] }
  : never;

type TFunction = (...a: unknown[]) => unknown;

type TPrimitives =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | Date
  | TFunction;

type TMerged<T> = [T] extends [Array<unknown>]
  ? { [K in keyof T]: TMerged<T[K]> }
  : [T] extends [TPrimitives]
  ? T
  : [T] extends [object]
  ? TPartialKeys<{ [K in TAllKeys<T>]: TMerged<TIndexValue<T, K>> }, never>
  : T;

const isObject = (obj: unknown): boolean => {
  if (typeof obj === 'object' && obj !== null) {
    if (typeof Object.getPrototypeOf === 'function') {
      const prototype = Object.getPrototypeOf(obj) as unknown;
      return prototype === Object.prototype || prototype === null;
    }

    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  return false;
};

interface IObject {
  [key: string]: unknown;
}

/**
 * Позволяет сделать глубокое слияние объектов с разными настройками.
 * Также поддерживает слияние массивов в объединяемых объектах
 *
 * merge.options:
 * allowUndefinedOverrides - Игнорировать значения undefined в объединяемых объектах
 * mergeArrays - Производить ли слияние массивов
 * uniqueArrayItems - Учитывать только уникальные элементы в массивах
 *
 * @param {IObject[]} objects - Объекты для слияния.
 * @return {TMerged} - Результат слияния
 */
const merge = <T extends IObject[]>(...objects: T): TMerged<T[number]> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  objects.reduce((result, current) => {
    if (Array.isArray(current)) {
      throw new TypeError(
        'Arguments provided to ts-deepmerge must be objects, not arrays.',
      );
    }

    Object.keys(current).forEach((key) => {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        return;
      }

      if (Array.isArray(result[key]) && Array.isArray(current[key])) {
        result[key] = merge.options.mergeArrays
          ? merge.options.uniqueArrayItems
            ? Array.from(
                new Set((result[key] as unknown[]).concat(current[key])),
              )
            : [...(<[]>result[key]), ...(<[]>current[key])]
          : current[key];
      } else if (isObject(result[key]) && isObject(current[key])) {
        result[key] = merge(result[key] as IObject, current[key] as IObject);
      } else {
        result[key] =
          current[key] === undefined
            ? merge.options.allowUndefinedOverrides
              ? current[key]
              : result[key]
            : current[key];
      }
    });

    return result;
  }, {}) as TMerged<T[number]>;

interface IOptions {
  /**
   * По умолчанию: `true`
   *
   *  При включенной опции: значения, которые были переданы как `undefined`, будут перезаписаны существующими значениями.
   *  При выключенной опции: значения, которые были переданы как `undefined`, не будут перезаписаны.
   */
  allowUndefinedOverrides: boolean;

  /**
   * По умолчанию: `true`
   *
   * При включенной опции: при слиянии  будут объединены массивы.
   * При выключенной опции: при слиянии будут заменены массивы на последнее значение.
   */
  mergeArrays: boolean;

  /**
   * По умолчанию: `true`
   * При включенной опции: при слиянии будут удалены повторяющиеся значения
   * При выключенной опции: при слиянии повторяющиеся значения будут оставлены
   */
  uniqueArrayItems: boolean;
  ignoreUndefined: boolean;
}

const defaultOptions: IOptions = {
  allowUndefinedOverrides: true,
  mergeArrays: true,
  uniqueArrayItems: true,
  ignoreUndefined: true,
};

merge.options = defaultOptions;

merge.withOptions = <T extends IObject[]>(
  options: Partial<IOptions>,
  ...objects: T
) => {
  merge.options = {
    ...defaultOptions,
    ...options,
  };

  const result = merge(...objects);

  merge.options = defaultOptions;

  return result;
};

export default merge;
