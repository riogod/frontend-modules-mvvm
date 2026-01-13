import { type FC, type ReactNode } from 'react';
import { Typography, Box, type Theme } from '@platform/ui';

interface SectionProps {
  /** Заголовок раздела */
  title?: string;
  /** Содержимое раздела */
  children: ReactNode;
  /** Дополнительные стили через функцию темы */
  sx?: (theme: Theme) => Record<string, unknown>;
}

/**
 * Компонент раздела документации с опциональным заголовком.
 *
 * @component
 * @example
 * ```tsx
 * <DocSection title="Установка">
 *   <p>Инструкции по установке...</p>
 * </DocSection>
 * ```
 */
export const DocSection: FC<SectionProps> = ({ title, children, sx }) => (
  <Box sx={(theme) => ({ mb: theme.spacing(4), ...sx?.(theme) })}>
    {title && (
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
    )}

    {children}
  </Box>
);
