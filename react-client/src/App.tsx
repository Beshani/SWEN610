// src/App.tsx
import { useEffect, useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { BoardViewWithCRUD } from './components/BoardViewWithCRUD';
import { AdminManagement } from './components/AdminManagement';
import { LoginUser } from './models/user';
import { authService } from './services/authService';

type View = 'login' | 'dashboard' | 'board' | 'admin';

const VIEW_KEY = 'tm_view';
const WS_KEY = 'tm_workspace_id';
const BOARD_KEY = 'tm_board_id';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);


  const persistView = (view: View, workspaceId?: number | null, boardId?: number | null) => {
    localStorage.setItem(VIEW_KEY, view);
    if (workspaceId != null) {
      localStorage.setItem(WS_KEY, String(workspaceId));
    } else {
      localStorage.removeItem(WS_KEY);
    }
    if (boardId != null) {
      localStorage.setItem(BOARD_KEY, String(boardId));
    } else {
      localStorage.removeItem(BOARD_KEY);
    }
  };

  const restoreView = (isAdminFlag: boolean) => {
    const storedView = localStorage.getItem(VIEW_KEY) as View | null;
    const storedWs = localStorage.getItem(WS_KEY);
    const storedBoard = localStorage.getItem(BOARD_KEY);

    if (!storedView || storedView === 'login') {
      const view: View = isAdminFlag ? 'admin' : 'dashboard';
      setCurrentView(view);
      persistView(view, null, null);
      return;
    }

    if (storedView === 'admin' && isAdminFlag) {
      setCurrentView('admin');
      persistView('admin', null, null);
      return;
    }

    if (storedView === 'board' && storedWs && storedBoard) {
      const wsId = Number(storedWs);
      const bId = Number(storedBoard);
      if (!Number.isNaN(wsId) && !Number.isNaN(bId)) {
        setSelectedWorkspace(wsId);
        setSelectedBoard(bId);
        setCurrentView('board');
        persistView('board', wsId, bId);
        return;
      }
    }

    // Otherwise fall back to dashboard/admin
    const fallbackView: View = isAdminFlag ? 'admin' : 'dashboard';
    setCurrentView(fallbackView);
    persistView(fallbackView, null, null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await authService.getMe();
        const user = new LoginUser(me.member_id, me.username, me.email, me.is_admin);

        setCurrentUser(user);
        setIsAdmin(me.is_admin);

        restoreView(me.is_admin);
      } catch (err: any) {
        console.log('No active session or /auth/me failed:', err);
        localStorage.removeItem(VIEW_KEY);
        localStorage.removeItem(WS_KEY);
        localStorage.removeItem(BOARD_KEY);
        setCurrentView('login');
      } finally {
        setBootstrapping(false);
      }
    };

    init();
  }, []);

  const handleLogin = (user: LoginUser, admin: boolean) => {
    setCurrentUser(user);
    setIsAdmin(admin);
    const targetView: View = admin ? 'admin' : 'dashboard';
    setCurrentView(targetView);
    persistView(targetView, null, null);
  };

  const handleLogout = async () => {
    try {
      const data = await authService.logout();
      console.log(data);
    } catch (err) {
      console.error('Logout API failed:', err);
    }

    setCurrentUser(null);
    setIsAdmin(false);
    setCurrentView('login');
    setSelectedWorkspace(null);
    setSelectedBoard(null);

    localStorage.removeItem(VIEW_KEY);
    localStorage.removeItem(WS_KEY);
    localStorage.removeItem(BOARD_KEY);
  };

  const handleBoardClick = (workspaceId: number, boardId: number) => {
    setSelectedWorkspace(workspaceId);
    setSelectedBoard(boardId);
    setCurrentView('board');
    persistView('board', workspaceId, boardId);
  };

  const handleBackToDashboard = () => {
    setSelectedWorkspace(null);
    setSelectedBoard(null);
    const targetView: View = isAdmin ? 'admin' : 'dashboard';
    setCurrentView(targetView);
    persistView(targetView, null, null);
  };

  // ---- Initial loading state ----
  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading session…</p>
      </div>
    );
  }

  if (currentView === 'login' || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentView === 'board' && selectedBoard && selectedWorkspace) {
    return (
      <BoardViewWithCRUD
        currentUser={currentUser}
        workspaceId={selectedWorkspace}
        boardId={selectedBoard}
        onBack={handleBackToDashboard}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'admin' && isAdmin) {
    return <AdminManagement currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <Dashboard
      currentUser={currentUser}
      onBoardClick={handleBoardClick}
      onLogout={handleLogout}
    />
  );
}
