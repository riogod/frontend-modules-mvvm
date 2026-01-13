import { type FC } from 'react';
import { DocSection, DocList } from '../../../common';

export const KeyPrinciplesSection: FC = () => (
  <DocSection title="Ключевые принципы">
    <p>Платформа построена на следующих принципах:</p>
    <DocList
      items={[
        'Модульность — каждый модуль изолирован и независим',
        'Чистая архитектура — четкое разделение слоев (Model, ViewModel, View, Use Cases, Repository)',
        'Dependency Injection — все зависимости через DI контейнер',
        'Reactive programming — реактивность через MobX',
        'Inter-module communication — взаимодействие только через DI',
      ]}
    />
  </DocSection>
);
