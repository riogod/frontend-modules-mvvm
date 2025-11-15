import { log } from '@todo/core';
import { injectable } from 'inversify';

@injectable()
class LocalStorageRepository {
  getKey<T>(key: string): T {
    try {
      return localStorage.getItem(key) as T;
    } catch (error) {
      log.error('Error getting key', { prefix: 'localStorage.repository', error });
      throw error;
    }
  }

  setKey<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, value as string);
    } catch (error) {
      log.error('Error setting key', { prefix: 'localStorage.repository', error });
      throw error;
    }
  }

  removeKey(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      log.error('Error removing key', { prefix: 'localStorage.repository', error });
      throw error;
    }
  }
}

export { LocalStorageRepository };
