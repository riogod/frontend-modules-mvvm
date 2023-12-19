import { FC } from 'react';
import TodoInput from './components/TodoInput.tsx';
import { useVM } from '@todo/ui';
import { TodoListViewModel } from '../viewmodels/todo_list.vm.ts';
import { Observer } from 'mobx-react-lite';
import TodoItem from './components/TodoItem.tsx';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
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
        <Observer
          children={() => (
            <Box sx={{ width: 1 }}>
              {listViewModel.items.map((item) => (
                <TodoItem key={item.id} item={item} />
              ))}
            </Box>
          )}
        />
        <Box sx={{ minHeight: 124 }} />
      </Container>
      <TodoInput />
    </>
  );
};

export default TodoPage;
