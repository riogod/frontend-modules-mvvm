import type { UserConfig, Plugin } from 'vite';
import type { InlineConfig } from 'vitest/config';
import type { AppManifest } from './plugins/types.js';

export type ViteConfig = UserConfig & { test?: InlineConfig };

export interface CreateViteConfigOptions {
  dirname: string;
  cacheDir?: string;
  outDir?: string;
  coverageDir?: string;
  vitestSetupFile?: string;
  react?: boolean;
  svgr?: boolean;
  dts?: boolean;
  dtsTsconfigPath?: string;
  lib?: {
    entry: string;
    name: string;
    fileName?: string | ((format: string) => string);
    formats?: ('es' | 'cjs' | 'umd' | 'iife')[];
  };
  external?: string[];
  plugins?: UserConfig['plugins'];
  resolve?: UserConfig['resolve'];
  build?: UserConfig['build'];
  server?: UserConfig['server'];
  preview?: UserConfig['preview'];
  test?: InlineConfig;
  define?: UserConfig['define'];
  localConfigPath?: string;
}

export type ConfigType = 'base' | 'host' | 'lib';

export interface CreateViteConfigFactoryOptions
  extends CreateViteConfigOptions {
  type: ConfigType;
  libName?: string;
}

export function createBaseConfig(options: {
  dirname: string;
  cacheDir?: string;
  plugins?: ViteConfig['plugins'];
  resolve?: ViteConfig['resolve'];
  test?: ViteConfig['test'];
}): ViteConfig;

export function createHostConfig(options: {
  dirname: string;
  cacheDir?: string;
  outDir?: string;
  coverageDir?: string;
  vitestSetupFile?: string;
  resolve?: ViteConfig['resolve'];
  server?: ViteConfig['server'];
  preview?: ViteConfig['preview'];
  define?: ViteConfig['define'];
  build?: ViteConfig['build'];
  plugins?: ViteConfig['plugins'];
}): ViteConfig;

export function createLibConfig(options: {
  dirname: string;
  libName: string;
  cacheDir?: string;
  outDir?: string;
  coverageDir?: string;
  vitestSetupFile?: string;
  react?: boolean;
  dts?: boolean;
  dtsTsconfigPath?: string;
  lib?: CreateViteConfigOptions['lib'];
  external?: string[];
  build?: ViteConfig['build'];
  plugins?: ViteConfig['plugins'];
}): ViteConfig;

export interface CreateModuleConfigOptions {
  dirname: string;
  moduleName: string;
  localConfigPath?: string;
  exposes?: Record<string, string>;
  shared?: Record<string, any>;
  cacheDir?: string;
  outDir?: string;
  server?: ViteConfig['server'];
  preview?: ViteConfig['preview'];
  build?: ViteConfig['build'];
  plugins?: ViteConfig['plugins'];
}

export function createModuleConfig(
  options: CreateModuleConfigOptions,
): Promise<ViteConfig>;

export function createViteConfig(
  options: CreateViteConfigFactoryOptions,
): ViteConfig | ((env: { mode: string }) => ViteConfig);

// Плагины для MFE
export function createModuleAliasesPlugin(options: {
  manifest: AppManifest | null;
  packagesDir: string;
}): Plugin;

export function createManifestMiddleware(options: {
  manifest: AppManifest | null;
  defaultUser?: {
    permissions: string[];
    featureFlags: string[];
  };
}): Plugin;

export function loadManifest(options: {
  dirname: string;
  manifestPath?: string;
  packagesDir?: string;
  createFallback?: boolean;
}): AppManifest | null;

export type {
  AppManifest,
  ModuleManifestEntry,
  ModuleAliasesOptions,
  ManifestMiddlewareOptions,
} from './plugins/types.js';

export type { LoadManifestOptions } from './plugins/loadManifest.js';
