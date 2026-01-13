import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList } from '../../common';

export const ModuleConfigSection: FC = () => (
  <DocSection title="Конфигурация модуля">
    <DocSection title="Структура module_config.ts">
      <DocCodeBlock
        code={`import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { DI_CONFIG } from './di.config';
import { handlers } from './mocks';
import en from './i18n/en_my-module.json';
import ru from './i18n/ru_my-module.json';

export default {
  // ✅ Маршруты модуля (обязательно функция)
  ROUTES: () => routes,

  // ✅ Инициализация модуля
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },

  // ✅ Регистрация переводов
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'my-module', en);
    i18n.addResourceBundle('ru', 'my-module', ru);
  },

  // ✅ MSW handlers для моков (опционально)
  mockHandlers: handlers,

  // ✅ Информация о модуле (обязательно для MFE)
  mockModuleInfo: {
    name: 'my-module',
    loadType: 'normal', // 'init' | 'normal'
    loadPriority: 10,
    dependencies: ['auth'],
    featureFlags: ['my-module.enabled'],
    accessPermissions: ['my-module.access'],
  },

  // ✅ Мок-данные для DEV режима (опционально)
  mockModuleData: {
    features: { 'my-module.enabled': true },
    permissions: { 'my-module.access': true },
    params: { 'my-module.api-url': 'https://api.example.com' },
  },
} as ModuleConfig;`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="ROUTES">
      <DocList
        items={[
          'Всегда функция `() => routes`, не просто `routes`',
          'Используйте `lazy()` для компонентов страниц',
          'Можно оставить пустым `ROUTES: () => []` для модуля без маршрутов',
        ]}
      />
    </DocSection>
    <DocSection title="I18N">
      <DocList
        items={[
          'Namespace должен совпадать с именем модуля',
          'Используйте ключи вида `module.key`',
          'Поддержка множественного числа через `_count`',
        ]}
      />
      <DocCodeBlock
        code={`// ru_my-module.json
{
  "menu": {
    "title": "Мой модуль"
  },
  "items_count": "Элементов: {{count}}",
  "items_count_plural": {
    "one": "{{count}} элемент",
    "few": "{{count}} элемента",
    "many": "{{count}} элементов"
  }
}`}
        language="json"
      />
    </DocSection>
    <DocSection title="mockModuleInfo">
      <p>Обязателен для MFE модулей, не нужен для Local модулей.</p>
      <DocList
        items={[
          'name - уникальное имя модуля',
          'loadType - `init` или `normal`',
          'loadPriority - приоритет загрузки (чем меньше, тем выше)',
          'dependencies - массив модулей, от которых зависит',
          'featureFlags - фичи, которые должны быть включены',
          'accessPermissions - права доступа',
        ]}
      />
    </DocSection>
    <DocSection title="Routes configuration">
      <DocCodeBlock
        code={`// routes.ts
export const routes: IRoutes = [
  {
    name: 'todo',
    path: '/todo',
    pageComponent: lazy(() => import('../view/pages/TodoPage')),
    menu: {
      text: 'todo:menu.title',
      icon: <CheckCircleIcon />,
    },
    browserTitle: 'Todo List',

    // ✅ Загрузка данных при входе
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      await container
        .get<LoadTaskListUsecase>(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST)
        .execute();
    },

    // ✅ Очистка при выходе
    onExitNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<DisposeTaskListUsecase>(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
        .execute();
    },

    // ✅ Дочерние маршруты
    children: [
      {
        name: 'todo-detail',
        path: '/todo/:id',
        pageComponent: lazy(() => import('../view/pages/TodoDetailPage')),
      },
    ],
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="DI Configuration">
      <DocCodeBlock
        code={`// di.config.ts
import { Container } from 'inversify';
import { TODO_DI_TOKENS } from './di.tokens';
import { TodoListModel } from '../models/todo_list.model';
import { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { AddTaskUsecase } from '../usecases/add_task.usecase';
import { TodoRepository } from '../data/todo.repository';

export const DI_CONFIG = (container: Container): Container => {
  // Model как singleton
  container
    .bind(TODO_DI_TOKENS.MODEL_TODO_LIST)
    .to(TodoListModel)
    .inSingletonScope();

  // ViewModel без scope
  container.bind(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST).to(TodoListViewModel);

  // Use Cases без scope
  container.bind(TODO_DI_TOKENS.USECASE_ADD_TASK).to(AddTaskUsecase);

  // Repository без scope
  container.bind(TODO_DI_TOKENS.REPOSITORY_TODO).to(TodoRepository);

  return container;
};`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Расширение ModuleConfig">
      <DocCodeBlock
        code={`// ✅ Расширение интерфейса
declare module '@platform/core' {
  interface ModuleConfig {
    // ✅ Кастомные поля
    customField?: string;
    customMethod?: () => void;
  }
}

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },
  // ✅ Использование кастомных полей
  customField: 'value',
  customMethod: () => {
    console.log('Custom method');
  },
} as ModuleConfig;`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
