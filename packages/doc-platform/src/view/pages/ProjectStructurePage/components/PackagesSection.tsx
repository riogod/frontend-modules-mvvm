import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocFileTree } from '../../../common';

export const PackagesSection: FC = () => (
  <DocSection title="packages/ — Бизнес-модули" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Директория packages/ содержит MFE-модули (Micro Frontend). Каждый модуль —
      независимое приложение с собственной сборкой и деплоем.
    </Typography>

    <Typography variant="h6" gutterBottom>
      Типичная структура модуля
    </Typography>
    <DocFileTree
      tree={`module-name/
├── src/
│   ├── config/
│   │   ├── module_config.ts    # Главная конфигурация
│   │   ├── routes.ts           # Маршруты с lazy()
│   │   ├── di.config.ts        # Регистрация в DI
│   │   ├── di.tokens.ts        # Токены DI
│   │   ├── endpoints.ts        # API эндпоинты
│   │   └── i18n/               # Переводы
│   ├── models/                 # Model (состояние)
│   ├── viewmodels/             # ViewModel (прокси к Model)
│   ├── usecases/               # Use Cases (бизнес-логика)
│   ├── view/                   # React компоненты
│   │   ├── pages/
│   │   └── components/
│   └── data/                   # Repository, DTO, валидация
│       ├── entity.repository.ts
│       ├── entity.dto.ts
│       └── validation/
├── vite.config.mts
├── package.json
└── tsconfig.json`}
    />
  </DocSection>
);
