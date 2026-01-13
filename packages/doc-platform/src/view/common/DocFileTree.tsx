import { type FC } from 'react';
import { Paper, Typography } from '@platform/ui';

interface DocFileTreeProps {
  /** ASCII-арт представление структуры файлов */
  tree: string;
}

/**
 * Компонент для отображения структуры файлов в виде ASCII-арт дерева.
 *
 * @component
 * @example
 * ```tsx
 * <DocFileTree tree={`
 * host/
 * ├── src/
 * │   ├── bootstrap/
 * │   └── modules/
 * └── package.json
 * `} />
 * ```
 */
export const DocFileTree: FC<DocFileTreeProps> = ({ tree }) => (
  <Paper
    sx={(theme) => ({
      p: theme.spacing(2),
      backgroundColor: '#1e1e1e',
      overflow: 'auto',
      mb: theme.spacing(2),
    })}
  >
    <Typography
      component="pre"
      sx={{
        color: '#d4d4d4',
        fontSize: '0.875rem',
        margin: 0,
        fontFamily: 'monospace',
        lineHeight: 1.6,
      }}
    >
      {tree.trim()}
    </Typography>
  </Paper>
);
