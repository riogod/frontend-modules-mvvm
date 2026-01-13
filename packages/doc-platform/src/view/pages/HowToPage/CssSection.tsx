import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const CssSection: FC = () => (
  <DocSection title="CSS">
    <DocSection title="CSS-in-JS">
      <p>Используйте MUI emotion стили:</p>
      <DocCodeBlock
        code={`import { Box, styled } from '@mui/material';

// ✅ sx prop
<Box
  sx={{
    padding: 2,
    backgroundColor: 'primary.main',
    '&:hover': {
      backgroundColor: 'primary.dark',
    },
  }}
>
  Content
</Box>

// ✅ styled
const StyledBox = styled(Box)({
  padding: 16,
  backgroundColor: 'var(--mui-palette-primary-main)',
  '&:hover': {
    backgroundColor: 'var(--mui-palette-primary-dark)',
  },
});

<StyledBox>Content</StyledBox>`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="CSS Modules">
      <p>Не рекомендуется для MFE модулей:</p>
      <DocCodeBlock
        code={`// ❌ НЕ РЕКОМЕНДУЕТСЯ ДЛЯ MFE МОДУЛЕЙ
import styles from './Component.module.css';

<div className={styles.container}>Content</div>`}
        language="typescript"
      />
      <DocNote type="error" title="Правило для MFE модулей">
        Не используйте глобальные CSS файлы в MFE модулях. Это может привести к
        конфликтам стилей между модулями.
      </DocNote>
    </DocSection>
    <DocSection title="CSS Variables">
      <p>Используйте CSS переменные из темы MUI:</p>
      <DocCodeBlock
        code={`const StyledComponent = styled('div')({
  color: 'var(--mui-palette-primary-main)',
  backgroundColor: 'var(--mui-palette-background-paper)',
  padding: 'var(--mui-spacing-2)',
});

// Доступные переменные
--mui-palette-primary-main
--mui-palette-primary-light
--mui-palette-primary-dark
--mui-palette-secondary-main
--mui-palette-background-paper
--mui-palette-background-default
--mui-palette-text-primary
--mui-palette-text-secondary
--mui-palette-error-main
--mui-palette-success-main
--mui-palette-warning-main
--mui-palette-info-main
--mui-spacing-1 / --mui-spacing-2 / --mui-spacing-3...`}
        language="typescript"
      />
      <p>ThemeSchema автоматически синхронизирует CSS переменные с темой.</p>
    </DocSection>
    <DocSection title="Примеры стилей">
      <DocCodeBlock
        code={`import { styled } from '@mui/material';

// Карточка
const Card = styled('div')({
  padding: 16,
  backgroundColor: 'var(--mui-palette-background-paper)',
  border: '1px solid var(--mui-palette-divider)',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',

  '&:hover': {
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
});

// Кнопка
const Button = styled('button')(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: 'var(--mui-palette-primary-main)',
  color: 'var(--mui-palette-primary-contrastText)',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'background-color 0.2s',

  '&:hover': {
    backgroundColor: 'var(--mui-palette-primary-dark)',
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}));

// Адаптивный компонент
const ResponsiveBox = styled('div')({
  padding: 16,

  '@media (max-width: 600px)': {
    padding: 8,
  },

  '@media (max-width: 400px)': {
    padding: 4,
  },
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Типизация sx prop">
      <DocCodeBlock
        code={`import { SxProps, Theme } from '@mui/material/styles';

interface MyComponentProps {
  sx?: SxProps<Theme>;
}

const MyComponent = ({ sx }: MyComponentProps) => (
  <Box sx={sx}>Content</Box>
);`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Best Practices">
      <DocList
        items={[
          'Используйте CSS-in-JS (sx prop, styled)',
          'Используйте CSS переменные из темы',
          'Избегайте глобальных CSS файлов в MFE модулях',
          'Типизируйте sx prop для компонентов',
          'Используйте theme.spacing() для отступов',
        ]}
      />
    </DocNote>
  </DocSection>
);
