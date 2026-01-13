import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { BootstrapProcessSection } from './BootstrapProcessSection';
import { HandlersSection } from './HandlersSection';
import { ModuleDependenciesSection } from './ModuleDependenciesSection';
import { ModuleLoaderSection } from './ModuleLoaderSection';
import { UiProvidersSection } from './UiProvidersSection';

/**
 * Страница документации по процессу инициализации и загрузки приложения.
 * Содержит информацию о bootstrap процессе, обработчиках, зависимостях модулей,
 * загрузчике модулей и UI провайдерах.
 *
 * @component
 */
const BootstrapPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.bootstrap')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Процесс инициализации и загрузки приложения. Включает последовательную
          загрузку обработчиков, модулей и провайдеров React.
        </Typography>

        <DocTOC
          items={[
            { id: 'обзор-процесса-загрузки', title: 'Обзор процесса загрузки' },
            { id: 'обработчики-handlers', title: 'Обработчики (Handlers)' },
            { id: 'зависимости-модулей', title: 'Зависимости модулей' },
            { id: 'загрузчик-модулей', title: 'Загрузчик модулей' },
            { id: 'ui-провайдеры', title: 'UI Провайдеры' },
          ]}
        />

        <div id="обзор-процесса-загрузки">
          <BootstrapProcessSection />
        </div>

        <div id="обработчики-handlers">
          <HandlersSection />
        </div>

        <div id="зависимости-модулей">
          <ModuleDependenciesSection />
        </div>

        <div id="загрузчик-модулей">
          <ModuleLoaderSection />
        </div>

        <div id="ui-провайдеры">
          <UiProvidersSection />
        </div>
      </Paper>
    </Container>
  );
};

export default BootstrapPage;
