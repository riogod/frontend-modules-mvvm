import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { UpdateTodoList } from "../models/todo_list.interface.ts";
import { AddTaskUsecase, GetTaskListUsecase, RemoveTaskUsecase, UpdateTaskUsecase } from "../usecases/index.ts";


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
    @inject(TodoListModel)
    private todoModel: TodoListModel,
    @inject(AddTaskUsecase)
    private addTaskUsecase: AddTaskUsecase,
    @inject(RemoveTaskUsecase)
    private removeTaskUsecase: RemoveTaskUsecase,
    @inject(UpdateTaskUsecase)
    private updateTaskUsecase: UpdateTaskUsecase,
    @inject(GetTaskListUsecase)
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
