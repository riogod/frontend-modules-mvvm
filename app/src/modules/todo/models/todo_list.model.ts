import { action, computed, makeAutoObservable } from "mobx";
import { injectable } from "inversify";
import { TodoList, UpdateTodoList } from "./todo_list.interface.ts";

@injectable()
export class TodoListModel {
  private _todos: TodoList[] = [];
  private _completeFilter: boolean = false;

  get completeFilter(): boolean {
    return this._completeFilter;
  }
  get items(): TodoList[] {
    return this._todos;
  }
  constructor() {
    makeAutoObservable(this, {
      items: computed,
      setItem: action,
      removeItem: action,
      updateItem: action,
    });
  }

  setItem(item: TodoList) {
    this._todos.push(item);
  }

  setCompleteFilter(filter: boolean) {
    this._completeFilter = filter;
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }

  updateItem(todo: UpdateTodoList) {
    const item = this._todos.find((item) => item.id === todo.id);
    if (item) {
      item.description = todo.description;
      item.completed = todo.completed;
      item.updated_at = new Date();
    }
  }
}
