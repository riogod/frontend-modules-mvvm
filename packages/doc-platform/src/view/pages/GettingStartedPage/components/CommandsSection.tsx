import { type FC } from 'react';
import { DocSection, DocTable } from '../../../common';

export const CommandsSection: FC = () => (
  <DocSection title="Полезные команды">
    <DocTable
      columns={[
        { header: 'Команда', key: 'command' },
        { header: 'Описание', key: 'description' },
      ]}
      rows={[
        {
          command: 'npm start',
          description: 'Запуск через интерактивный лаунчер',
        },
        {
          command: 'npm run build',
          description: 'Сборка host приложения',
        },
        {
          command: 'npm run build:all',
          description: 'Сборка всех модулей и host',
        },
        {
          command: 'npm run lint',
          description: 'Проверка кода всех модулей и библиотек',
        },
        {
          command: 'npm test',
          description: 'Запуск всех тестов',
        },
        {
          command: 'npm run storybook',
          description: 'Запуск Storybook для UI библиотеки',
        },
      ]}
    />

    <p style={{ color: 'text.secondary', marginTop: '16px' }}>
      Совет: Если вы новичок в проекте, начните с изучения{' '}
      <a href="/doc-platform/architecture">Архитектуры</a> и{' '}
      <a href="/doc-platform/project-structure">Структуры проекта</a>, чтобы
      понять, как организован код.
    </p>
  </DocSection>
);
