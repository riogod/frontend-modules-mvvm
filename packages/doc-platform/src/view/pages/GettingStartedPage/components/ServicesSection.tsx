import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocTable, DocList } from '../../../common';

export const ServicesSection: FC = () => (
  <DocSection
    title="Структура запущенных сервисов"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
    <Typography variant="body1" paragraph>
      После успешного запуска у вас будут работать:
    </Typography>

    <DocTable
      columns={[
        { header: 'Сервис', key: 'service' },
        { header: 'Порт', key: 'port' },
        { header: 'Назначение', key: 'purpose' },
      ]}
      rows={[
        {
          service: 'Vite Dev Server',
          port: '4200',
          purpose: 'Основное приложение, HMR, проксирование запросов',
        },
        {
          service: 'Dev Server',
          port: '1337',
          purpose: 'Обработка API запросов, MSW моки, проксирование на удаленный сервер',
        },
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      Проверка работы сервисов
    </Typography>
    <Typography variant="body2" paragraph>
      Откройте в браузере:
    </Typography>
    <DocList
      items={[
        'Приложение: http://localhost:4200',
        'Dev Server API: http://localhost:1337/app/start (должен вернуть JSON с манифестом)',
      ]}
    />
  </DocSection>
);
