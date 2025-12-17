import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model';
import { TodoList } from '../models/todo_list.interface';
import { LocalStorageRepository } from '@host/modules/core/data/localStorage.repository';
import { IOC_CORE_TOKENS, log } from '@platform/core';
import { TODO_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class LoadTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(): void {
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    let parsedTodoList: TodoList[] = [];

    if (todoList && todoList.trim()) {
      try {
        parsedTodoList = JSON.parse(todoList) as TodoList[];
      } catch (error) {
        log.error(
          'Error parsing todoList from localStorage',
          { prefix: 'usecase.loadTaskList' },
          error,
        );
        parsedTodoList = [];
      }
    }

    parsedTodoList.forEach((item) => {
      this.todoModel.setItem(item);
    });
  }
}
