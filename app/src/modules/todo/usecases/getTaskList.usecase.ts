import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { TodoList } from "../models/todo_list.interface.ts";

@injectable()
export class GetTaskListUsecase {

  constructor(
    @inject(TodoListModel)
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
