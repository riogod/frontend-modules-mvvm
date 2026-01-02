# navigateToCurrentRoute()

Метод `navigateToCurrentRoute()` — ключевой метод `BootstrapRouterService` для инициализации текущего маршрута после загрузки всех модулей. Обеспечивает корректную навигацию на маршрут из URL с полной инициализацией всех зависимостей модуля.

## Реализация

```typescript
// host/src/bootstrap/services/router/routerService.ts
navigateToCurrentRoute(): void {
  const current_route = this.router.getState();

  // Используем полный путь из current_route, который уже содержит query-параметры в URL
  // matchPath парсит URL и извлекает как path-параметры, так и query-параметры
  const fullPath = current_route.path;
  const match = this.router.matchPath(fullPath);

  if (fullPath === '/') {
    this.router.navigate(
      'todo',
      {},
      {
        replace: true,
        reload: true,
      },
    );
    return;
  }

  if (!match) {
    log.warn(
      'No route match found for path',
      {
        prefix: 'bootstrap.routerService.navigateToCurrentRoute',
      },
      { path: fullPath },
    );
    return;
  }

  log.debug(
    'Navigating to current route',
    {
      prefix: 'bootstrap.routerService.navigateToCurrentRoute',
    },
    { routeName: match.name, params: match.params, currentPath: fullPath },
  );

  this.router.navigate(match.name, match.params, {
    replace: true,
    reload: true,
  });
}
```

## Когда вызывается

Метод вызывается в `main.tsx` после успешной загрузки всех NORMAL модулей:

```typescript
// host/src/main.tsx
initBootstrap(new Bootstrap(app_modules), appConfig).then(async (bootstrap) => {
  bootstrap.setIsBootstrapped();

  // Старт роутера с локальными модулями
  bootstrap.routerService.router.start(() => {
    // Рендер React приложения
    createRoot(document.getElementById('root')!).render(/* ... */);
  });

  // Загрузка манифеста после рендера
  const manifestLoader = new ManifestLoader(
    bootstrap.getAPIClient,
    bootstrap.moduleLoader,
    bootstrap,
  );

  const manifest = await manifestLoader.loadManifest();
  if (manifest) {
    await manifestLoader.processManifestModules(manifest);
  }

  // Загрузка NORMAL модулей (локальные + из манифеста)
  bootstrap.moduleLoader
    .loadNormalModules()
    .then(() => {
      bootstrap.setIsAppStarted();
      // ✅ Вызов navigateToCurrentRoute после загрузки модулей
      bootstrap.routerService.navigateToCurrentRoute();
    })
    .catch((error: unknown) => {
      log.error('Error loading normal modules', { prefix: 'bootstrap' }, error);
    });
});
```

## Зачем нужен

Метод необходим для корректной инициализации текущего маршрута после загрузки модулей:

1. **Инициализация хуков:** После загрузки модулей нужно выполнить `onEnterNode` для текущего маршрута, чтобы загрузить данные и инициализировать состояние
2. **Регистрация компонентов:** Lazy-компоненты модулей должны быть загружены и зарегистрированы
3. **Обновление маршрутов:** После загрузки модулей список маршрутов может измениться, нужно пересобрать соответствие URL → маршрут
4. **Инициализация зависимостей:** Все сервисы из DI контейнера должны быть доступны для хуков

## Как работает

Метод выполняет следующие шаги:

1. **Получает текущий путь из URL:**

   ```typescript
   const current_route = this.router.getState();
   const fullPath = current_route.path; // Например: '/todo/list?id=123'
   ```

2. **Парсит путь для извлечения имени роута и параметров:**

   ```typescript
   const match = this.router.matchPath(fullPath);
   // match = { name: 'todo.list', params: { id: '123' } }
   ```

3. **Обрабатывает специальные случаи:**
   - Если путь = `/`, перенаправляет на дефолтный маршрут (например, `'todo'`)
   - Если маршрут не найден, логирует предупреждение и завершает выполнение

4. **Выполняет навигацию с перезагрузкой:**
   ```typescript
   this.router.navigate(match.name, match.params, {
     replace: true, // Заменяет текущую запись в истории
     reload: true, // Перезагружает маршрут (выполняет onEnterNode)
   });
   ```

## Зачем нужен `reload: true`

Опция `reload: true` критически важна для корректной работы:

- **Выполнение хуков:** Гарантирует выполнение `onEnterNode` для текущего маршрута, что необходимо для загрузки данных и инициализации состояния
- **Инициализация компонентов:** Обеспечивает полную загрузку lazy-компонентов и их инициализацию
- **Обновление состояния:** Пересобирает соответствие между URL и маршрутом с учетом всех загруженных модулей
- **Доступность сервисов:** Все сервисы из DI контейнера уже зарегистрированы и доступны для использования в хуках

## Пример полного цикла

```typescript
// 1. Пользователь открывает /todo/list?id=123
// 2. Приложение загружается, роутер инициализируется
// 3. Загружаются INIT модули (core, layout)
// 4. Рендерится UI с HomePage (показывается до загрузки модулей)
// 5. Загружается манифест и NORMAL модули
// 6. Регистрируются маршруты модулей (включая 'todo.list')
// 7. Вызывается navigateToCurrentRoute():

const current_route = router.getState();
// → { path: '/todo/list?id=123', ... }

const match = router.matchPath('/todo/list?id=123');
// → { name: 'todo.list', params: { id: '123' } }

router.navigate('todo.list', { id: '123' }, { replace: true, reload: true });
// → Выполняется onEnterNode для 'todo.list'
// → Загружаются данные через UseCase
// → Рендерится компонент TodoListPage
// → Пользователь видит страницу со списком задач
```

## Обработка ошибок

Если маршрут не найден (например, модуль не загрузился или маршрут не существует):

```typescript
if (!match) {
  log.warn('No route match found for path', { path: fullPath });
  // Метод завершается, пользователь остается на текущей странице
  // (обычно HomePage, если isAppStarted = false)
  return;
}
```

## Важные моменты

- Метод вызывается **только один раз** после загрузки всех модулей
- Использует `replace: true` чтобы не создавать новую запись в истории браузера
- Использует `reload: true` чтобы гарантировать выполнение всех хуков инициализации
- Работает с query-параметрами: `matchPath` автоматически извлекает их из URL
- Обрабатывает специальный случай корневого пути `/` с перенаправлением на дефолтный маршрут

## См. также

- [Расширение конфигурации роутинга](./routing.md) — расширение интерфейса `IRoute`
- [Конфигурация модуля](../modules/module-config.md) — настройка роутов в модулях
- [Процесс Bootstrap](../bootstrap/bootstrap-process.md) — порядок инициализации роутера
- [Цепочка обработчиков](../bootstrap/handlers.md) — описание `RouterHandler`
