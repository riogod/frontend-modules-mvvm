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
  }
}

export class RemoteModuleTimeoutError extends Error {
  constructor(
    public readonly moduleName: string,
    public readonly timeout: number,
  ) {
    super(`Timeout loading remote module "${moduleName}" after ${timeout}ms`);
    this.name = 'RemoteModuleTimeoutError';
  }
}

export class RemoteContainerNotFoundError extends Error {
  constructor(public readonly scope: string) {
    super(
      `Remote container "${scope}" not found. Make sure remoteEntry.js was loaded correctly.`,
    );
    this.name = 'RemoteContainerNotFoundError';
  }
}

