import type { Container } from 'inversify';
import { TODO_DI_TOKENS } from './di.tokens';

// Re-export for backward compatibility
export { TODO_DI_TOKENS };

import { TodoListModel } from '../models/todo_list.model';
import { AddTaskUsecase } from '../usecases/addTask.usecase';
import { TodoListViewModel } from '../viewmodels/todo_list.vm';
import {
  GetTaskListUsecase,
  RemoveTaskUsecase,
  UpdateTaskUsecase,
} from '../usecases';
import { DisposeTaskListUsecase } from '../usecases/disposeTaskList.usecase';
import { LoadTaskListUsecase } from '../usecases/loadTaskList.usecase';

export const DI_CONFIG = (container: Container) => {
  container.bind(TODO_DI_TOKENS.MODEL_TODO_LIST).to(TodoListModel);
  container.bind(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST).to(TodoListViewModel);
  container.bind(TODO_DI_TOKENS.USECASE_ADD_TASK).to(AddTaskUsecase);
  container.bind(TODO_DI_TOKENS.USECASE_GET_TASK_LIST).to(GetTaskListUsecase);
  container.bind(TODO_DI_TOKENS.USECASE_REMOVE_TASK).to(RemoveTaskUsecase);
  container.bind(TODO_DI_TOKENS.USECASE_UPDATE_TASK).to(UpdateTaskUsecase);
  container
    .bind(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
    .to(DisposeTaskListUsecase);
  container.bind(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST).to(LoadTaskListUsecase);

  return container;
};
