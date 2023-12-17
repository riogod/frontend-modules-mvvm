import merge from '../merge.ts';
import { beforeEach, describe, it, expect } from 'vitest';

describe('merge', () => {
  beforeEach(() => {
    merge.options = {
      mergeArrays: true,
      uniqueArrayItems: true,
      allowUndefinedOverrides: true,
      ignoreUndefined: true,
    };
  });

  it('should merge objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, d: 4 };
    const expected = { a: 1, b: 2, c: 3, d: 4 };

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge nested objects', () => {
    const obj1 = { a: { x: 1, y: 2 }, b: { z: 3 } };
    const obj2 = { a: { y: 3 }, c: { w: 4 } };
    const expected = { a: { x: 1, y: 3 }, b: { z: 3 }, c: { w: 4 } };

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should throw TypeError if array is passed as argument', () => {
    const obj1 = { a: 1, b: 2 };
    const arr1 = [1, 2, 3];

    // @ts-ignore
    expect(() => merge(obj1, arr1)).toThrow(TypeError);
  });

  it('should merge arrays if mergeArrays option is true', () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [2, 3], c: [5, 6] };
    const expected = { a: [1, 2, 3], b: [3, 4], c: [5, 6] };

    merge.options.mergeArrays = true;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should set last value of array if mergeArrays option is false', () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [2, 3], c: [5, 6] };
    const expected = { a: [2, 3], b: [3, 4], c: [5, 6] };

    merge.options.mergeArrays = false;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge arrays with unique items if uniqueArrayItems option is true', () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [2, 3], c: [5, 6] };
    const expected = { a: [1, 2, 3], b: [3, 4], c: [5, 6] };

    merge.options.mergeArrays = true;
    merge.options.uniqueArrayItems = true;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should allow undefined overrides if allowUndefinedOverrides option is true', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: undefined, c: 3 };
    const expected = { a: 1, b: undefined, c: 3 };

    merge.options.allowUndefinedOverrides = true;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should not allow undefined overrides if allowUndefinedOverrides option is false', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: undefined, c: 3 };
    const expected = { a: 1, b: 2, c: 3 };

    merge.options.allowUndefinedOverrides = false;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge objects with nested arrays', () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [2, 3], b: [5, 6] };
    const expected = { a: [1, 2, 3], b: [3, 4, 5, 6] };

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge objects with nested arrays with no unique items', () => {
    const obj1 = { a: [1, 2], b: [3, 4] };
    const obj2 = { a: [2, 3], b: [5, 6] };
    const expected = { a: [1, 2, 2, 3], b: [3, 4, 5, 6] };

    merge.options.uniqueArrayItems = false;

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge objects with undefined values', () => {
    const obj1 = { a: 1, b: undefined };
    const obj2 = { a: undefined, c: 3 };
    const expected = { a: undefined, b: undefined, c: 3 };

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  it('should merge objects with null values', () => {
    const obj1 = { a: 1, b: null };
    const obj2 = { a: null, c: 3 };
    const expected = { a: null, b: null, c: 3 };

    expect(merge(obj1, obj2)).toEqual(expected);
  });

  describe('merge.withOptions', () => {
    it('should merge objects with default options', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const expected = { a: 1, b: 2, c: 3, d: 4 };

      const result = merge.withOptions({}, obj1, obj2);

      expect(result).toEqual(expected);
    });

    it('should merge objects with custom options', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      const expected = { a: 1, b: 2, c: 3, d: 4 };

      const result = merge.withOptions({ ignoreUndefined: true }, obj1, obj2);

      expect(result).toEqual(expected);
    });

    it('should reset options after merging', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };

      merge.withOptions({}, obj1, obj2);

      expect(merge.options).toEqual({
        allowUndefinedOverrides: true,
        ignoreUndefined: true,
        mergeArrays: true,
        uniqueArrayItems: true,
      });
    });
  });
});
