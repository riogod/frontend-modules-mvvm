/**
 * Цветовые палитры для системы дизайна MFP
 *
 * Содержит полные цветовые шкалы для primary, secondary и semantic цветов.
 * Используется для создания light и dark тем.
 */

/**
 * Primary цвет: Indigo
 * Профессиональный, современный цвет для основных действий
 */
export const primaryColors = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1', // Main
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
} as const;

/**
 * Secondary цвет: Teal
 * Дополнительный цвет для вторичных действий и акцентов
 */
export const secondaryColors = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6', // Main
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
} as const;

/**
 * Success цвет: Green
 * Для успешных операций и положительных статусов
 */
export const successColors = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Main
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
} as const;

/**
 * Error цвет: Red
 * Для ошибок и деструктивных действий
 */
export const errorColors = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444', // Main
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
} as const;

/**
 * Warning цвет: Orange/Amber
 * Для предупреждений и предостережений
 */
export const warningColors = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b', // Main
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
} as const;

/**
 * Info цвет: Blue
 * Для информационных сообщений и подсказок
 */
export const infoColors = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Main
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
} as const;
