import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const DOC_PLATFORM_ROUTES = {
  HOME: 'doc-platform',
  ARCHITECTURE: 'doc-platform.architecture',
  GETTING_STARTED: 'doc-platform.getting-started',
  PROJECT_STRUCTURE: 'doc-platform.project-structure',
  BOOTSTRAP: 'doc-platform.bootstrap',
  MODULES: 'doc-platform.modules',
  LIBS: 'doc-platform.libs',
  MECHANICS: 'doc-platform.mechanics',
  TOOLS: 'doc-platform.tools',
  HOW_TO: 'doc-platform.how-to',
  DEPLOYMENT: 'doc-platform.deployment',
};

export const routes: IRoutes = [
  {
    name: 'doc-platform',
    path: '/doc-platform',
    menu: {
      text: 'doc-platform:menu.doc-platform',
      sortOrder: 10000,
    },
    browserTitle: 'Документация',
    pageComponent: lazy(() => import('../view/pages/HomePage')),
    children: [
      {
        name: 'architecture',
        path: '/architecture',
        menu: {
          text: 'doc-platform:menu.architecture',
          sortOrder: 1,
        },
        browserTitle: 'Архитектура',
        pageComponent: lazy(() => import('../view/pages/ArchitecturePage')),
      },
      {
        name: 'getting-started',
        path: '/getting-started',
        menu: {
          text: 'doc-platform:menu.getting-started',
          sortOrder: 2,
        },
        browserTitle: 'Начало работы',
        pageComponent: lazy(() => import('../view/pages/GettingStartedPage')),
      },
      {
        name: 'project-structure',
        path: '/project-structure',
        menu: {
          text: 'doc-platform:menu.project-structure',
          sortOrder: 3,
        },
        browserTitle: 'Структура проекта',
        pageComponent: lazy(() => import('../view/pages/ProjectStructurePage')),
      },
      {
        name: 'bootstrap',
        path: '/bootstrap',
        menu: {
          text: 'doc-platform:menu.bootstrap',
          sortOrder: 4,
        },
        browserTitle: 'Bootstrap',
        pageComponent: lazy(() => import('../view/pages/BootstrapPage')),
      },
      {
        name: 'modules',
        path: '/modules',
        menu: {
          text: 'doc-platform:menu.modules',
          sortOrder: 5,
        },
        browserTitle: 'Модули',
        pageComponent: lazy(() => import('../view/pages/ModulesPage')),
      },
      {
        name: 'libs',
        path: '/libs',
        menu: {
          text: 'doc-platform:menu.libs',
          sortOrder: 6,
        },
        browserTitle: 'Библиотеки',
        pageComponent: lazy(() => import('../view/pages/LibsPage')),
      },
      {
        name: 'mechanics',
        path: '/mechanics',
        menu: {
          text: 'doc-platform:menu.mechanics',
          sortOrder: 7,
        },
        browserTitle: 'Механики',
        pageComponent: lazy(() => import('../view/pages/MechanicsPage')),
      },
      {
        name: 'tools',
        path: '/tools',
        menu: {
          text: 'doc-platform:menu.tools',
          sortOrder: 8,
        },
        browserTitle: 'Инструменты',
        pageComponent: lazy(() => import('../view/pages/ToolsPage')),
      },
      {
        name: 'how-to',
        path: '/how-to',
        menu: {
          text: 'doc-platform:menu.how-to',
          sortOrder: 9,
        },
        browserTitle: 'How-to',
        pageComponent: lazy(() => import('../view/pages/HowToPage')),
      },
      {
        name: 'deployment',
        path: '/deployment',
        menu: {
          text: 'doc-platform:menu.deployment',
          sortOrder: 10,
        },
        browserTitle: 'Деплой',
        pageComponent: lazy(() => import('../view/pages/DeploymentPage')),
      },
    ],
  },
];
