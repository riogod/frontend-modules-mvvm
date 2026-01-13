import { type FC } from 'react';
import { DocSection, DocFileTree, DocTable } from '../../../common';

export const HostSection: FC = () => (
  <DocSection title="host/ — Хост-приложение">
    <p>
      Хост-приложение — точка входа и координатор всей системы. Содержит
      механизмы инициализации, загрузки модулей и базовые компоненты платформы.
    </p>

    <DocFileTree
      tree={`host/
 ├── src/
 │   ├── bootstrap/          # Система инициализации
 │   │   ├── handlers/       # Обработчики инициализации
 │   │   ├── services/       # Сервисы платформы
 │   │   │   ├── appStart/   # Загрузка стартовых данных
 │   │   │   ├── moduleLoader/  # Загрузчик модулей
 │   │   │   └── router/     # Сервис роутинга
 │   │   ├── index.ts        # Точка входа bootstrap
 │   │   └── interface.ts    # Интерфейсы
 │   ├── config/             # Конфигурация приложения
 │   ├── modules/            # Локальные модули (INIT)
 │   │   ├── core/           # Базовый модуль
 │   │   ├── core.layout/    # Модуль макета
 │   │   └── local-normal/   # Пример локального модуля
 │   ├── mocks/              # Моки для разработки
 │   ├── main.tsx            # Точка входа React
 │   └── main.css            # Глобальные стили
 ├── public/                 # Статические файлы
 ├── index.html              # HTML-шаблон
 ├── vite.config.mts         # Конфигурация Vite
 └── tsconfig.json           # Конфигурация TypeScript`}
    />

    <h6 style={{ marginTop: '16px' }}>bootstrap/handlers/</h6>
    <p>Обработчики выполняются последовательно при старте приложения:</p>
    <DocTable
      columns={[
        { header: 'Обработчик', key: 'handler' },
        { header: 'Назначение', key: 'purpose' },
      ]}
      rows={[
        { handler: 'APIClient', purpose: 'Инициализация HTTP-клиента' },
        {
          handler: 'FederationShared',
          purpose: 'Настройка shared scope для Module Federation',
        },
        {
          handler: 'ModulesDiscovery',
          purpose: 'Получение списка модулей с сервера',
        },
        { handler: 'Router', purpose: 'Инициализация роутера' },
        { handler: 'DI', purpose: 'Настройка DI-контейнера' },
        { handler: 'InitI18n', purpose: 'Инициализация интернационализации' },
        {
          handler: 'OnAppStart',
          purpose: 'Загрузка начальных данных приложения',
        },
        { handler: 'Modules', purpose: 'Загрузка INIT-модулей' },
        { handler: 'RouterPost', purpose: 'Финализация роутинга' },
        { handler: 'HTTPError', purpose: 'Настройка обработки HTTP-ошибок' },
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>bootstrap/services/moduleLoader/</h6>
    <p>Система загрузки модулей:</p>
    <DocFileTree
      tree={`moduleLoader/
 ├── core/               # Ядро загрузчика
 │   ├── ModuleLoader.ts        # Основной загрузчик
 │   ├── ModuleRegistry.ts      # Реестр модулей
 │   └── ModuleStatusTracker.ts # Отслеживание статусов
 ├── dev/                # Режим разработки
 ├── prod/               # Продакшен-режим
 ├── services/           # Вспомогательные сервисы
 ├── strategies/         # Стратегии загрузки (INIT/NORMAL)
 ├── types/              # TypeScript типы
 └── errors/             # Обработка ошибок`}
    />
  </DocSection>
);
