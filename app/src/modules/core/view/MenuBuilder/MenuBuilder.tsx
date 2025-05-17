import { FC, memo } from 'react';
import { useRouter } from '@riogz/react-router';
import { IMenuItem } from '@todo/core';
import { useTranslation } from 'react-i18next';
import FullMenuView from './components/FullMenuView';
import MobileMenuView from './components/MobileMenuView';

/**
 * Компонент для построения меню из конфигурации роутера.
 */
const MenuBuilder: FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const menuList: IMenuItem[] = router.getDependencies().menu as IMenuItem[];

  menuList.sort(
    (a, b) => (a.sortOrder || Infinity) - (b.sortOrder || Infinity),
  );

  const navigate = (path: string) => {
    router.navigate(path);
  };

  return (
    <>
      <MobileMenuView menuList={menuList} navigate={navigate} t={t} />
      <FullMenuView menuList={menuList} navigate={navigate} t={t} />
    </>
  );
};

export default memo(MenuBuilder);
