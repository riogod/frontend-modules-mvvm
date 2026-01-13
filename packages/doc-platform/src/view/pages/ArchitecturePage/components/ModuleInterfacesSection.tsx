import { type FC } from 'react';
import { DocSection, DocList, DocNote } from '../../../common';

export const ModuleInterfacesSection: FC = () => (
  <DocSection title="Интерфейсы модулей">
    <p>
      Каждый модуль должен реализовать интерфейс ModuleConfig из @platform/core:
    </p>
    <DocList
      items={[
        'ROUTES — функция, возвращающая массив маршрутов',
        'onModuleInit — функция инициализации модуля',
        'I18N — функция регистрации переводов',
        'mockHandlers — массив MSW хендлеров для моков',
        'mockModuleInfo — информация о модуле (name, dependencies, featureFlags)',
      ]}
    />
    <DocNote type="warning" title="Важно">
      <p>
        Прямой импорт реализаций между модулями ЗАПРЕЩЕН. Все взаимодействие
        должно происходить только через DI контейнер.
      </p>
    </DocNote>
  </DocSection>
);
