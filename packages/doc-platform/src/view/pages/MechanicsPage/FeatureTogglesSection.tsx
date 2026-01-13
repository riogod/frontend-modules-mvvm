import { type FC } from 'react';
import {
  DocSection,
  DocCodeBlock,
  DocList,
  DocNote,
  DocTable,
} from '../../common';

export const FeatureTogglesSection: FC = () => (
  <DocSection title="Feature Toggles">
    <DocSection title="Обзор">
      <p>
        Фичи (Feature Flags) - это булевые переключатели для управления
        функциональностью без деплоя.
      </p>
      <DocList
        items={[
          'A/B тестирование',
          'Kill switch для быстрого отключения функционала',
          'Условная загрузка модулей',
          'Скрытие незавершенных функций',
        ]}
      />
    </DocSection>
    <DocSection title="Use Cases">
      <DocCodeBlock
        code={`import {
  GetFeatureFlagUsecase,
  GetFeatureFlagsUsecase,
  SetFeatureFlagsUsecase,
  UpdateFeatureFlagsUsecase,
  RemoveFeatureFlagsUsecase,
} from '@platform/common';

@injectable()
export class DashboardViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAGS)
    private getFeatureFlagsUsecase: GetFeatureFlagsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Получить одну фичу (реактивный геттер)
  get isNewWidgetsEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('dashboard.widgets.v2');
  }

  // ✅ Получить все фичи (реактивный геттер)
  get allFeatures(): Record<string, boolean> {
    return this.getFeatureFlagsUsecase.execute();
  }

  // ✅ Установить фичи
  async setFeatures(features: Record<string, boolean>): Promise<void> {
    const setFeatureFlagsUsecase = this.di.get<SetFeatureFlagsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_FEATURE_FLAGS,
    );
    await setFeatureFlagsUsecase.execute(features);
  }

  // ✅ Обновить фичи
  async updateFeatures(updates: Record<string, boolean>): Promise<void> {
    const updateFeatureFlagsUsecase = this.di.get<UpdateFeatureFlagsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_FEATURE_FLAGS,
    );
    await updateFeatureFlagsUsecase.execute(updates);
  }

  // ✅ Удалить фичи
  async removeFeatures(keys: string[]): Promise<void> {
    const removeFeatureFlagsUsecase = this.di.get<RemoveFeatureFlagsUsecase>(
      IOC_CORE_TOKENS.USECASE_REMOVE_FEATURE_FLAGS,
    );
    await removeFeatureFlagsUsecase.execute(keys);
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Конфигурация модуля">
      <p>Укажите фичи в mockModuleInfo для условной загрузки:</p>
      <DocCodeBlock
        code={`// config/module_config.ts
export default {
  mockModuleInfo: {
    name: 'dashboard',
    dependencies: ['auth'],
    featureFlags: ['dashboard.enabled', 'dashboard.widgets.v2'], // Фичи
    accessPermissions: ['dashboard.access'],
  },
} as ModuleConfig;`}
        language="typescript"
      />
      <p>Модуль не загрузится, если хотя бы одна фича отключена.</p>
    </DocSection>
    <DocSection title="Именование фич">
      <p>Используйте enum для определения фич:</p>
      <DocCodeBlock
        code={`// config/feature.enum.ts
export enum DashboardFeatures {
  ENABLED = 'dashboard.enabled',
  WIDGETS_V2 = 'dashboard.widgets.v2',
  ANALYTICS = 'dashboard.analytics',
}

// Использование
get isNewWidgetsEnabled(): boolean {
  return this.getFeatureFlagUsecase.execute(DashboardFeatures.WIDGETS_V2);
}`}
        language="typescript"
      />
      <p>
        Формат ключей:{' '}
        <code>&lt;module&gt;.&lt;feature&gt;.&lt;action&gt;</code>
      </p>
    </DocSection>
    <DocSection title="Фичи vs Permissions">
      <DocTable
        columns={[
          { header: 'Характеристика', key: 'characteristic' },
          { header: 'Feature Flags', key: 'features' },
          { header: 'Permissions', key: 'permissions' },
        ]}
        rows={[
          {
            characteristic: 'Динамичность',
            features: 'Статичны в сессии',
            permissions: 'Динамические',
          },
          {
            characteristic: 'Область действия',
            features: 'К приложению',
            permissions: 'К пользователю',
          },
          {
            characteristic: 'Сценарий',
            features: 'A/B тестирование, kill switches',
            permissions: 'Контроль доступа',
          },
        ]}
      />
    </DocSection>
    <DocNote type="info" title="Использование в View">
      <DocCodeBlock
        code={`const DashboardPage = observer(() => {
  const viewModel = useVM<DashboardViewModel>(
    DASHBOARD_DI_TOKENS.VIEW_MODEL_DASHBOARD,
  );

  return (
    <div>
      {viewModel.isNewWidgetsEnabled ? (
        <NewWidgets />
      ) : (
        <OldWidgets />
      )}
    </div>
  );
});`}
        language="typescript"
      />
    </DocNote>
  </DocSection>
);
