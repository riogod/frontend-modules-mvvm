import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocNote } from '../../common';

export const ShareLibrarySection: FC = () => (
  <DocSection title="Share Library">
    <DocSection title="ThemeSchema">
      <p>Компонент для управления темой приложения.</p>
      <DocCodeBlock
        code={`import { ThemeSchema } from '@platform/share';

<ThemeSchema>
  <App />
</ThemeSchema>`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="CSS Variables">
      <p>ThemeSchema автоматически синхронизирует CSS переменные с темой.</p>
      <DocCodeBlock
        code={`/* Доступные CSS переменные */
var(--mui-palette-primary-main)
var(--mui-palette-primary-light)
var(--mui-palette-primary-dark)
var(--mui-palette-secondary-main)
var(--mui-palette-background-paper)
var(--mui-palette-background-default)
var(--mui-palette-text-primary)
var(--mui-palette-text-secondary)
var(--mui-palette-error-main)
var(--mui-palette-success-main)
var(--mui-palette-warning-main)
var(--mui-palette-info-main)

/* Использование в CSS */
.my-component {
  color: var(--mui-palette-primary-main);
  background: var(--mui-palette-background-paper);
}

/* Использование в styled */
const StyledComponent = styled('div')({
  color: 'var(--mui-palette-text-primary)',
  backgroundColor: 'var(--mui-palette-background-paper)',
});`}
        language="css"
      />
    </DocSection>
    <DocSection title="Theme Sync">
      <p>ThemeSchema наблюдает за UiSettingsViewModel для изменения темы.</p>
      <DocCodeBlock
        code={`@injectable()
export class UiSettingsViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS)
    private uiSettingsViewModel: UiSettingsViewModel,
  ) {
    makeAutoObservable(this);
  }

  get themeMode(): 'light' | 'dark' {
    return this.uiSettingsViewModel.themeMode;
  }

  toggleTheme(): void {
    this.uiSettingsViewModel.toggleThemeMode();
  }
}

// ThemeSchema автоматически реагирует на изменения
// themeMode в UiSettingsViewModel`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Пример переключения темы">
      <DocCodeBlock
        code={`import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { SETTINGS_DI_TOKENS } from '../config/di.tokens';

const ThemeToggle = observer(() => {
  const viewModel = useVM<UiSettingsViewModel>(
    SETTINGS_DI_TOKENS.VIEW_MODEL_UI_SETTINGS,
  );

  return (
    <button onClick={() => viewModel.toggleTheme()}>
      {viewModel.themeMode === 'light' ? '🌙' : '☀️'}
    </button>
  );
});`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Использование">
      ThemeSchema должен быть оберткой над всем приложением для корректной
      синхронизации CSS переменных с темой.
    </DocNote>
  </DocSection>
);
