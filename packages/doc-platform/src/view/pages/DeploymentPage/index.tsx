import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# CI/CD

Руководство по настройке непрерывной интеграции и развертывания для проекта.

---

## Обзор

CI/CD pipeline включает:

1. **Lint** — проверка кода ESLint
2. **Test** — запуск тестов Vitest
3. **Build** — сборка модулей и host
4. **Deploy** — развертывание на сервер

\`\`\`
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Lint   │ -> │   Test   │ -> │  Build   │ -> │  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
\`\`\`


---

# Подготовка к продакшену

Руководство по оптимизации приложения для production-окружения.

---

## Быстрый старт

\`\`\`bash
# Собрать всё
npm run build:all

# Предпросмотр
npm run preview
\`\`\`

> Детали сборки смотрите в разделе Сборка проекта

---

## Оптимизации

### Tree Shaking

Vite автоматически выполняет tree shaking. Для улучшения:

\`\`\`javascript
// ✅ Правильно — именованные экспорты
export { Button } from './Button';
export { Input } from './Input';

// ❌ Неправильно — re-export всего
export * from './components';
\`\`\`

### Code Splitting

Модули автоматически разбиваются на чанки:

\`\`\`javascript
rollupOptions: {
  output: {
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    assetFileNames: '[name]-[hash][extname]',
  },
}
\`\`\`

### CSS изоляция

В production генерируются короткие уникальные имена классов:

\`\`\`
Development: todo__button
Production:  todo_button_a1b2c
\`\`\`

### Удаление dev-полей

Плагин \`removeDevFieldsPlugin\` автоматически удаляет из production:

- \`mockHandlers\` — MSW handlers
- \`mockModuleInfo\` — dev-манифест
- \`mockModuleData\` — mock данные

---

## Переменные окружения

### .env.production

\`\`\`bash
VITE_APP_PREFIX=/app/
VITE_API_URL=https://api.example.com
\`\`\`

### Использование

\`\`\`typescript
const apiUrl = import.meta.env.VITE_API_URL;
const appPrefix = import.meta.env.VITE_APP_PREFIX;
\`\`\`

### LOG_LEVEL

| Уровень | Описание                   |
| ------- | -------------------------- |
| \`ERROR\` | Только ошибки              |
| \`WARN\`  | Ошибки и предупреждения    |
| \`INFO\`  | + информационные сообщения |
| \`DEBUG\` | + отладочная информация    |
| \`TRACE\` | Всё                        |

\`\`\`bash
LOG_LEVEL=ERROR npm run build:host
\`\`\`

---

## Prefix приложения

Для деплоя в поддиректорию:

\`\`\`bash
# .env.production
VITE_APP_PREFIX=/my-app/
\`\`\`

Vite автоматически добавит префикс ко всем путям ассетов.

---

## Чеклист перед деплоем

### Качество кода

- [ ] Все тесты проходят: \`npm run test\`
- [ ] Линтинг без ошибок: \`npm run lint\`

### Сборка

- [ ] Production сборка успешна: \`npm run build:all\`
- [ ] Предпросмотр работает: \`npm run preview\`
- [ ] Проверен размер бандла

### Конфигурация

- [ ] Переменные окружения настроены
- [ ] \`LOG_LEVEL\` установлен в \`ERROR\` или \`WARN\`
- [ ] API endpoints указывают на production
- [ ] \`VITE_APP_PREFIX\` настроен (если нужен)

---

## Типичные проблемы

### Большой размер бандла

**Причина**: Импорт всей библиотеки.

\`\`\`typescript
// ❌ Импортирует всю библиотеку
import { Button } from '@mui/material';

// ✅ Используйте @platform/ui
import { Button } from '@platform/ui';
\`\`\`

### Дублирование зависимостей

**Причина**: Разные версии библиотек в модулях.

**Решение**: \`singleton: true\` в shared конфигурации и единая версия в корневом \`package.json\`.

### Source maps

По умолчанию source maps включены для host. Для отключения:

\`\`\`javascript
build: {
  sourcemap: false,
}
\`\`\`

### CSS конфликты

**Решение**: CSS Modules или MUI \`sx\` prop. ESLint правило \`platform/no-global-css\` предотвращает глобальные стили.

`;

/**
 * Страница документации: Развертывание.
 *
 * @component
 */
const DeploymentPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.deployment')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default DeploymentPage;
