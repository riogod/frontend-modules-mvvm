import { type FC, memo } from 'react';
import { useVM, Box, Card } from '@platform/ui';
import { type IProps } from './interface';
import TodoItemActions from './TodoItemActions';
import TodoItemActionComplete from './TodoItemComplete';
import type { TodoListViewModel } from '../../viewmodels/todo_list.vm';
import TodoItemDescription from './TodoItemDescription';
import TodoItemDate from './TodoItemDate';
import { TODO_DI_TOKENS } from '../../config/di.tokens';

const TodoItem: FC<IProps> = ({ item }) => {
  const listViewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );

  const handleComplete = () => {
    listViewModel.updateItem({
      id: item.id,
      description: item.description,
      completed: !item.completed,
    });
  };

  const handleRemove = () => {
    listViewModel.removeItem(item.id);
  };

  return (
    <Card
      key={item.id}
      sx={{
        p: 1,
        m: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        '&:hover': {
          '& .actionIcon': {
            opacity: 1,
            display: 'flex',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TodoItemActionComplete item={item} setComplete={handleComplete} />
        <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
          <TodoItemDescription item={item} />
          <TodoItemDate item={item} />
        </Box>
      </Box>
      <TodoItemActions removeItemHandler={handleRemove} />
    </Card>
  );
};

export default memo(TodoItem);
