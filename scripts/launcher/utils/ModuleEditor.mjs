import chalk from 'chalk';
import prompts from 'prompts';
import { getSourceDisplayName } from '../cli/formatters/ModuleFormatter.mjs';

/**
 * @fileoverview Утилиты для редактирования модулей в конфигурациях
 */

/**
 * Показать меню выбора источника для модуля
 * @param {string} moduleName - Имя модуля
 * @param {string} currentSource - Текущий источник
 * @param {Object} configRepository - Репозиторий конфигураций
 * @returns {Promise<string>}
 */
export async function selectModuleSource(
  moduleName,
  currentSource,
  configRepository,
) {
  const isRemoteAvailable = configRepository.isRemoteAvailable();
  const remoteUrl = isRemoteAvailable
    ? configRepository.getRemoteServerUrl()
    : '';

  const choices = [
    { title: '🟢 LOCAL', value: 'local' },
    { title: '⏭️  Пропустить (не загружать)', value: 'skip' },
  ];

  if (isRemoteAvailable) {
    const normalizedUrl = remoteUrl.trim().replace(/\/+$/, '');
    const rawDisplayUrl = `${normalizedUrl}/modules/${moduleName}/latest/remoteEntry.js`;
    // Нормализуем лишние слэши, не ломая протокол (http://)
    const [proto, rest] = rawDisplayUrl.split('://');
    const safeDisplayUrl = rest
      ? `${proto}://${rest.replace(/\/{2,}/g, '/')}`
      : rawDisplayUrl.replace(/\/{2,}/g, '/');
    choices.splice(1, 0, {
      title: `🔵 REMOTE (${safeDisplayUrl})`,
      value: 'remote',
    });
  } else {
    choices.splice(1, 0, {
      title: '🔒 REMOTE (недоступно - настройте URL)',
      value: 'remote',
      disabled: true,
    });
  }

  choices.splice(choices.length - 1, 0, {
    title: '🟣 REMOTE_CUSTOM (кастомный URL)',
    value: 'remote_custom',
  });

  const currentIndex = choices.findIndex((c) => c.value === currentSource);
  const initial =
    currentIndex >= 0
      ? currentIndex
      : choices.findIndex((c) => c.value === 'skip');

  const { source } = await prompts({
    type: 'select',
    name: 'source',
    message: `📦 ${moduleName}:`,
    choices,
    initial: initial >= 0 ? initial : 0,
  });

  return source || currentSource;
}

/**
 * Показать меню редактирования модулей
 * @param {Array} normalModules - Список нормальных модулей
 * @param {Object} modules - Текущая конфигурация модулей
 * @param {Object} configRepository - Репозиторий конфигураций
 * @returns {Promise<Object|null>}
 */
export async function editModulesMenu(
  normalModules,
  modules,
  configRepository,
) {
  const isRemoteAvailable = configRepository.isRemoteAvailable();
  const remoteUrl = isRemoteAvailable
    ? configRepository.getRemoteServerUrl()
    : '';

  while (true) {
    process.stdout.write('\x1B[2J\x1B[0f');

    console.log(chalk.cyan.bold('\n📦 Настройка модулей\n'));

    console.log(chalk.yellow('INIT модули (загружаются всегда локально):'));
    console.log('  ✓ core');
    console.log('  ✓ core.layout\n');

    if (normalModules.length === 0) {
      console.log(chalk.yellow('NORMAL модули не найдены.\n'));
      return modules;
    }

    console.log(chalk.yellow('NORMAL модули (текущие настройки):\n'));

    normalModules.forEach((module) => {
      const moduleConfig = modules[module.name] || {};
      const currentSource = moduleConfig.source || 'skip';
      const customUrl = moduleConfig.customUrl || '';
      const useLocalMocks =
        moduleConfig.useLocalMocks !== undefined
          ? moduleConfig.useLocalMocks
          : true;
      const displayName = getSourceDisplayName(
        currentSource,
        isRemoteAvailable,
        remoteUrl,
        customUrl,
      );
      const mocksStatus =
        currentSource === 'skip'
          ? ''
          : useLocalMocks
            ? ' ✅ моки'
            : ' 🔵 удаленный сервис';
      console.log(`  ${module.name}: ${displayName}${mocksStatus}`);
    });

    console.log('');

    const choices = normalModules.map((module) => {
      const moduleConfig = modules[module.name] || {};
      const currentSource = moduleConfig.source || 'skip';
      const customUrl = moduleConfig.customUrl || '';
      const useLocalMocks =
        moduleConfig.useLocalMocks !== undefined
          ? moduleConfig.useLocalMocks
          : true;
      const displayName = getSourceDisplayName(
        currentSource,
        isRemoteAvailable,
        remoteUrl,
        customUrl,
      );
      const mocksStatus =
        currentSource === 'skip'
          ? ''
          : useLocalMocks
            ? ' ✅ моки'
            : ' 🔵 удаленный сервис';
      return {
        title: `${module.name}: ${displayName}${mocksStatus}`,
        value: module.name,
      };
    });

    choices.push({ title: '→ Готово', value: 'done' });
    choices.push({ title: '→ Отмена', value: 'cancel' });

    const { selectedModule } = await prompts({
      type: 'autocomplete',
      name: 'selectedModule',
      message:
        'Выберите модуль для редактирования (начните вводить для поиска):',
      choices,
      suggest: (input, choices) => {
        if (!input) {
          return choices;
        }
        const searchTerm = input.toLowerCase();
        return choices.filter(
          (choice) =>
            choice.title.toLowerCase().includes(searchTerm) ||
            choice.value.toLowerCase().includes(searchTerm),
        );
      },
    });

    if (!selectedModule || selectedModule === 'cancel') {
      // Сигнализируем вызывающему, что нужно вернуться назад, а не на главный экран
      return { canceled: true };
    }

    if (selectedModule === 'done') {
      return modules;
    }

    const moduleConfig = modules[selectedModule] || {};
    const currentSource = moduleConfig.source || 'skip';
    const newSource = await selectModuleSource(
      selectedModule,
      currentSource,
      configRepository,
    );

    if (newSource === 'skip') {
      delete modules[selectedModule];
    } else {
      modules[selectedModule] = {
        source: newSource,
        priority: moduleConfig.priority || 1,
        useLocalMocks:
          moduleConfig.useLocalMocks !== undefined
            ? moduleConfig.useLocalMocks
            : true,
      };

      if (newSource === 'local') {
        modules[selectedModule].path = `packages/${selectedModule}`;
      } else if (newSource === 'remote') {
        modules[selectedModule].url =
          configRepository.getRemoteModuleUrl(selectedModule);
      } else if (newSource === 'remote_custom') {
        const { customUrl } = await prompts({
          type: 'text',
          name: 'customUrl',
          message: 'Введите URL до remoteEntry.js:',
          initial: moduleConfig.customUrl || 'https://',
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'URL не может быть пустым';
            }
            try {
              new URL(value);
              return true;
            } catch {
              return 'Введите корректный URL';
            }
          },
        });

        if (customUrl) {
          modules[selectedModule].customUrl = customUrl.trim();
          modules[selectedModule].url = customUrl.trim();
        }
      }

      const { useLocalMocks } = await prompts({
        type: 'confirm',
        name: 'useLocalMocks',
        message:
          'Использовать локальные моки для этого модуля? (Нет = использовать удаленный сервис)',
        initial:
          moduleConfig.useLocalMocks !== undefined
            ? moduleConfig.useLocalMocks
            : true,
      });

      modules[selectedModule].useLocalMocks = useLocalMocks;
    }
  }
}
