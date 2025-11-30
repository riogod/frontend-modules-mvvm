import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model.ts';
import { TodoList } from '../models/todo_list.interface.ts';
import { TODO_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class GetTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(): TodoList[] {
    if (this.todoModel.completeFilter) {
      return this.todoModel.items;
    }
    return this.todoModel.items.filter((item) => !item.completed);
  }
}
