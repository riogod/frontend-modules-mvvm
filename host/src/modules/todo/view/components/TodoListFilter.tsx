import { type FC } from 'react';
import { useVM, Box, Typography, FormControlLabel, Switch } from '@platform/ui';
import { TodoListViewModel } from '../../viewmodels/todo_list.vm.ts';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

const TodoListFilter: FC = () => {
  const listViewModel = useVM<TodoListViewModel>(TodoListViewModel);
  const { t } = useTranslation('todo');

  if (listViewModel.allItemsLength === 0) return null;

  const handleCompleteFilter = () => {
    listViewModel.setCompleteFilter(!listViewModel.completeFilterStatus);
  };
  return (
    <Box
      sx={{
        width: 1,
        pt: 2,
        ml: 1,
        minHeight: 64,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          ml: 1,
        }}
      >
        {t('item-list.tasks-todo', {
          count: listViewModel.notCompletedItems.length,
        })}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={listViewModel.completeFilterStatus}
            onChange={handleCompleteFilter}
          />
        }
        label={
          <Typography variant="body2">
            {t('item-list.show-completed')}
          </Typography>
        }
      />
    </Box>
  );
};

export default observer(TodoListFilter);
