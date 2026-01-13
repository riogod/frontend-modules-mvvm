import { type FC } from 'react';
import { Paper, Typography, Box } from '@platform/ui';

interface DocCommandProps {
  /** Команда для отображения */
  command: string;
  /** Описание команды (опционально) */
  description?: string;
}

/**
 * Компонент для отображения CLI команд в документации.
 *
 * @component
 * @example
 * ```tsx
 * <DocCommand
 *   command="npm install"
 *   description="Установка зависимостей"
 * />
 * ```
 */
export const DocCommand: FC<DocCommandProps> = ({ command, description }) => (
  <Box sx={(theme) => ({ mb: theme.spacing(2) })}>
    {description && (
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>
    )}

    <Paper
      sx={(theme) => ({
        p: theme.spacing(1.5),
        backgroundColor: '#1e1e1e',
        overflow: 'auto',
      })}
    >
      <Typography
        component="pre"
        sx={{
          color: '#d4d4d4',
          fontSize: '0.875rem',
          margin: 0,
          fontFamily: 'monospace',
        }}
      >
        {command}
      </Typography>
    </Paper>
  </Box>
);
