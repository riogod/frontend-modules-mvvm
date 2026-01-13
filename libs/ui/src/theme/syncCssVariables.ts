import type { Theme } from '@mui/material/styles';

/**
 * Синхронизирует CSS переменные с темой MUI
 * Обновляет CSS переменные в :root на основе значений из темы
 * 
 * Поддерживает синхронизацию:
 * - Primary и Secondary цветов
 * - Semantic цветов (success, error, warning, info)
 * - Фоновых цветов
 * - Цветов текста
 * - Dividers и borders
 * - Shape параметров
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

  // Обновляем semantic цвета: success
  if (theme.palette.success?.main) {
    root.style.setProperty(
      '--mui-palette-success-main',
      theme.palette.success.main,
    );
  }
  if (theme.palette.success?.light) {
    root.style.setProperty(
      '--mui-palette-success-light',
      theme.palette.success.light,
    );
  }
  if (theme.palette.success?.dark) {
    root.style.setProperty(
      '--mui-palette-success-dark',
      theme.palette.success.dark,
    );
  }
  if (theme.palette.success?.contrastText) {
    root.style.setProperty(
      '--mui-palette-success-contrast-text',
      theme.palette.success.contrastText,
    );
  }

  // Обновляем semantic цвета: error
  if (theme.palette.error?.main) {
    root.style.setProperty(
      '--mui-palette-error-main',
      theme.palette.error.main,
    );
  }
  if (theme.palette.error?.light) {
    root.style.setProperty(
      '--mui-palette-error-light',
      theme.palette.error.light,
    );
  }
  if (theme.palette.error?.dark) {
    root.style.setProperty(
      '--mui-palette-error-dark',
      theme.palette.error.dark,
    );
  }
  if (theme.palette.error?.contrastText) {
    root.style.setProperty(
      '--mui-palette-error-contrast-text',
      theme.palette.error.contrastText,
    );
  }

  // Обновляем semantic цвета: warning
  if (theme.palette.warning?.main) {
    root.style.setProperty(
      '--mui-palette-warning-main',
      theme.palette.warning.main,
    );
  }
  if (theme.palette.warning?.light) {
    root.style.setProperty(
      '--mui-palette-warning-light',
      theme.palette.warning.light,
    );
  }
  if (theme.palette.warning?.dark) {
    root.style.setProperty(
      '--mui-palette-warning-dark',
      theme.palette.warning.dark,
    );
  }
  if (theme.palette.warning?.contrastText) {
    root.style.setProperty(
      '--mui-palette-warning-contrast-text',
      theme.palette.warning.contrastText,
    );
  }

  // Обновляем semantic цвета: info
  if (theme.palette.info?.main) {
    root.style.setProperty(
      '--mui-palette-info-main',
      theme.palette.info.main,
    );
  }
  if (theme.palette.info?.light) {
    root.style.setProperty(
      '--mui-palette-info-light',
      theme.palette.info.light,
    );
  }
  if (theme.palette.info?.dark) {
    root.style.setProperty(
      '--mui-palette-info-dark',
      theme.palette.info.dark,
    );
  }
  if (theme.palette.info?.contrastText) {
    root.style.setProperty(
      '--mui-palette-info-contrast-text',
      theme.palette.info.contrastText,
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
    // Обновляем кастомный цвет фона appBackground, если он задан
    if (theme.palette.background.appBackground) {
      root.style.setProperty(
        '--mui-palette-background-app-background',
        theme.palette.background.appBackground,
      );
    }
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
