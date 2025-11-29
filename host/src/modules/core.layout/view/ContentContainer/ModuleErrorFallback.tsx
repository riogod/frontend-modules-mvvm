import { Box, Button, Typography } from '@platform/ui';

const ModuleErrorFallback = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Typography>Ой! Произошла ошибка при загрузке модуля</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => window.location.reload()}
      >
        Перезагрузить страницу
      </Button>
    </Box>
  );
};

export default ModuleErrorFallback;
