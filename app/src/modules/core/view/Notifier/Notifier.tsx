import { FC } from 'react';
import { observer } from 'mobx-react-lite';
import Snackbar from '@mui/material/Snackbar';
import { AppSettingsViewModel } from '../../viewmodels/appSettings.vm.ts';
import { useVM } from '@todo/ui';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';

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
