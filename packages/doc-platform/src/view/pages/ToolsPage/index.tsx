import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { BuildSection } from './BuildSection';
import { LauncherSection } from './LauncherSection';
import { LintingSection } from './LintingSection';
import { StorybookSection } from './StorybookSection';
import { TestingSection } from './TestingSection';

/**
 * Страница документации по инструментам разработки.
 * Содержит информацию о Launcher, Build, Testing, Linting и Storybook.
 *
 * @component
 */
const ToolsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.tools')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Инструменты разработки для сборки, тестирования и документирования
          проекта.
        </Typography>

        <DocTOC
          items={[
            { id: 'launcher', title: 'Launcher' },
            { id: 'build', title: 'Build' },
            { id: 'testing', title: 'Testing' },
            { id: 'linting', title: 'Linting' },
            { id: 'storybook', title: 'Storybook' },
          ]}
        />

        <div id="launcher">
          <LauncherSection />
        </div>

        <div id="build">
          <BuildSection />
        </div>

        <div id="testing">
          <TestingSection />
        </div>

        <div id="linting">
          <LintingSection />
        </div>

        <div id="storybook">
          <StorybookSection />
        </div>
      </Paper>
    </Container>
  );
};

export default ToolsPage;
