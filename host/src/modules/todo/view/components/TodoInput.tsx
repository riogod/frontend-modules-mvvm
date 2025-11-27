import { type ChangeEvent, type FC, useState, type KeyboardEvent } from 'react';
import {
  useVM,
  Box,
  Container,
  Fab,
  Paper,
  TextField,
  AddIcon,
} from '@platform/ui';
import type { TodoListViewModel } from '../../viewmodels/todo_list.vm.ts';
import { useTranslation } from 'react-i18next';
import { TODO_DI_TOKENS } from '../../config/di.tokens';

const TodoInput: FC = () => {
  const listViewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );
  const { t } = useTranslation('todo');
  const [value, setValue] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };
  const setComplete = () => {
    if (!value) return;
    listViewModel.setItem(value);
    setValue('');
  };

  const onSaveHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      setComplete();
    }
  };

  return (
    <Paper
      elevation={10}
      square
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: 1,
        height: 96,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container
        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <TextField
          fullWidth
          autoFocus
          multiline
          maxRows={3}
          value={value}
          variant="standard"
          id="outlined-uncontrolled"
          onKeyDown={onSaveHandler}
          onChange={handleChange}
          label={t('actions.inputHelper')}
        />
        <Box sx={{ minWidth: 64, display: 'flex', justifyContent: 'end' }}>
          <Fab
            disabled={!value}
            color="primary"
            onClick={setComplete}
            aria-label={t('actions.add')}
          >
            <AddIcon fontSize="medium" />
          </Fab>
        </Box>
      </Container>
    </Paper>
  );
};

export default TodoInput;
