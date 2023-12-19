import { FC } from 'react';
import { observer } from 'mobx-react-lite';
import Snackbar from '@mui/material/Snackbar';
import { Alert, Slide } from '@mui/material';
import { AppSettingsViewModel } from '../../viewmodels/appSettings.vm.ts';
import { useVM } from '@todo/ui';

const Notifier: FC = () => {
  const appViewModel = useVM<AppSettingsViewModel>(AppSettingsViewModel);
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
