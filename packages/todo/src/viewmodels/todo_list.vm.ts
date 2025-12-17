import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model';
import { UpdateTodoList } from '../models/todo_list.interface';
import {
  AddTaskUsecase,
  GetTaskListUsecase,
  RemoveTaskUsecase,
  UpdateTaskUsecase,
} from '../usecases/index';
import { TODO_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class TodoListViewModel {
  get items() {
    return this.getTaskListUsecase.execute();
  }

  get allItemsLength() {
    return this.todoModel.items.length;
  }
  get notCompletedItems() {
    return this.todoModel.items.filter((item) => !item.completed);
  }

  get completeFilterStatus() {
    return this.todoModel.completeFilter;
  }

  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.USECASE_ADD_TASK)
    private addTaskUsecase: AddTaskUsecase,
    @inject(TODO_DI_TOKENS.USECASE_REMOVE_TASK)
    private removeTaskUsecase: RemoveTaskUsecase,
    @inject(TODO_DI_TOKENS.USECASE_UPDATE_TASK)
    private updateTaskUsecase: UpdateTaskUsecase,
    @inject(TODO_DI_TOKENS.USECASE_GET_TASK_LIST)
    private getTaskListUsecase: GetTaskListUsecase,
  ) {
    makeAutoObservable(this);
  }

  setItem(text: string) {
    this.addTaskUsecase.execute(text);
  }

  removeItem(id: string) {
    this.removeTaskUsecase.execute(id);
  }

  updateItem(item: UpdateTodoList) {
    this.updateTaskUsecase.execute(item);
  }

  setCompleteFilter(filter: boolean) {
    this.todoModel.setCompleteFilter(filter);
  }
}
