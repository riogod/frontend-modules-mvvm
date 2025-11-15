import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { TodoList, UpdateTodoList } from "../models/todo_list.interface.ts";
import { LocalStorageRepository } from "../../core/data/localStorage.repository.ts";

@injectable()
export class UpdateTaskUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
    @inject(LocalStorageRepository)
    private localStorageRepository: LocalStorageRepository
  ) {
    makeAutoObservable(this);
  }

  execute(item: UpdateTodoList): void {
    this.todoModel.updateItem(item);
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    let parsedTodoList: TodoList[] = [];
    
    if (todoList && todoList.trim()) {
      try {
        parsedTodoList = JSON.parse(todoList) as TodoList[];
      } catch {
        // Если данные повреждены, начинаем с пустого массива
        parsedTodoList = [];
      }
    }
    
    const index = parsedTodoList.findIndex((todo) => todo.id === item.id);
    if (index !== -1) {
      parsedTodoList[index] = this.todoModel.items[index];
    }

    this.localStorageRepository.setKey('todoList', JSON.stringify(parsedTodoList));
  }

}
