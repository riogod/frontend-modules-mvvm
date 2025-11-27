import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model.ts';
import type { LocalStorageRepository } from '../../core/data/localStorage.repository.ts';
import { TodoList } from '../models/todo_list.interface.ts';
import { TODO_DI_TOKENS } from '../config/di.tokens';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class AddTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(text: string): void {
    if (!text) return;

    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

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

    parsedTodoList.push(this.todoModel.items[this.todoModel.items.length - 1]);
    this.localStorageRepository.setKey(
      'todoList',
      JSON.stringify(parsedTodoList),
    );
  }
}
