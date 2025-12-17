/**
 * Утилиты для работы с модулями.
 * @module utils/moduleUtils
 */

import type { Module } from '../../../../modules/interface';

/**
 * Возвращает зависимости модуля.
 *
 * Централизованная функция для получения зависимостей модуля,
 * устраняющая дублирование логики в разных частях кода.
 *
 * @param module - Модуль для получения зависимостей
 * @returns Массив имен зависимостей (пустой массив, если зависимостей нет)
 *
 * @example
 * ```typescript
 * const deps = getModuleDependencies(module);
 * if (deps.length > 0) {
 *   // Обработка зависимостей
 * }
 * ```
 */
export function getModuleDependencies(module: Module): string[] {
  return module.loadCondition?.dependencies ?? [];
}

/**
 * Проверяет, есть ли у модуля зависимости.
 *
 * @param module - Модуль для проверки
 * @returns true, если у модуля есть зависимости
 */
export function hasDependencies(module: Module): boolean {
  const deps = getModuleDependencies(module);
  return deps.length > 0;
}
