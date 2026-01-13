import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocList } from '../../../common';

export const CleanArchitectureSection: FC = () => (
  <DocSection
    title="Чистая архитектура"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
    <Typography variant="body1" paragraph>
      Платформа следует принципам чистой архитектуры (SOLID):
    </Typography>
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
