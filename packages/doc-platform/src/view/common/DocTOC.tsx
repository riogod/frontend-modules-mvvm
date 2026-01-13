import { type FC } from 'react';
import { Paper, Typography, List, ListItem, Link } from '@platform/ui';

/**
 * Элемент оглавления с якорной ссылкой.
 */
export interface TOCItem {
  /** Уникальный идентификатор раздела */
  id: string;
  /** Заголовок раздела */
  title: string;
  /** Уровень вложенности (для отступа) */
  level?: number;
}

interface DocTOCProps {
  /** Массив элементов оглавления */
  items: TOCItem[];
}

/**
 * Компонент оглавления с якорными ссылками на разделы документации.
 *
 * @component
 * @example
 * ```tsx
 * <DocTOC items={[
 *   { id: 'overview', title: 'Обзор' },
 *   { id: 'installation', title: 'Установка', level: 2 }
 * ]} />
 * ```
 */
export const DocTOC: FC<DocTOCProps> = ({ items }) => (
  <Paper
    sx={(theme) => ({
      p: theme.spacing(2),
      mb: theme.spacing(3),
      backgroundColor: theme.palette.background.paper,
    })}
    elevation={5}
  >
    <Typography variant="h6" gutterBottom>
      Содержание
    </Typography>

    <List sx={{ py: 0 }}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          sx={(theme) => ({
            py: theme.spacing(0.5),
            pl: item.level ? theme.spacing(item.level * 2) : 0,
          })}
        >
          <Link
            href={`#${item.id}`}
            underline="hover"
            sx={{
              fontSize: item.level && item.level > 1 ? '0.875rem' : '1rem',
            }}
          >
            {item.title}
          </Link>
        </ListItem>
      ))}
    </List>
  </Paper>
);
