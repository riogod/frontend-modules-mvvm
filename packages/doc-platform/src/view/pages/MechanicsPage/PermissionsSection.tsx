import { type FC } from 'react';
import {
  DocSection,
  DocCodeBlock,
  DocList,
  DocNote,
  DocTable,
} from '../../common';

export const PermissionsSection: FC = () => (
  <DocSection title="Permissions">
    <DocSection title="Обзор">
      <p>
        Права (Permissions) - это флаги контроля доступа, привязанные к ролям
        пользователя.
      </p>
      <DocList
        items={[
          'Контроль доступа к CRUD операциям',
          'Скрытие UI элементов на основе прав',
          'Защита маршрутов',
          'Role-Based Access Control (RBAC)',
        ]}
      />
    </DocSection>
    <DocSection title="Use Cases">
      <DocCodeBlock
        code={`import {
  GetPermissionUsecase,
  GetPermissionsUsecase,
  SetPermissionsUsecase,
  UpdatePermissionsUsecase,
  RemovePermissionsUsecase,
} from '@platform/common';

@injectable()
export class UsersViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS)
    private getPermissionsUsecase: GetPermissionsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Получить одно право (реактивный геттер)
  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }

  // ✅ Получить все права (реактивный геттер)
  get allPermissions(): Record<string, boolean> {
    return this.getPermissionsUsecase.execute();
  }

  // ✅ Установить права
  async setPermissions(permissions: Record<string, boolean>): Promise<void> {
    const setPermissionsUsecase = this.di.get<SetPermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_PERMISSIONS,
    );
    await setPermissionsUsecase.execute(permissions);
  }

  // ✅ Обновить права
  async updatePermissions(updates: Record<string, boolean>): Promise<void> {
    const updatePermissionsUsecase = this.di.get<UpdatePermissionsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_PERMISSIONS,
    );
    await updatePermissionsUsecase.execute(updates);
  }

  // ✅ Удалить права
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
    <DocSection title="Конфигурация модуля">
      <p>Укажите права в mockModuleInfo для условной загрузки:</p>
      <DocCodeBlock
        code={`// config/module_config.ts
export default {
  mockModuleInfo: {
    name: 'users',
    dependencies: ['auth'],
    featureFlags: ['users.enabled'],
    accessPermissions: ['users.access', 'users.manage'], // Права
  },
} as ModuleConfig;`}
        language="typescript"
      />
      <p>Модуль не загрузится, если хотя бы одно право отсутствует.</p>
    </DocSection>
    <DocSection title="Именование прав">
      <p>Используйте enum для определения прав:</p>
      <DocCodeBlock
        code={`// config/permission.enum.ts
export enum UsersPermissions {
  ACCESS = 'users.access',
  CREATE = 'users.create',
  READ = 'users.read',
  UPDATE = 'users.update',
  DELETE = 'users.delete',
  MANAGE = 'users.manage',
}

// Использование
get canCreateUser(): boolean {
  return this.getPermissionUsecase.execute(UsersPermissions.CREATE);
}`}
        language="typescript"
      />
      <p>
        Формат ключей: <code>&lt;module&gt;.&lt;entity&gt;.&lt;action&gt;</code>
      </p>
    </DocSection>
    <DocSection title="Различия между Feature Flags и Permissions">
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
          {
            characteristic: 'Изменение',
            features: 'Администратором',
            permissions: 'Бэкендом при смене роли',
          },
        ]}
      />
    </DocSection>
    <DocNote type="warning" title="Важно">
      Всегда проверяйте права на бэкенде. Проверка на фронтенде только для UI, а
      не для реального контроля доступа.
    </DocNote>
    <DocSection title="Использование в View">
      <DocCodeBlock
        code={`const UsersPage = observer(() => {
  const viewModel = useVM<UsersViewModel>(
    USERS_DI_TOKENS.VIEW_MODEL_USERS,
  );

  return (
    <div>
      <Button
        variant="contained"
        disabled={!viewModel.canCreateUser}
        onClick={() => viewModel.openCreateDialog()}
      >
        Create User
      </Button>

      <Table>
        {viewModel.users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell align="right">
              {viewModel.canUpdate && (
                <IconButton onClick={() => viewModel.editUser(user.id)}>
                  <EditIcon />
                </IconButton>
              )}
              {viewModel.canDelete && (
                <IconButton onClick={() => viewModel.deleteUser(user.id)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
});`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
