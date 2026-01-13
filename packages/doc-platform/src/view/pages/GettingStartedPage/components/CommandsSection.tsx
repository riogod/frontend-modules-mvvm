import { type FC } from 'react';
import { Typography, Link } from '@platform/ui';
import { DocSection, DocTable } from '../../../common';

export const CommandsSection: FC = () => (
  <DocSection
    title="Полезные команды"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
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

    <Typography variant="body2" color="text.secondary" sx={(theme) => ({ mt: theme.spacing(2) })}>
      Совет: Если вы новичок в проекте, начните с изучения{' '}
      <Link href="/doc-platform/architecture" underline="hover">
        Архитектуры
      </Link>{' '}
      и{' '}
      <Link href="/doc-platform/project-structure" underline="hover">
        Структуры проекта
      </Link>
      , чтобы понять, как организован код.
    </Typography>
  </DocSection>
);
