/**
 * ESLint правило: запрет импорта глобальных CSS в MFE модулях
 * Разрешены только CSS Modules (.module.css) и импорты из @platform/ui
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow global CSS imports in MFE modules',
      category: 'Best Practices',
    },
    messages: {
      noGlobalCss:
        'Global CSS imports are not allowed in modules. Use MUI sx prop, styled components, or CSS Modules instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Проверяем импорт CSS файлов
        if (
          typeof importPath === 'string' &&
          (importPath.endsWith('.css') || importPath.endsWith('.scss'))
        ) {
          // Разрешаем CSS Modules
          if (importPath.includes('.module.')) {
            return;
          }

          // Разрешаем импорт из @platform/ui
          if (importPath.includes('@platform/ui')) {
            return;
          }

          // Разрешаем импорт из node_modules (библиотеки)
          if (importPath.startsWith('@') || !importPath.startsWith('.')) {
            return;
          }

          context.report({
            node,
            messageId: 'noGlobalCss',
          });
        }
      },
    };
  },
};
