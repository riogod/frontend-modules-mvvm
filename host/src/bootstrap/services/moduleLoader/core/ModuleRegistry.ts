/**
 * Реестр модулей.
 *
 * Отвечает за:
 * - Хранение и управление коллекцией модулей
 * - Кеширование маршрутов модулей
 * - Поиск модулей по различным критериям
 * - Загрузку динамических конфигураций
 *
 * Реализует паттерн Repository для работы с модулями.
 *
 * @module core/ModuleRegistry
 */

import { log, type IRoutes } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { RouteCacheEntry } from '../types';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.registry';

/**
 * Ошибки реестра модулей.
 */
export class ModuleRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModuleRegistryError';
  }
}

/**
 * Реестр модулей приложения.
 *
 * Обеспечивает централизованное хранение и управление модулями.
 * Поддерживает кеширование маршрутов для оптимизации производительности.
 */
export class ModuleRegistry {
  /** Хранилище модулей (Map для O(1) доступа по имени) */
  private readonly modulesByName = new Map<string, Module>();

  /** Кеш соответствия имени маршрута к модулю */
  private readonly routeToModuleCache = new Map<string, Module>();

  /** Кеш маршрутов модулей */
  private readonly routesCache = new Map<string, RouteCacheEntry>();

  /** Флаг, указывающий, были ли загружены INIT модули */
  private initModulesLoadedFlag = false;

  constructor() {
    log.debug('ModuleRegistry: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы: Добавление модулей
  // ============================================

  /**
   * Добавляет модуль в реестр.
   *
   * Для INIT модулей автоматически кеширует маршруты.
   * Для модулей с динамическим конфигом маршруты кешируются при первом обращении.
   *
   * @param module - Модуль для добавления
   * @throws {ModuleRegistryError} Если модуль с таким именем уже существует
   * @throws {ModuleRegistryError} Если INIT модули уже были загружены
   */
  public async addModule(module: Module): Promise<void> {
    this.validateCanAddModule(module);

    log.debug(
      `Добавление модуля: ${module.name} (тип: ${this.getModuleLoadType(module)})`,
      {
        prefix: LOG_PREFIX,
      },
    );

    this.modulesByName.set(module.name, module);

    // Для INIT модулей кешируем маршруты сразу
    if (this.getModuleLoadType(module) === ModuleLoadType.INIT) {
      await this.cacheModuleRoutes(module);
    }

    log.debug(`Модуль "${module.name}" добавлен в реестр`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Добавляет несколько модулей в реестр.
   *
   * @param modules - Массив модулей для добавления
   */
  public async addModules(modules: Module[]): Promise<void> {
    log.debug(`Добавление ${modules.length} модулей в реестр`, {
      prefix: LOG_PREFIX,
    });

    for (const module of modules) {
      await this.addModule(module);
    }

    log.debug(`Добавлено ${modules.length} модулей`, { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы: Получение модулей
  // ============================================

  /**
   * Возвращает модуль по имени.
   *
   * @param name - Имя модуля
   * @returns Модуль или undefined, если не найден
   */
  public getModule(name: string): Module | undefined {
    return this.modulesByName.get(name);
  }

  /**
   * Возвращает все модули.
   *
   * @returns Массив всех модулей (копия)
   */
  public getModules(): Module[] {
    return Array.from(this.modulesByName.values());
  }

  /**
   * Проверяет наличие модуля в реестре.
   *
   * @param name - Имя модуля
   * @returns true, если модуль существует
   */
  public hasModule(name: string): boolean {
    return this.modulesByName.has(name);
  }

  /**
   * Возвращает количество модулей в реестре.
   *
   * @returns Количество модулей
   */
  public get count(): number {
    return this.modulesByName.size;
  }

  // ============================================
  // Публичные методы: Фильтрация модулей
  // ============================================

  /**
   * Возвращает модули указанного типа загрузки.
   *
   * @param loadType - Тип загрузки (INIT или NORMAL)
   * @returns Массив модулей указанного типа
   */
  public getModulesByType(loadType: ModuleLoadType): Module[] {
    return this.getModules().filter(
      (m) => this.getModuleLoadType(m) === loadType,
    );
  }

  /**
   * Возвращает модуль по имени маршрута.
   *
   * Сначала ищет по полному имени маршрута, затем по первому сегменту.
   *
   * @param routeName - Имя маршрута (например, "todo" или "todo.list")
   * @returns Модуль или undefined, если не найден
   */
  public getModuleByRouteName(routeName: string): Module | undefined {
    // Поиск по полному имени
    const module = this.routeToModuleCache.get(routeName);
    if (module) {
      return module;
    }

    // Поиск по первому сегменту
    const firstSegment = routeName.split('.')[0];
    return this.routeToModuleCache.get(firstSegment);
  }

  // ============================================
  // Публичные методы: Работа с маршрутами
  // ============================================

  /**
   * Возвращает маршруты модуля с кешированием.
   *
   * Для модулей с динамическим конфигом загружает конфигурацию при первом обращении.
   *
   * @param module - Модуль
   * @returns Маршруты модуля или undefined
   */
  public async getModuleRoutes(module: Module): Promise<IRoutes | undefined> {
    // Загружаем конфигурацию, если она динамическая
    await this.loadModuleConfig(module);

    const config = module.config;
    if (!config || config instanceof Promise || !config.ROUTES) {
      return undefined;
    }

    // Проверяем кеш
    const cached = this.routesCache.get(module.name);
    if (cached) {
      log.debug(`Использование кешированных маршрутов для "${module.name}"`, {
        prefix: LOG_PREFIX,
      });
      return cached.routes;
    }

    // Вызываем ROUTES() и кешируем результат
    log.debug(`Получение маршрутов для модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    const routes = config.ROUTES();
    this.routesCache.set(module.name, {
      routes,
      cachedAt: Date.now(),
    });

    log.debug(`Закешировано ${routes.length} маршрутов для "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    return routes;
  }

  /**
   * Загружает динамическую конфигурацию модуля, если она является Promise.
   *
   * **ВАЖНО: Мутирует объект модуля!**
   *
   * После загрузки Promise заменяется на резолвленную конфигурацию напрямую в объекте модуля.
   * Это сделано для оптимизации: последующие обращения к `module.config` не требуют
   * повторной загрузки и сразу получают готовую конфигурацию.
   *
   * **Побочные эффекты:**
   * - Объект модуля изменяется после первого вызова этого метода
   * - Все ссылки на модуль видят обновленную конфигурацию
   * - Это нормальное поведение и не является багом
   *
   * @param module - Модуль для загрузки конфигурации (будет мутирован)
   */
  public async loadModuleConfig(module: Module): Promise<void> {
    if (!(module.config instanceof Promise)) {
      return;
    }

    log.debug(`Загрузка динамической конфигурации для "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    try {
      const config = await module.config;
      // ВАЖНО: Мутируем объект модуля, заменяя Promise на резолвленную конфигурацию
      // Это сделано намеренно для оптимизации - последующие обращения не требуют повторной загрузки
      (module as { config: typeof config }).config = config;

      log.debug(`Конфигурация загружена для "${module.name}"`, {
        prefix: LOG_PREFIX,
      });
    } catch (error) {
      const message = `Ошибка загрузки конфигурации модуля "${module.name}": ${
        error instanceof Error ? error.message : String(error)
      }`;
      log.error(message, { prefix: LOG_PREFIX });
      throw new ModuleRegistryError(message);
    }
  }

  // ============================================
  // Публичные методы: Сортировка
  // ============================================

  /**
   * Сортирует модули по приоритету загрузки.
   *
   * @param modules - Массив модулей для сортировки
   * @returns Отсортированный массив (новый массив, исходный не изменяется)
   */
  public sortModulesByPriority(modules: Module[]): Module[] {
    return [...modules].sort((a, b) => {
      const priorityA = a.loadPriority ?? 0;
      const priorityB = b.loadPriority ?? 0;
      return priorityA - priorityB;
    });
  }

  // ============================================
  // Публичные методы: Управление состоянием
  // ============================================

  /**
   * Устанавливает флаг загрузки INIT модулей.
   *
   * После установки флага добавление новых модулей запрещено.
   *
   * @param value - Значение флага
   */
  public setInitModulesLoaded(value: boolean): void {
    log.debug(`Установка флага initModulesLoaded: ${value}`, {
      prefix: LOG_PREFIX,
    });
    this.initModulesLoadedFlag = value;
  }

  /**
   * Проверяет, загружены ли INIT модули.
   *
   * @returns true, если INIT модули загружены
   */
  public get isInitModulesLoaded(): boolean {
    return this.initModulesLoadedFlag;
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Валидирует возможность добавления модуля.
   *
   * @param module - Модуль для проверки
   * @throws {ModuleRegistryError} Если добавление невозможно
   */
  private validateCanAddModule(module: Module): void {
    if (this.initModulesLoadedFlag) {
      throw new ModuleRegistryError(
        'Невозможно добавить модуль после загрузки INIT модулей',
      );
    }

    if (this.modulesByName.has(module.name)) {
      throw new ModuleRegistryError(
        `Модуль с именем "${module.name}" уже существует`,
      );
    }
  }

  /**
   * Возвращает тип загрузки модуля.
   *
   * @param module - Модуль
   * @returns Тип загрузки
   */
  private getModuleLoadType(module: Module): ModuleLoadType {
    return module.loadType ?? ModuleLoadType.NORMAL;
  }

  /**
   * Кеширует маршруты модуля для быстрого поиска.
   *
   * @param module - Модуль для кеширования маршрутов
   */
  private async cacheModuleRoutes(module: Module): Promise<void> {
    const routes = await this.getModuleRoutes(module);
    if (!routes) {
      log.debug(`У модуля "${module.name}" нет маршрутов для кеширования`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    log.debug(
      `Кеширование маршрутов модуля "${module.name}" (${routes.length} маршрутов)`,
      {
        prefix: LOG_PREFIX,
      },
    );

    for (const route of routes) {
      // Кешируем по полному имени маршрута
      this.routeToModuleCache.set(route.name, module);

      // Кешируем по первому сегменту для обратной совместимости
      const firstSegment = route.name.split('.')[0];
      if (!this.routeToModuleCache.has(firstSegment)) {
        this.routeToModuleCache.set(firstSegment, module);
      }
    }

    log.debug(`Маршруты модуля "${module.name}" закешированы`, {
      prefix: LOG_PREFIX,
    });
  }
}
