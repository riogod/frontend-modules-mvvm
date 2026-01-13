import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const UiProvidersSection: FC = () => (
  <DocSection title="UI Провайдеры">
    <DocSection title="Иерархия провайдеров">
      <DocCodeBlock
        code={`// Порядок провайдеров (сверху вниз)
<RouterProvider>      // Роутер (внешний)
  <DIProvider>          // DI контейнер
    <I18nextProvider>   // i18n
      <ThemeSchema>     // Тема
        <App />         // Ваше приложение`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="RouterProvider">
      <DocList
        items={[
          'Предоставляет систему роутинга',
          'Экспортирует useRouter, useLocation, useNavigate хуки',
          'Настраивается в RouterHandler',
        ]}
      />
    </DocSection>
    <DocSection title="DIProvider">
      <DocList
        items={[
          'Предоставляет DI контейнер через React Context',
          'Экспортирует useVM хук для получения ViewModel',
          'Настраивается в DIHandler',
        ]}
      />
      <DocCodeBlock
        code={`import { useVM } from '@platform/ui';
import { TODO_DI_TOKENS } from '../config/di.tokens';

const TodoPage = observer(() => {
  const viewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );

  return <div>{viewModel.items}</div>;
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="I18nextProvider">
      <DocList
        items={[
          'Предоставляет систему переводов',
          'Экспортирует useTranslation хук',
          'Настраивается в InitI18nHandler',
        ]}
      />
      <DocCodeBlock
        code={`import { useTranslation } from '@platform/ui';

const Component = () => {
  const { t } = useTranslation('todo');

  return <div>{t('menu.title')}</div>;
};`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="ThemeSchema">
      <DocList
        items={[
          'Предоставляет тему MUI',
          'Экспортирует CSS переменные темы',
          'Использует ThemeProvider из MUI',
        ]}
      />
      <DocCodeBlock
        code={`// Использование CSS переменных
const useStyles = makeStyles()((theme) => ({
  root: {
    color: 'var(--mui-palette-primary-main)',
    backgroundColor: 'var(--mui-palette-background-default)',
  },
}));`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Создание кастомного провайдера">
      <DocCodeBlock
        code={`// src/view/providers/CustomProvider.tsx
import { type FC, createContext, useContext } from 'react';
import { useDI } from '@platform/ui';

interface CustomContextValue {
  value: string;
}

const CustomContext = createContext<CustomContextValue | undefined>(
  undefined,
);

export const CustomProvider: FC = observer(() => {
  const di = useDI();
  const value = di.get('SomeService').getValue();

  return (
    <CustomContext.Provider value={{ value }}>
      {children}
    </CustomContext.Provider>
  );
});

export const useCustom = () => {
  const context = useContext(CustomContext);
  if (!context) {
    throw new Error('useCustom must be used within CustomProvider');
  }
  return context;
};

// Регистрация в host/src/bootstrap/handlers/ui-providers.handler.ts
<CustomProvider>
  {/* Другие провайдеры */}
</CustomProvider>`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="warning" title="Важное примечание">
      Порядок провайдеров критичен. Роутер должен быть внешним, DI контейнер
      должен быть доступен для всех компонентов.
    </DocNote>
  </DocSection>
);
