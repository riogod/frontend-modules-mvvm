import { type FC } from 'react';
import { Alert, AlertTitle } from '@platform/ui';

interface DocNoteProps {
  /** Тип заметки (определяет цвет и иконку) */
  type?: 'info' | 'warning' | 'error' | 'success';
  /** Заголовок заметки (если не указан, используется дефолтный) */
  title?: string;
  /** Содержимое заметки */
  children: React.ReactNode;
}

/**
 * Компонент для отображения заметок, предупреждений и важной информации в документации.
 *
 * @component
 * @example
 * ```tsx
 * <DocNote type="warning" title="Внимание">
 *   Это важное предупреждение
 * </DocNote>
 * ```
 */
export const DocNote: FC<DocNoteProps> = ({
  type = 'info',
  title,
  children,
}) => {
  const titles: Record<string, string> = {
    info: title || 'Важно',
    warning: title || 'Внимание',
    error: title || 'Ошибка',
    success: title || 'Успешно',
  };

  return (
    <Alert severity={type} sx={(theme) => ({ mb: theme.spacing(2) })}>
      {title && <AlertTitle>{titles[type]}</AlertTitle>}

      {children}
    </Alert>
  );
};
