export interface BaseComment {
  author: string;
  content: string;
  timestamp: string; // ISO date string
}

export interface Comment extends BaseComment {
  comment_id: number;
}

export interface TaskResponse {
  status: string;
  workspace_id: number;
  board_id: number;
  task: {
    id: number,
    board_id: number,
    workspace_id: number,
    title: string,
    description: string,
    points: number,
    priority: number,
    status_id: number,
    created_by: number,
    created_on: string,
    assigned_to: number,
    due_date: string,
  }
}

export interface TaskDBResponse {
  status: string;
  workspace_id: number;
  board_id: number;
  task: Task;
}

export interface TaskDBModel {
  id: number;
  title: string;
  description: string;
  points: number,
  priority: number,
  status_id: number,
  created_by: number,
  created_on: string,
  assigned_to: number,
  due_date: string,

}

export interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  priority: string;
  dueDate: string;     // ISO date string
  status: string;
  creator: string,
  assignee: string;
  comments: Comment[];
  categories: Category[];
}

export interface TaskPriority {
  id: string;        // 'low' | 'medium' | 'high'
  level: string;     // 'Low'
  color: string;     // 'secondary' | 'default' | 'destructive'
}

export interface TaskPriorityResponse {
  status: string;        
  task_priorities: TaskPriority[];
}

export interface Status {
  id: number;
  name: string;
}

export interface StatusResponse {
  status: string;
  statuses: Status[];
}

export interface Category {
  id: number;
  value: string;
  color: string;
}

export interface CategoryResponse {
  status: string;
  categories: Category[];
}

// For boards->tasks mapping
export type BoardTasksMap = Record<string, Task[]>;
