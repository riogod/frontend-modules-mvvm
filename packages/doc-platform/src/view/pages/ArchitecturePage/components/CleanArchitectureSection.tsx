import { type FC } from 'react';
import { DocSection, DocList } from '../../../common';

export const CleanArchitectureSection: FC = () => (
  <DocSection title="Чистая архитектура">
    <p>Платформа следует принципам чистой архитектуры (SOLID):</p>
    <DocList
      items={[
        'Dependency Inversion — зависеть от абстракций, а не от реализаций',
        'Single Responsibility — каждый класс/функция решает одну задачу',
        'Open/Closed — открыт для расширения, закрыт для модификации',
        'Interface Segregation — много специфичных интерфейсов лучше одного общего',
        'Liskov Substitution — подтипы должны заменять базовые типы',
      ]}
    />
  </DocSection>
);
