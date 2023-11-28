import { injectable } from "inversify";

@injectable()
class LocalStorageRepository {
  constructor() {}

  getKey<T>(key: string): T {
    return localStorage.getItem(key) as T;
  }

  setKey<T>(key: string, value: T): void {
    localStorage.setItem(key, value as string);
  }

  removeKey(key: string): void {
    localStorage.removeItem(key);
  }
}

export { LocalStorageRepository };
