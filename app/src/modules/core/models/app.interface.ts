export type ThemeMode = "light" | "dark" | "system";


export type AccessControlsType<T = Record<string, unknown>> = T extends Record<string, infer V>
    ? V extends string
    ? Record<string | V, boolean>
    : Record<string | keyof T, boolean>
    : Record<string | keyof T, boolean>;