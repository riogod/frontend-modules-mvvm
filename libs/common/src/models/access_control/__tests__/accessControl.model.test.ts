import { describe, it, expect, beforeEach } from 'vitest';
import { AccessControlModel } from '../accessControl.model';

describe('AccessControlModel', () => {
  let model: AccessControlModel;

  beforeEach(() => {
    model = new AccessControlModel();
  });

  describe('getFeatureFlags', () => {
    it('должен возвращать объект с ключами из enum и значениями feature flags', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
        feature3 = 'feature.three',
      }

      // Устанавливаем feature flags
      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
        'feature.three': true,
      });

      const result = model.getFeatureFlags(Features);

      expect(result).toEqual({
        feature1: true,
        feature2: false,
        feature3: true,
      });
    });

    it('должен возвращать false для несуществующих feature flags', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      // Не устанавливаем feature flags
      const result = model.getFeatureFlags(Features);

      expect(result).toEqual({
        feature1: false,
        feature2: false,
      });
    });

    it('должен работать с числовыми enum значениями', () => {
      enum Features {
        feature1 = 1,
        feature2 = 2,
      }

      model.setFeatureFlags({
        '1': true,
        '2': false,
      });

      const result = model.getFeatureFlags(Features);

      expect(result).toEqual({
        feature1: true,
        feature2: false,
      });
    });

    it('должен возвращать пустой объект для пустого enum', () => {
      enum EmptyEnum {}

      const result = model.getFeatureFlags(EmptyEnum);

      expect(result).toEqual({});
    });
  });

  describe('getFeatureFlag', () => {
    it('должен возвращать true для существующего feature flag', () => {
      model.setFeatureFlags({
        'test.flag': true,
      });

      expect(model.getFeatureFlag('test.flag')).toBe(true);
    });

    it('должен возвращать false для несуществующего feature flag', () => {
      expect(model.getFeatureFlag('non.existent')).toBe(false);
    });

    it('должен возвращать false для undefined feature flag', () => {
      model.setFeatureFlags({
        'test.flag': undefined as any,
      });

      expect(model.getFeatureFlag('test.flag')).toBe(false);
    });

    it('должен возвращать true для truthy значений', () => {
      model.setFeatureFlags({
        'test.flag': 1 as any,
      });

      expect(model.getFeatureFlag('test.flag')).toBe(true);
    });
  });

  describe('setFeatureFlags', () => {
    it('должен устанавливать feature flags', () => {
      const flags = {
        flag1: true,
        flag2: false,
        flag3: true,
      };

      model.setFeatureFlags(flags);

      expect(model.allFeatureFlags).toEqual(flags);
    });

    it('должен перезаписывать существующие feature flags', () => {
      model.setFeatureFlags({
        flag1: true,
        flag2: false,
      });

      model.setFeatureFlags({
        flag1: false,
        flag3: true,
      });

      expect(model.allFeatureFlags).toEqual({
        flag1: false,
        flag3: true,
      });
    });

    it('должен устанавливать пустой объект', () => {
      model.setFeatureFlags({
        flag1: true,
      });

      model.setFeatureFlags({});

      expect(model.allFeatureFlags).toEqual({});
    });
  });

  describe('includesFeatureFlags', () => {
    beforeEach(() => {
      model.setFeatureFlags({
        flag1: true,
        flag2: true,
        flag3: false,
      });
    });

    it('должен возвращать true для существующего feature flag', () => {
      expect(model.includesFeatureFlags('flag1')).toBe(true);
    });

    it('должен возвращать false для несуществующего feature flag', () => {
      expect(model.includesFeatureFlags('non.existent')).toBe(false);
    });

    it('должен возвращать false для отключенного feature flag', () => {
      expect(model.includesFeatureFlags('flag3')).toBe(false);
    });

    it('должен возвращать true если все feature flags в массиве включены', () => {
      expect(model.includesFeatureFlags(['flag1', 'flag2'])).toBe(true);
    });

    it('должен возвращать false если хотя бы один feature flag в массиве отключен', () => {
      expect(model.includesFeatureFlags(['flag1', 'flag3'])).toBe(false);
    });

    it('должен возвращать false если хотя бы один feature flag в массиве не существует', () => {
      expect(model.includesFeatureFlags(['flag1', 'non.existent'])).toBe(false);
    });

    it('должен возвращать true для пустого массива', () => {
      expect(model.includesFeatureFlags([])).toBe(true);
    });
  });

  describe('featureFlags getter', () => {
    it('должен возвращать текущие feature flags', () => {
      const flags = {
        flag1: true,
        flag2: false,
      };

      model.setFeatureFlags(flags);

      expect(model.allFeatureFlags).toEqual(flags);
    });

    it('должен возвращать пустой объект по умолчанию', () => {
      expect(model.allFeatureFlags).toEqual({});
    });
  });

  describe('permissions getter', () => {
    it('должен возвращать пустой объект по умолчанию', () => {
      expect(model.allPermissions).toEqual({});
    });
  });

  describe('интеграционные тесты', () => {
    it('должен работать с полным циклом: установка -> получение -> проверка', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
        feature3 = 'feature.three',
      }

      // Устанавливаем feature flags
      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': true,
        'feature.three': false,
      });

      // Получаем все feature flags
      const allFlags = model.getFeatureFlags(Features);
      expect(allFlags).toEqual({
        feature1: true,
        feature2: true,
        feature3: false,
      });

      // Проверяем отдельные feature flags
      expect(model.getFeatureFlag('feature.one')).toBe(true);
      expect(model.getFeatureFlag('feature.two')).toBe(true);
      expect(model.getFeatureFlag('feature.three')).toBe(false);

      // Проверяем наличие через includesFeatureFlags
      expect(model.includesFeatureFlags(['feature.one', 'feature.two'])).toBe(
        true,
      );
      expect(model.includesFeatureFlags(['feature.one', 'feature.three'])).toBe(
        false,
      );
    });

    it('должен корректно обрабатывать обновление feature flags', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      // Первая установка
      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
      });

      let result = model.getFeatureFlags(Features);
      expect(result).toEqual({
        feature1: true,
        feature2: false,
      });

      // Обновление
      model.setFeatureFlags({
        'feature.one': false,
        'feature.two': true,
      });

      result = model.getFeatureFlags(Features);
      expect(result).toEqual({
        feature1: false,
        feature2: true,
      });
    });
  });

  describe('мемоизация getFeatureFlags', () => {
    it('должен использовать кеш при повторных вызовах с тем же enum', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
      });

      // Первый вызов - вычисляется
      const result1 = model.getFeatureFlags(Features);
      expect(result1).toEqual({
        feature1: true,
        feature2: false,
      });

      // Второй вызов - должен использовать кеш
      const result2 = model.getFeatureFlags(Features);
      expect(result2).toEqual({
        feature1: true,
        feature2: false,
      });

      // Результаты должны быть одинаковыми (но не обязательно тем же объектом)
      expect(result2).toEqual(result1);
    });

    it('должен инвалидировать кеш при изменении feature flags через setFeatureFlags', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
      });

      // Первый вызов - вычисляется и кешируется
      const result1 = model.getFeatureFlags(Features);
      expect(result1).toEqual({
        feature1: true,
        feature2: false,
      });

      // Изменяем feature flags
      model.setFeatureFlags({
        'feature.one': false,
        'feature.two': true,
      });

      // Второй вызов - должен пересчитать, так как кеш инвалидирован
      const result2 = model.getFeatureFlags(Features);
      expect(result2).toEqual({
        feature1: false,
        feature2: true,
      });

      expect(result2).not.toEqual(result1);
    });

    it('должен инвалидировать кеш при изменении feature flags через updateFeatureFlags', () => {
      enum Features {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
      });

      // Первый вызов - вычисляется и кешируется
      const result1 = model.getFeatureFlags(Features);
      expect(result1).toEqual({
        feature1: true,
        feature2: false,
      });

      // Обновляем feature flags
      model.updateFeatureFlags({
        'feature.one': false,
      });

      // Второй вызов - должен пересчитать, так как кеш инвалидирован
      const result2 = model.getFeatureFlags(Features);
      expect(result2).toEqual({
        feature1: false,
        feature2: false,
      });

      expect(result2).not.toEqual(result1);
    });

    it("должен кешировать результаты для разных enum'ов независимо", () => {
      enum Features1 {
        feature1 = 'feature.one',
        feature2 = 'feature.two',
      }

      enum Features2 {
        feature3 = 'feature.three',
        feature4 = 'feature.four',
      }

      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': false,
        'feature.three': true,
        'feature.four': false,
      });

      // Кешируем первый enum
      const result1 = model.getFeatureFlags(Features1);
      expect(result1).toEqual({
        feature1: true,
        feature2: false,
      });

      // Кешируем второй enum
      const result2 = model.getFeatureFlags(Features2);
      expect(result2).toEqual({
        feature3: true,
        feature4: false,
      });

      // Повторные вызовы должны использовать кеш
      const result1Cached = model.getFeatureFlags(Features1);
      const result2Cached = model.getFeatureFlags(Features2);

      expect(result1Cached).toEqual(result1);
      expect(result2Cached).toEqual(result2);
    });

    it("должен инвалидировать кеш для всех enum'ов при изменении feature flags", () => {
      enum Features1 {
        feature1 = 'feature.one',
      }

      enum Features2 {
        feature2 = 'feature.two',
      }

      model.setFeatureFlags({
        'feature.one': true,
        'feature.two': true,
      });

      // Кешируем оба enum'а
      const result1Before = model.getFeatureFlags(Features1);
      const result2Before = model.getFeatureFlags(Features2);

      // Изменяем feature flags
      model.setFeatureFlags({
        'feature.one': false,
        'feature.two': false,
      });

      // Оба enum'а должны пересчитаться
      const result1After = model.getFeatureFlags(Features1);
      const result2After = model.getFeatureFlags(Features2);

      expect(result1After).not.toEqual(result1Before);
      expect(result2After).not.toEqual(result2Before);
      expect(result1After).toEqual({ feature1: false });
      expect(result2After).toEqual({ feature2: false });
    });
  });

  describe('getPermissions', () => {
    it('должен возвращать объект с ключами из enum и значениями permissions', () => {
      enum Permissions {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
        permission3 = 'permission.three',
      }

      // Устанавливаем permissions
      model.setPermissions({
        'permission.one': true,
        'permission.two': false,
        'permission.three': true,
      });

      const result = model.getPermissions(Permissions);

      expect(result).toEqual({
        permission1: true,
        permission2: false,
        permission3: true,
      });
    });

    it('должен возвращать false для несуществующих permissions', () => {
      enum Permissions {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
      }

      // Не устанавливаем permissions
      const result = model.getPermissions(Permissions);

      expect(result).toEqual({
        permission1: false,
        permission2: false,
      });
    });

    it('должен работать с числовыми enum значениями', () => {
      enum Permissions {
        permission1 = 1,
        permission2 = 2,
      }

      model.setPermissions({
        '1': true,
        '2': false,
      });

      const result = model.getPermissions(Permissions);

      expect(result).toEqual({
        permission1: true,
        permission2: false,
      });
    });

    it('должен возвращать пустой объект для пустого enum', () => {
      enum EmptyEnum {}

      const result = model.getPermissions(EmptyEnum);

      expect(result).toEqual({});
    });
  });

  describe('getPermission', () => {
    it('должен возвращать true для существующего permission', () => {
      model.setPermissions({
        'test.permission': true,
      });

      expect(model.getPermission('test.permission')).toBe(true);
    });

    it('должен возвращать false для несуществующего permission', () => {
      expect(model.getPermission('non.existent')).toBe(false);
    });

    it('должен возвращать false для undefined permission', () => {
      model.setPermissions({
        'test.permission': undefined as any,
      });

      expect(model.getPermission('test.permission')).toBe(false);
    });

    it('должен возвращать true для truthy значений', () => {
      model.setPermissions({
        'test.permission': 1 as any,
      });

      expect(model.getPermission('test.permission')).toBe(true);
    });
  });

  describe('setPermissions', () => {
    it('должен устанавливать permissions', () => {
      const permissions = {
        permission1: true,
        permission2: false,
        permission3: true,
      };

      model.setPermissions(permissions);

      expect(model.allPermissions).toEqual(permissions);
    });

    it('должен перезаписывать существующие permissions', () => {
      model.setPermissions({
        permission1: true,
        permission2: false,
      });

      model.setPermissions({
        permission1: false,
        permission3: true,
      });

      expect(model.allPermissions).toEqual({
        permission1: false,
        permission3: true,
      });
    });

    it('должен устанавливать пустой объект', () => {
      model.setPermissions({
        permission1: true,
      });

      model.setPermissions({});

      expect(model.allPermissions).toEqual({});
    });
  });

  describe('includesPermissions', () => {
    beforeEach(() => {
      model.setPermissions({
        permission1: true,
        permission2: true,
        permission3: false,
      });
    });

    it('должен возвращать true для существующего permission', () => {
      expect(model.includesPermissions('permission1')).toBe(true);
    });

    it('должен возвращать false для несуществующего permission', () => {
      expect(model.includesPermissions('non.existent')).toBe(false);
    });

    it('должен возвращать false для отключенного permission', () => {
      expect(model.includesPermissions('permission3')).toBe(false);
    });

    it('должен возвращать true если все permissions в массиве включены', () => {
      expect(model.includesPermissions(['permission1', 'permission2'])).toBe(
        true,
      );
    });

    it('должен возвращать false если хотя бы один permission в массиве отключен', () => {
      expect(model.includesPermissions(['permission1', 'permission3'])).toBe(
        false,
      );
    });

    it('должен возвращать false если хотя бы один permission в массиве не существует', () => {
      expect(model.includesPermissions(['permission1', 'non.existent'])).toBe(
        false,
      );
    });

    it('должен возвращать true для пустого массива', () => {
      expect(model.includesPermissions([])).toBe(true);
    });
  });

  describe('allPermissions getter', () => {
    it('должен возвращать текущие permissions', () => {
      const permissions = {
        permission1: true,
        permission2: false,
      };

      model.setPermissions(permissions);

      expect(model.allPermissions).toEqual(permissions);
    });

    it('должен возвращать пустой объект по умолчанию', () => {
      expect(model.allPermissions).toEqual({});
    });
  });

  describe('мемоизация getPermissions', () => {
    it('должен использовать кеш при повторных вызовах с тем же enum', () => {
      enum Permissions {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
      }

      model.setPermissions({
        'permission.one': true,
        'permission.two': false,
      });

      // Первый вызов - вычисляется
      const result1 = model.getPermissions(Permissions);
      expect(result1).toEqual({
        permission1: true,
        permission2: false,
      });

      // Второй вызов - должен использовать кеш
      const result2 = model.getPermissions(Permissions);
      expect(result2).toEqual({
        permission1: true,
        permission2: false,
      });

      // Результаты должны быть одинаковыми (но не обязательно тем же объектом)
      expect(result2).toEqual(result1);
    });

    it('должен инвалидировать кеш при изменении permissions через setPermissions', () => {
      enum Permissions {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
      }

      model.setPermissions({
        'permission.one': true,
        'permission.two': false,
      });

      // Первый вызов - вычисляется и кешируется
      const result1 = model.getPermissions(Permissions);
      expect(result1).toEqual({
        permission1: true,
        permission2: false,
      });

      // Изменяем permissions
      model.setPermissions({
        'permission.one': false,
        'permission.two': true,
      });

      // Второй вызов - должен пересчитать, так как кеш инвалидирован
      const result2 = model.getPermissions(Permissions);
      expect(result2).toEqual({
        permission1: false,
        permission2: true,
      });

      expect(result2).not.toEqual(result1);
    });

    it('должен инвалидировать кеш при изменении permissions через updatePermissions', () => {
      enum Permissions {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
      }

      model.setPermissions({
        'permission.one': true,
        'permission.two': false,
      });

      // Первый вызов - вычисляется и кешируется
      const result1 = model.getPermissions(Permissions);
      expect(result1).toEqual({
        permission1: true,
        permission2: false,
      });

      // Обновляем permissions
      model.updatePermissions({
        'permission.one': false,
      });

      // Второй вызов - должен пересчитать, так как кеш инвалидирован
      const result2 = model.getPermissions(Permissions);
      expect(result2).toEqual({
        permission1: false,
        permission2: false,
      });

      expect(result2).not.toEqual(result1);
    });

    it("должен кешировать результаты для разных enum'ов независимо", () => {
      enum Permissions1 {
        permission1 = 'permission.one',
        permission2 = 'permission.two',
      }

      enum Permissions2 {
        permission3 = 'permission.three',
        permission4 = 'permission.four',
      }

      model.setPermissions({
        'permission.one': true,
        'permission.two': false,
        'permission.three': true,
        'permission.four': false,
      });

      // Кешируем первый enum
      const result1 = model.getPermissions(Permissions1);
      expect(result1).toEqual({
        permission1: true,
        permission2: false,
      });

      // Кешируем второй enum
      const result2 = model.getPermissions(Permissions2);
      expect(result2).toEqual({
        permission3: true,
        permission4: false,
      });

      // Повторные вызовы должны использовать кеш
      const result1Cached = model.getPermissions(Permissions1);
      const result2Cached = model.getPermissions(Permissions2);

      expect(result1Cached).toEqual(result1);
      expect(result2Cached).toEqual(result2);
    });

    it("должен инвалидировать кеш для всех enum'ов при изменении permissions", () => {
      enum Permissions1 {
        permission1 = 'permission.one',
      }

      enum Permissions2 {
        permission2 = 'permission.two',
      }

      model.setPermissions({
        'permission.one': true,
        'permission.two': true,
      });

      // Кешируем оба enum'а
      const result1Before = model.getPermissions(Permissions1);
      const result2Before = model.getPermissions(Permissions2);

      // Изменяем permissions
      model.setPermissions({
        'permission.one': false,
        'permission.two': false,
      });

      // Оба enum'а должны пересчитаться
      const result1After = model.getPermissions(Permissions1);
      const result2After = model.getPermissions(Permissions2);

      expect(result1After).not.toEqual(result1Before);
      expect(result2After).not.toEqual(result2Before);
      expect(result1After).toEqual({ permission1: false });
      expect(result2After).toEqual({ permission2: false });
    });
  });
});
