import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Фича-флаги (Feature Flags)

Фича-флаги — это механизм управления функциональностью приложения через булевые переключатели. Они позволяют включать и отключать функции без изменения кода и развертывания.

## Что такое фича-флаги?

Фича-флаги (feature flags, feature toggles) — это константные булевые обёртки, которые определяют доступность определённой функциональности в приложении. В отличие от permissions (динамические разрешения на действия), фича-флаги обычно:

- Определяются на этапе конфигурации приложения
- Не меняются во время сессии пользователя
- Используются для A/B тестирования, постепенного раскатывания функций, или скрытия незавершённого функционала

## Для чего используются

| Сценарий                          | Описание                                                  |
| --------------------------------- | --------------------------------------------------------- |
| **A/B тестирование**              | Сравнение разных реализаций одной функции                 |
| **Kill switch**                   | Быстрое отключение проблемного функционала без передеплоя |
| **Условная загрузка модулей**     | Загрузка MFE-модуля только при наличии нужного флага      |
| **Скрытие незавершённых функций** | Разработка в продакшене без показа пользователям          |

## Архитектура

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Backend/API                          │
│              (features: { "my.feature": true })             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OnAppStartHandler                        │
│         accessControlModel.setFeatureFlags(...)             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   AccessControlModel                        │
│      _featureFlags: { "my.feature": true, ... }            │
│                                                             │
│  • getFeatureFlag(key)                                      │
│  • getFeatureFlags(enum)                                    │
│  • includesFeatureFlags(flags)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ModuleLoader │    │   Router    │    │  ViewModel  │
│             │    │             │    │    View     │
│ Условная    │    │ Условный    │    │             │
│ загрузка    │    │ рендеринг   │    │ Условный UI │
│ модулей     │    │ маршрутов   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

## Загрузка фича-флагов

Фича-флаги загружаются при старте приложения в \`OnAppStartHandler\`:

\`\`\`typescript
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
      accessControlModel.setFeatureFlags(manifest.data.features || {});
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с фича-флагами:

| Use Case                    | Описание                         | Токен DI                                       |
| --------------------------- | -------------------------------- | ---------------------------------------------- |
| \`GetFeatureFlagUsecase\`     | Получить значение одного флага   | \`IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG\`     |
| \`GetFeatureFlagsUsecase\`    | Получить значения по enum        | \`IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAGS\`    |
| \`SetFeatureFlagsUsecase\`    | Установить флаги (полная замена) | \`IOC_CORE_TOKENS.USECASE_SET_FEATURE_FLAGS\`    |
| \`UpdateFeatureFlagsUsecase\` | Обновить флаги (слияние)         | \`IOC_CORE_TOKENS.USECASE_UPDATE_FEATURE_FLAGS\` |
| \`RemoveFeatureFlagsUsecase\` | Удалить флаг                     | \`IOC_CORE_TOKENS.USECASE_REMOVE_FEATURE_FLAGS\` |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для отображения в UI:

\`\`\`typescript
import { makeAutoObservable, computed } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type {
  GetFeatureFlagUsecase,
  GetFeatureFlagsUsecase,
} from '@platform/common';

// Enum с флагами для модуля
enum DashboardFeatures {
  NewWidgets = 'dashboard.widgets.v2',
  DarkMode = 'dashboard.dark_mode',
  ExportPdf = 'dashboard.export.pdf',
}

@injectable()
export class DashboardViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAGS)
    private getFeatureFlagsUsecase: GetFeatureFlagsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Реактивный геттер для одного флага
  get isNewWidgetsEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('dashboard.widgets.v2');
  }

  // Реактивный геттер для группы флагов
  get features(): Record<keyof typeof DashboardFeatures, boolean> {
    return this.getFeatureFlagsUsecase.execute(DashboardFeatures);
  }

  // Вычисляемое свойство на основе флагов
  get availableExportFormats(): string[] {
    const formats = ['csv', 'xlsx'];

    if (this.features.ExportPdf) {
      formats.push('pdf');
    }

    return formats;
  }
}
\`\`\`

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении флагов (если они изменяются динамически).

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте состояние флагов через ViewModel — это обеспечивает разделение ответственности:

\`\`\`tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM, Button, Box } from '@platform/ui';
import type { DashboardViewModel } from '../viewmodels/dashboard.vm';
import { DASHBOARD_DI_TOKENS } from '../config/di.tokens';

const DashboardPage: FC = observer(() => {
  const vm = useVM<DashboardViewModel>(
    DASHBOARD_DI_TOKENS.VIEW_MODEL_DASHBOARD,
  );

  return (
    <Box>
      {/* Условный рендеринг на основе флага */}
      {vm.isNewWidgetsEnabled ? <NewWidgetsPanel /> : <LegacyWidgetsPanel />}

      {/* Условное отображение кнопки экспорта */}
      {vm.features.ExportPdf && (
        <Button onClick={() => vm.exportToPdf()}>Экспорт в PDF</Button>
      )}

      {/* Список доступных форматов */}
      <ExportMenu formats={vm.availableExportFormats} />
    </Box>
  );
});

export default DashboardPage;
\`\`\`

### Прямой доступ к AccessControlModel

В редких случаях, когда нет подходящей ViewModel, можно получить флаги напрямую:

\`\`\`tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

const FeaturePreview: FC = observer(() => {
  const accessControl = useVM<AccessControlModel>(
    IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
  );

  // Проверка одного флага
  if (!accessControl.getFeatureFlag('preview.beta.enabled')) {
    return null;
  }

  // Проверка нескольких флагов
  const hasPremiumFeatures = accessControl.includesFeatureFlags([
    'premium.feature1',
    'premium.feature2',
  ]);

  return (
    <div>
      <h2>Превью новой функции</h2>
      {hasPremiumFeatures && <PremiumBadge />}
    </div>
  );
});

export default FeaturePreview;
\`\`\`

> **Важно**: Оборачивайте компонент в \`observer()\` из \`mobx-react-lite\` для реактивных обновлений.

---

## Условная загрузка модулей

Фича-флаги определяют, будет ли загружен MFE-модуль. Это настраивается в конфигурации модуля:

### Конфигурация модуля

\`\`\`typescript
// packages/my-module/src/config/module_config.ts
import { type ModuleConfig } from '@platform/core';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },

  // Информация для манифеста — условия загрузки
  mockModuleInfo: {
    name: 'my-module',
    loadType: 'normal',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    // ⬇️ Модуль загрузится только если оба флага = true
    featureFlags: ['my-module.enabled', 'beta.features.enabled'],
    accessPermissions: ['my-module.access'],
  },

  // Мок-данные для локальной разработки
  mockModuleData: {
    features: {
      'my-module.enabled': true,
      'beta.features.enabled': true,
    },
    permissions: {
      'my-module.access': true,
    },
  },
} as ModuleConfig;
\`\`\`

> Модуль загрузится только если **все** указанные \`featureFlags\` имеют значение \`true\`.

## Примеры enum-ов для флагов

### Именование enum

Название enum должно содержать **модульный префикс** и суффикс \`Features\`:

**Формат:** \`<Module>Features\`

| Пример            | Модуль             |
| ----------------- | ------------------ |
| \`AuthFeatures\`    | Модуль авторизации |
| \`PaymentFeatures\` | Модуль платежей    |
| \`TodoFeatures\`    | Модуль задач       |

### Именование ключей флагов

Значения флагов должны начинаться с **модульного префикса** — это обеспечивает уникальность и позволяет легко определить, к какому модулю относится флаг.

**Формат:** \`<module>.<feature>.<action>\`

| Часть     | Описание                   | Пример                         |
| --------- | -------------------------- | ------------------------------ |
| \`module\`  | Название модуля или домена | \`auth\`, \`payment\`, \`ui\`        |
| \`feature\` | Название функции           | \`social_login\`, \`2fa\`, \`theme\` |
| \`action\`  | Тип флага (опционально)    | \`enabled\`, \`visible\`, \`v2\`     |

### Примеры

\`\`\`typescript
// Флаги для модуля авторизации
enum AuthFeatures {
  SocialLogin = 'auth.social_login.enabled',
  TwoFactor = 'auth.2fa.enabled',
  Biometrics = 'auth.biometrics.enabled',
  PasswordLess = 'auth.passwordless.enabled',
}

// Флаги для UI модуля
enum UiFeatures {
  DarkTheme = 'ui.theme.dark',
  AnimationsEnabled = 'ui.animations.enabled',
  NewNavigation = 'ui.nav.v2',
}

// Флаги для экспериментов
enum ExperimentFeatures {
  CheckoutV2 = 'experiment.checkout.v2',
  RecommendationsAI = 'experiment.recommendations.ai',
}
\`\`\`

---

## Лучшие практики

### ✅ Правильно

\`\`\`typescript
// Используйте осмысленные имена с namespace
enum Features {
  PaymentApplePay = 'payment.apple_pay.enabled',
}

// Проверяйте флаги в ViewModel, а не в View
class MyViewModel {
  get isFeatureEnabled() {
    return this.getFeatureFlagUsecase.execute('my.feature');
  }
}

// Определяйте флаги в enum для типобезопасности
const flags = this.getFeatureFlagsUsecase.execute(Features);
\`\`\`

### ❌ Неправильно

\`\`\`typescript
// Хардкод строк в коде — сложно искать и рефакторить
if (this.getFeatureFlagUsecase.execute('some_feature')) {}

// Слишком общие имена
enum Features {
  Feature1 = 'feature1', // Что это за feature?
}

// Проверка в View без observer — не будет реактивности
const MyComponent = () => {
  const model = useVM<AccessControlModel>(...);
  // ⚠️ Без observer компонент не перерендерится при изменении флага
  if (model.getFeatureFlag('my.feature')) {}
};
\`\`\`


---

# Permissions (Разрешения)

Permissions — это механизм контроля доступа к действиям и функциональности на основе прав пользователя.

## Что такое permissions?

Permissions (разрешения) — это динамические булевые флаги, определяющие, имеет ли пользователь право выполнять определённое действие. В отличие от фича-флагов (статические переключатели функций), permissions:

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

\`\`\`
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
\`\`\`

## Загрузка permissions

Permissions загружаются при старте приложения в \`OnAppStartHandler\`:

\`\`\`typescript
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
\`\`\`

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с permissions:

| Use Case                   | Описание                              | Токен DI                                     |
| -------------------------- | ------------------------------------- | -------------------------------------------- |
| \`GetPermissionUsecase\`     | Получить значение одного разрешения   | \`IOC_CORE_TOKENS.USECASE_GET_PERMISSION\`     |
| \`GetPermissionsUsecase\`    | Получить значения по enum             | \`IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS\`    |
| \`SetPermissionsUsecase\`    | Установить разрешения (полная замена) | \`IOC_CORE_TOKENS.USECASE_SET_PERMISSIONS\`    |
| \`UpdatePermissionsUsecase\` | Обновить разрешения (слияние)         | \`IOC_CORE_TOKENS.USECASE_UPDATE_PERMISSIONS\` |
| \`RemovePermissionsUsecase\` | Удалить разрешение                    | \`IOC_CORE_TOKENS.USECASE_REMOVE_PERMISSIONS\` |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для проверки прав в UI:

\`\`\`typescript
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
\`\`\`

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении permissions.

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте права через ViewModel — это обеспечивает разделение ответственности:

\`\`\`tsx
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
\`\`\`

### Прямой доступ к AccessControlModel

В редких случаях можно получить permissions напрямую:

\`\`\`tsx
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
\`\`\`

> **Важно**: Оборачивайте компонент в \`observer()\` из \`mobx-react-lite\` для реактивных обновлений.

---

## Условная загрузка модулей

Permissions определяют, будет ли загружен модуль. Это настраивается в конфигурации модуля:

### Конфигурация модуля

\`\`\`typescript
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
\`\`\`

> Модуль загрузится только если **все** указанные \`accessPermissions\` имеют значение \`true\`.

---

## Примеры enum-ов для permissions

### Именование enum

Название enum должно содержать **модульный префикс** и суффикс \`Permissions\`:

**Формат:** \`<Module>Permissions\`

| Пример             | Модуль              |
| ------------------ | ------------------- |
| \`UserPermissions\`  | Управление юзерами  |
| \`OrderPermissions\` | Управление заказами |
| \`AdminPermissions\` | Админ-панель        |

### Именование ключей permissions

Значения permissions должны начинаться с **модульного префикса** — это обеспечивает уникальность.

**Формат:** \`<module>.<entity>.<action>\`

| Часть    | Описание            | Пример                               |
| -------- | ------------------- | ------------------------------------ |
| \`module\` | Название модуля     | \`user\`, \`order\`, \`admin\`             |
| \`entity\` | Сущность или ресурс | \`profile\`, \`list\`, \`settings\`        |
| \`action\` | Действие            | \`create\`, \`read\`, \`update\`, \`delete\` |

### Примеры

\`\`\`typescript
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
\`\`\`

---

## Лучшие практики

### ✅ Правильно

\`\`\`typescript
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
\`\`\`

### ❌ Неправильно

\`\`\`typescript
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
\`\`\`

---

## Отличия от Feature Flags

| Аспект           | Feature Flags                  | Permissions                   |
| ---------------- | ------------------------------ | ----------------------------- |
| **Назначение**   | Включение/отключение функций   | Контроль доступа к действиям  |
| **Привязка**     | К приложению/окружению         | К пользователю/роли           |
| **Изменяемость** | Обычно статичны в сессии       | Могут меняться динамически    |
| **Примеры**      | \`ui.dark_mode\`, \`beta.feature\` | \`user.create\`, \`admin.access\` |
| **Use Case**     | A/B тесты, раскатка функций    | RBAC, защита ресурсов         |


---

# Server Parameters (Серверные параметры)

Server Parameters — это механизм передачи серверных конфигурационных данных в клиентское приложение при старте.

## Что такое server parameters?

Server Parameters (серверные параметры) — это произвольные конфигурационные данные, передаваемые с сервера при инициализации приложения. В отличие от фича-флагов (булевые переключатели) и permissions (разрешения), параметры могут содержать любые типы значений:

- Строки (\`string\`)
- Числа (\`number\`)
- Булевы значения (\`boolean\`)
- Объекты (\`object\`)
- Массивы (\`array\`)

## Для чего используются

| Сценарий                   | Описание                                             |
| -------------------------- | ---------------------------------------------------- |
| **Конфигурация модулей**   | Настройки, специфичные для конкретного модуля        |
| **URL-адреса и endpoints** | Динамические адреса API, CDN, внешних сервисов       |
| **Лимиты и ограничения**   | Максимальное количество элементов, размеры, таймауты |
| **Текстовые значения**     | Сообщения, заголовки, описания, настраиваемые тексты |
| **Настройки UI**           | Количество элементов на странице, размеры, стили     |
| **Интеграции**             | идентификаторы внешних сервисов                      |

## Архитектура

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Backend/API                          │
│   (params: { "api.url": "https://...", "perPage": 10 })    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OnAppStartHandler                        │
│              appParamsModel.setParams(...)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      AppParamsModel                          │
│    _params: { "api.url": "https://...", "perPage": 10 }    │
│                                                             │
│  • getParam<T>(key)                                         │
│  • getParamsByKeys<T>(keys[])                               │
│  • hasParams(keys)                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ViewModel  │    │   UseCase   │    │    View     │
│             │    │             │    │             │
│ Конфигурация│    │ Бизнес-     │    │ Условный    │
│ модуля      │    │ логика      │    │ рендеринг   │
└─────────────┘    └─────────────┘    └─────────────┘
\`\`\`

## Загрузка параметров

Параметры загружаются при старте приложения в \`OnAppStartHandler\`:

\`\`\`typescript
// host/src/bootstrap/handlers/OnAppStartHandler.ts
export class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // ... инициализация DI ...

    const appParamsModel = bootstrap.di.get<AppParamsModel>(
      IOC_CORE_TOKENS.MODEL_APP_PARAMS,
    );

    // Загрузка из манифеста или API
    const manifest = bootstrap.getAppStartManifest();

    if (manifest && manifest.data) {
      appParamsModel.setParams(manifest.data.params);
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с параметрами:

| Use Case              | Описание                             | Токен DI                                |
| --------------------- | ------------------------------------ | --------------------------------------- |
| \`GetParamUsecase\`     | Получить значение одного параметра   | \`IOC_CORE_TOKENS.USECASE_GET_PARAM\`     |
| \`GetParamsUsecase\`    | Получить значения по массиву ключей  | \`IOC_CORE_TOKENS.USECASE_GET_PARAMS\`    |
| \`SetParamsUsecase\`    | Установить параметры (полная замена) | \`IOC_CORE_TOKENS.USECASE_SET_PARAMS\`    |
| \`UpdateParamsUsecase\` | Обновить параметры (слияние)         | \`IOC_CORE_TOKENS.USECASE_UPDATE_PARAMS\` |
| \`RemoveParamUsecase\`  | Удалить параметр                     | \`IOC_CORE_TOKENS.USECASE_REMOVE_PARAM\`  |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для работы с параметрами:

\`\`\`typescript
import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetParamUsecase, GetParamsUsecase } from '@platform/common';

@injectable()
export class JokeViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAMS)
    private getParamsUsecase: GetParamsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Реактивный геттер для одного параметра с типизацией
  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('api.module.url') || '';
  }

  // Реактивный геттер для параметра с дефолтным значением
  get itemsPerPage(): number {
    return this.getParamUsecase.execute<number>('todo.perPage') || 10;
  }

  // Реактивный геттер для группы параметров
  get config(): Record<string, unknown> {
    return this.getParamsUsecase.execute<unknown>([
      'api.module.url',
      'api.module.timeout',
      'api.module.retries',
    ]);
  }

  // Вычисляемое свойство на основе параметров
  get requestConfig() {
    const config = this.config;
    return {
      url: config['api.module.url'] as string,
      timeout: (config['api.module.timeout'] as number) || 5000,
      retries: (config['api.module.retries'] as number) || 3,
    };
  }
}
\`\`\`

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении параметров.

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте параметры через ViewModel — это обеспечивает разделение ответственности:

\`\`\`tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM, Box, Typography } from '@platform/ui';
import type { JokeViewModel } from '../viewmodels/joke.vm';
import { JOKE_DI_TOKENS } from '../config/di.tokens';

const JokeMessage: FC = observer(() => {
  const vm = useVM<JokeViewModel>(JOKE_DI_TOKENS.VIEW_MODEL_JOKE);

  return (
    <Box>
      {/* Отображение параметра из сервера */}
      <Typography variant="body2">Параметр: {vm.paramValue}</Typography>

      {/* Использование параметра в логике */}
      {vm.itemsPerPage > 20 && (
        <Typography variant="caption">
          Большой размер страницы: {vm.itemsPerPage}
        </Typography>
      )}

      {/* Использование конфигурации */}
      <ApiClient config={vm.requestConfig} />
    </Box>
  );
});

export default JokeMessage;
\`\`\`

### Прямой доступ к AppParamsModel

Можно получить параметры напрямую:

\`\`\`tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AppParamsModel } from '@platform/common';

const ConfigDisplay: FC = observer(() => {
  const appParams = useVM<AppParamsModel>(IOC_CORE_TOKENS.MODEL_APP_PARAMS);

  // Получение одного параметра с типизацией
  const apiUrl = appParams.getParamTyped<string>('api.module.url');
  const timeout = appParams.getParamTyped<number>('api.module.timeout') || 5000;

  // Проверка наличия параметров
  const hasConfig = appParams.hasParams([
    'api.module.url',
    'api.module.timeout',
  ]);

  if (!hasConfig) {
    return <div>Конфигурация не загружена</div>;
  }

  return (
    <div>
      <p>API URL: {apiUrl}</p>
      <p>Timeout: {timeout}ms</p>
    </div>
  );
});

export default ConfigDisplay;
\`\`\`

> **Важно**: Оборачивайте компонент в \`observer()\` из \`mobx-react-lite\` для реактивных обновлений.

---

## Типизация параметров

### Использование дженериков

Все методы получения параметров поддерживают типизацию через дженерики:

\`\`\`typescript
// Строковый параметр
const apiUrl = getParamUsecase.execute<string>('api.module.url');

// Числовой параметр
const perPage = getParamUsecase.execute<number>('todo.perPage');

// Булев параметр
const enabled = getParamUsecase.execute<boolean>('feature.enabled');

// Объект
interface Config {
  url: string;
  timeout: number;
}
const config = getParamUsecase.execute<Config>('api.config');

// Массив
const items = getParamUsecase.execute<string[]>('menu.items');
\`\`\`

### Получение нескольких параметров

Для получения группы параметров используйте \`GetParamsUsecase\`:

\`\`\`typescript
// Получение нескольких параметров одного типа
const stringParams = getParamsUsecase.execute<string>([
  'api.module.url',
  'api.module.version',
  'api.module.environment',
]);

// Результат: { "api.module.url": string | undefined, ... }

// Использование с разными типами
const url = getParamUsecase.execute<string>('api.module.url');
const timeout = getParamUsecase.execute<number>('api.module.timeout');
const enabled = getParamUsecase.execute<boolean>('api.module.enabled');
\`\`\`

---

## Именование параметров

### Формат ключей

Ключи параметров должны следовать единому формату для обеспечения уникальности и читаемости:

**Формат:** \`<module>.<feature>.<property>\`

| Часть      | Описание                      | Пример                        |
| ---------- | ----------------------------- | ----------------------------- |
| \`module\`   | Название модуля или домена    | \`api\`, \`todo\`, \`core\`, \`ui\`   |
| \`feature\`  | Название функции или сущности | \`module\`, \`request\`, \`export\` |
| \`property\` | Конкретное свойство           | \`url\`, \`timeout\`, \`perPage\`   |

### Примеры

\`\`\`typescript
// Параметры для модуля API
'api.module.url'; // URL API сервера
'api.module.timeout'; // Таймаут запросов
'api.module.retries'; // Количество повторов

// Параметры для модуля задач
'todo.perPage'; // Элементов на странице
'todo.maxItems'; // Максимальное количество задач
'todo.exportFormats'; // Доступные форматы экспорта

// Параметры для ядра приложения
'core.apiUrl'; // Базовый URL API
'core.cdnUrl'; // URL CDN для статики
'core.environment'; // Окружение (dev, staging, prod)

// Параметры для UI
'ui.theme.default'; // Тема по умолчанию
'ui.pagination.size'; // Размер пагинации
'ui.notifications.duration'; // Длительность уведомлений
\`\`\`

---

## Примеры использования

### Конфигурация API клиента

\`\`\`typescript
@injectable()
export class ApiClientViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {
    makeAutoObservable(this);
  }

  get apiConfig() {
    return {
      baseUrl:
        this.getParamUsecase.execute<string>('api.module.url') ||
        'https://api.example.com',
      timeout:
        this.getParamUsecase.execute<number>('api.module.timeout') || 5000,
      retries: this.getParamUsecase.execute<number>('api.module.retries') || 3,
    };
  }
}
\`\`\`

---

## Лучшие практики

### ✅ Правильно

\`\`\`typescript
// Используйте типизацию для безопасности типов
const apiUrl = getParamUsecase.execute<string>('api.module.url');

// Предоставляйте дефолтные значения
const timeout = getParamUsecase.execute<number>('api.module.timeout') || 5000;

// Используйте осмысленные имена с namespace
const perPage = getParamUsecase.execute<number>('todo.perPage');

// Группируйте связанные параметры
const config = getParamsUsecase.execute<unknown>([
  'api.module.url',
  'api.module.timeout',
]);

// Проверяйте наличие параметров перед использованием
if (appParams.hasParams(['api.module.url'])) {
  const url = appParams.getParamTyped<string>('api.module.url');
}
\`\`\`

### ❌ Неправильно

\`\`\`typescript
// Хардкод значений в коде — используйте параметры
const apiUrl = 'https://api.example.com'; // ❌

// Отсутствие типизации — может привести к ошибкам
const timeout = getParamUsecase.execute('api.module.timeout'); // ❌

// Слишком общие имена без namespace
const url = getParamUsecase.execute<string>('url'); // ❌

// Игнорирование отсутствующих параметров
const url = getParamUsecase.execute<string>('api.module.url');
url.toUpperCase(); // ❌ Может быть undefined

// Использование параметров для бизнес-логики
// Параметры — для конфигурации, не для условий
if (getParamUsecase.execute<boolean>('user.canDelete')) {
  // ❌
  // Это должно быть permission, а не parameter
}
\`\`\`
`;

/**
 * Страница документации: Механики.
 *
 * @component
 */
const MechanicsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.mechanics')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default MechanicsPage;
