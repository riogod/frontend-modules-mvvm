export type ThemeMode = 'light' | 'dark' | 'system';

export type LoadingPhase =
  | 'init' // Bootstrap handler chain + ModuleLoader init
  | 'bootstraped' // Load INIT modules (before render)
  | 'finalized' // Finalize loading
  | 'error';
