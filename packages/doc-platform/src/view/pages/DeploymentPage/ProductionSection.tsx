import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const ProductionSection: FC = () => (
  <DocSection title="Production">
    <DocSection title="Quick Start">
      <DocCodeBlock
        code={`# Сборка проекта
npm run build:all

# Предпросмотр production сборки
npm run preview

# Деплой содержимого dist/ на сервер`}
        language="bash"
      />
    </DocSection>
    <DocSection title="Оптимизации">
      <p>Tree Shaking:</p>
      <DocCodeBlock
        code={`// ✅ Используйте named exports
export const myFunction = () => {};

// ❌ Не используйте re-export all
export * from './module';

// ✅ При импорте
import { myFunction } from './module';

// ❌ Не импортируйте всё
import * as module from './module';`}
        language="typescript"
      />
      <p>Code Splitting:</p>
      <DocCodeBlock
        code={`// ✅ Автоматическое разделение кода через lazy()
const LazyComponent = lazy(() => import('./LazyComponent'));

// ✅ Разделение маршрутов
export const routes = [
  {
    path: '/page',
    pageComponent: lazy(() => import('./view/pages/Page')),
  },
];`}
        language="typescript"
      />
      <p>CSS Isolation:</p>
      <DocCodeBlock
        code={`// ✅ Используйте короткие уникальные имена классов
const StyledCard = styled('div')({
  className: 'card-abc123', // Короткий уникальный класс
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="removeDevFieldsPlugin">
      <p>Плагин автоматически удаляет dev-only поля из production сборки:</p>
      <DocList
        items={[
          'mockHandlers - обработчики MSW',
          'mockModuleInfo - информация о модуле для DEV',
          'mockModuleData - мок-данные для DEV',
        ]}
      />
    </DocSection>
    <DocSection title="Environment Variables">
      <DocCodeBlock
        code={`# .env.production
VITE_API_URL=https://api.example.com
VITE_APP_PREFIX=/my-app
LOG_LEVEL=ERROR

# Доступ к переменным в коде
const apiUrl = import.meta.env.VITE_API_URL;
const appPrefix = import.meta.env.VITE_APP_PREFIX;`}
        language="bash"
      />
      <p>Уровни логирования:</p>
      <DocCodeBlock
        code={`LOG_LEVEL=ERROR    # Только ошибки
LOG_LEVEL=WARN     # Ошибки и предупреждения
LOG_LEVEL=INFO     # Информационные сообщения
LOG_LEVEL=DEBUG    # Отладочная информация
LOG_LEVEL=TRACE    # Полный трейс`}
        language="text"
      />
    </DocSection>
    <DocSection title="Checklist перед деплоем">
      <DocCodeBlock
        code={`✅ Тесты проходят
✅ Lint проверка прошла успешно
✅ Сборка завершена без ошибок
✅ Preview режим работает корректно
✅ Размер бандла проверен
✅ Environment variables настроены
✅ LOG_LEVEL установлен в ERROR или WARN
✅ API endpoints указывают на production сервер
✅ VITE_APP_PREFIX установлен если нужен подкаталог
✅ Source maps отключены (sourcemap: false)`}
        language="text"
      />
    </DocSection>
    <DocSection title="Общие проблемы">
      <p>Большой размер бандла:</p>
      <DocCodeBlock
        code={`// ❌ Не импортируйте напрямую из MUI
import { Button } from '@mui/material';

// ✅ Импортируйте через @platform/ui
import { Button } from '@platform/ui';

// ✅ Используйте named exports
import { Button } from '@platform/ui';
// Вместо
import UI from '@platform/ui';`}
        language="typescript"
      />
      <p>Дублирование зависимостей:</p>
      <DocCodeBlock
        code={`// vite.config.mts - Module Federation
export default {
  module: {
    rules: [/* ... */],
  },
  plugins: [
    federation({
      shared: {
        // ✅ Используйте singleton: true и единую версию
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
      },
    }),
  ],
};`}
        language="typescript"
      />
      <p>Source maps в production:</p>
      <DocCodeBlock
        code={`// vite.config.mts
export default defineConfig({
  build: {
    sourcemap: false, // ✅ Отключить source maps для production
  },
});`}
        language="typescript"
      />
      <p>Конфликты CSS:</p>
      <DocCodeBlock
        code={`// ✅ Используйте CSS Modules или sx prop
import { styled } from '@mui/material';

const StyledComponent = styled('div')({
  padding: 16,
  // Уникальные классы создаются автоматически
});

// Или используйте sx prop
<Box sx={{ padding: 16 }} />`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="warning" title="Важно">
      Всегда проверяйте preview режим перед деплоем. Убедитесь, что все маршруты
      и API запросы работают корректно.
    </DocNote>
  </DocSection>
);
