import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import type { AppSettingsViewModel } from '../../../core/viewmodels/appSettings.vm';
import { useVM, Alert, Slide, Snackbar } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

const Notifier: FC = () => {
  const appViewModel = useVM<AppSettingsViewModel>(
    IOC_CORE_TOKENS.VIEW_MODEL_APP_SETTINGS,
  );
  const handleClose = () => {
    appViewModel.clearNotification();
  };

  return (
    <Snackbar
      open={!!appViewModel.notification}
      TransitionComponent={Slide}
      autoHideDuration={5000}
      onClose={handleClose}
    >
      <Alert severity="error" sx={{ width: '100%' }}>
        {appViewModel.notification}
      </Alert>
    </Snackbar>
  );
};

export default observer(Notifier);
