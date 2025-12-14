# FRD: Единая система управления оверлеями (Overlay Manager)

## 1. Обзор

Данный документ описывает план реализации единой системы управления оверлеями для приложения, которая объединяет функциональность модальных окон, лайтбоксов и Drawer'ов в одну сущность.

### 1.1. Цели

- Создать единую систему управления всеми типами оверлеев
- Обеспечить взаимное исключение модальных окон и лайтбоксов (только один активен)
- Поддержать множественные Drawer'ы с возможностью наложения друг на друга
- Интегрировать систему в существующую архитектуру MVVM и модульную структуру

### 1.2. Требования

1. **Модальные окна (Dialog)**: только 1 на экране
2. **Лайтбоксы (Lightbox)**: только 1 на экране, не может быть одновременно с модалкой
3. **Drawer'ы**: может быть N штук, накладываются друг на друга
4. **Drawer'ы для лайтбоксов**: может быть N штук, накладываются друг на друга

## 2. Анализ существующей реализации (pl-aaa)

### 2.1. Dialog

**Расположение**: `@tmp/pl-aaa/libs/common/src/Dialog`

**Ключевые особенности**:

- Класс `Dialog` с EventEmitter для подписки на изменения состояния
- Состояние: `IDialogState` с `name` и `payload`
- Конфигурация: массив `IDialogConfig[]` с компонентами, хуками `onEnter`, `onClose`
- Проверка разрешений и feature toggles через IoC контейнер
- Методы: `setState()`, `reset()`, `subscribe()`, `addDialogs()`

**Интерфейсы**:

```typescript
interface IDialog {
  subscribe: (cb: ISubscribeCb) => IUnsubscribe;
  getState: () => IDialogState | undefined;
  setState: (name?: string, payload?: any) => void;
  reset: () => void;
  addDialogs: (config: IDialogConfig[]) => void;
}
```

### 2.2. Lightbox

**Расположение**: `@tmp/pl-aaa/libs/common/src/Lightbox`

**Ключевые особенности**:

- Класс `Lightbox` с поддержкой сворачивания/разворачивания
- Два состояния: активный лайтбокс и свернутый лайтбокс
- Методы: `openLightbox()`, `collapseLightbox()`, `expandLightbox()`, `resetLightbox()`
- Подписка на события открытия и сворачивания
- Аналогичная система проверки разрешений

**Интерфейсы**:

```typescript
interface ILightbox {
  openLightbox: (name?: string, payload?: any) => void;
  collapseLightbox: () => void;
  expandLightbox: () => void;
  resetLightbox: () => void;
  getLightboxState: () => ILightboxState | undefined;
  getCollapseLightboxState: () => ILightboxState | undefined;
}
```

### 2.3. React хуки

**useDialog**: `@tmp/pl-aaa/libs/core.ui/src/hooks/useDialog/useDialog.tsx`

- Получает экземпляр Dialog из React Context

**useLightbox**: `@tmp/pl-aaa/libs/core.ui/src/hooks/useLightbox/useLightbox.tsx`

- Получает экземпляр Lightbox из React Context

**useLightboxOverlayState**: управление стеком оверлеев через EventBus

### 2.4. Инициализация

**InitDialogHandler**: регистрирует конфигурацию диалогов в Bootstrap
**InitLightboxHandler**: регистрирует конфигурацию лайтбоксов в Bootstrap
**LightboxPostInitHandler**: пост-инициализация лайтбоксов

### 2.5. Конфигурация модулей

Модули регистрируют свои диалоги и лайтбоксы через:

```typescript
moduleConfig: IModuleConfig = {
  DIALOG: (dialog) => dialog.addDialogs(dialogConfig),
  LIGHTBOX: (lightbox) => lightbox.addLightbox(lightboxConfig),
};
```

**Важно**: В существующей реализации Drawer'ы не регистрируются централизованно, а создаются локально в компонентах. В новой реализации Drawer'ы также должны регистрироваться в конфигурации модулей, аналогично Dialog и Lightbox.

## 3. Архитектура решения

### 3.1. Единая сущность OverlayManager

Создать класс `OverlayManager`, который будет управлять всеми типами оверлеев:

```typescript
interface IOverlayManager {
  // Модальные окна и лайтбоксы (взаимоисключающие)
  openDialog: (name: string, payload?: any) => void;
  openLightbox: (name: string, payload?: any) => void;
  closeDialog: () => void;
  closeLightbox: () => void;

  // Drawer'ы (множественные) - открываются по имени из конфигурации
  openDrawer: (name: string, payload?: any) => void;
  closeDrawer: (name: string) => void;
  closeAllDrawers: () => void;

  // Drawer'ы для лайтбоксов (множественные) - открываются по имени из конфигурации
  openLightboxDrawer: (name: string, payload?: any) => void;
  closeLightboxDrawer: (name: string) => void;
  closeAllLightboxDrawers: () => void;

  // Состояния
  getDialogState: () => IOverlayState | undefined;
  getLightboxState: () => IOverlayState | undefined;
  getDrawers: () => IDrawerState[];
  getLightboxDrawers: () => IDrawerState[];

  // Подписки
  subscribe: (type: OverlayType, cb: ISubscribeCb) => IUnsubscribe;

  // Конфигурация
  addDialogs: (config: IOverlayConfig[]) => void;
  addLightboxes: (config: IOverlayConfig[]) => void;
  addDrawers: (config: IDrawerConfig[]) => void;
  addLightboxDrawers: (config: IDrawerConfig[]) => void;
}

interface IOverlayManagerOptions {
  analyticsCallback?: IOverlayAnalyticsCallback; // Опциональный колбек для аналитики
  syncWithUrl?: boolean; // Синхронизация состояния Lightbox с URL параметрами (по умолчанию true)
  urlParamName?: string; // Имя параметра URL для Lightbox (по умолчанию 'lightbox')
  compressPayload?: boolean; // Сжимать payload перед кодированием в base64url (по умолчанию true для больших payload)
}
```

### 3.2. Типы оверлеев

```typescript
enum OverlayType {
  DIALOG = 'dialog',
  LIGHTBOX = 'lightbox',
  DRAWER = 'drawer',
  LIGHTBOX_DRAWER = 'lightbox_drawer',
}

interface IOverlayState {
  name: string;
  payload?: any;
}

interface IDrawerState extends IOverlayState {
  zIndex: number; // для правильного наложения
}

interface IOverlayAnalyticsEvent {
  type: 'opened' | 'closed';
  overlayType: OverlayType;
  name: string;
  module?: string; // Модуль-источник, если доступен
  reason?: string; // Причина закрытия (например, 'esc', 'backdrop', 'programmatic')
}

type IOverlayAnalyticsCallback = (event: IOverlayAnalyticsEvent) => void;

interface IOverlayConfig {
  name: string;
  component: FunctionComponent | React.LazyExoticComponent<FunctionComponent>; // Компонент от UI-слоя; регистрируется модулем, core остаётся без прямых React-зависимостей
  onEnter?: (
    fromState?: IOverlayState,
    toState?: IOverlayState,
    overlay?: IOverlayManager,
  ) => void | Promise<void>; // Хук при открытии (может быть асинхронным)
  onClose?: (overlay?: IOverlayManager) => void; // Хук при закрытии
  permission?: string[]; // Требуемые разрешения
  featureToggle?: string[]; // Требуемые feature toggles
  syncWithUrl?: boolean; // Синхронизировать состояние с URL (только для Lightbox, по умолчанию true)
}

interface IDrawerConfig {
  name: string;
  component: FunctionComponent | React.LazyExoticComponent<FunctionComponent>; // Компонент от UI-слоя; регистрируется модулем, core остаётся без прямых React-зависимостей
  anchor: 'left' | 'right' | 'top' | 'bottom'; // Позиция Drawer'а
  width?: number | string; // Ширина (для left/right)
  height?: number | string; // Высота (для top/bottom)
  onEnter?: (
    fromState?: IDrawerState,
    toState?: IDrawerState,
    overlay?: IOverlayManager,
  ) => void | Promise<void>; // Хук при открытии (может быть асинхронным)
  onClose?: (overlay?: IOverlayManager) => void; // Хук при закрытии
  permission?: string[]; // Требуемые разрешения
  featureToggle?: string[]; // Требуемые feature toggles
}
```

### 3.3. Правила взаимного исключения

1. При открытии Dialog:
   - Закрыть активный Lightbox (если есть) — автоматически вызывается `closeLightbox()`
   - Закрыть все Lightbox Drawer'ы
   - Обычные Drawer'ы не зависят от Dialog и могут оставаться открытыми

2. При открытии Lightbox:
   - Закрыть активный Dialog (если есть) — автоматически вызывается `closeDialog()`
   - Lightbox Drawer'ы могут оставаться открытыми
   - Обычные Drawer'ы не закрываются автоматически

3. Drawer'ы:
   - Lightbox Drawer'ы регистрируются в конфигурации модуля и работают только когда открыт Lightbox
   - При попытке открыть Lightbox Drawer без открытого Lightbox выбрасывается исключение `OVERLAY_LIGHTBOX_DRAWER_REQUIRES_LIGHTBOX`
   - Обычные Drawer'ы — отдельная сущность, не зависящая от Dialog/Lightbox
   - Drawer'ы открываются по имени из конфигурации (аналогично Dialog/Lightbox)
   - Drawer'ы накладываются друг на друга с увеличивающимся zIndex
   - Может быть открыто несколько Drawer'ов одновременно (стек, планируется до 3х одновременно)
   - При открытии нового Drawer'а из другого модуля, текущие Drawer'ы остаются открытыми (накладываются друг на друга)

4. Повторное открытие оверлея с тем же именем трактуется как новое открытие:
   - Обновляется состояние/payload, вызывается onEnter
   - onClose при этом не вызывается

5. Lightbox Drawer'ы закрываются при `closeLightbox`.

6. При открытии оверлея из другого модуля:
   - Если открывается Dialog/Lightbox, закрываются все оверлеи того же типа из других модулей
   - Drawer'ы из разных модулей могут сосуществовать (накладываются друг на друга)

7. Синхронизация с URL (только для Lightbox):
   - При открытии Lightbox с `syncWithUrl: true` (по умолчанию), состояние сохраняется в URL параметрах
   - Формат URL: `?lightbox=<name>&lightbox_payload=<encoded_payload>`
   - Параметр `lightbox_payload` содержит все параметры Lightbox в закодированном виде (JSON в base64url)
   - Это позволяет избежать конфликтов с существующими query параметрами URL
   - При обновлении страницы или переходе по ссылке, Lightbox автоматически открывается с параметрами из URL
   - При закрытии Lightbox, параметры `lightbox` и `lightbox_payload` удаляются из URL
   - Dialog и Drawer'ы не синхронизируются с URL (только Lightbox)

### 3.4. Валидация и гварды

- Регистрация оверлея выполняется только при прохождении проверок permissions/feature toggles на этапе bootstrap регистрации модуля; иначе сущность не попадает в конфигурацию.
- Проверка разрешений выполняется только при регистрации модулей в bootstrap. Если разрешения изменяются во время работы приложения, это не влияет на уже зарегистрированные оверлеи.
- Конфликт имён между модулями — ошибка (fail fast) с кодом `OVERLAY_CONFIG_DUPLICATE_NAME`.
- Вызов открытия по несуществующему имени — исключение с кодом `OVERLAY_OPEN_NOT_FOUND`.
- Попытка открыть Lightbox Drawer без открытого Lightbox — исключение с кодом `OVERLAY_LIGHTBOX_DRAWER_REQUIRES_LIGHTBOX`.
- Core-слой не зависит от React; модули регистрируют конкретные UI-компоненты в конфигурациях.

## 4. План реализации

### 4.1. Этап 1: Создание базовой структуры

#### 4.1.1. Создать класс OverlayManager

**Расположение**: `libs/core/src/overlay/OverlayManager.ts`

**Функциональность**:

- Управление состоянием Dialog и Lightbox (взаимоисключающие)
- Управление стеками Drawer'ов (массивы состояний)
- EventTarget для подписок на изменения
- Проверка разрешений и feature toggles
- Валидация конфигураций: детектировать дубли имён (ошибка), исключать сущности, не прошедшие гварды
- Исключения при попытке открыть оверлей по несуществующему имени
- Методы для открытия/закрытия всех типов оверлеев
- Синхронизация состояния Lightbox с URL параметрами (опционально)
- Автоматическое восстановление состояния Lightbox из URL при загрузке страницы

**Зависимости**:

- Встроенный `EventTarget` (Web API) для событий — не требует дополнительных зависимостей, поддерживается во всех современных браузерах
- `inversify` для IoC контейнера (уже используется в проекте)
- `lodash` для утилит (isEqual, unionBy) — опционально, можно заменить на нативные методы при необходимости

#### 4.1.2. Создать интерфейсы и типы

**Расположение**: `libs/core/src/overlay/interfaces.ts`

**Интерфейсы**:

- `IOverlayManager` - основной интерфейс менеджера
- `IOverlayConfig` - конфигурация оверлея (Dialog/Lightbox) с компонентом, хуками onEnter/onClose, разрешениями
- `IDrawerConfig` - конфигурация Drawer'а с компонентом, anchor (left/right/top/bottom), width/height, хуками onEnter/onClose, разрешениями
- `IOverlayState` - состояние оверлея (name, payload)
- `IDrawerState` - состояние Drawer'а с zIndex для правильного наложения
- `IOverlayAnalyticsCallback` - опциональный колбек для аналитики событий оверлеев

#### 4.1.3. Создать события

**Расположение**: `libs/core/src/overlay/Events.ts`

**События**:

- `OPEN_DIALOG`
- `CLOSE_DIALOG`
- `OPEN_LIGHTBOX`
- `CLOSE_LIGHTBOX`
- `OPEN_DRAWER`
- `CLOSE_DRAWER`
- `OPEN_LIGHTBOX_DRAWER`
- `CLOSE_LIGHTBOX_DRAWER`
- `CLOSE_ALL_DRAWERS`
- `CLOSE_ALL_LIGHTBOX_DRAWERS`

### 4.2. Этап 2: React интеграция

#### 4.2.1. Создать React Context

**Расположение**: `libs/ui/src/providers/OverlayProvider.tsx`

**Функциональность**:

- Provider компонент для OverlayManager
- Прокидывание экземпляра через React Context
- Аналогично существующему DIProvider

#### 4.2.2. Создать хуки

**Расположение**: `libs/ui/src/hooks/useOverlay/useOverlay.tsx`

**Хуки**:

- `useOverlay()` - возвращает экземпляр OverlayManager
- `useDialogState()` - возвращает состояние Dialog
- `useLightboxState()` - возвращает состояние Lightbox
- `useDrawersState()` - возвращает массив Drawer'ов
- `useLightboxDrawersState()` - возвращает массив Lightbox Drawer'ов

#### 4.2.3. Создать компоненты-рендереры

**Расположение**: `libs/ui/src/components/overlay/`

**Компоненты**:

- `DialogRenderer.tsx` - рендерит активный Dialog
- `LightboxRenderer.tsx` - рендерит активный Lightbox
- `DrawerRenderer.tsx` - рендерит все активные Drawer'ы
- `LightboxDrawerRenderer.tsx` - рендерит все активные Lightbox Drawer'ы
- `OverlayContainer.tsx` - общий контейнер для всех оверлеев

### 4.3. Этап 3: Bootstrap интеграция

#### 4.3.1. Создать InitOverlayHandler

**Расположение**: `host/src/bootstrap/handlers/InitOverlayHandler.ts`

**Функциональность**:

- Инициализация OverlayManager с опциональным колбеком для аналитики и настройками синхронизации с URL
- Регистрация конфигураций из модулей
- Установка зависимостей (IoC контейнер)
- Передача роутера в OverlayManager для синхронизации с URL (получает доступ к `bootstrap.routerService.router`)
- При включенной синхронизации с URL: чтение параметров из текущего URL и автоматическое открытие Lightbox при наличии параметра `lightbox`

#### 4.3.2. Расширить Bootstrap класс

**Расположение**: `host/src/bootstrap/Bootstrap.ts`

**Методы**:

- `initOverlayManager(options?: IOverlayManagerOptions)` - инициализация с опциональными настройками (аналитика, синхронизация с URL)
- `overlayManager: OverlayManager` - геттер для доступа

#### 4.3.3. Добавить в цепочку обработчиков

**Расположение**: `host/src/bootstrap/index.ts`

**Порядок**:

- После DIHandler (нужен контейнер)
- После RouterHandler (нужен роутер для синхронизации с URL)
- Перед ModulesHandler (модули могут регистрировать оверлеи)

**Примечание**: Если синхронизация с URL включена, OverlayManager должен быть инициализирован после роутера, чтобы иметь доступ к query параметрам при загрузке страницы.

### 4.4. Этап 4: Конфигурация модулей

#### 4.4.1. Расширить интерфейс модуля

**Расположение**: `host/src/modules/interface.ts`

**Добавить**:

```typescript
interface IModuleConfig {
  // ... существующие поля
  OVERLAY?: (overlayManager: IOverlayManager) => void;
}
```

#### 4.4.2. Обновить ModuleLoader

**Расположение**: `host/src/bootstrap/services/moduleLoader/`

**Функциональность**:

- Вызов `OVERLAY` колбэка при загрузке модуля
- Передача экземпляра OverlayManager в модуль

### 4.5. Этап 5: UI компоненты

#### 4.5.1. Создать компонент OverlayContainer

**Расположение**: `libs/ui/src/components/overlay/OverlayContainer.tsx`

**Функциональность**:

- Подписка на все события OverlayManager
- Рендеринг Dialog/Lightbox (взаимоисключающие)
- Рендеринг Drawer'ов с правильным zIndex
- Использование MUI компонентов (Dialog, Drawer, Backdrop)

#### 4.5.2. Интегрировать в Layout

**Расположение**: `host/src/modules/core.layout/view/Layout/Layout.tsx`

**Изменения**:

- Добавить `<OverlayContainer />` в корневой Layout
- OverlayContainer будет управлять всеми оверлеями централизованно

## 5. Детальная структура файлов

```
libs/
├── core/
│   └── src/
│       └── overlay/
│           ├── OverlayManager.ts          # Основной класс
│           ├── interfaces.ts              # Интерфейсы и типы
│           ├── Events.ts                  # Константы событий
│           └── index.ts                   # Экспорты
│
libs/
├── ui/
│   └── src/
│       ├── providers/
│       │   └── OverlayProvider.tsx        # React Context Provider
│       ├── hooks/
│       │   └── useOverlay/
│       │       ├── useOverlay.tsx         # Основной хук
│       │       ├── useDialogState.tsx     # Хук для Dialog
│       │       ├── useLightboxState.tsx   # Хук для Lightbox
│       │       ├── useDrawersState.tsx    # Хук для Drawer'ов
│       │       └── index.ts
│       └── components/
│           └── overlay/
│               ├── OverlayContainer.tsx   # Главный контейнер
│               ├── DialogRenderer.tsx     # Рендерер Dialog
│               ├── LightboxRenderer.tsx   # Рендерер Lightbox
│               ├── DrawerRenderer.tsx    # Рендерер Drawer'ов
│               ├── LightboxDrawerRenderer.tsx
│               └── index.ts
│
host/
└── src/
    ├── bootstrap/
    │   ├── handlers/
    │   │   └── InitOverlayHandler.ts     # Обработчик инициализации
    │   └── Bootstrap.ts                  # Расширение Bootstrap
    └── modules/
        └── core.layout/
            └── view/
                └── Layout/
                    └── Layout.tsx         # Интеграция OverlayContainer
```

## 6. Примеры использования

### 6.1. Регистрация конфигурации в модуле

```typescript
// packages/my-module/src/config/overlay/config.ts
import type { IOverlayConfig, IDrawerConfig } from '@platform/core';
import { lazy } from 'react';

export const dialogConfig: IOverlayConfig[] = [
  {
    name: 'confirmDelete',
    component: lazy(() => import('../view/components/ConfirmDeleteDialog')),
    onEnter: (fromState, toState, overlay) => {
      console.log('Dialog opened', toState);
    },
    onClose: (overlay) => {
      console.log('Dialog closed');
    },
    permission: ['delete:users'], // Опционально
    featureToggle: ['enableDelete'], // Опционально
  },
];

export const lightboxConfig: IOverlayConfig[] = [
  {
    name: 'userDetails',
    component: lazy(() => import('../view/components/UserDetailsLightbox')),
    syncWithUrl: true, // По умолчанию true, можно явно указать
    onEnter: async (fromState, toState, overlay) => {
      // onEnter может быть асинхронным
      // При открытии из URL, payload будет содержать параметры из query string
      const container = overlay.getDependency('container');
      const viewModel = container.get(VIEW_MODEL_USER_DETAILS);
      await viewModel.loadUser(toState.payload.userId);
    },
    onClose: (overlay) => {
      console.log('Lightbox closed');
      // URL параметры автоматически удаляются при закрытии
    },
  },
];

export const drawerConfig: IDrawerConfig[] = [
  {
    name: 'filters',
    component: lazy(() => import('../view/components/FiltersPanel')),
    anchor: 'right',
    width: 360,
    onEnter: (fromState, toState, overlay) => {
      console.log('Drawer opened', toState);
    },
    onClose: (overlay) => {
      console.log('Drawer closed');
    },
  },
];

export const lightboxDrawerConfig: IDrawerConfig[] = [
  {
    name: 'details',
    component: lazy(() => import('../view/components/DetailsPanel')),
    anchor: 'bottom',
    height: '50%',
    onEnter: (fromState, toState, overlay) => {
      console.log('Lightbox Drawer opened', toState);
    },
    onClose: (overlay) => {
      console.log('Lightbox Drawer closed');
    },
  },
];
```

### 6.2. Использование в модуле

```typescript
// packages/my-module/src/config/module_config.ts
import {
  dialogConfig,
  lightboxConfig,
  drawerConfig,
  lightboxDrawerConfig,
} from './overlay/config';

export const moduleConfig: IModuleConfig = {
  OVERLAY: (overlayManager) => {
    overlayManager.addDialogs(dialogConfig);
    overlayManager.addLightboxes(lightboxConfig);
    overlayManager.addDrawers(drawerConfig);
    overlayManager.addLightboxDrawers(lightboxDrawerConfig);
  },
};
```

### 6.3. Использование в компоненте

```typescript
// packages/my-module/src/view/components/UserList.tsx
import { useOverlay } from '@platform/ui';

const UserList: FC = () => {
  const overlay = useOverlay();

  const handleOpenDetails = (userId: string) => {
    // При открытии Lightbox с syncWithUrl: true, URL обновится:
    // /current-page?lightbox=userDetails&userId=123
    overlay.openLightbox('userDetails', { userId });
  };

  const handleDelete = (userId: string) => {
    // Dialog не синхронизируется с URL
    overlay.openDialog('confirmDelete', { userId });
  };

  return (
    // ...
  );
};
```

### 6.5. Пример работы с URL

При открытии Lightbox (маленький payload, без сжатия):

- Исходный URL: `/users?filter=active&page=1`
- После `overlay.openLightbox('userDetails', { userId: '123', tab: 'profile' })`
- Payload кодируется: `{"userId":"123","tab":"profile"}` → base64url → `eyJ1c2VySWQiOiIxMjMiLCJ0YWIiOiJwcm9maWxlIn0=`
- URL становится: `/users?filter=active&page=1&lightbox=userDetails&lightbox_payload=eyJ1c2VySWQiOiIxMjMiLCJ0YWIiOiJwcm9maWxlIn0=`
- Существующие параметры (`filter`, `page`) сохраняются и не конфликтуют

При открытии Lightbox (большой payload, со сжатием):

- Исходный URL: `/users?filter=active&page=1`
- После `overlay.openLightbox('userDetails', { userId: '123', data: [...большой массив...] })`
- Payload кодируется: `JSON.stringify()` → `gzip сжатие` → `base64url` → `H4sIAAAAAAAAA6tWSkksSVSyUqqOUcpLzFGyqlZKzs8tKEotLs5Mz1OyqlZKLU4tKk5NtVJKrQYAJw5cJQwAAAA`
- URL становится: `/users?filter=active&page=1&lightbox=userDetails&lightbox_payload=H4sIAAAAAAAAA6tWSkksSVSyUqqOUcpLzFGyqlZKzs8tKEotLs5Mz1OyqlZKLU4tKk5NtVJKrQYAJw5cJQwAAAA&c=1`
- Параметр `c=1` указывает, что payload сжат

При обновлении страницы или переходе по ссылке:

- OverlayManager автоматически проверяет параметр `lightbox` в URL
- Если параметр присутствует и Lightbox с таким именем зарегистрирован, он открывается автоматически
- Payload декодируется из параметра `lightbox_payload`:
  - Если `c=1` присутствует: base64url → gunzip → JSON → объект
  - Если `c=1` отсутствует: base64url → JSON → объект
- Восстановленный payload передается в `onEnter` хука Lightbox

При закрытии Lightbox:

- Параметры `lightbox`, `lightbox_payload` и `c` удаляются из URL
- Остальные параметры сохраняются: `/users?filter=active&page=1`

### 6.4. Использование Drawer'ов

```typescript
const MyComponent: FC = () => {
  const overlay = useOverlay();

  const handleOpenDrawer = () => {
    // Drawer регистрируется в конфигурации модуля, открывается по имени
    overlay.openDrawer('filters', { filterType: 'active' });
  };

  const handleOpenLightboxDrawer = () => {
    // Lightbox Drawer также регистрируется в конфигурации, открывается по имени
    overlay.openLightboxDrawer('details', { itemId: '123' });
  };

  const handleCloseDrawer = () => {
    overlay.closeDrawer('filters');
  };

  return (
    // ...
  );
};
```

## 7. Технические детали

### 7.1. Управление zIndex для Drawer'ов

- Следуем стандартной схеме MUI: `theme.zIndex.drawer` (по умолчанию 1200), `theme.zIndex.modal` (1300), `theme.zIndex.snackbar` (1400), `theme.zIndex.tooltip` (1500).
- Drawer'ы регистрируются в конфигурации модуля (аналогично Dialog/Lightbox).
- При открытии Drawer'а по имени, он добавляется в стек активных Drawer'ов.
- Каждый новый обычный Drawer получает zIndex = `theme.zIndex.drawer + index`.
- Каждый новый Lightbox Drawer получает zIndex = `theme.zIndex.modal + 1 + index` для предсказуемого наложения над базовыми модалками/лайтбоксами.
- При закрытии Drawer'а, zIndex пересчитываются для оставшихся в стеке.
- Планируется поддержка до 3х одновременных Drawer'ов. Мемоизация компонентов — на усмотрение разработчика модуля.

### 7.2. Обработка закрытия по ESC/Backdrop

- Dialog: закрытие по ESC и клику на backdrop
- Lightbox: закрытие по ESC (backdrop опционально)
- Drawer: закрытие по ESC и клику на backdrop

### 7.3. Анимации

- Использовать MUI transitions (Slide, Fade, etc.)
- Настраиваемые через конфигурацию

### 7.4. Проверка разрешений

- Аналогично существующей реализации
- Через IoC контейнер получать AppViewModel
- Проверка permissions и feature toggles выполняется **только при регистрации модулей/сущностей в bootstrap**; сущности, не прошедшие гварды, не добавляются в конфигурацию
- Если разрешения изменяются во время работы приложения, это не влияет на уже зарегистрированные оверлеи (проверка выполняется один раз при инициализации)

### 7.5. Аналитика оверлеев (опционально)

- Аналитика является опциональной функцией и настраивается при инициализации OverlayManager через колбек.
- При инициализации OverlayManager можно передать опциональный колбек `IOverlayAnalyticsCallback` для отслеживания событий.
- Колбек вызывается при событиях: `opened`, `closed` с типом оверлея, именем, источником (модуль) и причиной закрытия.
- Если колбек не передан, аналитика не работает (no-op по умолчанию).
- Пример использования при инициализации:

  ```typescript
  // В InitOverlayHandler
  const overlayManager = new OverlayManager({
    analyticsCallback: (event) => {
      // event: { type: 'opened' | 'closed', overlayType: OverlayType, name: string, module?: string, reason?: string }
      analytics.track('overlay_event', event);
    },
    syncWithUrl: true, // По умолчанию true - синхронизация Lightbox с URL
    urlParamName: 'lightbox', // По умолчанию 'lightbox'
    compressPayload: true, // По умолчанию true - сжимать большие payload перед кодированием
  });
  ```

  Или без аналитики и синхронизации с URL:

  ```typescript
  const overlayManager = new OverlayManager({
    syncWithUrl: false, // Отключить синхронизацию с URL
  });
  ```

### 7.6. Клавиатурная навигация

- Единый обработчик клавиш: `Esc` закрывает верхний оверлей стека (Dialog/Lightbox > Lightbox Drawer > Drawer).
- Trap фокуса для Dialog/Lightbox; восстановление фокуса в исходный элемент после закрытия.
- Поддержка `Tab`/`Shift+Tab` внутри оверлеев, roving tabindex для списков и фокусируемых элементов Drawer’ов.
- Конфигурируемые хоткеи для открытия/закрытия (per-оверлей), отключаемые через опцию.

### 7.7. Синхронизация с URL

- **Назначение**: Сохранение состояния Lightbox в URL параметрах для возможности:
  - Восстановления состояния при обновлении страницы
  - Передачи ссылки другому пользователю с открытым Lightbox
  - Навигации назад/вперед в истории браузера

- **Формат URL параметров**:
  - Основной параметр: `lightbox=<name>` — имя открытого Lightbox
  - Параметр payload: `lightbox_payload=<encoded_payload>` — все параметры Lightbox в одном объекте, закодированном в base64url
  - Пример (без сжатия): `?lightbox=userDetails&lightbox_payload=eyJ1c2VySWQiOiIxMjMiLCJ0YWIiOiJwcm9maWxlIn0=`
  - Пример (со сжатием): `?lightbox=userDetails&lightbox_payload=H4sIAAAAAAAAA6tWSkksSVSyUqqOUcpLzFGyqlZKzs8tKEotLs5Mz1OyqlZKLU4tKk5NtVJKrQYAJw5cJQwAAAA&c=1`
  - Процесс кодирования: `JSON.stringify(payload)` → (опционально) `gzip/deflate сжатие` → `base64url encoding`
  - Параметр `c=1` указывает, что payload сжат (добавляется автоматически при сжатии)
  - Такой подход исключает конфликты с существующими query параметрами URL и минимизирует длину URL

- **Поведение**:
  - При открытии Lightbox с `syncWithUrl: true` (по умолчанию), URL обновляется через History API (`pushState`)
  - Payload кодируется:
    1. `JSON.stringify(payload)` — сериализация в JSON
    2. (опционально) `gzip/deflate сжатие` — если `compressPayload: true` и размер JSON > порога (например, 100 байт)
    3. `base64url encoding` — кодирование в URL-safe формат
  - Если payload был сжат, добавляется параметр `c=1` в URL для указания на необходимость декомпрессии
  - При закрытии Lightbox, параметры `lightbox`, `lightbox_payload` и `c` удаляются из URL через `replaceState`
  - При загрузке страницы, OverlayManager проверяет URL параметры и автоматически открывает Lightbox, если параметр `lightbox` присутствует
  - Payload декодируется из параметра `lightbox_payload`:
    1. `base64url decoding` — декодирование из base64url
    2. (если `c=1` присутствует) `gunzip/inflate декомпрессия` — распаковка
    3. `JSON.parse()` — десериализация из JSON
  - При изменении URL вручную (навигация назад/вперед), состояние Lightbox синхронизируется с URL
  - Существующие query параметры URL сохраняются и не конфликтуют с параметрами Lightbox

- **Интеграция с роутером**:
  - OverlayManager получает доступ к роутеру через Bootstrap (`bootstrap.routerService.router`)
  - При инициализации OverlayManager передается экземпляр роутера (если синхронизация с URL включена)
  - Используется API роутера для получения текущих query параметров и обновления URL
  - При открытии Lightbox: обновление URL через `router.navigate()` с добавлением параметров `lightbox` и `lightbox_payload`
  - При закрытии Lightbox: обновление URL через `router.navigate()` с удалением параметров `lightbox`, `lightbox_payload` и `c`
  - При загрузке страницы: чтение query параметров `lightbox` и `lightbox_payload` из текущего роута и автоматическое открытие Lightbox
  - Подписка на изменения роута для синхронизации при навигации назад/вперед в истории браузера

- **Конфигурация**:
  - Глобальная настройка: `syncWithUrl: boolean` в `IOverlayManagerOptions` (по умолчанию `true`)
  - Локальная настройка: `syncWithUrl: boolean` в `IOverlayConfig` для конкретного Lightbox (переопределяет глобальную)
  - Имя параметра URL: `urlParamName: string` в `IOverlayManagerOptions` (по умолчанию `'lightbox'`)

- **Сжатие payload**:
  - Base64 не сжимает данные, а увеличивает размер примерно на 33%
  - Для больших payload используется сжатие gzip/deflate перед base64url кодированием
  - Сжатие включается автоматически, если размер JSON > порога (например, 100 байт) или явно указано `compressPayload: true`
  - Сжатие может уменьшить размер payload в 2-10 раз (зависит от данных)
  - Параметр `c=1` в URL указывает, что payload сжат и требует декомпрессии при чтении

- **Ограничения**:
  - Только Lightbox синхронизируется с URL (Dialog и Drawer'ы не синхронизируются)
  - Payload должен быть сериализуемым (JSON-совместимые типы)
  - Ограничение длины URL браузера ~2000 символов (для старых браузеров) или ~8000 символов (для современных)
  - Сжатие эффективно для текстовых данных, но может быть неэффективно для уже сжатых данных (изображения, бинарные данные)
  - Используется base64url encoding (URL-safe вариант base64, символы `+`, `/`, `=` заменяются на `-`, `_`, и удаляются padding `=`)

- **Подробный анализ производительности**: см. раздел 7.8

### 7.8. Производительность и оптимизация

#### 7.8.1. Анализ производительности синхронизации с URL

**Операции кодирования/декодирования:**

| Операция                | Сложность | Время (маленький payload < 1KB) | Время (большой payload 10-50KB) |
| ----------------------- | --------- | ------------------------------- | ------------------------------- |
| `JSON.stringify()`      | O(n)      | < 1ms                           | 5-10ms                          |
| `JSON.parse()`          | O(n)      | < 1ms                           | 5-10ms                          |
| Base64url encoding      | O(n)      | < 0.5ms                         | 2-5ms                           |
| Base64url decoding      | O(n)      | < 0.5ms                         | 2-5ms                           |
| Gzip сжатие             | O(n)      | 1-2ms                           | 10-50ms                         |
| Gzip распаковка         | O(n)      | 0.5-1ms                         | 5-20ms                          |
| **Итого кодирование**   | -         | **1-2ms**                       | **15-30ms**                     |
| **Итого декодирование** | -         | **1-2ms**                       | **5-10ms**                      |

**Обновление URL (History API):**

- `history.pushState()`: < 0.1ms, синхронная операция, не блокирует рендеринг
- `history.replaceState()`: < 0.1ms, аналогично pushState
- Обновление URL не вызывает перезагрузку страницы

**Чтение параметров из URL:**

- Парсинг query параметров: < 0.5ms
- Извлечение `lightbox` и `lightbox_payload`: < 0.01ms каждая
- **Итого**: < 1ms для чтения и парсинга

**Влияние на размер URL:**

| Размер JSON | Без сжатия (base64url)     | Со сжатием (gzip + base64url)     | Рекомендация             |
| ----------- | -------------------------- | --------------------------------- | ------------------------ |
| 100 байт    | ~133 байта (~200 символов) | ~50-80 байт (~100-150 символов)   | Сжатие опционально       |
| 1KB         | ~1.3KB (~2000 символов)    | ~200-400 байт (~400-800 символов) | Сжатие рекомендуется     |
| 10KB        | ~13KB (превышает лимит)    | ~1-2KB (~2000-4000 символов)      | Сжатие обязательно       |
| 50KB+       | Невозможно                 | ~5-10KB (превышает лимит)         | Рассмотреть альтернативы |

**Производительность при частых операциях:**

- Быстрое открытие/закрытие (10 раз/сек):
  - Открытие: +1-30ms к базовому времени (зависит от размера payload)
  - Закрытие: +0.1ms к базовому времени
  - **Риск**: При больших payload может возникнуть задержка UI
  - **Решение**: Debounce для обновления URL (300ms)

- Навигация назад/вперед:
  - Чтение параметров: < 1ms
  - Декодирование: 1-10ms
  - Открытие Lightbox: 10-50ms (зависит от компонента)
  - **Итого**: ~15-60ms для восстановления состояния

**Память:**

- Хранение в URL: не влияет на память браузера
- История браузера: стандартное поведение, каждый URL сохраняется
- Дополнительная память для декодированного payload: < 1MB даже для больших payload

#### 7.8.2. Оптимизации

**1. Lazy декодирование:**

- Декодировать payload только при необходимости (при открытии Lightbox)
- Не декодировать при инициализации, если Lightbox не открыт

**2. Debounce обновления URL:**

- При быстрых изменениях состояния (например, ввод в форму внутри Lightbox)
- Рекомендуемый интервал: 300ms
- Применять только для обновления существующего Lightbox, не для открытия нового

**3. Кэширование:**

- Кэшировать декодированный payload, если он не изменился
- Избегать повторного декодирования при навигации назад/вперед

**4. Условное сжатие:**

- Сжимать только payload > порога (например, 100 байт)
- Для маленьких payload сжатие может быть медленнее, чем просто base64url

**5. Асинхронное сжатие (будущее улучшение):**

- Использовать Web Workers для сжатия больших payload
- Не блокирует UI поток
- Требует дополнительной реализации

**6. Оптимизация размера payload:**

- Передавать только необходимые данные
- Избегать дублирования данных
- Использовать ID вместо полных объектов, где возможно

#### 7.8.3. Рекомендации по использованию

**Для маленьких payload (< 1KB):**

- Сжатие опционально (можно включить для единообразия)
- Время кодирования/декодирования: < 2ms
- Влияние на производительность: минимальное

**Для средних payload (1-10KB):**

- Сжатие рекомендуется для уменьшения размера URL
- Время кодирования: 5-15ms
- Время декодирования: 2-5ms
- Влияние на производительность: приемлемое

**Для больших payload (> 10KB):**

- Сжатие обязательно
- Время кодирования: 15-50ms (может быть заметно)
- Рассмотреть альтернативные подходы:
  - Использовать sessionStorage для больших payload
  - Передавать только ID в URL, данные загружать отдельно
  - Использовать hash вместо query параметров (если допустимо)

**Для критичных по производительности сценариев:**

- Рассмотреть опцию отключения синхронизации с URL (`syncWithUrl: false`)
- Использовать синхронизацию только для важных Lightbox
- Применять debounce для частых обновлений

#### 7.8.4. Метрики производительности

**Время открытия Lightbox:**

- Без синхронизации URL: базовое время открытия компонента
- С синхронизацией URL (маленький payload): +1-2ms
- С синхронизацией URL (большой payload): +15-30ms

**Время закрытия Lightbox:**

- Без синхронизации URL: базовое время закрытия компонента
- С синхронизацией URL: +0.1ms

**Время восстановления состояния при загрузке:**

- Чтение параметров: < 1ms
- Декодирование payload: 1-10ms
- Открытие Lightbox: 10-50ms (зависит от компонента)
- **Итого**: ~15-60ms

**Влияние на FPS:**

- При нормальном использовании: < 1%
- При частых обновлениях без debounce: может достигать 5-10%
- С debounce: < 1%

### 7.9. Ошибки и логирование

- Формат ошибок регистрации:
  - `OVERLAY_CONFIG_DUPLICATE_NAME` - конфликт имён при регистрации
  - `OVERLAY_CONFIG_GUARD_FAILED` - сущность не прошла проверку разрешений/feature toggles
  - `OVERLAY_OPEN_NOT_FOUND` - попытка открыть оверлей по несуществующему имени (выбрасывается исключение)
  - `OVERLAY_LIGHTBOX_DRAWER_REQUIRES_LIGHTBOX` - попытка открыть Lightbox Drawer без открытого Lightbox (выбрасывается исключение)
- Ошибки выбрасываются из OverlayManager/Bootstrap с логированием в общий логгер приложения (уровень error для конфигурации, warn для попыток открыть несуществующее имя в runtime, если перехвачено).
- Сообщения включают тип, имя, модуль-источник и причину (например, провал permission/feature toggle).
- При открытии Dialog автоматически закрывается активный Lightbox (если есть) без ошибок.
- При открытии Lightbox автоматически закрывается активный Dialog (если есть) без ошибок.

## 8. План реализации

### 8.1. Этап 1: Подготовка (1-2 дня)

- Создать структуру файлов
- Реализовать базовый OverlayManager

### 8.2. Этап 2: React интеграция (2-3 дня)

- Создать Provider и хуки
- Создать компоненты-рендереры
- Интегрировать в Layout

### 8.3. Этап 3: Bootstrap интеграция (1-2 дня)

- Создать InitOverlayHandler
- Расширить Bootstrap
- Добавить в цепочку обработчиков (после RouterHandler для доступа к роутеру)
- Реализовать синхронизацию с URL (чтение параметров при инициализации, обновление URL при открытии/закрытии Lightbox)

### 8.4. Этап 4: Конфигурация модулей (1 день)

- Расширить интерфейс модуля
- Обновить ModuleLoader

### 8.5. Этап 5: Интеграция и документация (2-3 дня)

- Интеграция OverlayManager в модули приложения
- Регистрация оверлеев в конфигурациях модулей
- Создание примеров использования для разработчиков
- Документация API и примеры использования
- Тестирование вручную основных сценариев

**Итого: 8-12 дней** (с учетом реализации синхронизации с URL)

## 9. Риски и митигация

### 9.1. Риски

1. **Производительность при множественных Drawer'ах**
   - Митигация: Планируется поддержка до 3х одновременных Drawer'ов. Мемоизация компонентов — на усмотрение разработчика модуля.

2. **Конфликты zIndex**
   - Митигация: Централизованное управление zIndex через OverlayManager

3. **Сложность интеграции с модульной архитектурой**
   - Митигация: Четкая документация, примеры использования, типизация TypeScript

4. **Отсутствие обратной совместимости**
   - Старая система Dialog/Lightbox не поддерживается. Все модули должны быть мигрированы на новую систему OverlayManager.

## 10. Критерии приемки

1. ✅ Может быть открыт только 1 Dialog или 1 Lightbox (не вместе)
2. ✅ Может быть открыто N Drawer'ов с правильным наложением
3. ✅ Drawer'ы для Lightbox работают только когда открыт Lightbox
4. ✅ Обычные Drawer'ы независимы от Dialog/Lightbox
5. ✅ Все оверлеи регистрируются через конфигурацию модулей
6. ✅ Поддержка проверки разрешений и feature toggles
7. ✅ Поддержка хуков onEnter, onClose
8. ✅ Интеграция с существующей архитектурой MVVM
9. ✅ Типизация TypeScript для всех интерфейсов
10. ✅ Конфликты имён между модулями приводят к ошибке регистрации
11. ✅ Открытие по несуществующему имени выбрасывает исключение; Lightbox Drawer'ы закрываются при closeLightbox
12. ✅ Попытка открыть Lightbox Drawer без открытого Lightbox выбрасывает исключение
13. ✅ При открытии Dialog автоматически закрывается активный Lightbox
14. ✅ При открытии Lightbox автоматически закрывается активный Dialog
15. ✅ Drawer'ы из разных модулей могут сосуществовать (накладываются друг на друга)
16. ✅ Состояние Lightbox синхронизируется с URL параметрами (при включенной опции)
17. ✅ При обновлении страницы или переходе по ссылке, Lightbox автоматически открывается с параметрами из URL

## 11. Дополнительные улучшения (будущее)

1. **Группировка оверлеев**: связанные оверлеи в группы
2. **Accessibility**: улучшенная поддержка screen readers
3. **Анимации**: более сложные и плавные переходы
4. **Unit и интеграционные тесты**: автоматизированное тестирование основных сценариев
