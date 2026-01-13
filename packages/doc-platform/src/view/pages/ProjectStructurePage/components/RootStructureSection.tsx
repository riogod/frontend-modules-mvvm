import { type FC } from 'react';
import { DocSection, DocFileTree } from '../../../common';

export const RootStructureSection: FC = () => (
  <DocSection title="Корневая структура">
    <DocFileTree
      tree={`frontend-modules-mvvm/
├── host/                   # Хост-приложение
├── libs/                   # Библиотеки платформы
├── packages/               # Бизнес-модули
├── config/                 # Конфигурации инструментов
├── scripts/                # Скрипты сборки и разработки
├── docs/                   # Документация
├── dist/                   # Артефакты сборки
├── package.json            # Корневой package.json
└── tsconfig.base.json      # Базовая конфигурация TypeScript`}
    />
  </DocSection>
);
