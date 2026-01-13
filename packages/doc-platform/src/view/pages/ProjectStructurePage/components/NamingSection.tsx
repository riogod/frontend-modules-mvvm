import { type FC } from 'react';
import { DocSection, DocTable } from '../../../common';

export const NamingSection: FC = () => (
  <DocSection title="Соглашения об именовании" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <DocTable
      columns={[
        { header: 'Тип файла', key: 'type' },
        { header: 'Стиль', key: 'style' },
        { header: 'Пример', key: 'example' },
      ]}
      rows={[
        {
          type: 'React компоненты',
          style: 'PascalCase',
          example: 'TodoPage.tsx',
        },
        {
          type: 'Модели',
          style: 'snake_case',
          example: 'todo_list.model.ts',
        },
        {
          type: 'ViewModels',
          style: 'snake_case',
          example: 'todo_list.vm.ts',
        },
        {
          type: 'Use Cases',
          style: 'camelCase',
          example: 'getTaskList.usecase.ts',
        },
        {
          type: 'Конфигурация',
          style: 'snake_case',
          example: 'module_config.ts',
        },
        {
          type: 'Тесты',
          style: '*.test.ts',
          example: 'TodoModel.test.ts',
        },
        {
          type: 'Переводы',
          style: 'lang_module.json',
          example: 'en_todo.json',
        },
      ]}
    />
  </DocSection>
);
