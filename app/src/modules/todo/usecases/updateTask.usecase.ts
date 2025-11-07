import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { UpdateTodoList } from "../models/todo_list.interface.ts";

@injectable()
export class UpdateTaskUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(item: UpdateTodoList): void {
    this.todoModel.updateItem(item);
  }

}
