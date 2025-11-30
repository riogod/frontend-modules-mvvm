import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model.ts';
import { LocalStorageRepository } from '@host/modules/core/data/localStorage.repository.ts';
import { TodoList } from '../models/todo_list.interface.ts';
import { TODO_DI_TOKENS } from '../config/di.tokens';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class RemoveTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
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

    this.localStorageRepository.setKey(
      'todoList',
      JSON.stringify(parsedTodoList),
    );
  }
}
