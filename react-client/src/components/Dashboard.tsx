import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LogOut, FolderOpen, Layout } from 'lucide-react';
import { useEffect, useState } from 'react';
import { workspaceService } from '../services/workspaceService';
import type { Workspace, BoardAccess } from '../models/workspace';
import { LoginUser } from '../models/user';

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



interface DashboardProps {
  currentUser: LoginUser;
  onBoardClick: (workspaceId: number, boardId: number) => void;
  onLogout: () => void;
}

export function Dashboard({ currentUser, onBoardClick, onLogout }: DashboardProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boardAccess, setBoardAccess] = useState<BoardAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNoTasksDialog, setShowNoTasksDialog] = useState(false);
  const [selectedBoardName, setSelectedBoardName] = useState<string | null>(null);
  const [selectedWorkspaceName, setSelectedWorkspaceName] = useState<string | null>(null);

  console.log(currentUser)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [ws] = await Promise.all([
          workspaceService.getWorkspacesForUser(currentUser.id),
          // boardService.getBoardAccessForUser(currentUser.id),
        ]);
        setWorkspaces(ws);
        // setBoardAccess(boards);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.id]);

  if (loading) return <div>Loading dashboard…</div>;

  console.log(workspaces)

  const handleBoardClick = (workspace: Workspace, board: Workspace['boards'][number]) => {
    // treat null, undefined, or 0 as "empty"
    // if (board.taskCount == null || board.taskCount === 0) {
    //   setSelectedBoardName(board.name);
    //   setSelectedWorkspaceName(workspace.name);
    //   setShowNoTasksDialog(true);
    //   return;
    // }

    // only navigate when there ARE tasks
    onBoardClick(workspace.id, board.id);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔔 No-tasks popup */}
      <AlertDialog open={showNoTasksDialog} onOpenChange={setShowNoTasksDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No tasks on this board</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBoardName && selectedWorkspaceName ? (
                <>
                  The board <strong>{selectedBoardName}</strong> in workspace{' '}
                  <strong>{selectedWorkspaceName}</strong> has no tasks yet.
                </>
              ) : (
                <>This board has no tasks yet.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoTasksDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1>TaskMaster Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {currentUser.username}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {workspaces.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 text-lg">You have no access to any workspaces yet.</p>
              <p className="text-gray-500 text-sm mt-2">Contact your workspace administrator to request access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2>{workspace.name}</h2>
                    <p className="text-gray-600">{workspace.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspace.boards.map((board) => (
                    <Card
                      key={board.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleBoardClick(workspace, board)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <Layout className="w-5 h-5 text-gray-500" />
                          <Badge variant="secondary">{board.taskCount} tasks</Badge>
                        </div>
                        <CardTitle>{board.name}</CardTitle>
                        <CardDescription>{board.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
