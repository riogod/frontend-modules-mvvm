import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";

@injectable()
export class AddTaskUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(text: string): void {
    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

}
