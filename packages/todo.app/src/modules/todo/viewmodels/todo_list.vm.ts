import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { UpdateTodoList } from "../models/todo_list.interface.ts";

@injectable()
export class TodoListViewModel {
  get items() {
    if (this.completeFilterStatus) {
      return this.todoModel.items;
    }
    return this.todoModel.items.filter((item) => !item.completed);
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
  ) {
    makeAutoObservable(this);
  }

  setItem(text: string) {
    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  removeItem(id: string) {
    this.todoModel.removeItem(id);
  }

  updateItem(item: UpdateTodoList) {
    this.todoModel.updateItem(item);
  }

  setCompleteFilter(filter: boolean) {
    this.todoModel.setCompleteFilter(filter);
  }
}
