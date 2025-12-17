# app-test Module

Модуль для демонстрации функциональностей плататформы

## Структура

- `src/config/` - конфигурация модуля (routes, DI, i18n)
- `src/models/` - модели данных
- `src/usecases/` - бизнес-логика
- `src/view/` - React компоненты
- `src/viewmodels/` - view-модели (MobX)

## Разработка

```bash
# Запуск в dev режиме
npm run dev

# Сборка
npm run build
```

## Federation

- Remote scope: `module-app-test`
- Base URL: `/modules/app-test/`
- Exposes: `./Config` (module_config.ts)

## Следующие шаги

1. Добавить модуль в `host/src/modules/modules.ts`
2. Реализовать бизнес-логику в `src/usecases/`
3. Создать view-модели в `src/viewmodels/`
4. Добавить модуль в конфигурацию запуска (npm start)

