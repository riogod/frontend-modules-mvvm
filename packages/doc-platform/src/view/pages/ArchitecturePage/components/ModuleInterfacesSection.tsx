import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocList, DocNote } from '../../../common';

export const ModuleInterfacesSection: FC = () => (
  <DocSection
    title="Интерфейсы модулей"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
    <Typography variant="body1" paragraph>
      Каждый модуль должен реализовать интерфейс ModuleConfig из @platform/core:
    </Typography>
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
      <Typography variant="body2">
        Прямой импорт реализаций между модулями ЗАПРЕЩЕН. Все взаимодействие
        должно происходить только через DI контейнер.
      </Typography>
    </DocNote>
  </DocSection>
);
