import type { Theme } from '@mui/material/styles';

/**
 * Синхронизирует CSS переменные с темой MUI
 * Обновляет CSS переменные в :root на основе значений из темы
 */
export function syncCssVariables(theme: Theme): void {
  const root = document.documentElement;

  // Обновляем палитру primary
  if (theme.palette.primary?.main) {
    root.style.setProperty(
      '--mui-palette-primary-main',
      theme.palette.primary.main,
    );
  }
  if (theme.palette.primary?.light) {
    root.style.setProperty(
      '--mui-palette-primary-light',
      theme.palette.primary.light,
    );
  }
  if (theme.palette.primary?.dark) {
    root.style.setProperty(
      '--mui-palette-primary-dark',
      theme.palette.primary.dark,
    );
  }
  if (theme.palette.primary?.contrastText) {
    root.style.setProperty(
      '--mui-palette-primary-contrast-text',
      theme.palette.primary.contrastText,
    );
  }

  // Обновляем палитру secondary
  if (theme.palette.secondary?.main) {
    root.style.setProperty(
      '--mui-palette-secondary-main',
      theme.palette.secondary.main,
    );
  }
  if (theme.palette.secondary?.light) {
    root.style.setProperty(
      '--mui-palette-secondary-light',
      theme.palette.secondary.light,
    );
  }
  if (theme.palette.secondary?.dark) {
    root.style.setProperty(
      '--mui-palette-secondary-dark',
      theme.palette.secondary.dark,
    );
  }
  if (theme.palette.secondary?.contrastText) {
    root.style.setProperty(
      '--mui-palette-secondary-contrast-text',
      theme.palette.secondary.contrastText,
    );
  }

  // Обновляем фоновые цвета
  if (theme.palette.background) {
    root.style.setProperty(
      '--mui-palette-background-default',
      theme.palette.background.default,
    );
    root.style.setProperty(
      '--mui-palette-background-paper',
      theme.palette.background.paper,
    );
  }

  // Обновляем цвета текста
  if (theme.palette.text) {
    root.style.setProperty(
      '--mui-palette-text-primary',
      theme.palette.text.primary,
    );
    root.style.setProperty(
      '--mui-palette-text-secondary',
      theme.palette.text.secondary,
    );
    root.style.setProperty(
      '--mui-palette-text-disabled',
      theme.palette.text.disabled,
    );
  }

  // Обновляем divider
  if (theme.palette.divider) {
    root.style.setProperty('--mui-palette-divider', theme.palette.divider);
  }

  // Обновляем border radius
  if (theme.shape?.borderRadius) {
    const borderRadius =
      typeof theme.shape.borderRadius === 'number'
        ? `${theme.shape.borderRadius}px`
        : theme.shape.borderRadius;
    root.style.setProperty('--mui-shape-border-radius', borderRadius);
  }

  // Устанавливаем атрибут data-theme для поддержки темной темы в CSS
  root.setAttribute('data-theme', theme.palette.mode || 'light');
}
