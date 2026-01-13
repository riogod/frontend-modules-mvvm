import { type FC } from 'react';
import { DocSection, DocTable, DocList } from '../../../common';

export const ServicesSection: FC = () => (
  <DocSection title="Структура запущенных сервисов">
    <p>После успешного запуска у вас будут работать:</p>

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
          purpose:
            'Обработка API запросов, MSW моки, проксирование на удаленный сервер',
        },
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>Проверка работы сервисов</h6>
    <p>Откройте в браузере:</p>
    <DocList
      items={[
        'Приложение: http://localhost:4200',
        'Dev Server API: http://localhost:1337/app/start (должен вернуть JSON с манифестом)',
      ]}
    />
  </DocSection>
);
