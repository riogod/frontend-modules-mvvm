# PoC: Модульная MVVM архитектура фронтового приложения

## Установка и запуск

Для установки зависимостей проекта выполните `yarn` или `npm install` в корне проекта.

Для старта разработки используйте: `yarn dev`.

Запуск тестов приложения: `yarn test:app`.

Запуск проверки синтаксиса: `yarn lint:app`.

Запуск сборки приложения: `yarn build:app`.

Запуск тестов подключаемой библиотеки: `yarn test:lib`.

Сборка подключаемой библиотеки core: `yarn buildlib`. <br>
_\*После внесения изменений в библиотеку, требуется сборка._

## Архитектурная концепция

Концепция предусматривает разделения приложения на модули, где каждый модуль отвечает за отдельную функциональность и
представляет собой архитектурный подход на основе MVVM `model`-`veiw`-`viewmodel`. Межмодульные связи же реализуются с
помощью IoC и внедрением зависимостей непосредственно в сущность модели(`model`), модельного представления(`viewmodel`)
или
иной требуемой сущности.

> ### Модель (Model):
>`Model` предоставляет данные и бизнес-логику и должна быть быть наблюдаемой при помощи методов mobx, так как по своей
> сути модель выполняет роль стора приложения. Модель так же может иметь набор методов для взаимодействия с набором
> данными
> хранимыми в ней. Для декомпозиции `model`, набор данных можно выносить в `entity`, а для манипулирования
> данными - использовать различные паттерны проектирования (к примеру - Repository).



> ### Модель представления (ViewModel):
>  `ViewModel` по своей сути является связующим звеном между `model` и `view` и так же, должно быть наблюдаемым при
> помощи
> методов mobx, для обеспечения реакции на изменения набора данных `model` во `view`.
>
>Основные характеристики `viewmodel`:
> - Предоставляет геттеры, сеттеры и методы для взаимодействия с `model`;
> - К внедрению доступны только `model`;
> - Не может хранить состояния;


> ### Представление (View):
>`View` отвечает за отображение данных и взаимодействие с пользователем. В рамках данной концепции, view реализован
> при помощи React, а наблюдение за состнояниями стора приложения осуществляется с помощью компонентов и методов mobx.


Каждый модуль является конфигурируемым и инкапсулирет в себе весь функционал за который он отвечает. Так к примеру,
модуль
core является основным и инкапсулирует в себе основную логику приложения, такую как пользовательские настройки,
базовый лейаут, компонент отрисовки страницы поставлямой модулем, отрисовку основного меню и т.д.

Стоит заметить, что переиспользование ui компонентов между модулями крайне не желательно, так как это может привнести
проблемы
в будущем, к примеру при внедрении микрофронтовой архитектуры. Лучше перемещать общие компоненты в общее хранилище`ui`,
таким
образом их менее проблемно можно будет вынести в общую библиотеку компонентов, а также вы будете избавлены от
рефакторинга
модулей в случае необходимости удаления.

### Преимущества:

- Стандартизация;
- Простая компонентная заменяемость;
- Устойчивость к изменениям и рефакторингу;
- Низкий time-to-market для функционала;
- Тестирование;
- Ориентированность на потребности бизнеса и пользователей;
- Возможность загружать пользователю только тот функционал, который ему требуется;

## Структура приложения

Пример реализован с учетом использования монорепозитория и имеет следующую структуру:

```
root/
├─ libs/
│  ├─ core         # Подключаемая библиотека с API клиентом и мидлварами для роутера.
├─ packages/
│  ├─ todo.app/ 
│  │  ├─ bootstrap # Загрузочный слой для инициализации. 
│  │  ├─ config    # Конфигурация основных параметров приложения.
│  │  ├─ modules   # Модули приложения.
│  │  ├─ ui        # Общие react компоненты.
```

Загрузочный слой `bootstrap` определяет основные сервисы приложения и содержит все обработчики, сервисы и инициализаторы
для запуска приложения.

Асинхронная функция `initBootstrap` запускает весь процесс инициализации приложения и определяет последовательность
выполнения
обработчиков(`handlers`). Изменяя порядок обработчиков, можно изменить порядок инициализации приложения.
Функция принимает в себя набор модулей приложения определенных в файле `/modules/modules.ts` и конфигурацию, возращая
промис проинициализированного класса `Bootstrap`.

Набор обработчиков(`handlers`) для инициализации приложения. Каждый обработчик отвечает за одну функциональность и имеет
доступ
к основному конфигу приложения из папки `config`, а также к основному классу `Bootstrap`.

Класс `Bootstrap` содержит методы для запуска процесса инициализации функциональности для вызова из
обработчиков `handlers`,
а также геттры для получения инстансов проинициализированных функциональностей.

В реализованном примере, приложение имеет обработчики для инициализации API клинта, IoC контейнера, обработчика HTTP
ошибок,
подключения библиотеки интернационализации i18next, запуска сервиса маршрутизации и мок сервиса для возможности
локальной разработки.

## Архитектура и организация модулей

Каждый модуль отвечает за отдельную функциональность и может поставлять необходимые
сущности(`model`, `viewmodel`, `view`) как отдельно, так и вместе.
К примеру у вас могут быть модули которые отвечают как за пользовательскую функциональность, так и за функциональность
приложения:

- *Модуль ролевой модели*: Отвечает за функциональность ролевой модели и поставляет сущности `model` и `viewmodel` с
  которыми
  взаимодействуют другие модули внедряя необходимые зависимости во `view` или `viewmodel` из IoC контейнера.
- *Модуль обработки ошибок*: Отвечает за обработку ошибок и так же поставляет сущности `model` и `viewmodel` в общий
  IoC.
- *Функциональный модуль*: Отвечает за функциональность приложения и реализовывает свою логику `view`, `viewmodel`
  и `model` как вместе,
  таки и отдельно, обращаясь к необходимым частям, поставляемыми другими модулями.

состав модулей обычно определяется потребностями проекта.

### Конфигурация модуля:

Каждый модуль поставляет свою конфигурацию, которая интерпретируется на старте приложения в `bootstrap` :

```javascript
-ROUTES
:
() => IRoute[]; // Роутинг модуля.
-I18N ? : (i18n: i18n) => void; // Интернационализация модуля.
-onModuleInit ? : (bootstrap: Bootstrap) => Promise < void >; // Handler вызываемый при старте модуля
-mockHandlers ? : RequestHandler[]; // Моки обработчиков для локальной разработки.
```

При этом колличество обработчиков можно расширять дорабатывая метод инициализации модулей `onModuleInit` в
классе `Bootstrap`.

### Конфигурация роутинга:

Роутинг является важной частью приложения и определяется каждым модулем. Состав конфигурации роутинга можно расширять
необходимыми
параметрами, в примере же реализована базовая конфигурация c интерфейсом `IRoute` который дополняет интерфейс
параметрами и мидлвар
функциями конфигурации роутинга `router5`.

```javascript
/**
 * Объект конфигурации отображения роута в меню
 */
menu ? : IMenuConfig;
/**
 * Реакт Компонент отображаемой страницы
 */
pageComponent ? : FunctionComponent;
/**
 *  Вызывается при переходе пользователем по роуту.
 *  Используется для вызова инициализационных методов необходимых для работы отображаемой страницы.
 *  К примеру, это может быть первоначальная загрузка каких-либо данных из API в модель.
 */
onEnter ? : (
    router: Router<RouterDependencies>,
    toStateParams: Params,
    fromStateParams: Params,
) => Promise < void >;

/**
 *  Вызывается при выходе пользователя из роута
 *  Используется для вызова методов, необходимых для выхода пользователя из роута
 *  К примеру, это может очистка модели от загруженных данных.
 */
onExit ? : (
    router: Router<RouterDependencies>,
    container: Container
) => void;

/**
 * Устанавливает заголовок страницы
 */
title ? : string;

```

Вы так же можете расширять состав конфигурации роутинга, добавляя новые параметры и мидлвары.

## Пример схемы работы

<img width="1169" alt="Снимок экрана 2023-11-28 в 13 12 31" src="https://github.com/riogod/frontend-modules-mvvm/assets/6911539/2dae4c98-85df-4160-975f-08f446a2565f">

1. Пользователь переходит по роутингу `http://my.app/route`
2. При переходе по роуту происходит вызов события `onEnter` определенного в конфигурации роутинга модуля.
3. Из события `onEnter`, вызывается инициализационный метод `viewmodel.InitMethod()`.
4. Метод `viewmodel.InitMethod()` вызывает метод `model.getDataFromRepository()`.
5. Метод модели `model.getDataFromRepository()` вызывает метод `repository.getData()` который осуществляет запрос к
   эндпоинту,
   и обрабатывает полученные данные, возвращая их методу `model.getDataFromRepository()`.
6. Метод `model.getDataFromRepository()` устанавливает значения в `model`.
7. При изменении наблюдаемых параметров, компонент `view` обновляется.

Таким образом, модель может иметь свойство loading, через которое можно отслеживать состояние загрузки данный и
отображать
его во `view` для пользователя.

для более детального изучения данного процесса, рассмотрите модуль `api_example`.

## Стек проекта

Любой компонент стека может быть заменен на аналогичный.

| Библиотека    | Описание                                                                                                  |
|---------------|-----------------------------------------------------------------------------------------------------------|
| `inversify`   | IoC используется для управления зависимостями и организации создания и разрешения объектов.               |
| `mobx`        | Библиотека управлением состояния.                                                                         |
| `react`       | Библиотека для создания пользовательских интерфейсов.                                                     |
| `router-5`    | Агностик роутер для управления маршрутизацией приложения.                                                 |
| `Material-UI` | Библиотека пользовательского интерфейса для React.                                                        |
| `i18next`     | Библиотека предоставляет инструменты и методы для управления переводами и локализацией в веб-приложениях. |
| `msw`         | Библиотека для создания и управления мок-сервером во время разработки веб-приложений.                     |





