export interface TodoList {
  id: string;
  description: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UpdateTodoList = Pick<TodoList, "id" | "description" | "completed">;
