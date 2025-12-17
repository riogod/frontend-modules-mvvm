# Permissions (Разрешения)

Permissions — это механизм контроля доступа к действиям и функциональности на основе прав пользователя.

## Что такое permissions?

Permissions (разрешения) — это динамические булевые флаги, определяющие, имеет ли пользователь право выполнять определённое действие. В отличие от [фича-флагов](./feature-toggles.md) (статические переключатели функций), permissions:

- Привязаны к роли или правам конкретного пользователя
- Используются для контроля доступа к действиям (CRUD операции, навигация)
- Позволяют загружать только тот функционал, который доступен для пользователя.

## Для чего используются

| Сценарий                         | Описание                                         |
| -------------------------------- | ------------------------------------------------ |
| **Контроль доступа к действиям** | Разрешение на создание, редактирование, удаление |
| **Скрытие UI элементов**         | Кнопки и меню недоступны без нужных прав         |
| **Условная загрузка модулей**    | Модуль загружается только при наличии прав       |
| **Защита маршрутов**             | Доступ к странице только для авторизованных      |
| **Ролевая модель (RBAC)**        | Разные права для admin, manager, user            |

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Backend/API                          │
│            (permissions: { "user.create": true })           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OnAppStartHandler                        │
│         accessControlModel.setPermissions(...)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AccessControlModel                        │
│      _permissions: { "user.create": true, ... }            │
│                                                             │
│  • getPermission(key)                                       │
│  • getPermissions(enum)                                     │
│  • includesPermissions(permissions)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ModuleLoader │    │   Router    │    │  ViewModel  │
│             │    │             │    │    View     │
│ Условная    │    │ Защита      │    │             │
│ загрузка    │    │ маршрутов   │    │ Условный UI │
│ модулей     │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Загрузка permissions

Permissions загружаются при старте приложения в `OnAppStartHandler`:

```typescript
// host/src/bootstrap/handlers/OnAppStartHandler.ts
export class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // ... инициализация DI ...

    const accessControlModel = bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );

    // Загрузка из манифеста или API
    const manifest = bootstrap.getAppStartManifest();

    if (manifest && manifest.data) {
      accessControlModel.setPermissions(manifest.data.permissions || {});
    }

    return await super.handle(bootstrap);
  }
}
```

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с permissions:

| Use Case                   | Описание                              | Токен DI                                     |
| -------------------------- | ------------------------------------- | -------------------------------------------- |
| `GetPermissionUsecase`     | Получить значение одного разрешения   | `IOC_CORE_TOKENS.USECASE_GET_PERMISSION`     |
| `GetPermissionsUsecase`    | Получить значения по enum             | `IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS`    |
| `SetPermissionsUsecase`    | Установить разрешения (полная замена) | `IOC_CORE_TOKENS.USECASE_SET_PERMISSIONS`    |
| `UpdatePermissionsUsecase` | Обновить разрешения (слияние)         | `IOC_CORE_TOKENS.USECASE_UPDATE_PERMISSIONS` |
| `RemovePermissionsUsecase` | Удалить разрешение                    | `IOC_CORE_TOKENS.USECASE_REMOVE_PERMISSIONS` |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для проверки прав в UI:

```typescript
import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type {
  GetPermissionUsecase,
  GetPermissionsUsecase,
} from '@platform/common';

// Enum с разрешениями для модуля
enum UserPermissions {
  Create = 'user.create',
  Read = 'user.read',
  Update = 'user.update',
  Delete = 'user.delete',
}

@injectable()
export class UserListViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS)
    private getPermissionsUsecase: GetPermissionsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Реактивный геттер для одного разрешения
  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }

  // Реактивный геттер для группы разрешений
  get permissions(): Record<keyof typeof UserPermissions, boolean> {
    return this.getPermissionsUsecase.execute(UserPermissions);
  }

  // Вычисляемое свойство — есть ли права на редактирование
  get canEdit(): boolean {
    return this.permissions.Update;
  }

  // Вычисляемое свойство — полный доступ (все CRUD права)
  get hasFullAccess(): boolean {
    const p = this.permissions;
    return p.Create && p.Read && p.Update && p.Delete;
  }
}
```

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении permissions.

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте права через ViewModel — это обеспечивает разделение ответственности:

```tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM, Button, Box, IconButton } from '@platform/ui';
import type { UserListViewModel } from '../viewmodels/user_list.vm';
import { USER_DI_TOKENS } from '../config/di.tokens';

const UserListPage: FC = observer(() => {
  const vm = useVM<UserListViewModel>(USER_DI_TOKENS.VIEW_MODEL_USER_LIST);

  return (
    <Box>
      {/* Кнопка создания — только если есть право */}
      {vm.canCreateUser && (
        <Button onClick={() => vm.openCreateDialog()}>
          Создать пользователя
        </Button>
      )}

      {/* Список пользователей */}
      {vm.users.map((user) => (
        <UserRow key={user.id} user={user}>
          {/* Кнопка редактирования */}
          {vm.canEdit && (
            <IconButton onClick={() => vm.editUser(user.id)}>
              <EditIcon />
            </IconButton>
          )}

          {/* Кнопка удаления */}
          {vm.permissions.Delete && (
            <IconButton onClick={() => vm.deleteUser(user.id)}>
              <DeleteIcon />
            </IconButton>
          )}
        </UserRow>
      ))}
    </Box>
  );
});

export default UserListPage;
```

### Прямой доступ к AccessControlModel

В редких случаях можно получить permissions напрямую:

```tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

const AdminPanel: FC = observer(() => {
  const accessControl = useVM<AccessControlModel>(
    IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
  );

  // Проверка одного разрешения
  if (!accessControl.getPermission('admin.panel.access')) {
    return <div>Доступ запрещён</div>;
  }

  // Проверка нескольких разрешений
  const canManageUsers = accessControl.includesPermissions([
    'user.create',
    'user.update',
    'user.delete',
  ]);

  return (
    <div>
      <h2>Панель администратора</h2>
      {canManageUsers && <UserManagement />}
    </div>
  );
});

export default AdminPanel;
```

> **Важно**: Оборачивайте компонент в `observer()` из `mobx-react-lite` для реактивных обновлений.

---

## Условная загрузка модулей

Permissions определяют, будет ли загружен модуль. Это настраивается в конфигурации модуля:

### Конфигурация модуля

```typescript
// packages/admin/src/config/module_config.ts
import { type ModuleConfig } from '@platform/core';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },

  // Информация для манифеста — условия загрузки
  mockModuleInfo: {
    name: 'admin',
    loadType: 'normal',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    featureFlags: [],
    // ⬇️ Модуль загрузится только если есть право admin.access у данного польщователя
    accessPermissions: ['admin.access'],
  },

  // Мок-данные для локальной разработки
  mockModuleData: {
    features: {},
    permissions: {
      'admin.access': true,
      'admin.users.manage': true,
      'admin.settings.edit': true,
    },
  },
} as ModuleConfig;
```

> Модуль загрузится только если **все** указанные `accessPermissions` имеют значение `true`.

---

## Примеры enum-ов для permissions

### Именование enum

Название enum должно содержать **модульный префикс** и суффикс `Permissions`:

**Формат:** `<Module>Permissions`

| Пример             | Модуль              |
| ------------------ | ------------------- |
| `UserPermissions`  | Управление юзерами  |
| `OrderPermissions` | Управление заказами |
| `AdminPermissions` | Админ-панель        |

### Именование ключей permissions

Значения permissions должны начинаться с **модульного префикса** — это обеспечивает уникальность.

**Формат:** `<module>.<entity>.<action>`

| Часть    | Описание            | Пример                               |
| -------- | ------------------- | ------------------------------------ |
| `module` | Название модуля     | `user`, `order`, `admin`             |
| `entity` | Сущность или ресурс | `profile`, `list`, `settings`        |
| `action` | Действие            | `create`, `read`, `update`, `delete` |

### Примеры

```typescript
// Разрешения для модуля пользователей
enum UserPermissions {
  Create = 'user.create',
  Read = 'user.read',
  Update = 'user.update',
  Delete = 'user.delete',
  ManageRoles = 'user.roles.manage',
}

// Разрешения для модуля заказов
enum OrderPermissions {
  View = 'order.view',
  Create = 'order.create',
  Cancel = 'order.cancel',
  Refund = 'order.refund',
  Export = 'order.export',
}

// Разрешения для админ-панели
enum AdminPermissions {
  Access = 'admin.access',
  UsersManage = 'admin.users.manage',
  SettingsEdit = 'admin.settings.edit',
  LogsView = 'admin.logs.view',
}
```

---

## Лучшие практики

### ✅ Правильно

```typescript
// Используйте осмысленные имена с namespace
enum UserPermissions {
  Create = 'user.create',
  Delete = 'user.delete',
}

// Проверяйте права в ViewModel
class MyViewModel {
  get canDelete(): boolean {
    return this.getPermissionUsecase.execute('user.delete');
  }
}

// Скрывайте UI элементы при отсутствии прав
{vm.canDelete && <DeleteButton />}

// Используйте enum для типобезопасности
const permissions = this.getPermissionsUsecase.execute(UserPermissions);
```

### ❌ Неправильно

```typescript
// Хардкод строк — сложно поддерживать
if (this.getPermissionUsecase.execute('delete')) {
}

// Проверка прав только на фронтенде — небезопасно!
// Всегда проверяйте права на бэкенде тоже
const deleteUser = () => {
  // ⚠️ Без серверной проверки это уязвимость
  api.deleteUser(id);
};

// Слишком общие имена
enum Permissions {
  P1 = 'p1', // Что это за permission?
}
```

---

## Отличия от Feature Flags

| Аспект           | Feature Flags                  | Permissions                   |
| ---------------- | ------------------------------ | ----------------------------- |
| **Назначение**   | Включение/отключение функций   | Контроль доступа к действиям  |
| **Привязка**     | К приложению/окружению         | К пользователю/роли           |
| **Изменяемость** | Обычно статичны в сессии       | Могут меняться динамически    |
| **Примеры**      | `ui.dark_mode`, `beta.feature` | `user.create`, `admin.access` |
| **Use Case**     | A/B тесты, раскатка функций    | RBAC, защита ресурсов         |

---

## Связанные разделы

- [Фича-флаги](./feature-toggles.md) — константные переключатели функций
- [Server Parameters](./server-parameters.md) — серверные параметры
- [Конфигурация модуля](../modules/module-config.md) — настройка accessPermissions
- [Типы модулей](../modules/module-types.md) — условия загрузки модулей
- [Common библиотека](../libs/common.md) — модели и use cases
- [MVVM паттерн](../modules/mvvm-pattern.md) — архитектура слоёв
