# Создание сервиса манифестов

Сервис манифестов предоставляет стартовую информацию для приложения: список модулей, feature flags, permissions и серверные параметры.

## Эндпоинт

**Метод:** `GET`  
**Путь:** `/app/start`

## Контракт ответа

### Структура ответа

```typescript
interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
    params?: Record<string, unknown>;
    modules?: ModuleManifestEntry[];
  };
}
```

### Поля ответа

| Поле          | Тип                       | Обязательно | Описание                                    |
| ------------- | ------------------------- | ----------- | ------------------------------------------- |
| `status`      | `string`                  | Да          | Статус ответа (обычно `"ok"` или `"error"`) |
| `data`        | `object`                  | Да          | Данные ответа                               |
| `features`    | `Record<string, boolean>` | Да          | Feature flags пользователя                  |
| `permissions` | `Record<string, boolean>` | Да          | Permissions пользователя                    |
| `params`      | `Record<string, unknown>` | Нет         | Серверные параметры                         |
| `modules`     | `ModuleManifestEntry[]`   | Нет         | Список модулей для загрузки                 |

### Структура модуля

```typescript
interface ModuleManifestEntry {
  name: string; // Обязательно
  loadType: 'init' | 'normal'; // Обязательно
  loadPriority?: number; // Опционально, по умолчанию 1
  remoteEntry: string; // Обязательно (пустая строка для локальных)
  dependencies?: string[]; // Опционально
  featureFlags?: string[]; // Опционально
  accessPermissions?: string[]; // Опционально
}
```

### Поля модуля

| Поле                | Тип                  | Обязательно | Описание                                                          |
| ------------------- | -------------------- | ----------- | ----------------------------------------------------------------- |
| `name`              | `string`             | Да          | Уникальное имя модуля (например, `"todo"`, `"api_example"`)       |
| `loadType`          | `'init' \| 'normal'` | Да          | Тип загрузки: `init` — при старте, `normal` — после инициализации |
| `loadPriority`      | `number`             | Нет         | Приоритет загрузки (меньше = выше приоритет), по умолчанию `1`    |
| `remoteEntry`       | `string`             | Да          | URL для remote модулей или пустая строка для локальных            |
| `dependencies`      | `string[]`           | Нет         | Список имен модулей, от которых зависит текущий модуль            |
| `featureFlags`      | `string[]`           | Нет         | Feature flags, при отсутствии которых модуль не загружается       |
| `accessPermissions` | `string[]`           | Нет         | Permissions, при отсутствии которых модуль не загружается         |

## Пример ответа

```json
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
```

## Валидация модулей

### Обязательные проверки

1. **Структура ответа**
   - Поле `status` должно быть строкой
   - Поле `data` должно быть объектом
   - Поля `features` и `permissions` должны быть объектами `Record<string, boolean>`

2. **Валидация модулей**
   - `name` — непустая строка, уникальное в рамках массива
   - `loadType` — строго `"init"` или `"normal"`
   - `remoteEntry` — строка (может быть пустой для локальных модулей)
   - `loadPriority` — положительное число, если указано
   - `dependencies` — массив строк, если указано
   - `featureFlags` — массив строк, если указано
   - `accessPermissions` — массив строк, если указано

3. **Валидация зависимостей**
   - Все модули из `dependencies` должны присутствовать в массиве `modules`
   - Запрещены циклические зависимости
   - Модуль не может зависеть от самого себя

4. **Валидация remoteEntry**
   - Для `loadType: "normal"` с непустым `remoteEntry` — URL должен быть валидным
   - Для локальных модулей (`remoteEntry === ""`) — модуль должен существовать локально

## Что учесть при реализации

### 1. Кеширование

- Ответ должен быть актуальным на момент запроса
- Рекомендуется кешировать на короткое время (30-60 секунд)
- При изменении feature flags или permissions кеш должен инвалидироваться

### 2. Персонализация данных

- `features` и `permissions` должны соответствовать текущему пользователю
- Если пользователь не авторизован, верните пустые объекты или базовые значения

### 3. Фильтрация модулей

- Возвращайте только модули, доступные текущему пользователю
- Учитывайте feature flags и permissions при формировании списка модулей
- Не включайте модули, для которых не выполнены условия загрузки
- Рекомендуется проверять зависимости на циклы и устанавливать порядок loadPriority в соответствии с постоенным деревом зависимостей

### 4. Формат remoteEntry

Для remote модулей `remoteEntry` должен быть полным URL:

```
https://cdn.example.com/modules/{moduleName}/{version}/assets/remoteEntry.js
```

Для локальных модулей используйте пустую строку:

```
""
```

### 5. Обработка ошибок

- При ошибке верните статус `"error"` и описание в `data`:

```json
{
  "status": "error",
  "error": {
    "message": "Failed to load modules",
    "code": "GEN_FAILED"
  }
}
```

- Клиент обработает ошибку и продолжит работу с fallback (пустым списком модулей)

### 6. Версионирование модулей

- Поле `version` опционально, но рекомендуется для отслеживания
- Формат версии: семантическое версионирование (`"1.0.0"`) или `"latest"`

### 7. Приоритеты загрузки

- `loadPriority` определяет порядок загрузки модулей
- Меньшее значение = выше приоритет
- По умолчанию используется `1`

### 8. Условия загрузки

Модуль загружается только если:

- Все `featureFlags` присутствуют в `data.features` со значением `true`
- Все `accessPermissions` присутствуют в `data.permissions` со значением `true`
- Все `dependencies` загружены успешно

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
