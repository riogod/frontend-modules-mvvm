import { type FC } from 'react';
import TodoInput from './components/TodoInput.tsx';
import { useVM, Container, Box } from '@todo/ui';
import { TodoListViewModel } from '../viewmodels/todo_list.vm.ts';
import { Observer } from 'mobx-react-lite';
import TodoItem from './components/TodoItem.tsx';
import TodoListFilter from './components/TodoListFilter.tsx';

const TodoPage: FC = () => {
  const listViewModel = useVM<TodoListViewModel>(TodoListViewModel);

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
