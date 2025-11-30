import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model.ts';
import { TodoList, UpdateTodoList } from '../models/todo_list.interface.ts';
import { LocalStorageRepository } from '@host/modules/core/data/localStorage.repository.ts';
import { TODO_DI_TOKENS } from '../config/di.tokens';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class UpdateTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
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

    this.localStorageRepository.setKey(
      'todoList',
      JSON.stringify(parsedTodoList),
    );
  }
}
