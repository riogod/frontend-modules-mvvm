import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Создание сервиса манифестов

Сервис манифестов предоставляет стартовую информацию для приложения: список модулей, feature flags, permissions и серверные параметры.

## Эндпоинт

**Метод:** \`GET\`  
**Путь:** \`/app/start\`

## Контракт ответа

### Структура ответа

\`\`\`typescript
interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
    params?: Record<string, unknown>;
    modules?: ModuleManifestEntry[];
  };
}
\`\`\`

### Поля ответа

| Поле          | Тип                       | Обязательно | Описание                                    |
| ------------- | ------------------------- | ----------- | ------------------------------------------- |
| \`status\`      | \`string\`                  | Да          | Статус ответа (обычно \`"ok"\` или \`"error"\`) |
| \`data\`        | \`object\`                  | Да          | Данные ответа                               |
| \`features\`    | \`Record<string, boolean>\` | Да          | Feature flags пользователя                  |
| \`permissions\` | \`Record<string, boolean>\` | Да          | Permissions пользователя                    |
| \`params\`      | \`Record<string, unknown>\` | Нет         | Серверные параметры                         |
| \`modules\`     | \`ModuleManifestEntry[]\`   | Нет         | Список модулей для загрузки                 |

### Структура модуля

\`\`\`typescript
interface ModuleManifestEntry {
  name: string; // Обязательно
  loadType: 'init' | 'normal'; // Обязательно
  loadPriority?: number; // Опционально, по умолчанию 1
  remoteEntry: string; // Обязательно (пустая строка для локальных)
  dependencies?: string[]; // Опционально
  featureFlags?: string[]; // Опционально
  accessPermissions?: string[]; // Опционально
}
\`\`\`

### Поля модуля

| Поле                | Тип                  | Обязательно | Описание                                                          |
| ------------------- | -------------------- | ----------- | ----------------------------------------------------------------- |
| \`name\`              | \`string\`             | Да          | Уникальное имя модуля (например, \`"todo"\`, \`"api_example"\`)       |
| \`loadType\`          | \`'init' | 'normal'\` | Да          | Тип загрузки: \`init\` — при старте, \`normal\` — после инициализации |
| \`loadPriority\`      | \`number\`             | Нет         | Приоритет загрузки (меньше = выше приоритет), по умолчанию \`1\`    |
| \`remoteEntry\`       | \`string\`             | Да          | URL для remote модулей или пустая строка для локальных            |
| \`dependencies\`      | \`string[]\`           | Нет         | Список имен модулей, от которых зависит текущий модуль            |
| \`featureFlags\`      | \`string[]\`           | Нет         | Feature flags, при отсутствии которых модуль не загружается       |
| \`accessPermissions\` | \`string[]\`           | Нет         | Permissions, при отсутствии которых модуль не загружается         |

## Пример ответа

\`\`\`json
{
  "status": "ok",
  "data": {
    "features": {
      "FEATURE_NEW_DASHBOARD": true,
      "FEATURE_EXPERIMENTAL_UI": false
    },
    "permissions": {
      "PERMISSION_ADMIN_PANEL": true,
      "PERMISSION_REPORTS_VIEW": true,
      "PERMISSION_REPORTS_EDIT": false
    },
    "params": {
      "SOME_URL": "https://example.com",
      "MAX_UPLOAD_SIZE": 10485760
    },
    "modules": [
      {
        "name": "todo",
        "loadType": "normal",
        "loadPriority": 1,
        "remoteEntry": "https://cdn.example.com/modules/todo/latest/assets/remoteEntry.js",
        "dependencies": [],
        "featureFlags": ["FEATURE_TODO_MODULE"],
        "accessPermissions": []
      },
      {
        "name": "reports",
        "loadType": "normal",
        "loadPriority": 2,
        "remoteEntry": "",
        "dependencies": ["todo"],
        "featureFlags": [],
        "accessPermissions": ["PERMISSION_REPORTS_VIEW"]
      }
    ]
  }
}
\`\`\`

## Валидация модулей

### Обязательные проверки

1. **Структура ответа**
   - Поле \`status\` должно быть строкой
   - Поле \`data\` должно быть объектом
   - Поля \`features\` и \`permissions\` должны быть объектами \`Record<string, boolean>\`

2. **Валидация модулей**
   - \`name\` — непустая строка, уникальное в рамках массива
   - \`loadType\` — строго \`"init"\` или \`"normal"\`
   - \`remoteEntry\` — строка (может быть пустой для локальных модулей)
   - \`loadPriority\` — положительное число, если указано
   - \`dependencies\` — массив строк, если указано
   - \`featureFlags\` — массив строк, если указано
   - \`accessPermissions\` — массив строк, если указано

3. **Валидация зависимостей**
   - Все модули из \`dependencies\` должны присутствовать в массиве \`modules\`
   - Запрещены циклические зависимости
   - Модуль не может зависеть от самого себя

4. **Валидация remoteEntry**
   - Для \`loadType: "normal"\` с непустым \`remoteEntry\` — URL должен быть валидным
   - Для локальных модулей (\`remoteEntry === ""\`) — модуль должен существовать локально

## Что учесть при реализации

### 1. Кеширование

- Ответ должен быть актуальным на момент запроса
- Рекомендуется кешировать на короткое время (30-60 секунд)
- При изменении feature flags или permissions кеш должен инвалидироваться

### 2. Персонализация данных

- \`features\` и \`permissions\` должны соответствовать текущему пользователю
- Если пользователь не авторизован, верните пустые объекты или базовые значения

### 3. Фильтрация модулей

- Возвращайте только модули, доступные текущему пользователю
- Учитывайте feature flags и permissions при формировании списка модулей
- Не включайте модули, для которых не выполнены условия загрузки
- Рекомендуется проверять зависимости на циклы и устанавливать порядок loadPriority в соответствии с постоенным деревом зависимостей

### 4. Формат remoteEntry

Для remote модулей \`remoteEntry\` должен быть полным URL:

\`\`\`
https://cdn.example.com/modules/{moduleName}/{version}/assets/remoteEntry.js
\`\`\`

Для локальных модулей используйте пустую строку:

\`\`\`
""
\`\`\`

### 5. Обработка ошибок

- При ошибке верните статус \`"error"\` и описание в \`data\`:

\`\`\`json
{
  "status": "error",
  "error": {
    "message": "Failed to load modules",
    "code": "GEN_FAILED"
  }
}
\`\`\`

- Клиент обработает ошибку и продолжит работу с fallback (пустым списком модулей)

### 6. Версионирование модулей

- Поле \`version\` опционально, но рекомендуется для отслеживания
- Формат версии: семантическое версионирование (\`"1.0.0"\`) или \`"latest"\`

### 7. Приоритеты загрузки

- \`loadPriority\` определяет порядок загрузки модулей
- Меньшее значение = выше приоритет
- По умолчанию используется \`1\`

### 8. Условия загрузки

Модуль загружается только если:

- Все \`featureFlags\` присутствуют в \`data.features\` со значением \`true\`
- Все \`accessPermissions\` присутствуют в \`data.permissions\` со значением \`true\`
- Все \`dependencies\` загружены успешно

Если условие не выполнено, модуль пропускается и не отображается в списке доступных.

## Рекомендации

1. **Производительность**
   - Минимизируйте размер ответа
   - Используйте сжатие (gzip/brotli)
   - Оптимизируйте запросы к БД для получения permissions/features

2. **Мониторинг**
   - Логируйте запросы к эндпоинту
   - Отслеживайте время ответа
   - Мониторьте ошибки валидации

3. **Тестирование**
   - Проверяйте все комбинации feature flags и permissions
   - Тестируйте циклические зависимости
   - Проверяйте обработку некорректных данных


---

# CSS-in-JS vs CSS Modules

В платформе поддерживаются оба подхода к стилизации компонентов. Выбор зависит от контекста использования.

## Обзор подходов

| Подход          | Когда использовать                        | Примеры                 |
| --------------- | ----------------------------------------- | ----------------------- |
| **MUI sx prop** | Быстрая стилизация MUI компонентов        | \`<Box sx={{ p: 2 }}>\`   |
| **styled()**    | Переиспользуемые стилизованные компоненты | \`styled(AppBar)({...})\` |
| **CSS Modules** | Сложные стили, анимации, медиа-запросы    | \`styles.container\`      |

## CSS-in-JS (Emotion + MUI)

### sx prop

Самый быстрый способ стилизации MUI компонентов:

\`\`\`tsx
import { Box, Typography, Button } from '@platform/ui';

export const MyComponent: FC = () => (
  <Box
    sx={{
      p: 2,
      display: 'flex',
      gap: 2,
      bgcolor: 'background.paper',
    }}
  >
    <Typography sx={{ color: 'text.primary' }}>Текст</Typography>
    <Button sx={{ mt: 'auto' }}>Кнопка</Button>
  </Box>
);
\`\`\`

**Преимущества:**

- Доступ к теме через сокращения (\`p\`, \`mt\`, \`bgcolor\`)
- Автодополнение в IDE
- Типизация из коробки

### styled()

Для создания переиспользуемых стилизованных компонентов в соответствии с концепциями MUI:

\`\`\`tsx
import { styled, AppBar } from '@platform/ui';

export const AppBarStyled = styled(AppBar)(() => ({
  boxShadow: 'none',
  backdropFilter: 'blur(8px)',
}));

// С доступом к теме
export const StyledCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));
\`\`\`

**Когда использовать:**

- Компонент используется в нескольких местах
- Нужна кастомизация базового MUI компонента
- Требуется доступ к теме

## CSS Modules

### Базовое использование

Создайте файл с расширением \`.module.css\`:

\`\`\`css
/* MyComponent.module.css */
.container {
  padding: var(--spacing-md);
  border: 1px solid var(--mui-palette-divider);
  border-radius: var(--mui-shape-border-radius);
}

.title {
  color: var(--mui-palette-primary-main);
  font-size: 18px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
\`\`\`

Импортируйте стили в компонент:

\`\`\`tsx
import { type FC } from 'react';
import { Box, Typography } from '@platform/ui';
import styles from './MyComponent.module.css';

export const MyComponent: FC = () => (
  <Box className={styles.container}>
    <Typography className={styles.title}>Заголовок</Typography>
    <div className={styles.content}>Контент</div>
  </Box>
);
\`\`\`

### CSS переменные

CSS переменные из темы MUI доступны глобально через \`@platform/ui\`:

\`\`\`css
.element {
  /* Цвета из темы */
  color: var(--mui-palette-primary-main);
  background: var(--mui-palette-background-paper);
  border-color: var(--mui-palette-divider);

  /* Скругления */
  border-radius: var(--mui-shape-border-radius);

  /* Отступы */
  padding: var(--spacing-md);
  margin: var(--spacing-sm);
}
\`\`\`

**Доступные переменные:**

| Переменная                         | Описание                |
| ---------------------------------- | ----------------------- |
| \`--mui-palette-primary-main\`       | Основной цвет темы      |
| \`--mui-palette-primary-light\`      | Светлый вариант primary |
| \`--mui-palette-primary-dark\`       | Темный вариант primary  |
| \`--mui-palette-secondary-main\`     | Вторичный цвет          |
| \`--mui-palette-background-default\` | Фон по умолчанию        |
| \`--mui-palette-background-paper\`   | Фон карточек            |
| \`--mui-palette-text-primary\`       | Основной цвет текста    |
| \`--mui-palette-text-secondary\`     | Вторичный цвет текста   |
| \`--mui-palette-divider\`            | Цвет разделителей       |
| \`--mui-shape-border-radius\`        | Скругление углов        |
| \`--spacing-xs\`                     | 4px                     |
| \`--spacing-sm\`                     | 8px                     |
| \`--spacing-md\`                     | 16px                    |
| \`--spacing-lg\`                     | 24px                    |
| \`--spacing-xl\`                     | 32px                    |

### Изоляция стилей в модулях

Платформа автоматически добавляет префикс модуля к классам CSS Modules:

\`\`\`
Development: todo__container
Production:  todo_container_abc12
\`\`\`

Это обеспечивается конфигурацией Vite:

\`\`\`javascript
css: {
  modules: {
    generateScopedName: (name, filename) => {
      if (isProduction) {
        return \`\${modulePart}_\${name}_\${hash}\`;
      }
      return \`\${modulePart}__\${name}\`;
    },
    localsConvention: 'camelCase',
  },
}
\`\`\`

### Медиа-запросы и анимации

CSS Modules отлично подходят для сложных стилей:

\`\`\`css
.container {
  padding: var(--spacing-md);
}

@media (max-width: 600px) {
  .container {
    padding: var(--spacing-sm);
  }
}

.fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
\`\`\`

## Правило ESLint: no-global-css

В MFE модулях **запрещен** импорт глобальных CSS файлов. Это обеспечивает изоляцию стилей между модулями.

**Разрешено:**

- CSS Modules (\`.module.css\`)
- Импорты из \`@platform/ui\`
- Импорты из \`node_modules\`

**Запрещено:**

- Глобальные CSS файлы (\`./styles.css\`)

\`\`\`typescript
// ❌ Запрещено
import './global-styles.css';

// ✅ Разрешено
import styles from './Component.module.css';
import '@platform/ui/theme/variables.css';
\`\`\`

## Типизация CSS Modules

Для TypeScript добавьте декларацию в \`vite-env.d.ts\`:

\`\`\`typescript
/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
\`\`\`

## Рекомендации по выбору

### Используйте sx prop когда

- Стилизуете единичный MUI компонент
- Нужны простые стили (отступы, цвета, размеры)
- Важна скорость разработки

### Используйте styled() когда

- Создаете переиспользуемый компонент
- Кастомизируете MUI компонент для проекта
- Нужен доступ к теме в стилях

### Используйте CSS Modules когда

- Пишете сложные стили (animations, pseudo-elements)
- Нужны медиа-запросы
- Стилизуете не-MUI элементы
- Команда привыкла к классическому CSS

## Примеры комбинирования

Подходы можно комбинировать в одном компоненте:

\`\`\`tsx
import { type FC } from 'react';
import { Box, Typography, styled } from '@platform/ui';
import styles from './Card.module.css';

const StyledBox = styled(Box)(({ theme }) => ({
  transition: theme.transitions.create('box-shadow'),
}));

export const Card: FC = () => (
  <StyledBox className={styles.card} sx={{ p: 2 }}>
    <Typography variant="h6" className={styles.title} sx={{ mb: 1 }}>
      Заголовок
    </Typography>
    <div className={styles.content}>Контент карточки</div>
  </StyledBox>
);
\`\`\`

## Синхронизация темы

CSS переменные автоматически синхронизируются с темой MUI через компонент \`CssVariablesSync\`:

\`\`\`tsx
// Автоматически включен в ThemeSchema
import { CssVariablesSync } from '@platform/ui';

// При изменении темы переменные обновляются
<ThemeProvider theme={theme}>
  <CssVariablesSync />
  {children}
</ThemeProvider>;
\`\`\`

Это позволяет CSS Modules реагировать на смену светлой/темной темы.

## Лучшие практики

1. **Не смешивайте подходы без необходимости** — выберите основной для компонента
2. **Используйте CSS переменные** — они обеспечивают консистентность с темой
3. **Избегайте глобальных стилей** — только в \`host/src/main.css\`
4. **Именуйте классы по BEM-подобной схеме** — \`.container\`, \`.container__title\`
5. **Группируйте стили по компоненту** — один \`.module.css\` на компонент


---

# Мониторинг ошибок

Руководство по интеграции системы мониторинга ошибок в приложение.

---

## Обзор

Платформа предоставляет встроенный механизм для отправки ошибок во внешние системы мониторинга (Sentry, Rollbar, LogRocket и др.). Механизм автоматически перехватывает:

- Необработанные исключения (\`window.onerror\`)
- Необработанные промисы (\`unhandledrejection\`)
- Ошибки, логируемые через \`log.error()\`

---

## Подключение

Откройте файл \`host/src/main.tsx\` и раскомментируйте \`errorMonitoringCallback\`:

\`\`\`typescript
log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    // Отправка ошибки в систему мониторинга
    // Пример для Sentry:
    // Sentry.captureException(error, { extra: errorInfo });
  },
});
\`\`\`

---

## Интерфейс callback

\`\`\`typescript
interface IErrorMonitoringCallback {
  (
    error: Error,
    errorInfo?: {
      message?: string;
      source?: string;
      lineno?: number;
      colno?: number;
      stack?: string;
      filename?: string;
      isUnhandledRejection?: boolean;
      prefix?: string;
    },
  ): void;
}
\`\`\`

| Поле                   | Описание                           |
| ---------------------- | ---------------------------------- |
| \`error\`                | Объект ошибки                      |
| \`message\`              | Текст сообщения об ошибке          |
| \`source\`               | Источник ошибки (URL файла)        |
| \`lineno\`               | Номер строки                       |
| \`colno\`                | Номер колонки                      |
| \`stack\`                | Stack trace                        |
| \`filename\`             | Имя файла                          |
| \`isUnhandledRejection\` | Флаг необработанного промиса       |
| \`prefix\`               | Префикс логгера (модуль/компонент) |

---

## Пример с Sentry

\`\`\`typescript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: import.meta.env.MODE,
});

log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    Sentry.captureException(error, {
      extra: {
        ...errorInfo,
        userAgent: navigator.userAgent,
      },
    });
  },
});
\`\`\`

---

## Пример с Rollbar

\`\`\`typescript
import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: 'your-token',
  environment: import.meta.env.MODE,
});

log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    rollbar.error(error, errorInfo);
  },
});
\`\`\`

---

## Дедупликация

Logger автоматически предотвращает дублирование ошибок:

- Каждая ошибка отправляется в мониторинг только один раз
- Кэш обработанных ошибок автоматически очищается (максимум 20 записей)

---

## Игнорирование ошибок

Отменённые запросы (AbortError) автоматически игнорируются и не отправляются в мониторинг.

Для фильтрации других ошибок добавьте проверку в callback:

\`\`\`typescript
errorMonitoringCallback: (error, errorInfo) => {
  // Игнорировать ошибки сети
  if (error.name === 'NetworkError') return;

  // Игнорировать ошибки из внешних скриптов
  if (errorInfo?.source?.includes('external-script')) return;

  Sentry.captureException(error);
},
\`\`\`


---

# Optimistic UI

Optimistic UI — это паттерн, при котором интерфейс обновляется **мгновенно**, не дожидаясь ответа от сервера. Это создает ощущение быстрого и отзывчивого приложения.

## Что это дает

- **Мгновенный отклик** — пользователь сразу видит результат действия
- **Улучшенный UX** — нет задержек и "зависаний" интерфейса
- **Естественное взаимодействие** — приложение ведет себя как нативное

## Принцип работы

\`\`\`
┌──────────────┐   1. Действие    ┌──────────────┐   2. Обновление   ┌───────────┐
│     View     │ ───────────────▶ │   UseCase    │ ────────────────▶ │   Model   │
│   (кнопка)   │                  │  (execute)   │                   │  (state)  │
└──────────────┘                  └──────────────┘                   └───────────┘
       ▲                                 │                                 │
       │         MobX реактивность       │   3. Сохранение                 │
       └─────────────────────────────────│◀─────(async)────────────────────┘
                 5. Ререндер             │           │
                                         ▼           ▼
                                  ┌──────────────────────┐
                                  │  Repository / API    │
                                  └──────────────────────┘
                                         │
                                         ▼
                                  4. Подтверждение
\`\`\`

**Последовательность:**

1. Пользователь выполняет действие (клик, ввод)
2. UseCase **сразу** обновляет Model
3. View перерисовывается благодаря MobX-реактивности
4. UseCase асинхронно сохраняет данные
5. При ошибке — откат к предыдущему состоянию

## Реализация в платформе

### MobX как основа реактивности

MobX автоматически отслеживает изменения в моделях и обновляет View. Это ключевой элемент для Optimistic UI.

\`\`\`typescript
// Model — реактивное хранилище
@injectable()
export class TodoListModel {
  private _todos: TodoList[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // Мгновенное обновление состояния
  setItem(item: TodoList) {
    this._todos.push(item);
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }
}
\`\`\`

### Паттерн "Обнови сейчас, сохрани потом"

UseCase сначала обновляет модель, а потом выполняет сохранение:

\`\`\`typescript
@injectable()
export class AddTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(text: string): void {
    if (!text) return;

    // 1. СНАЧАЛА обновляем Model — UI мгновенно отобразит изменения
    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. ПОТОМ сохраняем в хранилище
    this.saveToStorage();
  }

  private saveToStorage(): void {
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    let parsedTodoList: TodoList[] = [];

    if (todoList && todoList.trim()) {
      try {
        parsedTodoList = JSON.parse(todoList) as TodoList[];
      } catch {
        parsedTodoList = [];
      }
    }

    parsedTodoList.push(this.todoModel.items[this.todoModel.items.length - 1]);
    this.localStorageRepository.setKey('todoList', JSON.stringify(parsedTodoList));
  }
}
\`\`\`

### Обновление существующих данных

\`\`\`typescript
@injectable()
export class UpdateTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(item: UpdateTodoList): void {
    // 1. Мгновенное обновление модели
    this.todoModel.updateItem(item);

    // 2. Синхронизация с хранилищем
    this.syncStorage(item);
  }

  private syncStorage(item: UpdateTodoList): void {
    // ... логика сохранения
  }
}
\`\`\`

## Работа с API и откат при ошибках

Для работы с API используется утилита \`executeWithAbortHandling\`, которая автоматически:

- Сохраняет предыдущие данные перед запросом
- Восстанавливает их при отмене или ошибке
- Управляет состоянием загрузки

\`\`\`typescript
import { executeWithAbortHandling } from '@platform/core';

@injectable()
export class GetJokeUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(API_EXAMPLE_DI_TOKENS.REPOSITORY_JOKE)
    private jokesRepository: JokesRepository,
    @inject(API_EXAMPLE_DI_TOKENS.MODEL_JOKE)
    private jokesModel: JokesModel,
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    await executeWithAbortHandling({
      // Функция запроса
      requestFn: async () => {
        const joke = await this.jokesRepository.getJoke();
        return joke && joke.length > 0 ? joke[0] : null;
      },
      // Получить предыдущие данные для отката
      getPreviousData: () => this.jokesModel.joke,
      // Установить новые данные
      setData: (joke) => {
        if (joke) {
          this.jokesModel.setJoke(joke);
        }
      },
      // Управление состоянием загрузки
      setLoading: (loading) => {
        this.jokesModel.loading = loading;
      },
      // Обработка ошибок
      onError: (error) => {
        if (error instanceof Error) {
          this.appModel.notification = error.message;
        }
      },
      // Трекер для отслеживания актуальности запроса
      requestIdTracker: this.requestIdTracker,
    });
  }
}
\`\`\`

### Параметры \`executeWithAbortHandling\`

| Параметр           | Описание                                                |
| ------------------ | ------------------------------------------------------- |
| \`requestFn\`        | Асинхронная функция запроса                             |
| \`getPreviousData\`  | Функция получения текущих данных для возможного отката  |
| \`setData\`          | Функция установки новых данных в модель                 |
| \`setLoading\`       | Функция управления состоянием загрузки                  |
| \`onError\`          | Обработчик ошибок (не вызывается при отмене)            |
| \`requestIdTracker\` | Объект для отслеживания актуальности запроса            |

### Как работает откат

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    executeWithAbortHandling                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Сохранить previousData = getPreviousData()                  │
│  2. setLoading(true)                                            │
│  3. Выполнить requestFn()                                       │
│     ├─ Успех → setData(response)                                │
│     ├─ Отмена → setData(previousData)  // откат                 │
│     └─ Ошибка → onError(error), throw                           │
│  4. setLoading(false)                                           │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## Ручной откат при ошибках

Если не используете \`executeWithAbortHandling\`, реализуйте откат вручную:

\`\`\`typescript
@injectable()
export class CreateItemUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL) private model: ItemsModel,
    @inject(DI_TOKENS.REPOSITORY) private repository: ItemsRepository,
    @inject(IOC_CORE_TOKENS.MODEL_APP) private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(item: Item): Promise<void> {
    // 1. Сохраняем для возможного отката
    const previousItems = [...this.model.items];

    // 2. Оптимистичное обновление
    this.model.addItem(item);

    try {
      // 3. Отправляем на сервер
      await this.repository.create(item);
    } catch (error) {
      // 4. Откат при ошибке
      this.model.setItems(previousItems);

      if (error instanceof Error) {
        this.appModel.notification = 'Не удалось создать элемент';
      }
    }
  }
}
\`\`\`

## Связка с View

View автоматически обновляется благодаря \`observer\` из MobX:

\`\`\`tsx
import { observer } from 'mobx-react-lite';

const TodoList: FC = observer(() => {
  const vm = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL);

  return (
    <ul>
      {vm.items.map((item) => (
        <li key={item.id}>
          {item.description}
          <button onClick={() => vm.removeItem(item.id)}>Удалить</button>
        </li>
      ))}
    </ul>
  );
});
\`\`\`

При вызове \`vm.removeItem(id)\`:
1. UseCase мгновенно удаляет элемент из модели
2. MobX замечает изменение
3. Компонент перерисовывается без элемента
4. Пользователь сразу видит результат

## Когда использовать

### ✅ Подходит для

- Добавление/удаление элементов списка
- Переключение состояний (чекбоксы, тоглы)
- Обновление полей форм
- Действия с высокой вероятностью успеха

### ❌ Не подходит для

- Критичные финансовые операции
- Действия с низкой вероятностью успеха
- Операции требующие подтверждения сервера

## Лучшие практики

1. **Всегда сохраняйте предыдущее состояние** перед оптимистичным обновлением
2. **Показывайте индикатор загрузки** для длительных операций
3. **Информируйте об ошибках** при неудачном сохранении
4. **Используйте \`executeWithAbortHandling\`** для API-запросов
5. **Не забывайте \`observer\`** в компонентах для реактивности



---

# Debug режим в Production

Руководство по включению debug-логов в промышленной среде.

---

## Когда это нужно

Бывают ситуации, когда в production возникает проблема, которую сложно воспроизвести локально:

- Ошибки, зависящие от специфических данных пользователя
- Проблемы с загрузкой модулей
- Некорректное поведение при определённых условиях доступа
- Баги, связанные с конкретной конфигурацией окружения

В этих случаях полезно временно включить расширенное логирование для диагностики.

---

## Как включить

Откройте DevTools браузера и выполните в консоли:

\`\`\`javascript
localStorage.setItem('platform_debug', 'true');
\`\`\`

Перезагрузите страницу. Теперь в консоли будут отображаться все debug-логи.

---

## Как отключить

Удалите флаг из localStorage:

\`\`\`javascript
localStorage.removeItem('platform_debug');
\`\`\`

Или установите в \`false\`:

\`\`\`javascript
localStorage.setItem('platform_debug', 'false');
\`\`\`

Перезагрузите страницу.

---

## Допустимые значения

| Значение            | Результат                    |
| ------------------- | ---------------------------- |
| \`true\`, \`1\`, \`on\`   | Включает DEBUG уровень       |
| \`false\`, \`0\`, \`off\` | Только ERROR логи            |
| отсутствует         | Стандартное поведение (INFO) |

---

## Что отображается в DEBUG

При включённом debug-режиме в консоли отображаются:

- Процесс загрузки модулей
- Работа DI-контейнера
- Изменения состояния моделей
- Детали API-запросов
- Внутренние операции bootstrap

---


---

# Расширение конфигурации роутинга

Платформа позволяет расширять конфигурацию роутинга двумя способами:

1. Добавление кастомных параметров в интерфейс \`IRoute\`
2. Внедрение дополнительных зависимостей через расширение \`RouterDependencies\`

## Расширение интерфейса IRoute

Интерфейс \`IRoute\` находится в \`libs/core/src/Router/interfaces.ts\` и расширяет \`Route<RouterDependencies>\` из библиотеки \`@riogz/router\`. Вы можете добавить свои поля прямо в этот интерфейс.

### Добавление кастомных полей

\`\`\`typescript
// libs/core/src/Router/interfaces.ts
import type { Route } from '@riogz/router';
import type { Router } from '@riogz/router';
import type { FunctionComponent, ReactNode } from 'react';
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];
}

export interface IRoute extends Route<RouterDependencies> {
  /**
   * Переопределение интерфейса дочерних роутов
   */
  children?: IRoute[];
  /**
   * Объект конфигурации отображения роута в меню
   */
  menu?: IMenuConfig;
  /**
   * Компонент отображаемой страницы
   */
  pageComponent?: FunctionComponent;

  /**
   * Кастомные метаданные маршрута (пример расширения)
   */
  meta?: {
    requiresAuth?: boolean;
    requiredPermission?: string;
    requiredFeatureFlag?: string;
    analytics?: {
      category: string;
      action: string;
    };
    customData?: Record<string, unknown>;
  };
}
\`\`\`

### Использование кастомных полей в маршрутах

\`\`\`typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'admin-panel',
    path: '/admin',
    browserTitle: 'Admin Panel',
    pageComponent: lazy(() => import('../view/AdminPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'PERMISSION_ADMIN',
      analytics: {
        category: 'Navigation',
        action: 'Admin Panel Access',
      },
    },
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/DashboardPage')),
    meta: {
      requiredFeatureFlag: 'FEATURE_DASHBOARD',
    },
  },
];
\`\`\`

### Использование кастомных полей в хуках

\`\`\`typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

export const routes: IRoutes = [
  {
    name: 'protected-page',
    path: '/protected',
    pageComponent: lazy(() => import('../view/ProtectedPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'PERMISSION_VIEW',
    },
    onEnterNode: async (toState, fromState, deps) => {
      const route = deps.router.getRoute(toState.name);
      const meta = route?.meta;

      // Проверка прав доступа
      if (meta?.requiredPermission) {
        const accessControl = deps.di.get<AccessControlModel>(
          IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
        );

        if (!accessControl.hasPermission(meta.requiredPermission)) {
          deps.router.navigate('access-denied');
          return;
        }
      }
    },
  },
];
\`\`\`

## Расширение RouterDependencies

\`RouterDependencies\` передается в хуки жизненного цикла маршрутов (\`onEnterNode\`, \`onExitNode\`) и доступен через \`router.getDependencies()\`. Вы можете расширить его своими сервисами.

### 1. Расширение интерфейса RouterDependencies

\`\`\`typescript
// libs/core/src/Router/interfaces.ts
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];

  // Добавление кастомных зависимостей
  analytics?: AnalyticsService;
  authService?: AuthService;
  customService?: CustomService;
}
\`\`\`

### 2. Расширение RouterPostHandler

Модифицируйте \`RouterPostHandler\`, чтобы он устанавливал дополнительные зависимости после установки базовых:

\`\`\`typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log, type RouterDependencies } from '@platform/core';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthService } from '../services/AuthService';

export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('RouterPostHandler: starting', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });

    await bootstrap.moduleLoader.preloadRoutes();

    const { routerPostInit } = this.params;
    if (routerPostInit) {
      bootstrap.routerService.routerPostInit(routerPostInit);
    }

    const appMenu =
      bootstrap.routerService.buildRoutesMenu(bootstrap.routerService.routes) ||
      [];

    // Устанавливаем базовые зависимости
    const baseDependencies: RouterDependencies = {
      di: bootstrap.di,
      menu: appMenu,
    };

    // Создаем или получаем дополнительные сервисы
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    // Устанавливаем расширенные зависимости
    bootstrap.routerService.router.setDependencies({
      ...baseDependencies,
      analytics,
      authService,
    } as RouterDependencies);

    log.debug('RouterPostHandler: completed', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });
    return await super.handle(bootstrap);
  }
}
\`\`\`

### Альтернатива: через параметр конфигурации

Если вы хотите сделать это более гибким, можно добавить функцию в \`IAppConfig\`:

\`\`\`typescript
// host/src/config/app.ts
import { type RouterDependencies } from '@platform/core';

export interface IAppConfig {
  apiUrl?: string;
  appPrefix?: string;
  i18nOptions?: InitOptions<object>;
  routes?: IRoutes;
  routerPostInit?: (
    router: Router<RouterDependencies>,
  ) => Router<RouterDependencies>;

  // Функция для расширения зависимостей роутера
  extendRouterDependencies?: (
    baseDeps: RouterDependencies,
  ) => RouterDependencies;
}
\`\`\`

Затем в \`RouterPostHandler\`:

\`\`\`typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
const baseDependencies: RouterDependencies = {
  di: bootstrap.di,
  menu: appMenu,
};

// Расширяем зависимости через функцию из конфигурации, если она есть
const finalDependencies = this.params.extendRouterDependencies
  ? this.params.extendRouterDependencies(baseDependencies)
  : baseDependencies;

bootstrap.routerService.router.setDependencies(finalDependencies);
\`\`\`

И в \`appConfig\`:

\`\`\`typescript
// host/src/config/app.ts
export const appConfig: IAppConfig = {
  // ... другие настройки

  extendRouterDependencies: (baseDeps) => {
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    return {
      ...baseDeps,
      analytics,
      authService,
    };
  },
};
\`\`\`

### 4. Использование расширенных зависимостей в маршрутах

\`\`\`typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'my-module',
    path: '/my-module',
    pageComponent: lazy(() => import('../view/MyPage')),
    onEnterNode: async (toState, fromState, deps) => {
      // Использование расширенных зависимостей
      const { analytics, authService, di } = deps;

      // Отправка аналитики
      if (analytics) {
        analytics.trackPageView(toState.name);
      }

      // Проверка аутентификации
      if (authService && !authService.isAuthenticated()) {
        deps.router.navigate('login');
        return;
      }

      // Использование стандартных зависимостей
      const useCase = di.get<LoadDataUsecase>(DI_TOKENS.USECASE_LOAD_DATA);
      await useCase.execute();
    },
  },
];
\`\`\`

### 5. Использование в viewCondition меню

\`\`\`typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'admin-panel',
    path: '/admin',
    menu: {
      text: 'admin:menu.title',
      viewCondition: (router) => {
        // Получаем зависимости
        const deps = router.getDependencies();
        const { authService } = deps;

        // Проверяем аутентификацию
        return authService?.isAuthenticated() ?? false;
      },
    },
    pageComponent: lazy(() => import('../view/AdminPage')),
  },
];
\`\`\`

## Полный пример

### Расширение интерфейсов

\`\`\`typescript
// libs/core/src/Router/interfaces.ts
import type { Route } from '@riogz/router';
import type { FunctionComponent, ReactNode } from 'react';
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];
  // Кастомные зависимости
  analytics?: AnalyticsService;
  authService?: AuthService;
}

export interface IRoute extends Route<RouterDependencies> {
  children?: IRoute[];
  menu?: IMenuConfig;
  pageComponent?: FunctionComponent;
  // Кастомные поля
  meta?: {
    requiresAuth?: boolean;
    requiredPermission?: string;
    analytics?: {
      category: string;
      action: string;
    };
  };
}
\`\`\`

### Модификация RouterPostHandler

\`\`\`typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log, type RouterDependencies } from '@platform/core';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthService } from '../services/AuthService';

export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // ... существующий код ...

    const appMenu =
      bootstrap.routerService.buildRoutesMenu(bootstrap.routerService.routes) ||
      [];

    // Устанавливаем базовые зависимости
    const baseDependencies: RouterDependencies = {
      di: bootstrap.di,
      menu: appMenu,
    };

    // Создаем дополнительные сервисы
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    // Устанавливаем расширенные зависимости
    bootstrap.routerService.router.setDependencies({
      ...baseDependencies,
      analytics,
      authService,
    } as RouterDependencies);

    return await super.handle(bootstrap);
  }
}
\`\`\`

### Использование в модуле

\`\`\`typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

export const routes: IRoutes = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/DashboardPage')),
    meta: {
      requiresAuth: true,
      analytics: {
        category: 'Navigation',
        action: 'Dashboard View',
      },
    },
    onEnterNode: async (toState, fromState, deps) => {
      const route = deps.router.getRoute(toState.name);
      const { analytics, authService, di } = deps;

      // Проверка аутентификации
      if (
        route?.meta?.requiresAuth &&
        authService &&
        !authService.isAuthenticated()
      ) {
        deps.router.navigate('login');
        return;
      }

      // Отправка аналитики
      if (route?.meta?.analytics && analytics) {
        analytics.track(
          route.meta.analytics.category,
          route.meta.analytics.action,
        );
      }
    },
  },
];
\`\`\`

## Важные замечания

1. **Модификация RouterPostHandler**: Расширение зависимостей выполняется прямо в \`RouterPostHandler\` после установки базовых зависимостей (\`di\`, \`menu\`).

2. **Опциональные зависимости**: Расширенные зависимости должны быть опциональными (\`?\`), так как они могут быть не установлены в некоторых случаях.

3. **Типизация**: При использовании расширенных зависимостей проверяйте их наличие, так как они опциональны.

4. **Сервисы**: Сервисы можно создавать в обработчике или получать из DI контейнера, если они там зарегистрированы.

5. **Гибкость**: Для большей гибкости можно использовать функцию \`extendRouterDependencies\` в \`IAppConfig\`, чтобы не модифицировать \`RouterPostHandler\` напрямую.


---

# Организация работы команд в монорепозитории

Руководство по организации эффективной командной разработки в MFP (Modular Frontend Platform) с использованием монорепозитория и Module Federation.

## Обзор подхода

MFP построена как **монорепозиторий** с поддержкой **независимой разработки модулей** разными командами. Каждая команда может работать над своим модулем, используя общую инфраструктуру платформы.

### Ключевые принципы

- **Изоляция команд**: Каждая команда работает в своем модуле
- **Общие ресурсы**: Библиотеки и инфраструктура разделяются между командами
- **Независимые релизы**: Модули могут деплоиться независимо
- **Единые стандарты**: Общие правила разработки и архитектуры

## Структура командной работы

### Гибкая организация модулей

MFP поддерживает различные стратегии организации модулей в зависимости от потребностей проекта и команд:

#### Организация по бизнес-доменам

\`\`\`
frontend-modules-mvvm/
├── packages/           # Модули по бизнес-доменам
│   ├── user-management/    # Команда авторизации
│   ├── catalog/            # Команда каталога
│   ├── orders/             # Команда заказов
│   └── analytics/          # Команда аналитики
├── libs/               # Общие библиотеки
│   ├── core/           # Команда платформы
│   ├── common/         # Команда платформы
│   ├── ui/             # Команда UI/UX
│   └── share/          # Совместные компоненты
└── host/               # Команда платформы
\`\`\`

#### Организация по ответственностям команд

\`\`\`
frontend-modules-mvvm/
├── packages/           # Модули по командам
│   ├── team-1/         # Команда 1
│   ├── team-2/         # Команда 2
│   ├── team-3/         # Команда 3
│   ├── team-4/         # Команда 4
├── libs/               # Общие библиотеки
│   ├── core/           # Команда платформы
│   ├── common/         # Команда платформы
│   ├── ui/             # Команда UI/UX
│   └── share/          # Совместные компоненты
└── host/               # Команда платформы
\`\`\`

#### Смешанная организация

\`\`\`
frontend-modules-mvvm/
├── packages/
│   ├── auth/               # Авторизация (один домен)
│   ├── catalog/            # Каталог товаров
│   │   ├── catalog-list/
│   │   ├── catalog-search/
│   │   └── catalog-admin/
│   ├── orders/             # Заказы
├── libs/               # Общие библиотеки
└── host/               # Хост-приложение
\`\`\`

### Выбор стратегии организации

| Стратегия       | Преимущества                                  | Недостатки                             | Когда использовать                            |
| --------------- | --------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| **По доменам**  | Четкая бизнес-логика, простая навигация       | Команды могут быть перегружены         | Маленькие команды, простая доменная модель    |
| **По командам** | Полная ответственность команды, независимость | Сложная навигация, пересечения доменов | Большие команды, сложная бизнес-логика        |
| **Смешанная**   | Гибкость, баланс нагрузки                     | Сложность управления                   | Средние команды, эволюционирующая архитектура |

#### Принципы организации модулей

- **Независимость**: Модули могут разрабатываться и деплоиться отдельно
- **Масштабируемость**: Структура должна расти с командой и проектом
- **Прозрачность**: Названия модулей должны отражать их назначение

### Распределение ответственности

| Команда           | Ответственность            | Модули/Библиотеки                     |
| ----------------- | -------------------------- | ------------------------------------- |
| **Платформа**     | Инфраструктура, CI/CD      | \`host/\`, \`libs/core/\`, \`libs/common/\` |
| **UI/UX**         | Дизайн-система, компоненты | \`libs/ui/\`                            |
| **Общие ресурсы** | Совместные компоненты      | \`libs/share/\`                         |
| **Авторизация**   | Пользователи, права        | \`packages/user-management/\`           |
| **Каталог**       | Товары, категории          | \`packages/catalog/\`                   |
| **Заказы**        | Корзина, оформление        | \`packages/orders/\`                    |
| **Аналитика**     | Метрики, отчеты            | \`packages/analytics/\`                 |

## Code Review и качество

### Автоматизированные проверки

\`\`\`bash
# Линтинг модуля
npm run lint:module -- my-feature

# Тестирование модуля
npm run test:module -- my-feature

\`\`\`

### Правила code review

#### Для модулей

- ✅ Соблюдение MVVM паттерна
- ✅ Использование DI контейнера
- ✅ Наличие тестов для бизнес-логики
- ✅ Документирование API

#### Для библиотек

- ✅ Экспорт через index.ts
- ✅ Типизация всех публичных API
- ✅ Отсутствие побочных эффектов в импортах

### Работа с git

Для организации командной разработки рекомендуется GitFlow подход. Это обеспечивает предсказуемый процесс разработки и безопасные релизы в монорепозитории с множеством команд.

#### Уровни GitFlow в монорепозитории

**Проектный уровень:**

- \`main\` — продакшен код всего проекта
- \`develop\` — интеграция всех фич от всех команд
- \`release/*\` — подготовка общих релизов
- \`hotfix/*\` — срочные исправления в продакшене

**Командный уровень:**
Команды могут организовывать свою работу по GitFlow внутри своих модулей, включая создание командных release веток:

\`\`\`
project/
├── main (общий продакшен)
├── develop (общая интеграция)
├── release/v1.2.0 (общий релиз проекта)
├── team-a/
│   ├── feature/team-a-feature-1
│   ├── feature/team-a-feature-2
│   └── release/team-a-v1.0.0 (релиз модулей команды A)
└── team-b/
    ├── feature/team-b-feature-1
    ├── feature/team-b-feature-2
    └── release/team-b-v2.1.0 (релиз модулей команды B)
\`\`\`

**Варианты организации разработки:**

**Вариант 1: Централизованный GitFlow (рекомендуется для небольших команд)**

- Все команды работают напрямую с общими ветками проекта
- Быстрая интеграция и простота координации
- Подходит для проектов с частыми релизами

**Вариант 2: Децентрализованный GitFlow (рекомендуется для больших команд)**

- Команды используют свои ветки для автономной разработки
- Интеграция происходит через командные release ветки
- Подходит для проектов со сложной релизной политикой

**Релизный процесс (децентрализованный вариант):**

1. Команды создают \`release/team-*-vX.X.X\` ветки для тестирования своих модулей
2. После успешного тестирования изменения сливаются в общую \`develop\` ветку

**Выбор подхода зависит от:**

- Размера команд и количества разработчиков
- Частоты релизов и сложности интеграции
- Требований к качеству и тестированию
- Корпоративных стандартов разработки

**Важно:** Независимо от выбранного подхода, все изменения команд обязательно попадают в общие \`main\` и \`develop\` ветки для поддержания актуальности всего проекта.

#### Основные ветки

| Ветка       | Назначение          | Создание от | Слияние в              |
| ----------- | ------------------- | ----------- | ---------------------- |
| \`main\`      | Продакшен код       | -           | -                      |
| \`develop\`   | Интеграция фич      | \`main\`      | \`main\` (через release) |
| \`feature/*\` | Разработка фич      | \`develop\`   | \`develop\`              |
| \`release/*\` | Подготовка релиза   | \`develop\`   | \`main\`, \`develop\`      |
| \`hotfix/*\`  | Срочные исправления | \`main\`      | \`main\`, \`develop\`      |

#### Правила коммитов

Используйте Conventional Commits:

\`\`\`
feat: add new user authentication module
fix: resolve memory leak in data loader
docs: update API documentation
refactor: simplify component architecture
chore: update dependencies to latest versions
\`\`\`

#### Code Review процесс

1. **Pull Request** создается в ветку \`develop\`
2. **Обязательные проверки:**
   - CI/CD пайплайн прошел
   - Линтинг и тесты пройдены
   - Code review от минимум 1 разработчика
3. **Merge** только через "Squash and merge" для чистой истории
4. **Удаление** feature веток после мерджа

`;

/**
 * Страница документации: How-To.
 *
 * @component
 */
const HowToPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.howTo')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default HowToPage;
