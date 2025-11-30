/**
 * Генератор манифеста для Module Federation
 * Создает структуру манифеста на основе конфигурации модулей
 */
export class ManifestGenerator {
  /**
   * Генерирует манифест на основе конфигурации
   * @param {Object} config - Конфигурация модулей
   * @param {Object} config.modules - Объект с конфигурацией модулей
   * @param {ModuleDiscovery} moduleDiscovery - Экземпляр ModuleDiscovery для проверки существования модулей
   * @returns {Object} Манифест для Module Federation
   */
  generate(config, moduleDiscovery = null) {
    const manifest = {
      modules: [],
      timestamp: new Date().toISOString(),
    };

    // INIT модули всегда локальные
    manifest.modules.push(
      {
        name: 'core',
        loadType: 'init',
        loadPriority: 0,
        remoteEntry: '',
      },
      {
        name: 'core.layout',
        loadType: 'init',
        loadPriority: 2,
        remoteEntry: '',
      },
    );

    // NORMAL модули на основе конфигурации
    if (config.modules) {
      for (const [name, moduleConfig] of Object.entries(config.modules)) {
        // Проверяем существование модуля, если передан moduleDiscovery
        if (moduleDiscovery) {
          // Для LOCAL модулей проверяем физическое существование
          if (moduleConfig.source === 'local' && !moduleDiscovery.moduleExists(name)) {
            console.warn(
              `[ManifestGenerator] Пропускаем модуль "${name}": модуль не найден в packages/${name}`,
            );
            continue;
          }
          // Для REMOTE модулей не проверяем (они загружаются удаленно)
        }

        manifest.modules.push({
          name,
          loadType: 'normal',
          loadPriority: moduleConfig.priority || 1,
          remoteEntry:
            moduleConfig.source === 'local' ? '' : moduleConfig.url || '',
          dependencies: moduleConfig.dependencies || [],
          featureFlags: moduleConfig.featureFlags || [],
          accessPermissions: moduleConfig.accessPermissions || [],
        });
      }
    }

    return manifest;
  }
}
