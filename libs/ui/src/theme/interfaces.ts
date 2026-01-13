import '@mui/material/styles';

/**
 * Расширение типов MUI для поддержки кастомных параметров темы
 * Использует TypeScript module augmentation для добавления новых полей
 */
declare module '@mui/material/styles' {
  /**
   * Расширение интерфейса TypeBackground для добавления кастомных цветов фона
   */
  interface TypeBackground {
    appBackground: string;
  }

  /**
   * Расширение интерфейса Shape для добавления кастомного радиуса скругления элементов
   */
  interface Shape {
    borderElementRadius: number | string;
    radius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      full: number;
    };
  }

  interface ShapeOptions {
    borderElementRadius?: number | string;
    radius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      full: number;
    };
  }
}

/**
 * Реэкспорт ThemeOptions из MUI с расширенными типами
 */
export type { ThemeOptions } from '@mui/material/styles';
