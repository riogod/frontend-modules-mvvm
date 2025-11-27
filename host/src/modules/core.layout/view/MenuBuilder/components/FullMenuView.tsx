import { type FC, memo } from 'react';
import { type IMenuItem } from '@platform/core';
import { Button, Box } from '@platform/ui';

interface IProps {
  menuList: IMenuItem[];
  navigate: (path: string) => void;
  t: (key: string) => string;
}
/**
 * Компонент для построения меню из конфигурации роутера.
 */
const FullMenuView: FC<IProps> = ({ menuList, navigate, t }) => {
  const onNavigate = (path: string) => () => {
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
      {menuList.map((page) => {
        return (
          <Button key={page.id} onClick={onNavigate(page.path)} color="primary">
            {t(page.text)}
          </Button>
        );
      })}
    </Box>
  );
};

export default memo(FullMenuView);
