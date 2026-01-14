import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  LogOut, Users, Briefcase, LayoutGrid, Shield, Plus, Pencil, Trash2, Tags 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import type { LoginUser, User } from '../models/user';
import type { WorkspaceAccess, BoardAccess } from '../models/workspace';
import type { Category } from '../models/task';
import { userService } from '../services/userService';
import { workspaceService } from '../services/workspaceService';
import { boardService } from '../services/boardService';
import { categoryService } from '../services/categoryService';

interface AdminManagementProps {
  onLogout: () => void;
  currentUser: LoginUser;
}

export function AdminManagement({ 
  onLogout ,
  currentUser
}: AdminManagementProps) {
  const [activeTab, setActiveTab] = useState('workspaces');
  
  // Dialog states
  const [workspaceDialog, setWorkspaceDialog] = useState<{ open: boolean; workspace: WorkspaceAccess | null }>({ open: false, workspace: null });
  const [boardDialog, setBoardDialog] = useState<{ open: boolean; board: BoardAccess | null }>({ open: false, board: null });
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number; workspaceId: number; name: string }>({ open: false, type: '', id: 0, workspaceId: 0, name: '' });

  const [workspaceAccessDialog, setWorkspaceAccessDialog] = useState<{
    open: boolean;
    workspace: WorkspaceAccess | null;
    selectedUsers: string[];   // usernames currently checked
    originalUsers: string[];   // usernames when dialog opened
  }>({
    open: false,
    workspace: null,
    selectedUsers: [],
    originalUsers: [],
  });

  const [boardAccessDialog, setBoardAccessDialog] = useState<{
    open: boolean;
    board: BoardAccess | null;
    selectedUsers: string[];   // usernames currently checked
    originalUsers: string[];   // usernames when dialog opened
  }>({
    open: false,
    board: null,
    selectedUsers: [],
    originalUsers: [],
  });


  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    user: User | null;   // null = create, user = edit
  }>({
    open: false,
    user: null,
  });


  // Form states
  // const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '', users: [] as string[] });
  const [boardForm, setBoardForm] = useState({ name: '', description: '', workspaceId: 0, users: [] as string[] });
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6' });

  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    slug: '',
  });

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    handle: '',
    password: '',
  });

  const [userError, setUserError] = useState<string | null>(null);


  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceAccess[]>([]);
  const [boards, setBoards] = useState<BoardAccess[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [allUsers, wsAccess, boardAccess, cats] = await Promise.all([
          userService.getUsers(),
          workspaceService.getAdminWorkspaceAccess(),
          boardService.getBoardAccess(),
          categoryService.getCategories(),
        ]);
        setUsers(allUsers);
        setWorkspaces(wsAccess);
        setBoards(boardAccess);
        setCategories(cats);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshWorkspacesAndBoards = async () => {
    const [allUsers, wsAccess, boardAccess] = await Promise.all([
      userService.getUsers(),
      workspaceService.getAdminWorkspaceAccess(),
      boardService.getBoardAccess(),
    ]);
    setUsers(allUsers);
    setWorkspaces(wsAccess);
    setBoards(boardAccess);
  };

  const refreshCategories = async () => {
    const cats = await categoryService.getCategories();
    setCategories(cats);
  };

  if (loading) return <div>Loading admin data…</div>;

  // const getUserById = (userId: number) => {
  //   return users.find(u => u.id === userId);
  // };

  const getUserByName = (userName: string) => {
    return users.find(u => u.username === userName);
  };

  const getUsersWithAccess = (userNames: string[]) => {
    return userNames.map(userName => getUserByName(userName)).filter(Boolean) as User[];
  };

  // Workspace CRUD
  // const handleCreateWorkspace = () => {
  //   setWorkspaceForm({ name: '', description: '', users: [] });
  //   setWorkspaceDialog({ open: true, workspace: null });
  // };

  // const handleEditWorkspace = (workspace: WorkspaceAccess) => {
  //   setWorkspaceForm({ name: workspace.name, description: workspace.description, users: workspace.users.map(u => u.username) });
  //   setWorkspaceDialog({ open: true, workspace });
  // };

  const handleCreateWorkspace = () => {
    setWorkspaceForm({ 
      name: '', 
      description: '', 
      slug: '' });
    setWorkspaceDialog({ open: true, workspace: null });
  };

  const handleEditWorkspace = (workspace: WorkspaceAccess) => {
    setWorkspaceForm({
      name: workspace.name,
      description: workspace.description ?? '',
      slug: workspace.slug ?? '',        // assuming slug exists on WorkspaceAccess
    });
    setWorkspaceDialog({ open: true, workspace });
  };


  // const handleSaveWorkspace = async () => {
  //   if (!workspaceForm.name.trim()) return;
  //   setSaving(true);
  //   try {
  //     if (workspaceDialog.workspace) {
  //       // Update existing workspace (name/description)
  //       await workspaceService.updateWorkspace(workspaceDialog.workspace.id, {
  //         name: workspaceForm.name,
  //         description: workspaceForm.description,
  //       });
  //       // NOTE: if you add an API for workspace users, call it here.
  //     } else {
  //       // Create new workspace
  //       await workspaceService.createWorkspace({
  //         name: workspaceForm.name,
  //         description: workspaceForm.description,
  //       });
  //       // NOTE: assign users here if backend supports it.
  //     }
  //     await refreshWorkspacesAndBoards();
  //     setWorkspaceDialog({ open: false, workspace: null });
  //   } catch (err) {
  //     console.error('Failed to save workspace', err);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleSaveWorkspace = async () => {
    if (!workspaceForm.name.trim()) return;
    setSaving(true);
    try {
      if (workspaceDialog.workspace) {
        await workspaceService.updateWorkspace(workspaceDialog.workspace.id, {
          name: workspaceForm.name,
          description: workspaceForm.description,
          slug: workspaceForm.slug,
        });
      } else {
        await workspaceService.createWorkspace({
          name: workspaceForm.name,
          description: workspaceForm.description,
          slug: workspaceForm.slug,
          creator: currentUser.username,
        });
      }
      await refreshWorkspacesAndBoards();
      setWorkspaceDialog({ open: false, workspace: null });
    } catch (err) {
      console.error('Failed to save workspace', err);
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteWorkspace = async (id: number) => {
    setSaving(true);
    try {
      await workspaceService.deleteWorkspace(id);
      await refreshWorkspacesAndBoards();
    } catch (err) {
      console.error('Failed to delete workspace', err);
    } finally {
      setSaving(false);
      setDeleteDialog({ open: false, type: '', id: 0, workspaceId: 0, name: '' });
    }
  };

  // Board CRUD
  const handleCreateBoard = () => {
    const defaultWorkspaceId = workspaces[0]?.id ?? 0;
    setBoardForm({ name: '', description: '', workspaceId: defaultWorkspaceId, users: [] });
    setBoardDialog({ open: true, board: null });
  };

  const handleEditBoard = (board: BoardAccess) => {
    setBoardForm({
      name: board.name,
      description: board.description,
      workspaceId: board.workspaceId,
      users: board.users.map(u => u.username),
    });
    setBoardDialog({ open: true, board });
  };

  const handleSaveBoard = async () => {
    if (!boardForm.name.trim() || !boardForm.workspaceId) return;

    setSaving(true);
    try {
      if (boardDialog.board) {
        // Update existing board
        await boardService.updateBoard(boardDialog.board.id, boardDialog.board.workspaceId, {
          name: boardForm.name,
          description: boardForm.description,
        });

      } else {
        // Create new board
        await boardService.createBoard(boardForm.workspaceId, {
          name: boardForm.name,
          description: boardForm.description,
        });

      }
      await refreshWorkspacesAndBoards();
      setBoardDialog({ open: false, board: null });
    } catch (err) {
      console.error('Failed to save board', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async (workspaceId: number, boardId: number) => {
    try {
      await boardService.deleteBoard(workspaceId, boardId);

      // Update UI
      const updatedBoards = boards.filter(b => b.id !== boardId);
      setBoards(updatedBoards);

      const updatedWorkspaces = workspaces.map(ws =>
        ws.id === workspaceId
          ? { ...ws, boardCount: Math.max(0, ws.boardCount - 1) }
          : ws
      );
      setWorkspaces(updatedWorkspaces);

    } catch (err) {
      console.error("Failed to delete board:", err);
    }

    setDeleteDialog({ open: false, type: '', id: 0, workspaceId: 0, name: '' });
  };


  // Category CRUD
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
      await refreshCategories();
      setCategoryDialog({ open: false, category: null });
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setSaving(true);
    try {
      await categoryService.deleteCategory(id);
      await refreshCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
    } finally {
      setSaving(false);
      setDeleteDialog({ open: false, type: '', id: 0, workspaceId: 0, name: '' });
    }
  };

  // Helper to open access dialog for a workspace
  const openWorkspaceAccessDialog = (workspace: WorkspaceAccess) => {
    const usernames = workspace.users.map(u => u.username);

    setWorkspaceAccessDialog({
      open: true,
      workspace,
      selectedUsers: usernames,   // what the checkboxes show
      originalUsers: usernames,   // snapshot for diff
    });
  };


  const handleSaveWorkspaceAccess = async () => {
    const dialog = workspaceAccessDialog;
    if (!dialog.workspace) return;

    const { originalUsers, selectedUsers, workspace } = dialog;

    const originalSet = new Set(originalUsers);
    const selectedSet = new Set(selectedUsers);

    const toAdd = [...selectedSet].filter(u => !originalSet.has(u));
    const toRemove = [...originalSet].filter(u => !selectedSet.has(u));

    // If nothing changed, bail early
    if (toAdd.length === 0 && toRemove.length === 0) {
      setWorkspaceAccessDialog({ open: false, workspace: null, selectedUsers: [], originalUsers: [] });
      return;
    }

    setSaving(true);
    try {
      if (toAdd.length > 0) {
        await workspaceService.addWorkspaceUsers(workspace.id, toAdd);
      }
      if (toRemove.length > 0) {
        await workspaceService.removeWorkspaceUsers(workspace.id, toRemove);
      }

      await refreshWorkspacesAndBoards();

      setWorkspaceAccessDialog({
        open: false,
        workspace: null,
        selectedUsers: [],
        originalUsers: [],
      });
    } catch (err) {
      console.error('Failed to update workspace access', err);
    } finally {
      setSaving(false);
    }
  };


    // User toggle for workspace/board access
  // const toggleUserAccess = (userName: string, currentUsers: string[], setter: (users: string[]) => void) => {
  //   if (currentUsers.includes(userName)) {
  //     setter(currentUsers.filter(un => un !== userName));
  //   } else {
  //     setter([...currentUsers, userName]);
  //   }
  // };

  const toggleWorkspaceAccessUser = (username: string) => {
    setWorkspaceAccessDialog(prev => {
      if (!prev.workspace) return prev;
      const exists = prev.selectedUsers.includes(username);
      return {
        ...prev,
        selectedUsers: exists
          ? prev.selectedUsers.filter(u => u !== username)
          : [...prev.selectedUsers, username],
      };
    });
  };


  /** Board Access */

  // Open board access dialog with current users selected
  const openBoardAccessDialog = (board: BoardAccess) => {
    const usernames = board.users.map(u => u.username);

    setBoardAccessDialog({
      open: true,
      board,
      selectedUsers: usernames,   // what checkboxes show
      originalUsers: usernames,   // snapshot for diff
    });
  };


  const toggleBoardAccessUser = (username: string) => {
    setBoardAccessDialog(prev => {
      if (!prev.board) return prev;
      const exists = prev.selectedUsers.includes(username);
      return {
        ...prev,
        selectedUsers: exists
          ? prev.selectedUsers.filter(u => u !== username)
          : [...prev.selectedUsers, username],
      };
    });
  };


  const handleSaveBoardAccess = async () => {
    const dialog = boardAccessDialog;
    if (!dialog.board) return;

    const { originalUsers, selectedUsers, board } = dialog;

    const originalSet = new Set(originalUsers);
    const selectedSet = new Set(selectedUsers);

    // Users newly added (checked now but not before)
    const toAdd = [...selectedSet].filter(u => !originalSet.has(u));

    // Users removed (were there before, not checked now)
    const toRemove = [...originalSet].filter(u => !selectedSet.has(u));

    // Nothing changed
    if (toAdd.length === 0 && toRemove.length === 0) {
      setBoardAccessDialog({
        open: false,
        board: null,
        selectedUsers: [],
        originalUsers: [],
      });
      return;
    }

    setSaving(true);
    try {
      if (toAdd.length > 0) {
        await boardService.addBoardUsers(board.workspaceId, board.id, toAdd);
      }
      if (toRemove.length > 0) {
        await boardService.removeBoardUsers(board.workspaceId, board.id, toRemove);
      }

      await refreshWorkspacesAndBoards();

      setBoardAccessDialog({
        open: false,
        board: null,
        selectedUsers: [],
        originalUsers: [],
      });
    } catch (err) {
      console.error('Failed to update board access', err);
    } finally {
      setSaving(false);
    }
  };

  // const toggleBoardUser = (username: string) => {
  //   setBoardForm(prev => ({
  //     ...prev,
  //     users: prev.users.includes(username)
  //       ? prev.users.filter(u => u !== username)
  //       : [...prev.users, username],
  //   }));
  // };


  // USER CRUD

  const handleEditUser = (user: User) => {
    setUserError(null);
    setUserForm({
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
      email: user.email ?? '',
      username: user.username ?? '',
      handle: user.handle ?? '',  // if you store handle on the user
      password: '',               // empty => no change unless set
    });
    setUserDialog({ open: true, user });
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser.id) {
      setUserError('You cannot delete your own admin account.');
      return;
    }
    setSaving(true);
    try {
      await userService.deleteUser(userId);
      // Just re-use your existing loader to refresh everything
      await refreshWorkspacesAndBoards();
    } catch (err) {
      console.error('Failed to delete user', err);
    } finally {
      setSaving(false);
      setDeleteDialog({ open: false, type: '', id: 0, workspaceId: 0, name: '' });
    }
  };


  const handleSaveUser = async () => {
    setUserError(null);

    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const email = userForm.email.trim();
    const username = userForm.username.trim();
    let handle = userForm.handle.trim();
    const password = userForm.password;

    if (!firstName || !lastName || !email || !username || !handle) {
      setUserError('All fields except password are required.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setUserError('Please enter a valid email address.');
      return;
    }

    if (/\s/.test(username)) {
      setUserError('Username must not contain spaces.');
      return;
    }

    if (!handle.startsWith('@')) {
      handle = '@' + handle;
    }
    if (handle === '@') {
      setUserError('Handle must contain characters after "@".');
      return;
    }

    const isEdit = !!userDialog.user;

    // For create, password required; for edit, optional
    if (!isEdit && !password) {
      setUserError('Password is required for new users.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && userDialog.user) {
        const updatePayload: any = {
          first_name: firstName,
          last_name: lastName,
          email,
          username,
          handle,
        };
        if (password) {
          updatePayload.new_password = password; // only if changing
        }

        await userService.updateUser(userDialog.user.id, updatePayload);
      } else {
        await userService.createUser({
          first_name: firstName,
          last_name: lastName,
          email,
          username,
          handle,
          password,
        });
      }

      await refreshWorkspacesAndBoards();

      setUserDialog({ open: false, user: null });
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        handle: '',
        password: '',
      });
    } catch (err) {
      console.error('Failed to save user', err);
      setUserError('Failed to save user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

    const handleStatusChange = async (
    userId: number,
    newStatus: 'active' | 'suspended'
  ) => {
    setSaving(true);
    try {
      await userService.updateStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );
    } catch (err) {
      console.error('Failed to update user status', err);
    } finally {
      setSaving(false);
    }
  };




  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1>Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System Administration & Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="workspaces" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="boards" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Boards
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2>Workspaces</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage all workspaces and user access
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{workspaces.length} Total</Badge>
                <Button onClick={handleCreateWorkspace} disabled={saving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workspace
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {workspaces.map((workspace) => {
                const accessUsers = getUsersWithAccess(workspace.users.map(u => u.username));
                return (
                  <Card key={workspace.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{workspace.name}</CardTitle>
                          <CardDescription>{workspace.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{workspace.boardCount} boards</Badge>
                          {/* Manage Access to Workspace */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWorkspaceAccessDialog(workspace)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Manage Access
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditWorkspace(workspace)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, type: 'workspace', id: workspace.id,  workspaceId: workspace.id, name: workspace.name })}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Users with access:</span>
                          <Badge>{accessUsers.length} users</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {accessUsers.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {user.username.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.username}</span>
                              {/* {user.is_admin && (
                                <Badge variant="secondary" className="text-xs h-5">Admin</Badge>
                              )} */}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Boards Tab */}
          <TabsContent value="boards" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2>Boards</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage all boards and user access
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{boards.length} Total</Badge>
                <Button onClick={handleCreateBoard} disabled={saving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Board
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {boards.map((board) => {
                const accessUsers = getUsersWithAccess(board.users.map((u) => u.username));
                return (
                  <Card key={board.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{board.name}</CardTitle>
                          </div>
                          <CardDescription>
                            {board.workspaceName} • {board.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{board.taskCount} tasks</Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBoardAccessDialog(board)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Manage Access
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBoard(board)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, type: 'board', id: board.id, workspaceId: board.workspaceId, name: board.name })}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Users with access:</span>
                          <Badge>{accessUsers.length} users</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {accessUsers.map((user) => (
                            <div 
                              key={user.id}
                              className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {user.username.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.username}</span>
                              {user.is_admin && (
                                <Badge variant="secondary" className="text-xs h-5">Admin</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2>Task Categories</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage task status categories
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{categories.length} Total</Badge>
                <Button onClick={handleCreateCategory} disabled={saving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <CardTitle>{category.value}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, type: 'category', id: category.id, workspaceId: 0, name: category.value })}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2>Users</h2>
                <p className="text-sm text-gray-600 mt-1">
                  All users in the system
                </p>
              </div>
              <Badge variant="secondary">{users.length} Total</Badge>
              <Button
                onClick={() => {
                  setUserError(null);
                  setUserForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    username: '',
                    handle: '',
                    password: '',
                  });
                  setUserDialog({ open: true, user: null });
                }}
                disabled={saving}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {users.map((user) => {
                const userWorkspaces = workspaces.filter(ws => ws.users.map(u => u.username).includes(user.username));
                const userBoards = boards.filter(b => b.users.map(u => u.username).includes(user.username));
                
                return (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {user.username.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{user.username}</CardTitle>
                            {user.is_admin && (
                              <Badge variant="default">Admin</Badge>
                            )}
                          </div>
                          <CardDescription>{user.email}</CardDescription>
                        </div>

                        <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!(user.is_admin && user.id === currentUser.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: 'user',
                                id: user.id,
                                workspaceId: 0,
                                name: user.username,
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">

                        {/* 🔹 Status row with toggle */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <div className="flex items-center gap-2">
                            <select
                              className="border rounded-md px-2 py-1 text-xs"
                              value={(user.status ?? 'active').toLowerCase()}
                              disabled={saving || user.id === currentUser.id}
                              onChange={(e) =>
                                handleStatusChange(
                                  user.id,
                                  e.target.value as 'active' | 'suspended'
                                )
                              }
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>

                            <Badge
                              variant={
                                (user.status ?? 'active').toLowerCase() === 'suspended'
                                  ? 'destructive'
                                  : 'outline'
                              }
                            >
                              {(user.status ?? 'active').toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* existing rows */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Workspaces:</span>
                          <Badge variant="outline">{userWorkspaces.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Boards:</span>
                          <Badge variant="outline">{userBoards.length}</Badge>
                        </div>
                        {userWorkspaces.length > 0 && (
                          <div className="pt-2 mt-2 border-t">
                            <p className="text-xs text-gray-600 mb-1">Access to:</p>
                            <div className="flex flex-wrap gap-1">
                              {userWorkspaces.map((ws) => (
                                <Badge key={ws.id} variant="secondary" className="text-xs">
                                  {ws.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Workspace Dialog */}
      <Dialog open={workspaceDialog.open} onOpenChange={(open) => !open && setWorkspaceDialog({ open: false, workspace: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{workspaceDialog.workspace ? 'Edit Workspace' : 'Create Workspace'}</DialogTitle>
            <DialogDescription>
              {workspaceDialog.workspace ? 'Update workspace details and user access' : 'Create a new workspace and assign users'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                value={workspaceForm.name}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                placeholder="Workspace name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-slug">Slug</Label>
              <Input
                id="ws-slug"
                value={workspaceForm.slug}
                onChange={(e) =>
                  setWorkspaceForm({ ...workspaceForm, slug: e.target.value })
                }
                placeholder="workspace-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-desc">Description</Label>
              <Textarea
                id="ws-desc"
                value={workspaceForm.description}
                onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                placeholder="Workspace description"
              />
            </div>
            {/* <div className="space-y-2">
              <Label>User Access</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ws-user-${user.id}`}
                      checked={workspaceForm.users.includes(user.username)}
                      onCheckedChange={() => toggleUserAccess(user.username, workspaceForm.users, (users) => setWorkspaceForm({ ...workspaceForm, users }))}
                    />
                    <label
                      htmlFor={`ws-user-${user.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                      {user.is_admin && (
                        <Badge variant="secondary" className="text-xs h-5">Admin</Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkspaceDialog({ open: false, workspace: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorkspace} disabled={saving}>
              {workspaceDialog.workspace ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Board Dialog */}
      <Dialog open={boardDialog.open} onOpenChange={(open) => !open && setBoardDialog({ open: false, board: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{boardDialog.board ? 'Edit Board' : 'Create Board'}</DialogTitle>
            <DialogDescription>
              {boardDialog.board ? 'Update board details and user access' : 'Create a new board and assign users'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Name</Label>
              <Input
                id="board-name"
                value={boardForm.name}
                onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                placeholder="Board name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-desc">Description</Label>
              <Textarea
                id="board-desc"
                value={boardForm.description}
                onChange={(e) => setBoardForm({ ...boardForm, description: e.target.value })}
                placeholder="Board description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-workspace">Workspace</Label>
              <select
                id="board-workspace"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={boardForm.workspaceId}
                onChange={(e) => setBoardForm({ ...boardForm, workspaceId: Number(e.target.value) })}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="space-y-2">
              <Label>User Access</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`board-user-${user.id}`}
                      checked={boardForm.users.includes(user.username)}
                      onCheckedChange={() => toggleBoardUser(user.username)}
                      // {() => toggleUserAccess(user.username, boardForm.users, (users) => setBoardForm({ ...boardForm, users }))}
                    />
                    <label
                      htmlFor={`board-user-${user.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                      {user.is_admin && (
                        <Badge variant="secondary" className="text-xs h-5">Admin</Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardDialog({ open: false, board: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveBoard} disabled={saving}>
              {boardDialog.board ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: '', id: 0, workspaceId: 0, name: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteDialog.type} "{deleteDialog.name}". This action cannot be undone.
              {deleteDialog.type === 'workspace' && ' All boards within this workspace will also be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.type === 'workspace') handleDeleteWorkspace(deleteDialog.id);
                else if (deleteDialog.type === 'board') handleDeleteBoard(deleteDialog.workspaceId!, deleteDialog.id);
                else if (deleteDialog.type === 'category') handleDeleteCategory(deleteDialog.id);
                else if (deleteDialog.type === 'user') handleDeleteUser(deleteDialog.id);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Workspace User Access Dialog */}
      <Dialog
        open={workspaceAccessDialog.open}
        onOpenChange={(open) =>
          !open &&
          setWorkspaceAccessDialog({
            open: false,
            workspace: null,
            selectedUsers: [],
            originalUsers: [],
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Manage Access – {workspaceAccessDialog.workspace?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove users who can access this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ws-access-${user.id}`}
                    checked={workspaceAccessDialog.selectedUsers.includes(user.username)}
                    onCheckedChange={() => toggleWorkspaceAccessUser(user.username)}
                  />
                  <label
                    htmlFor={`ws-access-${user.id}`}
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {user.username.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {user.username}
                    {user.is_admin && (
                      <Badge variant="secondary" className="text-xs h-5">Admin</Badge>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setWorkspaceAccessDialog({
                  open: false,
                  workspace: null,
                  selectedUsers: [],
                  originalUsers: [],
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWorkspaceAccess} disabled={saving}>
              Save Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Board User Access Dialog */}
          <Dialog
            open={boardAccessDialog.open}
            onOpenChange={(open) =>
              !open &&
              setBoardAccessDialog({
                open: false,
                board: null,
                selectedUsers: [],
                originalUsers: [],
              })
            }
          >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Manage Board Access – {boardAccessDialog.board?.name}
              </DialogTitle>
              <DialogDescription>
                Add or remove users who can access this board.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`board-access-${user.id}`}
                      checked={boardAccessDialog.selectedUsers.includes(user.username)}
                      onCheckedChange={() => toggleBoardAccessUser(user.username)}
                    />
                    <label
                      htmlFor={`board-access-${user.id}`}
                      className="text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.username
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.username}
                      {user.is_admin && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Admin
                        </Badge>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setBoardAccessDialog({
                    open: false,
                    board: null,
                    selectedUsers: [],
                    originalUsers: [],
                  })
                }
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBoardAccess} disabled={saving}>
                Save Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog
          open={userDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setUserDialog({ open: false, user: null });
              setUserError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {userDialog.user ? 'Edit User' : 'Create User'}
              </DialogTitle>
              <DialogDescription>
                {userDialog.user
                  ? 'Update user details.'
                  : 'Add a new user to the system.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {userError && (
                <p className="text-sm text-red-600">{userError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="user-first-name">First name</Label>
                  <Input
                    id="user-first-name"
                    value={userForm.firstName}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    placeholder="Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-last-name">Last name</Label>
                  <Input
                    id="user-last-name"
                    value={userForm.lastName}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="jane.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-username">Username</Label>
                <Input
                  id="user-username"
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="janedoe123"
                />
                <p className="text-xs text-gray-500">
                  No spaces allowed. Used for login.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-handle">Handle</Label>
                <Input
                  id="user-handle"
                  value={userForm.handle}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, handle: e.target.value }))
                  }
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && !v.startsWith('@')) {
                      const withAt = '@' + v;
                      setUserForm((prev) => ({ ...prev, handle: withAt }));
                    }
                  }}
                  placeholder="@janedoe"
                />
                <p className="text-xs text-gray-500">
                  Must start with <span className="font-mono">@</span>. We’ll auto-add it if you forget.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUserDialog({ open: false, user: null });
                  setUserError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveUser} disabled={saving}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


    </div>
  );
}
