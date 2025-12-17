import { Box, Button, Container, Typography } from '@platform/ui';

const ModuleErrorFallback = ({ error }: { error: Error }) => {
  return (
    <Container
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'error.main',
          borderRadius: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Ой! Что-то пошло не так
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Перезагрузить страницу
        </Button>
      </Box>
    </Container>
  );
};

export default ModuleErrorFallback;
