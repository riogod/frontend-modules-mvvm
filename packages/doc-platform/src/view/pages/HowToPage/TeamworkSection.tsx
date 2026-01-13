import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const TeamworkSection: FC = () => (
  <DocSection title="Teamwork">
    <DocSection title="Монорепозиторий">
      <p>MFP - монорепозиторий с независимой разработкой модулей.</p>
      <DocList
        items={[
          'Несколько модулей в одном репозитории',
          'Общие библиотеки и конфигурации',
          'npm workspaces для управления зависимостями',
          'Module Federation для распределенной сборки',
        ]}
      />
    </DocSection>
    <DocSection title="Организация команд">
      <DocList
        items={[
          'По домену: каждая команда отвечает за свой домен (catalog, orders, etc.)',
          'По командам: каждая команда работает над своим набором модулей',
          'Смешанный подход: комбинация доменов и команд',
        ]}
      />
    </DocSection>
    <DocSection title="GitFlow">
      <p>Рекомендуемый Git workflow:</p>
      <DocCodeBlock
        code={`main         # Продуктивная ветка
  develop      # Ветка разработки
  feature/*    # Фичи
  hotfix/*     # Исправления для production
  release/*    # Подготовка релиза`}
        language="text"
      />
    </DocSection>
    <DocSection title="Централизованная разработка">
      <p>Преимущества:</p>
      <DocList
        items={[
          'Единая кодовая база',
          'Простое разделение кода',
          'Общие инструменты и конфигурации',
          'Легкий контроль версий',
        ]}
      />
      <p>Недостатки:</p>
      <DocList
        items={[
          'Медленные билды',
          'Сложные merge конфликты',
          'Рост кодовой базы',
        ]}
      />
    </DocSection>
    <DocSection title="Децентрализованная разработка">
      <p>Преимущества:</p>
      <DocList
        items={[
          'Независимый деплой модулей',
          'Быстрые билды',
          'Четкое разделение ответственности',
        ]}
      />
      <p>Недостатки:</p>
      <DocList
        items={['Сложное управление зависимостями', 'Дублирование кода']}
      />
    </DocSection>
    <DocSection title="Code Review">
      <p>Правила code review:</p>
      <DocCodeBlock
        code={`✅ Что проверять:
- Соответствие MVVM паттерну
- Использование DI для зависимостей
- Наличие тестов
- Документация сложного кода
- Соблюдение конвенций именования
- Отсутствие прямых импортов между модулями

✅ Что НЕ делать:
- Не делайте review без понимания контекста
- Не игнорируйте комментарии
- Не ревьювьте только форматирование
- Не лейте без одобрения

✅ Размер PR:
- Идеальный размер: 200-400 строк
- Максимум: 1000 строк
- Большие PR разбивайте на части`}
        language="text"
      />
    </DocSection>
    <DocSection title="Conventional Commits">
      <p>Используйте формат конвенциональных коммитов:</p>
      <DocCodeBlock
        code={`<type>(<scope>): <subject>

<body>

<footer>

# Types
feat:     Новая функциональность
fix:       Исправление бага
docs:      Изменения в документации
style:     Форматирование, отступы
refactor:  Рефакторинг без изменений функциональности
test:      Добавление или изменение тестов
chore:     Обновление инструментов, конфигураций
perf:      Улучшение производительности
ci:        Изменения CI/CD
build:     Изменения в системе сборки

# Примеры
feat(todo): add task filtering feature

fix(auth): resolve login issue with special characters

docs(readme): update installation instructions

refactor(core): extract common validation logic

test(todos): add unit tests for TodoListModel

chore(deps): update dependencies to latest versions`}
        language="text"
      />
    </DocSection>
    <DocSection title="Совместная работа над модулями">
      <p>Рекомендации:</p>
      <DocList
        items={[
          'Используйте feature branches',
          'Создавайте PR для каждой фичи',
          'Просите review у владельца модуля',
          'Автоматизируйте проверки (CI)',
          'Используйте автоматические тесты',
        ]}
      />
    </DocSection>
    <DocSection title="Разрешение конфликтов">
      <DocCodeBlock
        code={`# Конфликт в package.json
{
  "workspaces": [
    "libs/*",
    "packages/*"
  ]
<<<<<<< HEAD
    "new-modules/*"
=======
    "modules/*"
>>>>>>> feature-branch
}

# Разрешите конфликт и выберите нужное значение`}
        language="json"
      />
      <p>Для Module Federation конфликтов:</p>
      <DocCodeBlock
        code={`// vite.config.mts
// Версии зависимостей должны совпадать
export default {
  shared: {
    react: { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  },
};`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Коммуникация">
      <p>Инструменты для командной работы:</p>
      <DocList
        items={[
          'GitHub / GitLab - хостинг кода и PR',
          'Slack / Mattermost - коммуникация',
          'Jira / Linear - управление задачами',
          'Confluence / Notion - документация',
          'Figma / Sketch - дизайн',
        ]}
      />
    </DocSection>
    <DocNote type="info" title="Best Practices">
      <DocList
        items={[
          'Используйте GitFlow для workflow',
          'Следуйте Conventional Commits',
          'Делайте code review для каждого PR',
          'Разбивайте большие задачи на меньшие',
          'Автоматизируйте проверки в CI',
          'Документируйте сложные решения',
        ]}
      />
    </DocNote>
  </DocSection>
);
