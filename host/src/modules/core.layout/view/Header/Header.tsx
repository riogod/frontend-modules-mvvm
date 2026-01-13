import { type FC, memo } from 'react';
import { observer } from 'mobx-react-lite';
import { Toolbar, SettingsIcon, IconButton, Box, useTheme } from '@platform/ui';
import { type IProps } from './interfaces';
import { AppBarStyled } from './components/AppBarStyled';
import { useTranslation } from 'react-i18next';
import { GlassSurface } from '@platform/ui';

const Header: FC<IProps> = ({ open, handleAppSettingsOpen }) => {
  const { t } = useTranslation('common');
  const theme = useTheme();

  return (
    <AppBarStyled
      open={open}
      color="transparent"
      position="sticky"
      elevation={0}
      sx={{
        borderRadius: 0,
        boxShadow: 'none',
        mt: (theme) => ({
          xs: theme.spacing(0),
          md: theme.spacing(0),
        }),
      }}
    >
      <Box
        sx={(theme) => ({
          display: 'flex',
          justifyContent: 'flex-end',
          height: '100%',
          marginLeft: (theme) => ({
            xs: theme.spacing(0),
            md: theme.spacing(1),
          }),
          marginRight: (theme) => ({
            xs: theme.spacing(0),
            md: theme.spacing(1),
          }),
          padding: {
            xs: theme.spacing(1),
            md: theme.spacing(2),
          },

          borderRadius: {
            md: theme.shape.radius.md,
            sm: theme.shape.radius.sm,
          },
        })}
      >
        <GlassSurface
          width="100%"
          height="48px"
          borderWidth={0.13}
          blur={12}
          displace={4.5}
          // brightness={100}
          // distortionScale={-180}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          borderRadius={theme.shape.radius.lg}
        >
          <Toolbar
            sx={{
              display: 'flex',
              height: '100%',
              width: '100%',
              minHeight: '48px !important',
              justifyContent: 'space-between',
              p: {
                xs: theme.spacing(1),
                md: theme.spacing(1),
              },
            }}
          >
            <Box></Box>
            <IconButton
              color="inherit"
              size="small"
              aria-label={t('settings.OPEN')}
              title={t('settings.OPEN')}
              onClick={handleAppSettingsOpen}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Toolbar>
        </GlassSurface>
      </Box>
    </AppBarStyled>
  );
};

export default memo(observer(Header));
