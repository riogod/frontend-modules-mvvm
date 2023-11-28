import { TodoList } from "../../models/todo_list.interface.ts";

export interface IProps {
  item: TodoList;
}

export interface IActions {
  removeItemHandler: () => void;
}

export interface ICompleteActions extends IProps {
  setComplete: () => void;
}
