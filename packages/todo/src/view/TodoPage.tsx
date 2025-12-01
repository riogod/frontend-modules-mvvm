import { type FC } from 'react';
import TodoInput from './components/TodoInput';
import { useVM, Container, Box } from '@platform/ui';
import type { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { Observer } from 'mobx-react-lite';
import TodoItem from './components/TodoItem';
import TodoListFilter from './components/TodoListFilter';
import { TODO_DI_TOKENS } from '../config/di.tokens';

const TodoPage: FC = () => {
  const listViewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );

  return (
    <>
      <Container
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: 'column',
          pl: 0,
          pr: 0,
        }}
      >
        <TodoListFilter />
        <Observer>
          {() => (
            <Box sx={{ width: 1 }}>
              {listViewModel.items.map((item) => (
                <TodoItem key={item.id} item={item} />
              ))}
            </Box>
          )}
        </Observer>
        <Box sx={{ minHeight: 124 }} />
      </Container>
      <TodoInput />
    </>
  );
};

export default TodoPage;
