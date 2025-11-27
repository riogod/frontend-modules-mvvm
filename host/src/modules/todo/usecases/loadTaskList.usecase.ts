import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model.ts';
import { TodoList } from '../models/todo_list.interface.ts';
import { LocalStorageRepository } from '../../core/data/localStorage.repository.ts';
import { log } from '@platform/core';

@injectable()
export class LoadTaskListUsecase {
  constructor(
    @inject(TodoListModel)
    private todoModel: TodoListModel,
    @inject(LocalStorageRepository)
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
