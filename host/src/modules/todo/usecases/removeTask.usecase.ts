import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { TodoListModel } from "../models/todo_list.model.ts";
import { LocalStorageRepository } from "../../core/data/localStorage.repository.ts";
import { TodoList } from "../models/todo_list.interface.ts";

@injectable()
export class RemoveTaskUsecase {

  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
    @inject(LocalStorageRepository)
    private localStorageRepository: LocalStorageRepository
  ) {
    makeAutoObservable(this);
  }

  execute(id: string): void {
    if (!id) return;

    this.todoModel.removeItem(id);
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
    
    const index = parsedTodoList.findIndex((todo) => todo.id === id);
    if (index !== -1) {
      parsedTodoList.splice(index, 1);
    }
    
    this.localStorageRepository.setKey('todoList', JSON.stringify(parsedTodoList));
  }

}
