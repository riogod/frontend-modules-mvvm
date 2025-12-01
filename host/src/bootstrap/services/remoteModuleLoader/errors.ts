import { log } from '@platform/core';

export class RemoteModuleLoadError extends Error {
  constructor(
    public readonly moduleName: string,
    public readonly remoteEntry: string,
    public readonly originalError: Error,
    public readonly attempts: number,
  ) {
    super(
      `Failed to load remote module "${moduleName}" from ${remoteEntry}: ${originalError.message}`,
    );
    this.name = 'RemoteModuleLoadError';
    log.debug(
      `RemoteModuleLoadError created: ${moduleName} from ${remoteEntry} after ${attempts} attempts`,
      {
        prefix:
          'bootstrap.services.remoteModuleLoader.errors.RemoteModuleLoadError',
      },
      {
        moduleName,
        remoteEntry,
        attempts,
        originalError: originalError.message,
      },
    );
  }
}

export class RemoteModuleTimeoutError extends Error {
  constructor(
    public readonly moduleName: string,
    public readonly timeout: number,
  ) {
    super(`Timeout loading remote module "${moduleName}" after ${timeout}ms`);
    this.name = 'RemoteModuleTimeoutError';
    log.debug(
      `RemoteModuleTimeoutError created: ${moduleName} after ${timeout}ms`,
      {
        prefix:
          'bootstrap.services.remoteModuleLoader.errors.RemoteModuleTimeoutError',
      },
      {
        moduleName,
        timeout,
      },
    );
  }
}

export class RemoteContainerNotFoundError extends Error {
  constructor(public readonly scope: string) {
    super(
      `Remote container "${scope}" not found. Make sure remoteEntry.js was loaded correctly.`,
    );
    this.name = 'RemoteContainerNotFoundError';
    log.debug(
      `RemoteContainerNotFoundError created: ${scope}`,
      {
        prefix:
          'bootstrap.services.remoteModuleLoader.errors.RemoteContainerNotFoundError',
      },
      {
        scope,
      },
    );
  }
}
