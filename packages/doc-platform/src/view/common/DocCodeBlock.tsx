import { type FC } from 'react';
import { Paper, Typography, type Theme } from '@platform/ui';

interface DocCodeBlockProps {
  /** Код для отображения */
  code: string;
  /** Язык программирования (для подсветки и метки) */
  language?: string;
  /** Дополнительные стили через функцию темы */
  sx?: (theme: Theme) => Record<string, unknown>;
}

/**
 * Компонент для отображения блоков кода в документации.
 *
 * @component
 * @example
 * ```tsx
 * <DocCodeBlock
 *   code="const x = 1;"
 *   language="typescript"
 * />
 * ```
 */
export const DocCodeBlock: FC<DocCodeBlockProps> = ({
  code,
  language = 'typescript',
  ...props
}) => (
  <Paper
    sx={(theme) => ({
      p: theme.spacing(2),
      backgroundColor: '#1e1e1e',
      overflow: 'auto',
      mb: theme.spacing(2),
    })}
    {...props}
  >
    <Typography
      variant="caption"
      sx={(theme) => ({ color: '#858585', display: 'block', mb: theme.spacing(1) })}
    >
      {language}
    </Typography>

    <Typography
      component="pre"
      sx={{ color: '#d4d4d4', fontSize: '0.875rem', margin: 0 }}
    >
      {code}
    </Typography>
  </Paper>
);
