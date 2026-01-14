import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  ArrowLeft, Calendar, AlertCircle, LayoutList, Columns, MessageSquare, 
  Plus, Pencil, Trash2, Tags 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

import type { Task, TaskPriority, BaseComment, Status, Category } from '../models/task';
import type { LoginUser, UserPrivileges } from '../models/user';
import type { BoardAccess, WorkspaceAccess } from '../models/workspace';
import { boardService } from '../services/boardService';
import { categoryService } from '../services/categoryService';
import { workspaceService } from '../services/workspaceService';
import { taskService } from '../services/taskService';

interface BoardViewWithCRUDProps {
  currentUser: LoginUser;
  workspaceId: number;
  boardId: number;
  onBack: () => void;
  onLogout: () => void;
}

export function BoardViewWithCRUD({ 
  currentUser,
  workspaceId,
  boardId,
  onBack,
  onLogout,
}: BoardViewWithCRUDProps) {
  const [viewMode, setViewMode] = useState<'list' | 'columns'>('list');
  const [groupingMode, setGroupingMode] = useState<'status' | 'category'>('status');

  // Filters (apply ONLY in list view)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilterIds, setCategoryFilterIds] = useState<number[]>([]);

  const [board, setBoard] = useState<BoardAccess | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userPrivileges, setUserPrivileges] = useState<UserPrivileges | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');

  const [priorities, setPriorities] = useState<TaskPriority[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Task CRUD dialogs
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });
  const [deleteTaskDialog, setDeleteTaskDialog] = useState<{
    open: boolean;
    taskId: number;
    taskTitle: string;
  }>({
    open: false,
    taskId: 0,
    taskTitle: '',
  });

  // Category CRUD dialogs
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category: Category | null;
  }>({
    open: false,
    category: null,
  });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState<{
    open: boolean;
    categoryId: number;
    categoryName: string;
  }>({
    open: false,
    categoryId: 0,
    categoryName: '',
  });
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    points: 0,
    priority: 'low',
    dueDate: '',
    status: 'todo',
    assignee: '',
    categoryIds: [] as number[],
  });

  // Category form
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===== Data loading =====
  const loadTasks = async () => {
    const boardAccess = await boardService.getBoard(workspaceId, boardId);
    setTasks(boardAccess.tasks ?? []);
  };

  const loadCategories = async () => {
    const cats = await categoryService.getCategories();
    setCategories(cats);
  };

  const loadPrivileges = async () => {
    const wsAccess: WorkspaceAccess = await workspaceService.getWorkspaceAccess(workspaceId, currentUser.id);
    const hasAccess = !!wsAccess;

    const priv: UserPrivileges = {
      userId: currentUser.id,
      workspaceId,
      canCreate: hasAccess,
      canEdit: hasAccess,
      canDelete: hasAccess,
    };
    setUserPrivileges(priv);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [boardDetails, pList, sList] = await Promise.all([
          boardService.getBoard(workspaceId, boardId), // returns BoardAccess
          taskService.getPriorities(),
          taskService.getStatuses(),
        ]);

        setBoard(boardDetails);
        setPriorities(pList);
        setStatuses(sList);

        await Promise.all([loadTasks(), loadCategories(), loadPrivileges()]);
      } catch (err) {
        console.error('Failed to load board view data', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [boardId, workspaceId, currentUser.id]);

  const canCreate = userPrivileges?.canCreate ?? false;
  const canEdit = userPrivileges?.canEdit ?? false;
  const canDelete = userPrivileges?.canDelete ?? false;

  const assigneeOptions = board?.users ?? [];

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const isCompletedStatus = (status: string) =>
    status.toLowerCase() === 'completed';


  const sortTasksByPriorityAndDate = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      const aPastDue = isPastDue(a.dueDate) && a.status !== 'completed';
      const bPastDue = isPastDue(b.dueDate) && b.status !== 'completed';
      
      if (aPastDue && !bPastDue) return -1;
      if (!aPastDue && bPastDue) return 1;

      const priorityOrder: { [key: string]: number } = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const toDateInputValue = (value: string | null | undefined): string => {
    if (!value) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';

    return d.toISOString().slice(0, 10);
  };

  const sortedTasks = sortTasksByPriorityAndDate(tasks);

  // === Filters (only applied in list view) ===
  const applyListFilters = (tasksInput: Task[]): Task[] => {
    let result = [...tasksInput];

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (categoryFilterIds.length > 0) {
      result = result.filter((t) => {
        const taskCats = t.categories ?? [];
        const taskCatIds = taskCats.map((c) => c.id);
        return taskCatIds.some((id) => categoryFilterIds.includes(id));
      });
    }

    return result;
  };

  const listViewTasks = applyListFilters(sortedTasks);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'to do':
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(year, (month ?? 1) - 1, day ?? 1);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const makeTodayLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const statusDisplayOrder = ['To Do', 'In Progress', 'Completed'];

  const getSortedStatuses = (): Status[] => {
    return [...statuses].sort((a, b) => {
      const ia = statusDisplayOrder.findIndex(
        (name) => name.toLowerCase() === a.name.toLowerCase()
      );
      const ib = statusDisplayOrder.findIndex(
        (name) => name.toLowerCase() === b.name.toLowerCase()
      );

      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  };

  // Task CRUD operations
  const handleCreateTask = () => {
    // const today = new Date().toISOString().split('T')[0];
    const today = makeTodayLocalDateString();
    setTaskForm({
      title: '',
      description: '',
      points: 0,
      priority: 'medium',
      dueDate: today,
      status: 'To Do',
      assignee: currentUser.username,
      categoryIds: [],
    });
    setTaskDialog({ open: true, task: null });
  };

  const handleEditTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskForm({
      title: task.title,
      description: task.description,
      points: task.points,
      priority: task.priority,
      dueDate: toDateInputValue(task.dueDate),
      status: task.status,
      assignee: task.assignee || currentUser.username,
      categoryIds: (task.categories ?? []).map((c) => c.id),
    });
    setTaskDialog({ open: true, task });
  };

  const toggleTaskFormCategory = (categoryId: number) => {
    setTaskForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;
    setSaving(true);
    try {
      let savedTaskId: number;
      if (taskDialog.task) {
        // Update existing
        await taskService.updateTask(workspaceId, boardId, taskDialog.task.id, {
          title: taskForm.title,
          description: taskForm.description,
          points: taskForm.points,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          status: taskForm.status,
          assignee: taskForm.assignee,
          // category_ids: taskForm.categoryIds,  // hook up when backend ready
        });
        savedTaskId = taskDialog.task.id;
      } else {
        // Create new
        const newTask = await taskService.createTask(workspaceId, boardId, {
          title: taskForm.title,
          description: taskForm.description,
          points: taskForm.points,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          status: taskForm.status,
          creator: currentUser.username,
          assignee: taskForm.assignee,
          // category_ids: taskForm.categoryIds,
        });
        savedTaskId = newTask.id;
      }

      // 2. BULK CATEGORY UPDATE LOGIC
      const oldCategoryIds = taskDialog.task
        ? (taskDialog.task.categories ?? []).map((c) => c.id)
        : [];

      const newCategoryIds = taskForm.categoryIds;

      const categoriesToAdd = newCategoryIds.filter((id) => !oldCategoryIds.includes(id));
      const categoriesToRemove = oldCategoryIds.filter((id) => !newCategoryIds.includes(id));

      if (categoriesToAdd.length > 0) {
        await taskService.bulkAddTaskCategories(workspaceId, boardId, savedTaskId, categoriesToAdd);
      }

      if (categoriesToRemove.length > 0) {
        await taskService.bulkRemoveTaskCategories(workspaceId, boardId, savedTaskId, categoriesToRemove);
      }

      await loadTasks();
      setTaskDialog({ open: false, task: null });
    } catch (err) {
      console.error('Failed to save task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDropOnStatus = async (targetStatus: string) => {
    if (!draggedTask) return;
    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    setSaving(true);
    try {
      await taskService.updateTask(workspaceId, boardId, draggedTask.id, {
        title: draggedTask.title,
        description: draggedTask.description,
        points: draggedTask.points,
        priority: draggedTask.priority,
        dueDate: draggedTask.dueDate,
        status: targetStatus,
        assignee: draggedTask.assignee,
      });

      await loadTasks();
    } catch (err) {
      console.error('Failed to move task by drag & drop', err);
    } finally {
      setSaving(false);
      setDraggedTask(null);
    }
  };


  const handleDeleteTask = async (taskId: number) => {
    setSaving(true);
    try {
      await taskService.deleteTask(workspaceId, boardId, taskId);
      await loadTasks();
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task', err);
    } finally {
      setSaving(false);
      setDeleteTaskDialog({ open: false, taskId: 0, taskTitle: '' });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    const comment: BaseComment = {
      author: currentUser.username,
      content: newComment,
      timestamp: new Date().toISOString(),
    };

    setSaving(true);
    try {
      await taskService.createComment(workspaceId, boardId, selectedTask.id, comment);
      const updatedTask = await taskService.getTask(workspaceId, boardId, selectedTask.id);
      setSelectedTask(updatedTask);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSaving(false);
    }
  };

  // Category CRUD operations
  const handleCreateCategory = () => {
    setCategoryForm({ name: '', color: '#3b82f6' });
    setCategoryDialog({ open: true, category: null });
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({ name: category.value, color: category.color });
    setCategoryDialog({ open: true, category });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    try {
      if (categoryDialog.category) {
        await categoryService.updateCategory(categoryDialog.category.id, {
          value: categoryForm.name,
          color: categoryForm.color,
        });
      } else {
        await categoryService.createCategory({
          value: categoryForm.name,
          color: categoryForm.color,
        });
      }
      await loadCategories();
      setCategoryDialog({ open: false, category: null });
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    setSaving(true);
    try {
      await categoryService.deleteCategory(categoryId);
      await loadCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
    } finally {
      setSaving(false);
      setDeleteCategoryDialog({ open: false, categoryId: 0, categoryName: '' });
    }
  };

  const renderTaskCard = (task: Task, showActions: boolean = true) => {
    const pastDue = !!task.dueDate && isPastDue(task.dueDate) && !isCompletedStatus(task.status);
    const taskCategories = task.categories ?? [];
    const maxVisibleCats = 2;
    const visibleCats = taskCategories.slice(0, maxVisibleCats);
    const hiddenCount = taskCategories.length - visibleCats.length;

    return (
      <Card 
        key={task.id} 
        className={`${pastDue ? 'border-red-300 bg-red-50' : ''} cursor-pointer hover:shadow-md transition-shadow`}
        onClick={() => setSelectedTask(task)}
        draggable={viewMode === 'columns' && groupingMode === 'status'}
        onDragStart={() => handleDragStart(task)}
        onDragEnd={handleDragEnd}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Past due label */}
              {pastDue && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Past Due</span>
                </div>
              )}

              {/* Title + description */}
              <div className="space-y-1">
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>{task.description}</CardDescription>
              </div>

              {/* Categories as colored blocks */}
              {taskCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleCats.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border shadow-sm"
                      style={{
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                        color: '#fff',
                      }}
                    >
                      {cat.value}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border border-dashed bg-white/60 text-gray-700">
                      +{hiddenCount} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              <Badge variant={getPriorityColor(task.priority)}>
                {task.priority.toUpperCase()}
              </Badge>

              {viewMode === 'list' && (
                <Badge className={getStatusColor(task.status)}>
                  {task.status.replace('-', ' ').toUpperCase()}
                </Badge>
              )}

              {showActions && (canEdit || canDelete) && (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditTask(task, e)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTaskDialog({ open: true, taskId: task.id, taskTitle: task.title });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
        {viewMode === 'columns' ? (
          // Column view: "Due" then "Assigned to" after it
          <div className="text-sm text-gray-600">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
              {task.assignee && (
                <span>Assigned to: {task.assignee}</span>
              )}
            </div>
          </div>
        ) : (
          // List view: keep original left/right layout
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Due: {formatDate(task.dueDate)}</span>
            </div>
            {task.assignee && (
              <span>Assigned to: {task.assignee}</span>
            )}
          </div>
        )}
      </CardContent>
      </Card>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading board…</p>
      </div>
    );
  }

  // Helpers for column view grouping
  const getTasksForStatus = (statusName: string): Task[] => {
    const filtered = tasks.filter((t) => t.status === statusName);
    return sortTasksByPriorityAndDate(filtered);
  };

  const getTasksForCategory = (categoryId: number | 'uncategorized'): Task[] => {
    if (categoryId === 'uncategorized') {
      const filtered = tasks.filter(
        (t) => !t.categories || (t.categories && t.categories.length === 0)
      );
      return sortTasksByPriorityAndDate(filtered);
    }
    const filtered = tasks.filter((t) =>
      (t.categories ?? []).some((c) => c.id === categoryId)
    );
    return sortTasksByPriorityAndDate(filtered);
  };

  const sortedStatuses = getSortedStatuses();
  const statusColumnCount = sortedStatuses.length;
  const shouldScrollStatuses = statusColumnCount > 3;

  const categoryColumnCount = categories.length + 1; // +1 for "Uncategorized"
  const shouldScrollCategories = categoryColumnCount > 3;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-gray-600">{board.workspaceName}</p>
              <h1>{board.name}</h1>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end">
              {canCreate && (
                <Button onClick={handleCreateTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowCategoryManagement(true)}
              >
                <Tags className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>

              {/* View mode toggle */}
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'columns' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('columns')}
                >
                  <Columns className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </div>

              {/* Grouping toggle (affects only column view) */}
              {viewMode === 'columns' && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500 hidden sm:inline mr-1">
                    Group by
                  </span>
                  <Button
                    variant={groupingMode === 'status' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupingMode('status')}
                  >
                    Status
                  </Button>
                  <Button
                    variant={groupingMode === 'category' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGroupingMode('category')}
                  >
                    Category
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Filters – only for LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {/* Status filter */}
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Status:</span>

              {['all', ...statuses.map((s) => s.name)].map((value) => {
                const isSelected = statusFilter === value;
                const label = value === 'all' ? 'All' : value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border"
                    style={{
                      backgroundColor: isSelected ? '#111827' : '#ffffff',   // dark fill when selected
                      borderColor: isSelected ? '#111827' : '#d1d5db',
                      color: isSelected ? '#ffffff' : '#111827',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Category:</span>

              {/* ALL option */}
              <button
                key="all"
                type="button"
                onClick={() => setCategoryFilterIds([])}   // empty array = ALL
                className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border"
                style={{
                  backgroundColor: categoryFilterIds.length === 0 ? '#111827' : '#ffffff',
                  borderColor: categoryFilterIds.length === 0 ? '#111827' : '#d1d5db',
                  color: categoryFilterIds.length === 0 ? '#ffffff' : '#111827',
                }}
              >
                All
              </button>

              {/* Individual Categories */}
              {categories.map((cat) => {
                const isSelected = categoryFilterIds.includes(cat.id);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCategoryFilterIds(categoryFilterIds.filter((id) => id !== cat.id));
                      } else {
                        setCategoryFilterIds([...categoryFilterIds, cat.id]);
                      }
                    }}
                    className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border"
                    style={{
                      backgroundColor: isSelected ? '#111827' : '#ffffff',
                      borderColor: cat.color,
                      color: isSelected ? '#ffffff' : '#111827',
                    }}
                  >
                    {cat.value}
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* MAIN CONTENT */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-gray-500">No tasks in this board yet.</p>
              {canCreate && (
                <Button onClick={handleCreateTask}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {listViewTasks.map((task) => renderTaskCard(task))}
            {listViewTasks.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-400 text-sm">
                    No tasks match the selected filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // COLUMN VIEW: grouping by status OR category
          <>
            {groupingMode === 'status' ? (
              shouldScrollStatuses ? (
                // Scrollable horizontal layout when > 3 statuses
                <div
                  className="flex gap-6 overflow-x-auto pb-2"
                  style={{ scrollbarGutter: 'stable both-edges' }}
                >
                  {sortedStatuses.map((status) => {
                    const tasksForStatus = getTasksForStatus(status.name);
                    return (
                      <div
                        key={status.id}
                        className="w-[320px] flex-shrink-0 space-y-4"
                        onDragOver={(e) => e.preventDefault()}               // allow drop
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnStatus(status.name);                   // move task here
                        }}
                      >
                        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                status.name
                              )}`}
                            />
                            <h3>{status.name}</h3>
                          </div>
                          <Badge variant="secondary">{tasksForStatus.length}</Badge>
                        </div>

                        <div className="space-y-4">
                          {tasksForStatus.map((task) => renderTaskCard(task, false))}
                          {tasksForStatus.length === 0 && (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-gray-400 text-sm">No tasks</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Grid layout when <= 3 statuses
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sortedStatuses.map((status) => {
                    const tasksForStatus = getTasksForStatus(status.name);
                    return (
                      <div
                        key={status.id}
                        className="space-y-4"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnStatus(status.name);
                        }}
                      >
                        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                status.name
                              )}`}
                            />
                            <h3>{status.name}</h3>
                          </div>
                          <Badge variant="secondary">{tasksForStatus.length}</Badge>
                        </div>

                        <div className="space-y-4">
                          {tasksForStatus.map((task) => renderTaskCard(task, false))}
                          {tasksForStatus.length === 0 && (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-gray-400 text-sm">No tasks</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Grouping by category
              shouldScrollCategories ? (
                // Scrollable layout when > 3 category columns (including uncategorized)
                <div
                  className="flex gap-6 overflow-x-auto pb-2"
                  style={{ scrollbarGutter: 'stable both-edges' }}
                >
                  {categories.map((cat) => {
                    const tasksForCat = getTasksForCategory(cat.id);
                    return (
                      <div
                        key={cat.id}
                        className="w-[320px] flex-shrink-0 space-y-4"
                      >
                        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <h3>{cat.value}</h3>
                          </div>
                          <Badge variant="secondary">{tasksForCat.length}</Badge>
                        </div>

                        <div className="space-y-4">
                          {tasksForCat.map((task) => renderTaskCard(task, false))}
                          {tasksForCat.length === 0 && (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-gray-400 text-sm">No tasks</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Uncategorized column */}
                  <div className="w-[320px] flex-shrink-0 space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <h3>Uncategorized</h3>
                      </div>
                      <Badge variant="secondary">
                        {getTasksForCategory('uncategorized').length}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {getTasksForCategory('uncategorized').map((task) =>
                        renderTaskCard(task, false)
                      )}
                      {getTasksForCategory('uncategorized').length === 0 && (
                        <Card>
                          <CardContent className="py-8 text-center">
                            <p className="text-gray-400 text-sm">No tasks</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Grid layout when <= 3 category columns
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categories.map((cat) => {
                    const tasksForCat = getTasksForCategory(cat.id);
                    return (
                      <div key={cat.id} className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <h3>{cat.value}</h3>
                          </div>
                          <Badge variant="secondary">{tasksForCat.length}</Badge>
                        </div>

                        <div className="space-y-4">
                          {tasksForCat.map((task) => renderTaskCard(task, false))}
                          {tasksForCat.length === 0 && (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-gray-400 text-sm">No tasks</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Uncategorized column */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <h3>Uncategorized</h3>
                      </div>
                      <Badge variant="secondary">
                        {getTasksForCategory('uncategorized').length}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {getTasksForCategory('uncategorized').map((task) =>
                        renderTaskCard(task, false)
                      )}
                      {getTasksForCategory('uncategorized').length === 0 && (
                        <Card>
                          <CardContent className="py-8 text-center">
                            <p className="text-gray-400 text-sm">No tasks</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Task Detail Dialog */}
      <Dialog open={selectedTask !== null} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-6xl w-full h-[600px] overflow-hidden p-0 flex flex-col">
          {selectedTask && (
            <>
              <DialogHeader className="p-6 pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedTask.title}</DialogTitle>
                  {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            setSelectedTask(null);
                            handleEditTask(selectedTask, e);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeleteTaskDialog({ 
                              open: true, 
                              taskId: selectedTask.id, 
                              taskTitle: selectedTask.title 
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <DialogDescription className="sr-only">Task details and comments</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6 flex-1 overflow-hidden">
                {/* Left Side - Task Details */}
                <div className="space-y-6 overflow-y-auto pr-2">
                  {/* Status and Priority */}
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Status</label>
                      <Badge className={getStatusColor(selectedTask.status)}>
                        {selectedTask.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Priority</label>
                      <Badge variant={getPriorityColor(selectedTask.priority)}>
                        {selectedTask.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Due Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{formatDate(selectedTask.dueDate)}</span>
                      {isPastDue(selectedTask.dueDate) && !isCompletedStatus(selectedTask.status) && (
                        <Badge variant="destructive" className="ml-2">Past Due</Badge>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  {selectedTask.assignee && (
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Assigned To</label>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {selectedTask.assignee.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedTask.assignee}</span>
                      </div>
                    </div>
                  )}

                  {/* Categories (left side, before description) */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Categories</label>
                    {selectedTask.categories && selectedTask.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.categories.map((cat) => (
                          <div
                            key={cat.id}
                            className="inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border"
                            style={{
                              backgroundColor: cat.color,
                              borderColor: cat.color,
                              color: '#fff',
                            }}
                          >
                            {cat.value}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No categories assigned</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="text-sm">{selectedTask.description}</p>
                  </div>
                </div>

                {/* Right Side - Comments */}
                <div className="border-l pl-6 flex flex-col overflow-hidden h-full">
                  <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                    <MessageSquare className="w-5 h-5" />
                    <h3>Comments</h3>
                  </div>

                  {/* Existing Comments - Scrollable */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      [...selectedTask.comments].reverse().map((comment) => (
                        <div key={comment.comment_id} className="flex gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{comment.author}</span>
                              <span className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                    )}
                  </div>

                  {/* Add Comment - Fixed at bottom */}
                  <div className="space-y-2 pt-4 border-t mt-4 flex-shrink-0">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button onClick={handleAddComment} size="sm">
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Create/Edit Dialog */}
      <Dialog open={taskDialog.open} onOpenChange={(open) => !open && setTaskDialog({ open: false, task: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{taskDialog.task ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <DialogDescription>
              {taskDialog.task ? 'Update task details' : 'Create a new task for this board'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-creator">Creator</Label>
              <Input
                id="task-creator"
                value={taskDialog.task ? taskDialog.task.creator : currentUser.username}
                disabled
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-points">Story Points</Label>
              <Input
                id="task-points"
                type="number"
                min="0"
                value={taskForm.points}
                onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                >
                  {priorities.map(p => (
                    <option key={p.id} value={p.level}>
                      {p.level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <select
                  id="task-status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due">Due Date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <select
                  id="task-assignee"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={taskForm.assignee}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, assignee: e.target.value })
                  }
                >
                  {/* Unassigned option */}
                  <option value="">Unassigned</option>

                  {/* All users who have access to this board */}
                  {assigneeOptions.map((user) => (
                    <option key={user.username} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Only members who have access to this board are listed here.
                </p>
              </div>
            </div>

            {/* Category selection in task dialog */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = taskForm.categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleTaskFormCategory(cat.id)}
                      className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-medium border ${
                        selected ? 'ring-1 ring-offset-1' : ''
                      }`}
                      style={{
                        backgroundColor: selected ? cat.color : '#ffffff',
                        borderColor: cat.color,
                        color: selected ? '#ffffff' : '#111827',
                      }}
                    >
                      {cat.value}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                Click to toggle categories for this task.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialog({ open: false, task: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} disabled={saving}>
              {taskDialog.task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <AlertDialog open={deleteTaskDialog.open} onOpenChange={(open) => !open && setDeleteTaskDialog({ open: false, taskId: 0, taskTitle: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTaskDialog.taskTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteTask(deleteTaskDialog.taskId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryManagement} onOpenChange={setShowCategoryManagement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Add, edit, or remove task categories
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {canCreate && (
              <Button onClick={handleCreateCategory} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            )}
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.value}</span>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCategoryDialog({ 
                          open: true, 
                          categoryId: category.id, 
                          categoryName: category.value 
                        })}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Create/Edit Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => !open && setCategoryDialog({ open: false, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryDialog.category ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {categoryDialog.category ? 'Update category details' : 'Create a new task category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name (e.g., To Do, In Progress)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cat-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, category: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {categoryDialog.category ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialog.open} onOpenChange={(open) => !open && setDeleteCategoryDialog({ open: false, categoryId: 0, categoryName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{deleteCategoryDialog.categoryName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteCategory(deleteCategoryDialog.categoryId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
