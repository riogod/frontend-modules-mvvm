import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";

@injectable()
export class RemoveTaskUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(id: string): void {
    this.todoModel.removeItem(id);
  }

}
