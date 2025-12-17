#!/usr/bin/env node
/**
 * @fileoverview Скрипт для генерации 100 MFE модулей с DI сущностями для нагрузочного теста
 * Запуск: node scripts/generate-load-test-modules.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ModuleGenerator } from './launcher/index.mjs';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(projectRoot, 'packages');

/**
 * Преобразует kebab-case в UPPER_SNAKE_CASE
 */
function toUpperSnakeCase(str) {
  return str.toUpperCase().replace(/-/g, '_');
}

/**
 * Преобразует kebab-case в PascalCase
 */
function toPascalCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Преобразует kebab-case в camelCase
 */
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Генерирует содержимое модели
 */
function generateModel(moduleName, index, modulePrefix) {
  const modelName = `${modulePrefix}Model${index}`;
  const className = `${toPascalCase(modulePrefix)}Model${index}`;
  const tokenName = `MODEL_${toUpperSnakeCase(modulePrefix)}_${index}`;

  return `import { action, computed, makeAutoObservable } from 'mobx';
import { injectable } from 'inversify';

export interface ${className}Data {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class ${className} {
  private _items: ${className}Data[] = [];
  private _filter: string = '';

  get items(): ${className}Data[] {
    return this._items;
  }

  get filteredItems(): ${className}Data[] {
    if (!this._filter) return this._items;
    return this._items.filter((item) => item.name.includes(this._filter));
  }

  get count(): number {
    return this._items.length;
  }

  constructor() {
    makeAutoObservable(this, {
      items: computed,
      filteredItems: computed,
      count: computed,
      addItem: action,
      removeItem: action,
      updateItem: action,
      setFilter: action,
    });
  }

  addItem(item: Omit<${className}Data, 'id' | 'createdAt' | 'updatedAt'>): void {
    this._items.push({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  removeItem(id: string): void {
    this._items = this._items.filter((item) => item.id !== id);
  }

  updateItem(id: string, updates: Partial<${className}Data>): void {
    const item = this._items.find((item) => item.id === id);
    if (item) {
      Object.assign(item, updates);
      item.updatedAt = new Date();
    }
  }

  setFilter(filter: string): void {
    this._filter = filter;
  }

  dispose(): void {
    this._items = [];
    this._filter = '';
  }
}
`;
}

/**
 * Генерирует содержимое usecase
 */
function generateUsecase(
  moduleName,
  index,
  modulePrefix,
  dependencies,
  diTokens,
) {
  const usecaseName = `${modulePrefix}Usecase${index}`;
  const className = `${toPascalCase(modulePrefix)}Usecase${index}`;
  const tokenName = `USECASE_${toUpperSnakeCase(modulePrefix)}_${index}`;

  // Создаем зависимости от других сущностей
  const injects = dependencies.length > 0
    ? dependencies
        .map((dep, idx) => {
          const depType = dep.type === 'model' ? 'Model' : 'Usecase';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          const depToken = dep.type === 'model' 
            ? `MODEL_${toUpperSnakeCase(modulePrefix)}_${dep.index}`
            : `USECASE_${toUpperSnakeCase(modulePrefix)}_${dep.index}`;
          const comma = idx < dependencies.length - 1 ? ',' : '';
          return `    @inject(${diTokens}.${depToken})
    private ${toCamelCase(modulePrefix)}${depType}${dep.index}: ${depClassName}${comma}`;
        })
        .join('\n')
    : '';

  const constructorParams = injects || '';

  const imports = dependencies.length > 0
    ? dependencies
        .map((dep) => {
          const depType = dep.type === 'model' ? 'Model' : 'Usecase';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          return `import { ${depClassName} } from '../${dep.type === 'model' ? 'models' : 'usecases'}/${toCamelCase(modulePrefix)}${dep.type === 'model' ? 'Model' : 'Usecase'}${dep.index}.ts';`;
        })
        .join('\n')
    : '';

  return `import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { ${diTokens} } from '../config/di.tokens';
${imports ? imports + '\n' : ''}
@injectable()
export class ${className} {
  private _result: string = '';
  private _isLoading: boolean = false;

  get result(): string {
    return this._result;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  constructor(${dependencies.length > 0 ? '\n' + constructorParams + '\n' : ''}) {
    makeAutoObservable(this);
  }

  async execute(params: { value: string; count?: number }): Promise<void> {
    this._isLoading = true;
    try {
      // Симуляция асинхронной операции
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      // Использование зависимостей
      ${dependencies
        .map((dep, idx) => {
          const depVar = `this.${toCamelCase(modulePrefix)}${dep.type === 'model' ? 'Model' : 'Usecase'}${dep.index}`;
          if (dep.type === 'model') {
            return `${depVar}.addItem({ name: params.value, value: params.count || 0 });`;
          } else {
            return `await ${depVar}.execute({ value: params.value, count: params.count });`;
          }
        })
        .join('\n      ') || '// No dependencies to use'}
      
      this._result = \`Processed: \${params.value} (count: \${params.count || 0})\`;
    } finally {
      this._isLoading = false;
    }
  }

  reset(): void {
    this._result = '';
    this._isLoading = false;
  }
}
`;
}

/**
 * Генерирует содержимое repository
 */
function generateRepository(moduleName, index, modulePrefix) {
  const repoName = `${modulePrefix}Repository${index}`;
  const className = `${toPascalCase(modulePrefix)}Repository${index}`;
  const tokenName = `REPOSITORY_${toUpperSnakeCase(modulePrefix)}_${index}`;

  return `import { injectable } from 'inversify';

export interface ${className}Data {
  id: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

@injectable()
export class ${className} {
  private storage: Map<string, ${className}Data> = new Map();

  async get(id: string): Promise<${className}Data | null> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return this.storage.get(id) || null;
  }

  async set(id: string, data: Record<string, unknown>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    this.storage.set(id, {
      id,
      data,
      timestamp: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    this.storage.delete(id);
  }

  async getAll(): Promise<${className}Data[]> {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return Array.from(this.storage.values());
  }

  clear(): void {
    this.storage.clear();
  }
}
`;
}

/**
 * Генерирует содержимое service
 */
function generateService(moduleName, index, modulePrefix, dependencies, diTokens) {
  const serviceName = `${modulePrefix}Service${index}`;
  const className = `${toPascalCase(modulePrefix)}Service${index}`;
  const tokenName = `SERVICE_${toUpperSnakeCase(modulePrefix)}_${index}`;

  const injects = dependencies.length > 0
    ? dependencies
        .map((dep, idx) => {
          const depType = dep.type === 'repository' ? 'Repository' : 'Service';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          const depToken = dep.type === 'repository'
            ? `REPOSITORY_${toUpperSnakeCase(modulePrefix)}_${dep.index}`
            : `SERVICE_${toUpperSnakeCase(modulePrefix)}_${dep.index}`;
          const comma = idx < dependencies.length - 1 ? ',' : '';
          return `    @inject(${diTokens}.${depToken})
    private ${toCamelCase(modulePrefix)}${depType}${dep.index}: ${depClassName}${comma}`;
        })
        .join('\n')
    : '';

  const constructorParams = injects || '';

  const imports = dependencies.length > 0
    ? dependencies
        .map((dep) => {
          const depType = dep.type === 'repository' ? 'Repository' : 'Service';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          return `import { ${depClassName} } from '../data/${toCamelCase(modulePrefix)}${depType === 'Repository' ? 'Repository' : 'Service'}${dep.index}.ts';`;
        })
        .join('\n')
    : '';

  return `import { inject, injectable } from 'inversify';
import { ${diTokens} } from '../config/di.tokens';
${imports ? imports + '\n' : ''}
@injectable()
export class ${className} {
  private cache: Map<string, unknown> = new Map();

  constructor(${dependencies.length > 0 ? '\n' + constructorParams + '\n' : ''}) {}

  async process(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = { ...data };
    
    ${dependencies
      .map((dep, idx) => {
        const depVar = `this.${toCamelCase(modulePrefix)}${dep.type === 'repository' ? 'Repository' : 'Service'}${dep.index}`;
        if (dep.type === 'repository') {
          return `const stored${dep.index} = await ${depVar}.get(data.id as string);
      if (stored${dep.index}) {
        result.stored = stored${dep.index}.data;
      }`;
        } else {
          return `const processed${dep.index} = await ${depVar}.process(data);
      Object.assign(result, processed${dep.index});`;
        }
      })
      .join('\n    ') || '// No dependencies'}
    
    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
`;
}

/**
 * Генерирует содержимое viewmodel
 */
function generateViewModel(moduleName, index, modulePrefix, dependencies, diTokens) {
  const vmName = `${modulePrefix}ViewModel${index}`;
  const className = `${toPascalCase(modulePrefix)}ViewModel${index}`;
  const tokenName = `VIEW_MODEL_${toUpperSnakeCase(modulePrefix)}_${index}`;

  const injects = dependencies.length > 0
    ? dependencies
        .map((dep, idx) => {
          const depType = dep.type === 'model' ? 'Model' : 'Usecase';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          const depToken = dep.type === 'model'
            ? `MODEL_${toUpperSnakeCase(modulePrefix)}_${dep.index}`
            : `USECASE_${toUpperSnakeCase(modulePrefix)}_${dep.index}`;
          const comma = idx < dependencies.length - 1 ? ',' : '';
          return `    @inject(${diTokens}.${depToken})
    private ${toCamelCase(modulePrefix)}${depType}${dep.index}: ${depClassName}${comma}`;
        })
        .join('\n')
    : '';

  const constructorParams = injects || '';

  const imports = dependencies.length > 0
    ? dependencies
        .map((dep) => {
          const depType = dep.type === 'model' ? 'Model' : 'Usecase';
          const depClassName = `${toPascalCase(modulePrefix)}${depType}${dep.index}`;
          return `import { ${depClassName} } from '../${dep.type === 'model' ? 'models' : 'usecases'}/${toCamelCase(modulePrefix)}${dep.type === 'model' ? 'Model' : 'Usecase'}${dep.index}.ts';`;
        })
        .join('\n')
    : '';

  return `import { makeAutoObservable, computed } from 'mobx';
import { inject, injectable } from 'inversify';
import { ${diTokens} } from '../config/di.tokens';
${imports ? imports + '\n' : ''}
@injectable()
export class ${className} {
  get items() {
    ${(() => {
      const modelDep = dependencies.find((d) => d.type === 'model');
      return modelDep
        ? `return this.${toCamelCase(modulePrefix)}Model${modelDep.index}.items;`
        : 'return [];';
    })()}
  }

  get isLoading() {
    ${(() => {
      const usecaseDep = dependencies.find((d) => d.type === 'usecase');
      return usecaseDep
        ? `return this.${toCamelCase(modulePrefix)}Usecase${usecaseDep.index}.isLoading;`
        : 'return false;';
    })()}
  }

  constructor(${dependencies.length > 0 ? '\n' + constructorParams + '\n' : ''}) {
    makeAutoObservable(this);
  }

  async loadData(value: string): Promise<void> {
    ${(() => {
      const usecaseDep = dependencies.find((d) => d.type === 'usecase');
      return usecaseDep
        ? `await this.${toCamelCase(modulePrefix)}Usecase${usecaseDep.index}.execute({ value });`
        : '// No usecase to call';
    })()}
  }

  dispose(): void {
    ${dependencies
      .filter((d) => d.type === 'model')
      .map((dep) => `this.${toCamelCase(modulePrefix)}Model${dep.index}.dispose();`)
      .join('\n    ') || '// No models to dispose'}
  }
}
`;
}

/**
 * Генерирует DI токены
 */
function generateDITokens(moduleName, modulePrefix, entities) {
  const tokensEnum = toUpperSnakeCase(moduleName);
  const tokens = [];

  // Models
  entities.models.forEach((idx) => {
    tokens.push(`  MODEL_${toUpperSnakeCase(modulePrefix)}_${idx} = '${toPascalCase(modulePrefix)}Model${idx}',`);
  });

  // ViewModels
  entities.viewmodels.forEach((idx) => {
    tokens.push(`  VIEW_MODEL_${toUpperSnakeCase(modulePrefix)}_${idx} = '${toPascalCase(modulePrefix)}ViewModel${idx}',`);
  });

  // Usecases
  entities.usecases.forEach((idx) => {
    tokens.push(`  USECASE_${toUpperSnakeCase(modulePrefix)}_${idx} = '${toPascalCase(modulePrefix)}Usecase${idx}',`);
  });

  // Repositories
  entities.repositories.forEach((idx) => {
    tokens.push(`  REPOSITORY_${toUpperSnakeCase(modulePrefix)}_${idx} = '${toPascalCase(modulePrefix)}Repository${idx}',`);
  });

  // Services
  entities.services.forEach((idx) => {
    tokens.push(`  SERVICE_${toUpperSnakeCase(modulePrefix)}_${idx} = '${toPascalCase(modulePrefix)}Service${idx}',`);
  });

  return `export enum ${tokensEnum}_DI_TOKENS {
${tokens.join('\n')}
}
`;
}

/**
 * Генерирует DI конфигурацию
 */
function generateDIConfig(moduleName, modulePrefix, entities) {
  const tokensEnum = `${toUpperSnakeCase(moduleName)}_DI_TOKENS`;
  const imports = [];
  const bindings = [];

  // Models
  entities.models.forEach((idx) => {
    const className = `${toPascalCase(modulePrefix)}Model${idx}`;
    imports.push(`import { ${className} } from '../models/${toCamelCase(modulePrefix)}Model${idx}.ts';`);
    bindings.push(
      `  container.bind(${tokensEnum}.MODEL_${toUpperSnakeCase(modulePrefix)}_${idx}).to(${className});`,
    );
  });

  // ViewModels
  entities.viewmodels.forEach((idx) => {
    const className = `${toPascalCase(modulePrefix)}ViewModel${idx}`;
    imports.push(`import { ${className} } from '../viewmodels/${toCamelCase(modulePrefix)}ViewModel${idx}.ts';`);
    bindings.push(
      `  container.bind(${tokensEnum}.VIEW_MODEL_${toUpperSnakeCase(modulePrefix)}_${idx}).to(${className});`,
    );
  });

  // Usecases
  entities.usecases.forEach((idx) => {
    const className = `${toPascalCase(modulePrefix)}Usecase${idx}`;
    imports.push(`import { ${className} } from '../usecases/${toCamelCase(modulePrefix)}Usecase${idx}.ts';`);
    bindings.push(
      `  container.bind(${tokensEnum}.USECASE_${toUpperSnakeCase(modulePrefix)}_${idx}).to(${className});`,
    );
  });

  // Repositories
  entities.repositories.forEach((idx) => {
    const className = `${toPascalCase(modulePrefix)}Repository${idx}`;
    imports.push(`import { ${className} } from '../data/${toCamelCase(modulePrefix)}Repository${idx}.ts';`);
    bindings.push(
      `  container.bind(${tokensEnum}.REPOSITORY_${toUpperSnakeCase(modulePrefix)}_${idx}).to(${className});`,
    );
  });

  // Services
  entities.services.forEach((idx) => {
    const className = `${toPascalCase(modulePrefix)}Service${idx}`;
    imports.push(`import { ${className} } from '../data/${toCamelCase(modulePrefix)}Service${idx}.ts';`);
    bindings.push(
      `  container.bind(${tokensEnum}.SERVICE_${toUpperSnakeCase(modulePrefix)}_${idx}).to(${className});`,
    );
  });

  return `import type { Container } from 'inversify';
import { ${tokensEnum} } from './di.tokens';

${imports.join('\n')}

export const DI_CONFIG = (container: Container) => {
${bindings.join('\n')}

  return container;
};
`;
}

/**
 * Создает зависимости между сущностями
 */
function createDependencies(entities, entityType, entityIndex) {
  const deps = [];
  const maxDeps = 3; // Максимум 3 зависимости на сущность

  // Зависимости от моделей
  if (entities.models.length > 0 && entityType !== 'model') {
    const modelIdx = entities.models[Math.floor(Math.random() * entities.models.length)];
    if (modelIdx !== entityIndex || entities.models.length > 1) {
      deps.push({ type: 'model', index: modelIdx });
    }
  }

  // Зависимости от usecases (только для viewmodels и других usecases)
  if (entities.usecases.length > 0 && (entityType === 'viewmodel' || entityType === 'usecase')) {
    const usecaseIdx = entities.usecases[Math.floor(Math.random() * entities.usecases.length)];
    if (usecaseIdx !== entityIndex || entities.usecases.length > 1) {
      deps.push({ type: 'usecase', index: usecaseIdx });
    }
  }

  // Зависимости от repositories (для services)
  if (entities.repositories.length > 0 && entityType === 'service') {
    const repoIdx = entities.repositories[Math.floor(Math.random() * entities.repositories.length)];
    deps.push({ type: 'repository', index: repoIdx });
  }

  // Зависимости от services (для других services)
  if (entities.services.length > 0 && entityType === 'service') {
    const serviceIdx = entities.services[Math.floor(Math.random() * entities.services.length)];
    if (serviceIdx !== entityIndex || entities.services.length > 1) {
      deps.push({ type: 'service', index: serviceIdx });
    }
  }

  return deps.slice(0, maxDeps);
}

/**
 * Генерирует модуль с DI сущностями
 */
async function generateModuleWithDI(moduleNumber) {
  const moduleName = `load-test-${String(moduleNumber).padStart(3, '0')}`;
  const modulePrefix = 'entity';
  const tokensEnum = `${toUpperSnakeCase(moduleName)}_DI_TOKENS`;

  console.log(chalk.cyan(`\n📦 Генерация модуля: ${moduleName}`));

  // Создаем базовую структуру модуля
  const generator = new ModuleGenerator(projectRoot);
  const answers = {
    name: moduleName,
    description: `Load test module ${moduleNumber} with DI entities`,
    author: 'Load Test Generator',
    title: `Load Test Module ${moduleNumber}`,
    titleRu: `Модуль нагрузочного теста ${moduleNumber}`,
    confirm: true,
  };

  await generator.generateModule(answers);

  const modulePath = path.join(packagesDir, moduleName);
  const srcPath = path.join(modulePath, 'src');

  // Определяем структуру сущностей (минимум 20)
  const entities = {
    models: Array.from({ length: 6 }, (_, i) => i + 1),
    viewmodels: Array.from({ length: 3 }, (_, i) => i + 1),
    usecases: Array.from({ length: 8 }, (_, i) => i + 1),
    repositories: Array.from({ length: 2 }, (_, i) => i + 1),
    services: Array.from({ length: 2 }, (_, i) => i + 1),
  };

  const totalEntities = entities.models.length + entities.viewmodels.length + 
                        entities.usecases.length + entities.repositories.length + 
                        entities.services.length;

  console.log(chalk.gray(`  Создание ${totalEntities} DI сущностей...`));

  // Создаем директории
  fs.mkdirSync(path.join(srcPath, 'models'), { recursive: true });
  fs.mkdirSync(path.join(srcPath, 'usecases'), { recursive: true });
  fs.mkdirSync(path.join(srcPath, 'viewmodels'), { recursive: true });
  fs.mkdirSync(path.join(srcPath, 'data'), { recursive: true });

  // Генерируем модели
  for (const idx of entities.models) {
    const content = generateModel(moduleName, idx, modulePrefix);
    fs.writeFileSync(
      path.join(srcPath, 'models', `${toCamelCase(modulePrefix)}Model${idx}.ts`),
      content,
    );
  }

  // Генерируем repositories
  for (const idx of entities.repositories) {
    const content = generateRepository(moduleName, idx, modulePrefix);
    fs.writeFileSync(
      path.join(srcPath, 'data', `${toCamelCase(modulePrefix)}Repository${idx}.ts`),
      content,
    );
  }

  // Генерируем services
  for (const idx of entities.services) {
    const deps = createDependencies(entities, 'service', idx);
    const content = generateService(moduleName, idx, modulePrefix, deps, tokensEnum);
    fs.writeFileSync(
      path.join(srcPath, 'data', `${toCamelCase(modulePrefix)}Service${idx}.ts`),
      content,
    );
  }

  // Генерируем usecases
  for (const idx of entities.usecases) {
    const deps = createDependencies(entities, 'usecase', idx);
    const content = generateUsecase(moduleName, idx, modulePrefix, deps, tokensEnum);
    fs.writeFileSync(
      path.join(srcPath, 'usecases', `${toCamelCase(modulePrefix)}Usecase${idx}.ts`),
      content,
    );
  }

  // Генерируем viewmodels
  for (const idx of entities.viewmodels) {
    const deps = createDependencies(entities, 'viewmodel', idx);
    const content = generateViewModel(moduleName, idx, modulePrefix, deps, tokensEnum);
    fs.writeFileSync(
      path.join(srcPath, 'viewmodels', `${toCamelCase(modulePrefix)}ViewModel${idx}.ts`),
      content,
    );
  }

  // Создаем index файлы для экспорта
  const modelsIndex = entities.models
    .map((idx) => `export { ${toPascalCase(modulePrefix)}Model${idx} } from './${toCamelCase(modulePrefix)}Model${idx}.ts';`)
    .join('\n');
  fs.writeFileSync(path.join(srcPath, 'models', 'index.ts'), modelsIndex);

  const usecasesIndex = entities.usecases
    .map((idx) => `export { ${toPascalCase(modulePrefix)}Usecase${idx} } from './${toCamelCase(modulePrefix)}Usecase${idx}.ts';`)
    .join('\n');
  fs.writeFileSync(path.join(srcPath, 'usecases', 'index.ts'), usecasesIndex);

  const viewmodelsIndex = entities.viewmodels
    .map((idx) => `export { ${toPascalCase(modulePrefix)}ViewModel${idx} } from './${toCamelCase(modulePrefix)}ViewModel${idx}.ts';`)
    .join('\n');
  fs.writeFileSync(path.join(srcPath, 'viewmodels', 'index.ts'), viewmodelsIndex);

  // Обновляем di.tokens.ts
  const diTokensContent = generateDITokens(moduleName, modulePrefix, entities);
  fs.writeFileSync(path.join(srcPath, 'config', 'di.tokens.ts'), diTokensContent);

  // Обновляем di.config.ts
  const diConfigContent = generateDIConfig(moduleName, modulePrefix, entities);
  fs.writeFileSync(path.join(srcPath, 'config', 'di.config.ts'), diConfigContent);

  // Создаем index.html если его нет
  const indexPath = path.join(modulePath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    const moduleTitle = moduleName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module ${moduleTitle}</title>
</head>
<body>
  <!-- Этот файл нужен только для сборки Module Federation -->
  <!-- В production модуль будет загружаться через remoteEntry.js -->
  <script type="module" src="/src/config/module_config.ts"></script>
</body>
</html>
`;
    fs.writeFileSync(indexPath, htmlContent, 'utf-8');
  }

  console.log(chalk.green(`  ✅ Модуль ${moduleName} создан (${totalEntities} сущностей)`));
}

/**
 * Главная функция
 */
async function main() {
  console.log(chalk.bold.cyan('\n🚀 Генерация 100 MFE модулей для нагрузочного теста\n'));

  const spinner = ora('Инициализация...').start();
  spinner.stop();

  const totalModules = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i <= totalModules; i++) {
    try {
      await generateModuleWithDI(i);
      successCount++;
    } catch (error) {
      console.error(chalk.red(`  ❌ Ошибка при создании модуля load-test-${String(i).padStart(3, '0')}:`));
      console.error(chalk.gray(error.message));
      errorCount++;
    }

    // Показываем прогресс каждые 10 модулей
    if (i % 10 === 0) {
      console.log(chalk.yellow(`\n📊 Прогресс: ${i}/${totalModules} модулей (✅ ${successCount}, ❌ ${errorCount})\n`));
    }
  }

  console.log(chalk.bold.green(`\n✅ Генерация завершена!`));
  console.log(chalk.green(`   Успешно: ${successCount} модулей`));
  if (errorCount > 0) {
    console.log(chalk.red(`   Ошибок: ${errorCount} модулей`));
  }
  console.log(chalk.cyan(`\n💡 Не забудьте добавить модули в host/src/modules/modules.ts\n`));
}

main().catch((error) => {
  console.error(chalk.red('Критическая ошибка:'), error);
  process.exit(1);
});

