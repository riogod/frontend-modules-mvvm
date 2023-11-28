import { useContext } from "react";
import { DIContext } from "../contexts";

/**
 * Возвращает API модуль из контекста
 */
function useVM<T>(diInstance: any): T {
  const container = useContext(DIContext);
  if (!container) {
    throw Error("DI Container context not initialized");
  }
  return container.get<T>(diInstance);
}

export { useVM };
