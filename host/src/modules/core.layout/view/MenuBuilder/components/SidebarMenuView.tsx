import { type FC, memo, useCallback, useState, useMemo } from 'react';
import { useRoute } from '@riogz/react-router';
import { type IMenuItem } from '@platform/core';
import { List } from '@platform/ui';
import MenuItem from './MenuItem';
import MenuItemWithSubMenu from './MenuItemWithSubMenu';

interface IProps {
  menuList: IMenuItem[];
  navigate: (path: string) => void;
  t: (key: string) => string;
}

/**
 * Компонент для построения бокового меню с поддержкой вложенных элементов
 */
const SidebarMenuView: FC<IProps> = ({ menuList, navigate, t }) => {
  const route = useRoute();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Проверка, является ли маршрут активным
  const isActive = useCallback(
    (menuItem: IMenuItem): boolean => {
      const currentPath = route.route.name;
      // Прямое совпадение
      if (menuItem.path === currentPath) {
        return true;
      }
      // Проверка, начинается ли текущий путь с пути пункта меню (для вложенных маршрутов)
      if (currentPath.startsWith(menuItem.path + '.')) {
        return true;
      }
      // Рекурсивная проверка дочерних элементов
      if (menuItem.children) {
        return menuItem.children.some((child) => isActive(child));
      }
      return false;
    },
    [route.route.name],
  );

  // Проверка, должен ли элемент быть раскрыт по умолчанию
  const shouldBeExpanded = useCallback(
    (menuItem: IMenuItem): boolean => {
      if (menuItem.menuAlwaysExpand) {
        return true;
      }
      if (isActive(menuItem)) {
        return true;
      }
      if (menuItem.children) {
        return menuItem.children.some((child) => shouldBeExpanded(child));
      }
      return false;
    },
    [isActive],
  );

  // Инициализация раскрытых элементов
  useMemo(() => {
    const initialExpanded = new Set<string>();
    menuList.forEach((item) => {
      if (shouldBeExpanded(item)) {
        initialExpanded.add(item.id);
      }
    });
    setExpandedItems(initialExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuList]);

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const renderMenuItem = useCallback(
    (menuItem: IMenuItem, level: number = 0) => {
      const hasChildren = menuItem.children && menuItem.children.length > 0;
      const isExpanded = expandedItems.has(menuItem.id);
      const active = isActive(menuItem);
      // Используем spacing для расчета отступов: базовая 1 + 1 за каждый уровень вложенности
      const paddingLeft = 1 + level * 2;

      if (hasChildren) {
        return (
          <MenuItemWithSubMenu
            key={menuItem.id}
            menuItem={menuItem}
            isActive={active}
            isExpanded={isExpanded}
            paddingLeft={paddingLeft}
            level={level}
            t={t}
            onToggleExpand={toggleExpand}
            renderMenuItem={renderMenuItem}
          />
        );
      }

      return (
        <MenuItem
          key={menuItem.id}
          menuItem={menuItem}
          isActive={active}
          paddingLeft={paddingLeft}
          navigate={navigate}
          t={t}
        />
      );
    },
    [expandedItems, isActive, navigate, t, toggleExpand],
  );

  return (
    <List component="nav" disablePadding>
      {menuList.map((item) => renderMenuItem(item))}
    </List>
  );
};

export default memo(SidebarMenuView);
