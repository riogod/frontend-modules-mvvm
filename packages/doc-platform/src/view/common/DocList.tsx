import type React from 'react';
import { type FC } from 'react';
import { Typography, Box } from '@platform/ui';

/**
 * Элемент списка с вложенными дочерними элементами.
 */
interface DocListItem {
  /** Основное содержимое элемента */
  content: React.ReactNode;
  /** Вложенные дочерние элементы */
  children?: (string | React.ReactNode | DocListItem)[];
}

interface DocListProps {
  /** Массив элементов списка (строки, React-элементы или объекты с вложенностью) */
  items: (string | React.ReactNode | DocListItem)[];
  /** Использовать нумерованный список (ordered list) */
  ordered?: boolean;
  /** Глубина вложенности (для внутренней рекурсии) */
  depth?: number;
}

/**
 * Внутренний компонент для отображения содержимого элемента списка.
 */
const DocListItemContent: FC<{
  item: string | React.ReactNode | DocListItem;
  depth?: number;
}> = ({ item, depth = 0 }) => {
  if (typeof item === 'string') {
    return (
      <Typography variant="body1" component="span">
        {item}
      </Typography>
    );
  }

  const listItem = item as DocListItem;

  if (listItem.content) {
    return (
      <>
        <Typography variant="body1" component="span">
          {listItem.content}
        </Typography>

        {listItem.children && listItem.children.length > 0 && (
          <Box
            component="ul"
            sx={(theme) => ({
              ml: theme.spacing(4),
              mt: theme.spacing(0.5),
              mb: 0,
              pl: theme.spacing(3),
            })}
          >
            <DocList
              items={listItem.children}
              ordered={false}
              depth={depth + 1}
            />
          </Box>
        )}
      </>
    );
  }

  return <>{item}</>;
};

/**
 * Внутренняя реализация списка с поддержкой вложенности.
 * Использует нативные HTML элементы для корректного отображения.
 */
const DocListInternal: FC<DocListProps> = ({
  items,
  ordered = false,
  depth = 0,
}) => {
  const ListComponent = ordered ? 'ol' : 'ul';

  return (
    <Box
      component={ListComponent}
      sx={(theme) => ({
        pl: depth > 0 ? theme.spacing(4) : theme.spacing(3),
        mb: theme.spacing(2),
        mt: 0,
        listStylePosition: 'outside',
      })}
    >
      {items.map((item, idx) => (
        <Box
          key={idx}
          component="li"
          sx={(theme) => ({
            mb: theme.spacing(0.5),
            '&::marker': {
              color: theme.palette.text.primary,
            },
          })}
        >
          <DocListItemContent item={item} depth={depth} />
        </Box>
      ))}
    </Box>
  );
};

/**
 * Компонент списка для отображения маркированных или нумерованных списков в документации.
 * Поддерживает вложенные списки и различные типы элементов.
 * Использует нативные HTML элементы для корректного отображения.
 *
 * @component
 * @example
 * ```tsx
 * <DocList
 *   items={[
 *     'Первый пункт',
 *     'Второй пункт',
 *     { content: 'Третий пункт', children: ['Вложенный 1', 'Вложенный 2'] }
 *   ]}
 *   ordered={false}
 * />
 * ```
 */
export const DocList: FC<DocListProps> = DocListInternal;
