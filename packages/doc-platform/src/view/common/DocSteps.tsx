import { type FC, type ReactNode } from 'react';
import { Box, Typography } from '@platform/ui';

/**
 * Элемент шага в пошаговой инструкции.
 */
export interface StepItem {
  /** Заголовок шага */
  title: string;
  /** Содержимое шага (команды, код, текст) */
  content: ReactNode;
}

interface DocStepsProps {
  /** Массив шагов инструкции */
  steps: StepItem[];
}

/**
 * Компонент для отображения пошаговых инструкций с нумерацией.
 *
 * @component
 * @example
 * ```tsx
 * <DocSteps steps={[
 *   { title: 'Клонирование репозитория', content: <DocCommand command="git clone ..." /> },
 *   { title: 'Установка зависимостей', content: <DocCommand command="npm install" /> }
 * ]} />
 * ```
 */
export const DocSteps: FC<DocStepsProps> = ({ steps }) => (
  <Box sx={(theme) => ({ mb: theme.spacing(3) })}>
    {steps.map((step, index) => (
      <Box
        key={index}
        sx={(theme) => ({
          mb: theme.spacing(2),
          display: 'flex',
          gap: theme.spacing(2),
        })}
      >
        <Box
          sx={{
            minWidth: '32px',
            minHeight: '32px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={(theme) => ({ mt: theme.spacing(0.5) })}
          >
            {step.title}
          </Typography>

          {step.content}
        </Box>
      </Box>
    ))}
  </Box>
);
