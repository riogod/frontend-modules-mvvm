import { type FC } from 'react';
import { DocSection, DocCommand } from '../../../common';

export const LaunchingSection: FC = () => (
  <DocSection title="Запуск проекта">
    <p>
      MFP предоставляет несколько способов запуска проекта в режиме разработки.
      Выберите подходящий для вашей задачи.
    </p>

    <h6>Интерактивный лаунчер</h6>
    <p>Самый удобный способ для начала работы:</p>
    <DocCommand command="npm start" />
    <p>или</p>
    <DocCommand command="npm run dev" />

    <p style={{ color: 'text.secondary' }}>
      Подробнее см. <a href="/doc-platform/tools">Лаунчер</a> для детального
      описания работы с конфигурациями.
    </p>
  </DocSection>
);
