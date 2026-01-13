import { type FC } from 'react';
import { DocSection, DocFileTree, DocList } from '../../../common';

export const LibsSection: FC = () => (
  <DocSection title="libs/ — Библиотеки платформы">
    <p>
      Библиотеки предоставляют инфраструктурный код, переиспользуемый хостом и
      модулями.
    </p>

    <DocFileTree
      tree={`libs/
 ├── core/       # Базовая инфраструктура
 ├── common/     # Общие модели и usecases
 ├── ui/         # UI-компоненты и хуки
 └── share/      # Библиотека для шаринга сущностей`}
    />

    <h6 style={{ marginTop: '16px' }}>libs/core/</h6>
    <p>Базовая инфраструктура платформы:</p>
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
    <p>
      <strong>Экспортирует:</strong>
    </p>
    <DocList
      items={[
        'APIClient — HTTP-клиент с поддержкой отмены запросов',
        'log — логгер с уровнями и префиксами',
        'IOC_CORE_TOKENS — Системные токены для DI-контейнера',
        'Типы для роутинга и модулей',
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>libs/common/</h6>
    <p>Общие бизнес-сущности:</p>
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
    <p>
      <strong>Экспортирует:</strong>
    </p>
    <DocList
      items={[
        'AccessControlModel — управление feature flags и permissions',
        'Use cases для работы с флагами и разрешениями',
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>libs/ui/</h6>
    <p>UI-компоненты и React-утилиты:</p>
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

    <h6 style={{ marginTop: '16px' }}>libs/share/</h6>
    <p>Библиотека для шаринга компонентов между модулями:</p>
    <DocFileTree
      tree={`share/src/
 └── ThemeSchema/         # Обертка для темы`}
    />
  </DocSection>
);
