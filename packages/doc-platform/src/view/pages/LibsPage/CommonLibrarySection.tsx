import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocNote } from '../../common';

export const CommonLibrarySection: FC = () => (
  <DocSection title="Common Library">
    <DocSection title="AccessControlModel">
      <p>Модель для управления доступом (фичи, права, параметры).</p>
      <DocCodeBlock
        code={`import { AccessControlModel } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  get features() {
    return this.accessControlModel.features;
  }

  get permissions() {
    return this.accessControlModel.permissions;
  }

  get params() {
    return this.accessControlModel.params;
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Feature Flags Use Cases">
      <p>Use Cases для работы с фичами:</p>
      <DocCodeBlock
        code={`import {
  GetFeatureFlagUsecase,
  GetFeatureFlagsUsecase,
  SetFeatureFlagsUsecase,
  UpdateFeatureFlagsUsecase,
  RemoveFeatureFlagsUsecase,
} from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Получить одну фичу
  get isNewDashboardEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('dashboard.v2');
  }

  // Установить фичи
  async setFeatures(features: Record<string, boolean>): Promise<void> {
    const setFeatureFlagsUsecase = this.di.get<SetFeatureFlagsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_FEATURE_FLAGS,
    );
    await setFeatureFlagsUsecase.execute(features);
  }

  // Обновить фичи
  async updateFeatures(updates: Record<string, boolean>): Promise<void> {
    const updateFeatureFlagsUsecase = this.di.get<UpdateFeatureFlagsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_FEATURE_FLAGS,
    );
    await updateFeatureFlagsUsecase.execute(updates);
  }

  // Удалить фичи
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
    <DocSection title="Permissions Use Cases">
      <p>Use Cases для работы с правами доступа:</p>
      <DocCodeBlock
        code={`import {
  GetPermissionUsecase,
  GetPermissionsUsecase,
  SetPermissionsUsecase,
  UpdatePermissionsUsecase,
  RemovePermissionsUsecase,
} from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Получить одно право
  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }

  // Получить все права
  get allPermissions(): Record<string, boolean> {
    const getPermissionsUsecase = this.di.get<GetPermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS,
    );
    return getPermissionsUsecase.execute();
  }

  // Установить права
  async setPermissions(permissions: Record<string, boolean>): Promise<void> {
    const setPermissionsUsecase = this.di.get<SetPermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_PERMISSIONS,
    );
    await setPermissionsUsecase.execute(permissions);
  }

  // Обновить права
  async updatePermissions(updates: Record<string, boolean>): Promise<void> {
    const updatePermissionsUsecase = this.di.get<UpdatePermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_PERMISSIONS,
    );
    await updatePermissionsUsecase.execute(updates);
  }

  // Удалить права
  async removePermissions(keys: string[]): Promise<void> {
    const removePermissionsUsecase = this.di.get<RemovePermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_REMOVE_PERMISSIONS,
    );
    await removePermissionsUsecase.execute(keys);
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Server Parameters Use Cases">
      <p>Use Cases для работы с параметрами сервера:</p>
      <DocCodeBlock
        code={`import {
  GetParamUsecase,
  GetParamsUsecase,
  SetParamsUsecase,
  UpdateParamsUsecase,
  RemoveParamUsecase,
} from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Получить один параметр
  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('my-module.api-url') || '';
  }

  // Получить все параметры
  get allParams(): Record<string, string | number | boolean> {
    const getParamsUsecase = this.di.get<GetParamsUsecase>(
      IOC_CORE_TOKENS.USECASE_GET_PARAMS,
    );
    return getParamsUsecase.execute();
  }

  // Установить параметры
  async setParams(params: Record<string, string | number | boolean>): Promise<void> {
    const setParamsUsecase = this.di.get<SetParamsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_PARAMS,
    );
    await setParamsUsecase.execute(params);
  }

  // Обновить параметры
  async updateParams(updates: Record<string, string | number | boolean>): Promise<void> {
    const updateParamsUsecase = this.di.get<UpdateParamsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_PARAMS,
    );
    await updateParamsUsecase.execute(updates);
  }

  // Удалить параметр
  async removeParam(key: string): Promise<void> {
    const removeParamUsecase = this.di.get<RemoveParamUsecase>(
      IOC_CORE_TOKENS.USECASE_REMOVE_PARAM,
    );
    await removeParamUsecase.execute(key);
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Использование в ViewModels">
      Все Use Cases из @platform/common используются для проверки фич, прав и
      параметров. Это позволяет динамически управлять доступом к
      функциональности.
    </DocNote>
  </DocSection>
);
