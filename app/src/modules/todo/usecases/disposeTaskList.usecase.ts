import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";

@injectable()
export class DisposeTaskListUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel
  ) {
    makeAutoObservable(this);
  }

  execute(): void {
    this.todoModel.dispose();
  }

}
