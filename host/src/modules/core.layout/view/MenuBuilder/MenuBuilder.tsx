import { type FC, memo, useMemo, useCallback } from 'react';
import { useRouter } from '@riogz/react-router';
import { type IMenuItem } from '@platform/core';
import { useTranslation } from 'react-i18next';
import SidebarMenuView from './components/SidebarMenuView';

/**
 * Компонент для построения меню из конфигурации роутера.
 */
const MenuBuilder: FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const rawMenuList: IMenuItem[] = router.getDependencies().menu as IMenuItem[];

  console.log('rawMenuList', rawMenuList);
  // Мемоизируем отсортированный список, чтобы не создавать новый массив при каждом рендере
  // Создаем стабильный ключ из содержимого для эффективного сравнения содержимого,
  // а не ссылки на массив (так как getDependencies() может возвращать новый массив)
  const menuListKey = useMemo(
    () =>
      rawMenuList
        .map((item) => `${item.id}-${item.sortOrder}`)
        .sort()
        .join(','),
    [rawMenuList],
  );

  const menuList = useMemo(() => {
    return [...rawMenuList].sort(
      (a, b) => (a.sortOrder || Infinity) - (b.sortOrder || Infinity),
    );
    // Используем menuListKey вместо rawMenuList для сравнения содержимого, а не ссылки
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuListKey]);

  const navigate = useCallback(
    (path: string) => {
      router.navigate(path);
    },
    [router],
  );

  return <SidebarMenuView menuList={menuList} navigate={navigate} t={t} />;
};

export default memo(MenuBuilder);
