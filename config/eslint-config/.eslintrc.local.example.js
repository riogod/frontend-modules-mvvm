/**
 * Пример локального конфига для расширения базового конфига
 * 
 * Скопируйте этот файл в нужную директорию как .eslintrc.local.js
 * и добавьте свои специфичные правила
 */

module.exports = {
  // Дополнительные правила
  rules: {
    // 'custom-rule': 'error',
  },
  
  // Дополнительные overrides
  overrides: [
    {
      files: ['src/specific/**/*.ts'],
      rules: {
        // '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
  
  // Дополнительные настройки
  settings: {
    // 'custom-setting': 'value',
  },
  
  // Дополнительные ignore patterns
  ignorePatterns: [
    // 'custom-pattern/**/*',
  ],
};

