import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocCommand } from '../../../common';

export const PreviewSection: FC = () => (
  <DocSection
    title="Режим Preview"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
    <Typography variant="body2" paragraph>
      Для просмотра готового приложения в режиме production, выполните команду:
    </Typography>
    <DocCommand command="npm run preview" />

    <Typography variant="body2" paragraph>
      Эта команда соберет приложение и запустит его на порту 4300. В данной
      конфигурации все модули будут загружены как REMOTE модули и вам необходимо
      будет настроить API URL в конфигурации. Также необходимо создать эндпоинт,
      который будет отдавать манифест (пример такого локального сервера для
      проведения тестов расположен в examples/manifest-server).
    </Typography>

    <Typography variant="body2">
      В этом режиме можно локально протестировать приложение в приближенном к
      боевому режиме.
    </Typography>
  </DocSection>
);
