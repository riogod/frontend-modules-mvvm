import { type FC } from 'react';
import { DocSection, DocSteps, DocCommand } from '../../../common';

export const InstallationSection: FC = () => (
  <DocSection title="Установка">
    <DocSteps
      steps={[
        {
          title: 'Клонирование репозитория',
          content: (
            <>
              <p>Если вы еще не склонировали проект, выполните:</p>
              <DocCommand command="git clone <repository-url>" />
              <DocCommand command="cd frontend-modules-mvvm" />
            </>
          ),
        },
        {
          title: 'Установка зависимостей',
          content: (
            <>
              <p>
                Проект использует npm workspaces для управления зависимостями
                всех модулей и библиотек. Установка выполняется одной командой:
              </p>
              <DocCommand command="npm install" />
            </>
          ),
        },
      ]}
    />
  </DocSection>
);
