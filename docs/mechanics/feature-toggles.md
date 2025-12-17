# Фича-флаги (Feature Flags)

Фича-флаги — это механизм управления функциональностью приложения через булевые переключатели. Они позволяют включать и отключать функции без изменения кода и развертывания.

## Что такое фича-флаги?

Фича-флаги (feature flags, feature toggles) — это константные булевые обёртки, которые определяют доступность определённой функциональности в приложении. В отличие от [permissions](./permissions.md) (динамические разрешения на действия), фича-флаги обычно:

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

```
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
```

## Загрузка фича-флагов

Фича-флаги загружаются при старте приложения в `OnAppStartHandler`:

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
      accessControlModel.setFeatureFlags(manifest.data.features || {});
    }

    return await super.handle(bootstrap);
  }
}
```

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с фича-флагами:

| Use Case                    | Описание                         | Токен DI                                       |
| --------------------------- | -------------------------------- | ---------------------------------------------- |
| `GetFeatureFlagUsecase`     | Получить значение одного флага   | `IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG`     |
| `GetFeatureFlagsUsecase`    | Получить значения по enum        | `IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAGS`    |
| `SetFeatureFlagsUsecase`    | Установить флаги (полная замена) | `IOC_CORE_TOKENS.USECASE_SET_FEATURE_FLAGS`    |
| `UpdateFeatureFlagsUsecase` | Обновить флаги (слияние)         | `IOC_CORE_TOKENS.USECASE_UPDATE_FEATURE_FLAGS` |
| `RemoveFeatureFlagsUsecase` | Удалить флаг                     | `IOC_CORE_TOKENS.USECASE_REMOVE_FEATURE_FLAGS` |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для отображения в UI:

```typescript
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
```

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении флагов (если они изменяются динамически).

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте состояние флагов через ViewModel — это обеспечивает разделение ответственности:

```tsx
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
```

### Прямой доступ к AccessControlModel

В редких случаях, когда нет подходящей ViewModel, можно получить флаги напрямую:

```tsx
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
```

> **Важно**: Оборачивайте компонент в `observer()` из `mobx-react-lite` для реактивных обновлений.

---

## Условная загрузка модулей

Фича-флаги определяют, будет ли загружен MFE-модуль. Это настраивается в конфигурации модуля:

### Конфигурация модуля

```typescript
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
```

> Модуль загрузится только если **все** указанные `featureFlags` имеют значение `true`.

## Примеры enum-ов для флагов

### Именование enum

Название enum должно содержать **модульный префикс** и суффикс `Features`:

**Формат:** `<Module>Features`

| Пример            | Модуль             |
| ----------------- | ------------------ |
| `AuthFeatures`    | Модуль авторизации |
| `PaymentFeatures` | Модуль платежей    |
| `TodoFeatures`    | Модуль задач       |

### Именование ключей флагов

Значения флагов должны начинаться с **модульного префикса** — это обеспечивает уникальность и позволяет легко определить, к какому модулю относится флаг.

**Формат:** `<module>.<feature>.<action>`

| Часть     | Описание                   | Пример                         |
| --------- | -------------------------- | ------------------------------ |
| `module`  | Название модуля или домена | `auth`, `payment`, `ui`        |
| `feature` | Название функции           | `social_login`, `2fa`, `theme` |
| `action`  | Тип флага (опционально)    | `enabled`, `visible`, `v2`     |

### Примеры

```typescript
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
```

---

## Лучшие практики

### ✅ Правильно

```typescript
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
```

### ❌ Неправильно

```typescript
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
```

---

## Связанные разделы

- [Permissions](./permissions.md) — динамические разрешения на действия
- [Server Parameters](./server-parameters.md) — серверные параметры
- [Конфигурация модуля](../modules/module-config.md) — настройка featureFlags и permissions
- [Типы модулей](../modules/module-types.md) — условия загрузки модулей
- [Common библиотека](../libs/common.md) — модели и use cases
- [MVVM паттерн](../modules/mvvm-pattern.md) — архитектура слоёв
