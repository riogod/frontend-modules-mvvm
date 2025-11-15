import { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { Toolbar, SettingsIcon, MuiIconButton, Box, Divider } from '@todo/ui';
import { IProps } from './interfaces.tsx';
import { AppBarStyled } from './components/AppBarStyled.tsx';
import { useTranslation } from 'react-i18next';
import MenuBuilder from '../MenuBuilder/index.tsx';

const Header: FC<IProps> = ({ open, handleAppSettingsOpen }) => {
  const { t } = useTranslation('common');

  return (
    <AppBarStyled open={open} color="transparent">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        >
          <MenuBuilder />
        </Box>
        <Box>
          <MuiIconButton
            color="primary"
            size="small"
            aria-label={t('settings.OPEN')}
            title={t('settings.OPEN')}
            onClick={handleAppSettingsOpen}
          >
            <SettingsIcon fontSize="small" />
          </MuiIconButton>
        </Box>
      </Toolbar>
      <Divider />
    </AppBarStyled>
  );
};

export default observer(Header);
