import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const RoutingSection: FC = () => (
  <DocSection title="Routing">
    <DocSection title="Расширение IRoute">
      <p>Добавьте кастомные поля к маршруту:</p>
      <DocCodeBlock
        code={`// config/routing.ts
import type { IRoute } from '@platform/core';

declare module '@platform/core' {
  interface IRoute {
    // ✅ Кастомные поля
    icon?: React.ReactNode;
    badge?: number | string;
    viewCondition?: () => boolean;
    meta?: {
      title: string;
      description: string;
    };
  }
}

export const routes: IRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/pages/DashboardPage')),
    icon: <DashboardIcon />,
    badge: 'NEW',
    meta: {
      title: 'Dashboard',
      description: 'Main dashboard page',
    },
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Расширение RouterDependencies">
      <p>Добавьте кастомные зависимости в RouterPostHandler:</p>
      <DocCodeBlock
        code={`// host/src/bootstrap/handlers/router-post.handler.ts
import { type RouterDependencies } from '@platform/core';

declare module '@platform/core' {
  interface RouterDependencies {
    // ✅ Кастомные зависимости
    customService?: CustomService;
    myData?: MyData;
  }
}

// В RouterPostHandler
export class RouterPostHandler implements IBootstrapHandler {
  async handle(params: BootstrapParams, next: HandlerNext): Promise<BootstrapResult> {
    const result = await next(params);

    // ✅ Добавляем кастомные зависимости
    return {
      ...result,
      routerDependencies: {
        ...result.routerDependencies,
        customService: new CustomService(),
      },
    };
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Использование в onEnterNode">
      <p>Получите доступ к кастомным зависимостям:</p>
      <DocCodeBlock
        code={`// config/routes.ts
export const routes: IRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/pages/DashboardPage')),

    // ✅ onEnterNode с кастомными зависимостями
    onEnterNode: async (_toState, _fromState, deps) => {
      const { customService } = deps.routerDependencies || {};

      if (customService) {
        await customService.initialize();
      }
    },
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Использование в onExitNode">
      <p>Очистка ресурсов при выходе из маршрута:</p>
      <DocCodeBlock
        code={`export const routes: IRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/pages/DashboardPage')),

    onExitNode: async (_toState, _fromState, deps) => {
      const { customService } = deps.routerDependencies || {};

      if (customService) {
        customService.cleanup();
      }
    },
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="viewCondition для меню">
      <p>Условное отображение пункта меню:</p>
      <DocCodeBlock
        code={`import { GetFeatureFlagUsecase } from '@platform/common';

// ViewModel
@injectable()
export class MenuViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
  ) {}

  canShowDashboard(): boolean {
    return this.getFeatureFlagUsecase.execute('dashboard.enabled');
  }
}

// Routes
export const routes: IRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/pages/DashboardPage')),
    menu: {
      text: 'dashboard:menu.title',
      viewCondition: () => {
        const di = useDI();
        const menuVM = di.get<MenuViewModel>('MenuViewModel');
        return menuVM.canShowDashboard();
      },
    },
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Динамические маршруты">
      <p>Создавайте маршруты динамически:</p>
      <DocCodeBlock
        code={`// config/routes.ts
export const createDynamicRoutes = (entities: Entity[]): IRoute[] => {
  return entities.map((entity) => ({
    name: entity.name,
    path: \`/\${entity.name}\`,
    pageComponent: lazy(() => import('../view/pages/EntityPage')),
    meta: {
      title: entity.title,
      description: entity.description,
    },
  }));
};

export const routes: IRoute[] = [
  ...staticRoutes,
  ...createDynamicRoutes(entities),
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Вложенные маршруты">
      <DocCodeBlock
        code={`export const routes: IRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/pages/DashboardPage')),

    // ✅ Дочерние маршруты
    children: [
      {
        name: 'dashboard-stats',
        path: '/dashboard/stats',
        pageComponent: lazy(() => import('../view/pages/DashboardStatsPage')),
      },
      {
        name: 'dashboard-settings',
        path: '/dashboard/settings',
        pageComponent: lazy(() => import('../view/pages/DashboardSettingsPage')),
      },
    ],
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Параметры маршрута">
      <DocCodeBlock
        code={`export const routes: IRoute[] = [
  {
    name: 'todo-detail',
    path: '/todo/:id', // ✅ Параметр маршрута
    pageComponent: lazy(() => import('../view/pages/TodoDetailPage')),

    onEnterNode: async (toState, _fromState, deps) => {
      const { id } = toState.params; // ✅ Получение параметра

      const container = deps.di;
      const loadTodoUsecase = container.get<LoadTodoUsecase>(
        TODO_DI_TOKENS.USECASE_LOAD_TODO,
      );

      await loadTodoUsecase.execute(id);
    },
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Query параметры">
      <DocCodeBlock
        code={`// В View
import { useSearchParams } from '@platform/ui';

const TodoListPage = observer(() => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const filter = searchParams.get('filter') || 'all';

  const changePage = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), filter });
  };

  return (
    <div>
      <TodoList page={page} filter={filter} />
      <Pagination
        page={page}
        onChange={changePage}
      />
    </div>
  );
});`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Best Practices">
      <DocList
        items={[
          'Используйте lazy() для компонентов страниц',
          'Загружайте данные в onEnterNode',
          'Очищайте данные в onExitNode',
          'Используйте viewCondition для условного меню',
          'Типизируйте кастомные поля в declare module',
        ]}
      />
    </DocNote>
  </DocSection>
);
