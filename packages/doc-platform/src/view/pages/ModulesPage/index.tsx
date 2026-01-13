import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { MvvmPatternSection } from './MvvmPatternSection';
import { CreatingModuleSection } from './CreatingModuleSection';
import { ModuleConfigSection } from './ModuleConfigSection';
import { UseCasesSection } from './UseCasesSection';
import { DataLayerSection } from './DataLayerSection';
import { InterModuleCommunicationSection } from './InterModuleCommunicationSection';
import { ModuleTypesSection } from './ModuleTypesSection';

/**
 * Страница документации по модулям платформы.
 * Содержит информацию о MVVM паттерне, создании модулей, конфигурации,
 * Use Cases, Data Layer, межмодульном взаимодействии и типах модулей.
 *
 * @component
 */
const ModulesPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.modules')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Создание и работа с модулями в платформе MFP. Модули следуют MVVM
          паттерну и изолированы друг от друга через Dependency Injection.
        </Typography>

        <DocTOC
          items={[
            { id: 'mvvm-pattern', title: 'MVVM Pattern' },
            { id: 'создание-модуля', title: 'Создание модуля' },
            { id: 'конфигурация-модуля', title: 'Конфигурация модуля' },
            { id: 'use-cases', title: 'Use Cases' },
            { id: 'data-layer', title: 'Data Layer' },
            {
              id: 'межмодульное-взаимодействие',
              title: 'Межмодульное взаимодействие',
            },
            { id: 'типы-модулей', title: 'Типы модулей' },
          ]}
        />

        <div id="mvvm-pattern">
          <MvvmPatternSection />
        </div>

        <div id="создание-модуля">
          <CreatingModuleSection />
        </div>

        <div id="конфигурация-модуля">
          <ModuleConfigSection />
        </div>

        <div id="use-cases">
          <UseCasesSection />
        </div>

        <div id="data-layer">
          <DataLayerSection />
        </div>

        <div id="межмодульное-взаимодействие">
          <InterModuleCommunicationSection />
        </div>

        <div id="типы-модулей">
          <ModuleTypesSection />
        </div>
      </Paper>
    </Container>
  );
};

export default ModulesPage;
