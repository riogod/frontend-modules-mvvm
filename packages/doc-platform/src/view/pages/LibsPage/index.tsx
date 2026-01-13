import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { CoreLibrarySection } from './CoreLibrarySection';
import { CommonLibrarySection } from './CommonLibrarySection';
import { UiLibrarySection } from './UiLibrarySection';
import { ShareLibrarySection } from './ShareLibrarySection';
import { CreateLibrarySection } from './CreateLibrarySection';

/**
 * Страница документации по библиотекам платформы.
 * Содержит информацию о core, common, ui, share библиотеках
 * и создании новых библиотек.
 *
 * @component
 */
const LibsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.libs')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Библиотеки платформы предоставляют инфраструктурный код,
          переиспользуемый хостом и модулями: core, common, ui, share.
        </Typography>

        <DocTOC
          items={[
            { id: 'core-library', title: '@platform/core' },
            { id: 'common-library', title: '@platform/common' },
            { id: 'ui-library', title: '@platform/ui' },
            { id: 'share-library', title: '@platform/share' },
            { id: 'создание-библиотеки', title: 'Создание библиотеки' },
          ]}
        />

        <div id="core-library">
          <CoreLibrarySection />
        </div>

        <div id="common-library">
          <CommonLibrarySection />
        </div>

        <div id="ui-library">
          <UiLibrarySection />
        </div>

        <div id="share-library">
          <ShareLibrarySection />
        </div>

        <div id="создание-библиотеки">
          <CreateLibrarySection />
        </div>
      </Paper>
    </Container>
  );
};

export default LibsPage;
