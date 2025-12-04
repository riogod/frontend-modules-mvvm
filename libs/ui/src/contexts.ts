import { createContext } from "react";
import { type Container } from "inversify";

const DIContext = createContext<Container | null>(null);

if (process.env.NODE_ENV !== "production") {
  DIContext.displayName = "DIContext";
}

// Глобальный fallback для DI контейнера
// Используется когда React Context недоступен (например, в remote модулях)
declare global {
  // eslint-disable-next-line no-var
  var __PLATFORM_DI_CONTAINER__: Container | undefined;
}

/**
 * Устанавливает глобальный DI контейнер
 * Вызывается из хоста при инициализации
 */
export function setGlobalDIContainer(container: Container): void {
  globalThis.__PLATFORM_DI_CONTAINER__ = container;
}

/**
 * Получает глобальный DI контейнер
 * Используется как fallback когда React Context недоступен
 */
export function getGlobalDIContainer(): Container | null {
  return globalThis.__PLATFORM_DI_CONTAINER__ || null;
}

export { DIContext };
