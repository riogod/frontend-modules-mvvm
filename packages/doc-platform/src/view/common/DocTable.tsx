import { type FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@platform/ui';

/**
 * Определение колонки таблицы.
 */
interface TableColumn {
  /** Заголовок колонки */
  header: string;
  /** Ключ для доступа к данным в строках */
  key: string;
}

interface DocTableProps {
  /** Массив определений колонок */
  columns: TableColumn[];
  /** Массив строк данных */
  rows: Record<string, React.ReactNode>[];
}

/**
 * Компонент таблицы для отображения структурированных данных в документации.
 *
 * @component
 * @example
 * ```tsx
 * <DocTable
 *   columns={[
 *     { header: 'Название', key: 'name' },
 *     { header: 'Тип', key: 'type' }
 *   ]}
 *   rows={[
 *     { name: 'Todo', type: 'string' },
 *     { name: 'Completed', type: 'boolean' }
 *   ]}
 * />
 * ```
 */
export const DocTable: FC<DocTableProps> = ({ columns, rows }) => (
  <TableContainer component={Paper} sx={(theme) => ({ mb: theme.spacing(2) })}>
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableCell key={col.key}>{col.header}</TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={idx}>
            {columns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
