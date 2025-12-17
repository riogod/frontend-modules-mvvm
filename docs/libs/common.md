# Common библиотека (@platform/common)

Библиотека общих сущностей (моделей данных, use cases и т.д.) для работы.

## Подключение

```typescript
import {
  AccessControlModel,
  GetFeatureFlagUsecase,
  GetPermissionUsecase,
} from '@platform/common';
```

## Use Cases

### Feature Flag Use Cases

| Use Case                    | Описание                      |
| --------------------------- | ----------------------------- |
| `GetFeatureFlagUsecase`     | Получить значение одного flag |
| `GetFeatureFlagsUsecase`    | Получить значения по enum     |
| `SetFeatureFlagsUsecase`    | Установить flags (замена)     |
| `UpdateFeatureFlagsUsecase` | Обновить flags (слияние)      |
| `RemoveFeatureFlagsUsecase` | Удалить flags                 |

### Использование в модуле

```typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetFeatureFlagUsecase } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
  ) {}

  get isNewFeatureEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('my.new.feature');
  }
}
```

### Permission Use Cases

| Use Case                   | Описание                            |
| -------------------------- | ----------------------------------- |
| `GetPermissionUsecase`     | Получить значение одного permission |
| `GetPermissionsUsecase`    | Получить значения по enum           |
| `SetPermissionsUsecase`    | Установить permissions (замена)     |
| `UpdatePermissionsUsecase` | Обновить permissions (слияние)      |
| `RemovePermissionsUsecase` | Удалить permissions                 |

### Использование в модуле

```typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetPermissionUsecase } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
  ) {}

  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }
}
```

## Проверка доступа в View

```typescript
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

const MyComponent: FC = observer(() => {
  const accessControl = useVM<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL);

  if (!accessControl.getFeatureFlag('my.feature')) {
    return null;
  }

  if (!accessControl.getPermission('action.perform')) {
    return <div>Нет доступа</div>;
  }

  return <div>Контент доступен</div>;
});
```

## Типы

### AccessControlsType

```typescript
type AccessControlsType = Record<string, boolean>;
```

## Связанные разделы

- [Core библиотека](./core.md)
- [Конфигурация модуля](../modules/module-config.md) — настройка featureFlags и permissions
- [Типы модулей](../modules/module-types.md) — условия загрузки модулей
