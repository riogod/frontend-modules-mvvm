import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocFileTree, DocList } from '../../../common';

export const LibsSection: FC = () => (
  <DocSection title="libs/ — Библиотеки платформы" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Библиотеки предоставляют инфраструктурный код, переиспользуемый хостом и
      модулями.
    </Typography>

    <DocFileTree
      tree={`libs/
├── core/       # Базовая инфраструктура
├── common/     # Общие модели и usecases
├── ui/         # UI-компоненты и хуки
└── share/      # Библиотека для шаринга сущностей`}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      libs/core/
    </Typography>
    <Typography variant="body2" paragraph>
      Базовая инфраструктура платформы:
    </Typography>
    <DocFileTree
      tree={`core/src/
├── APIClient/          # HTTP-клиент на базе axios
│   ├── APIClient.ts    # Основной класс
│   ├── AbortControllerStorage.ts  # Управление отменой запросов
│   └── UrlNormalizer.ts  # Нормализация URL
├── Logger/             # Система логирования
├── ModuleInterfaces/   # Интерфейсы модулей
├── Router/             # Типы роутинга
└── index.ts            # Экспорт + IOC_CORE_TOKENS`}
    />
    <Typography variant="body2" fontWeight="bold" gutterBottom sx={(theme) => ({ mt: theme.spacing(1) })}>
      Экспортирует:
    </Typography>
    <DocList
      items={[
        'APIClient — HTTP-клиент с поддержкой отмены запросов',
        'log — логгер с уровнями и префиксами',
        'IOC_CORE_TOKENS — Системные токены для DI-контейнера',
        'Типы для роутинга и модулей',
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      libs/common/
    </Typography>
    <Typography variant="body2" paragraph>
      Общие бизнес-сущности:
    </Typography>
    <DocFileTree
      tree={`common/src/
├── models/
│   └── access_control/     # Модель контроля доступа
│       ├── accessControl.model.ts
│       └── accessControl.interface.ts
└── usecases/
    ├── featureFlag/        # Работа с feature flags
    └── permission/         # Работа с разрешениями`}
    />
    <Typography variant="body2" fontWeight="bold" gutterBottom sx={(theme) => ({ mt: theme.spacing(1) })}>
      Экспортирует:
    </Typography>
    <DocList
      items={[
        'AccessControlModel — управление feature flags и permissions',
        'Use cases для работы с флагами и разрешениями',
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      libs/ui/
    </Typography>
    <Typography variant="body2" paragraph>
      UI-компоненты и React-утилиты:
    </Typography>
    <DocFileTree
      tree={`ui/src/
├── components/         # UI-компоненты
│   ├── ui/            # Базовые компоненты
│   └── utils/         # Утилитарные компоненты
├── hooks/
│   ├── useVM.ts       # Получение ViewModel из DI
│   └── useSharedComponent/  # Хук для shared компонентов
├── providers/
│   └── DIProvider.tsx  # React-провайдер для DI
└── theme/              # Темы MUI`}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      libs/share/
    </Typography>
    <Typography variant="body2" paragraph>
      Библиотека для шаринга компонентов между модулями:
    </Typography>
    <DocFileTree
      tree={`share/src/
└── ThemeSchema/         # Обертка для темы`}
    />
  </DocSection>
);
