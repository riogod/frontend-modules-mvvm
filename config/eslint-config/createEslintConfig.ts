import type { ESLintConfig, CreateEslintConfigOptions } from './types';
import { baseConfig } from './base.config';
import { createAppConfig } from './app.config';
import { createLibConfig } from './lib.config';
import path from 'path';
import fs from 'fs';

export type ConfigType = 'base' | 'app' | 'lib';

export interface CreateEslintConfigFactoryOptions extends CreateEslintConfigOptions {
    /**
     * Тип конфигурации: base, app, или lib
     */
    type: ConfigType;

    /**
     * Путь к локальному конфигу для расширения (опционально)
     * Если файл существует, он будет загружен и объединен с базовым конфигом
     */
    localConfigPath?: string;
}

/**
 * Загружает локальный конфиг если он существует
 */
function loadLocalConfig(localConfigPath?: string): Partial<CreateEslintConfigOptions> | null {
    if (!localConfigPath) {
        return null;
    }

    const resolvedPath = path.resolve(localConfigPath);

    if (!fs.existsSync(resolvedPath)) {
        return null;
    }

    try {
        // Поддерживаем как .js/.mjs, так и .json файлы
        if (resolvedPath.endsWith('.json')) {
            const content = fs.readFileSync(resolvedPath, 'utf-8');
            return JSON.parse(content);
        } else {
            // Для .js/.mjs файлов используем require
            delete require.cache[resolvedPath];
            return require(resolvedPath);
        }
    } catch (error) {
        console.warn(`Failed to load local config from ${resolvedPath}:`, error);
        return null;
    }
}


/**
 * Фабрика для создания ESLint конфигураций
 * Поддерживает расширение локальными конфигами
 */
export function createEslintConfig(options: CreateEslintConfigFactoryOptions): ESLintConfig {
    const { type, localConfigPath, ...restOptions } = options;

    // Загружаем локальный конфиг если он существует
    const localConfig = loadLocalConfig(localConfigPath);

    // Объединяем опции с локальным конфигом
    const mergedOptions = localConfig
        ? {
            ...restOptions,
            rules: { ...restOptions.rules, ...localConfig.rules },
            overrides: [...(restOptions.overrides || []), ...(localConfig.overrides || [])],
            settings: { ...restOptions.settings, ...localConfig.settings },
            env: { ...restOptions.env, ...localConfig.env },
            ignorePatterns: [
                ...(restOptions.ignorePatterns || []),
                ...(localConfig.ignorePatterns || []),
            ],
            react: localConfig.react ?? restOptions.react,
            tsconfigPath: localConfig.tsconfigPath || restOptions.tsconfigPath,
        }
        : restOptions;

    // Создаем базовый конфиг в зависимости от типа
    let base: ESLintConfig;

    switch (type) {
        case 'app':
            base = createAppConfig({
                tsconfigPath:
                    typeof mergedOptions.tsconfigPath === 'string'
                        ? mergedOptions.tsconfigPath
                        : mergedOptions.tsconfigPath?.[0],
                localRules: mergedOptions.rules,
                localOverrides: mergedOptions.overrides,
                localSettings: mergedOptions.settings,
                localIgnorePatterns: mergedOptions.ignorePatterns,
            });
            break;

        case 'lib':
            base = createLibConfig({
                react: mergedOptions.react,
                tsconfigPath:
                    typeof mergedOptions.tsconfigPath === 'string'
                        ? mergedOptions.tsconfigPath
                        : mergedOptions.tsconfigPath?.[0],
                localRules: mergedOptions.rules,
                localOverrides: mergedOptions.overrides,
                localSettings: mergedOptions.settings,
                localIgnorePatterns: mergedOptions.ignorePatterns,
                localEnv: mergedOptions.env,
            });
            break;

        case 'base':
        default:
            base = baseConfig;
            if (mergedOptions.rules) {
                base.rules = { ...base.rules, ...mergedOptions.rules };
            }
            if (mergedOptions.overrides) {
                base.overrides = [...(base.overrides || []), ...mergedOptions.overrides];
            }
            if (mergedOptions.settings) {
                base.settings = { ...mergedOptions.settings };
            }
            if (mergedOptions.env) {
                base.env = { ...mergedOptions.env };
            }
            if (mergedOptions.ignorePatterns) {
                base.ignorePatterns = [
                    ...(base.ignorePatterns || []),
                    ...mergedOptions.ignorePatterns,
                ];
            }
            break;
    }

    return base;
}

