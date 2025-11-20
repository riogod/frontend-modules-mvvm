/**
 * Опции для создания ESLint конфигурации
 */
export interface ESLintConfig {
    root?: boolean;
    extends?: string[];
    plugins?: string[];
    ignorePatterns?: string[];
    env?: Record<string, boolean>;
    settings?: Record<string, unknown>;
    rules?: Record<string, unknown>;
    overrides?: Array<{
        files?: string | string[];
        extends?: string[];
        parser?: string;
        parserOptions?: Record<string, unknown>;
        rules?: Record<string, unknown>;
        env?: Record<string, boolean>;
    }>;
}

export interface CreateEslintConfigOptions {
    /**
     * Путь к tsconfig.json для type-aware правил
     */
    tsconfigPath?: string | string[];

    /**
     * Включить поддержку React
     */
    react?: boolean;

    /**
     * Включить поддержку тестов (более мягкие правила)
     */
    test?: boolean;

    /**
     * Дополнительные ignore patterns
     */
    ignorePatterns?: string[];

    /**
     * Дополнительные правила
     */
    rules?: ESLintConfig['rules'];

    /**
     * Дополнительные overrides
     */
    overrides?: ESLintConfig['overrides'];

    /**
     * Дополнительные настройки
     */
    settings?: ESLintConfig['settings'];

    /**
     * Environment настройки
     */
    env?: ESLintConfig['env'];

    /**
     * Дополнительные extends
     */
    extends?: string[];
}

