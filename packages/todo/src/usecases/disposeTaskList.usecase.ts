import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model';
import { TODO_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class DisposeTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(): void {
    this.todoModel.dispose();
  }
}
