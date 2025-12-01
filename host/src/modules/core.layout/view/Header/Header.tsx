import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Toolbar,
  SettingsIcon,
  MuiIconButton,
  Box,
  Divider,
} from '@platform/ui';
import { type IProps } from './interfaces';
import { AppBarStyled } from './components/AppBarStyled';
import { useTranslation } from 'react-i18next';
import MenuBuilder from '../MenuBuilder/index';

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
