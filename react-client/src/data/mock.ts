import type { User, UserPrivileges } from "../models/user";
import type { Category } from "../models/workspace";

// Mock users
const initialUsers: User[] = [
  { id: 1, username: 'John Doe', email: 'john.doe@example.com', is_admin: false },
  { id: 2, username: 'Jane Smith', email: 'jane.smith@example.com', is_admin: false },
  { id: 3, username: 'Mike Johnson', email: 'mike.johnson@example.com', is_admin: false },
  { id: 4, username: 'Sarah Williams', email: 'sarah.williams@example.com', is_admin: false },
  { id: 5, username: 'Marketing Team', email: 'marketing@example.com', is_admin: false },
  { id: 6, username: 'Design Team', email: 'design@example.com', is_admin: false },
  { id: 7, username: 'Marketing Lead', email: 'marketing.lead@example.com', is_admin: false },
  { id: 8, username: 'PR Team', email: 'pr@example.com', is_admin: false },
  { id: 9, username: 'Admin User', email: 'admin@example.com', is_admin: true },
];

// Mock user privileges - defines what each user can do
const initialUserPrivileges: UserPrivileges[] = [
  // John Doe - Full privileges in Product Development
  { userId: 1, workspaceId: 'ws-1', canCreate: true, canEdit: true, canDelete: true },
  // Jane Smith - Can edit and create but not delete
  { userId: 2, workspaceId: 'ws-1', canCreate: true, canEdit: true, canDelete: false },
  // Mike Johnson - Read-only in Product Development
  { userId: 3, workspaceId: 'ws-1', canCreate: false, canEdit: false, canDelete: false },
  // Sarah Williams - Full privileges
  { userId: 4, workspaceId: 'ws-1', canCreate: true, canEdit: true, canDelete: true },
  // Marketing Team - Full privileges in Marketing
  { userId: 5, workspaceId: 'ws-2', canCreate: true, canEdit: true, canDelete: true },
  { userId: 6, workspaceId: 'ws-2', canCreate: true, canEdit: true, canDelete: false },
  { userId: 7, workspaceId: 'ws-2', canCreate: true, canEdit: true, canDelete: true },
  { userId: 8, workspaceId: 'ws-2', canCreate: true, canEdit: true, canDelete: false },
];

// Mock categories
const initialCategories: Category[] = [
  { id: 'cat-1', name: 'To Do', color: '#94a3b8' },
  { id: 'cat-2', name: 'In Progress', color: '#3b82f6' },
  { id: 'cat-3', name: 'Completed', color: '#22c55e' },
];

// Mock data
const mockWorkspaces = [
  {
    id: 'ws-1',
    username: 'Product Development',
    description: 'All boards related to product development and features',
    boards: [
      {
        id: 'board-1',
        username: 'Sprint Planning',
        description: 'Current sprint tasks and planning',
        taskCount: 8,
      },
      {
        id: 'board-2',
        username: 'Bug Tracking',
        description: 'Track and manage bugs',
        taskCount: 5,
      },
      {
        id: 'board-3',
        username: 'Feature Requests',
        description: 'User feature requests and enhancements',
        taskCount: 12,
      },
    ],
  },
  {
    id: 'ws-2',
    username: 'Marketing',
    description: 'Marketing campaigns and content planning',
    boards: [
      {
        id: 'board-4',
        username: 'Content Calendar',
        description: 'Blog posts and social media content',
        taskCount: 6,
      },
      {
        id: 'board-5',
        username: 'Campaign Planning',
        description: 'Upcoming marketing campaigns',
        taskCount: 4,
      },
    ],
  },
];

// Mock workspace access data
const mockWorkspaceAccess = [
  {
    id: 'ws-1',
    username: 'Product Development',
    description: 'All boards related to product development and features',
    users: [1, 2, 3, 4, 9], // John, Jane, Mike, Sarah have access
    boardCount: 3,
  },
  {
    id: 'ws-2',
    username: 'Marketing',
    description: 'Marketing campaigns and content planning',
    users: [5, 6, 7, 8, 9], // Marketing team members have access
    boardCount: 2,
  },
];

// Mock board access data
const mockBoardAccess = [
  {
    id: 'board-1',
    username: 'Sprint Planning',
    description: 'Current sprint tasks and planning',
    workspaceId: 'ws-1',
    workspaceusername: 'Product Development',
    users: [1, 2, 3, 4, 9],
    taskCount: 8,
  },
  {
    id: 'board-2',
    username: 'Bug Tracking',
    description: 'Track and manage bugs',
    workspaceId: 'ws-1',
    workspaceusername: 'Product Development',
    users: [1, 2, 4, 9], // John, Jane, Sarah
    taskCount: 5,
  },
  {
    id: 'board-3',
    username: 'Feature Requests',
    description: 'User feature requests and enhancements',
    workspaceId: 'ws-1',
    workspaceusername: 'Product Development',
    users: [1, 2, 3, 4, 9],
    taskCount: 12,
  },
  {
    id: 'board-4',
    username: 'Content Calendar',
    description: 'Blog posts and social media content',
    workspaceId: 'ws-2',
    workspaceusername: 'Marketing',
    users: [5, 6, 9], // Marketing Team, Design Team
    taskCount: 6,
  },
  {
    id: 'board-5',
    username: 'Campaign Planning',
    description: 'Upcoming marketing campaigns',
    workspaceId: 'ws-2',
    workspaceusername: 'Marketing',
    users: [5, 7, 8, 9], // Marketing Team, Marketing Lead, PR Team
    taskCount: 4,
  },
];

const mockTasks: Record<string, any[]> = {
  'board-1': [
    {
      id: 'task-1',
      title: 'Implement user authentication',
      description: 'Set up OAuth and session management',
      priority: 'high',
      dueDate: '2025-11-03',
      status: 'in-progress',
      assignee: 'John Doe',
      comments: [
        {
          id: 'c1',
          author: 'Sarah Williams',
          content: 'We should use OAuth 2.0 for better security. I can help with the implementation.',
          timestamp: '2025-11-01T10:30:00Z',
        },
        {
          id: 'c2',
          author: 'John Doe',
          content: 'Good idea! I\'ve started with the OAuth setup. Will push the changes by EOD.',
          timestamp: '2025-11-02T14:20:00Z',
        },
      ],
    },
    {
      id: 'task-2',
      title: 'Design dashboard mockups',
      description: 'Create wireframes for the new dashboard',
      priority: 'high',
      dueDate: '2025-11-08',
      status: 'todo',
      assignee: 'Jane Smith',
      comments: [
        {
          id: 'c3',
          author: 'Mike Johnson',
          content: 'Can we include dark mode in these mockups?',
          timestamp: '2025-11-05T09:15:00Z',
        },
      ],
    },
    {
      id: 'task-3',
      title: 'Update API documentation',
      description: 'Document all new endpoints',
      priority: 'medium',
      dueDate: '2025-11-10',
      status: 'todo',
      assignee: 'Mike Johnson',
      comments: [],
    },
    {
      id: 'task-4',
      title: 'Code review for PR #234',
      description: 'Review and approve authentication PR',
      priority: 'high',
      dueDate: '2025-11-05',
      status: 'todo',
      assignee: 'Sarah Williams',
      comments: [
        {
          id: 'c4',
          author: 'John Doe',
          content: 'PR is ready for review. Added unit tests for all auth flows.',
          timestamp: '2025-11-04T16:45:00Z',
        },
      ],
    },
    {
      id: 'task-5',
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      priority: 'medium',
      dueDate: '2025-11-12',
      status: 'todo',
      assignee: 'John Doe',
      comments: [],
    },
    {
      id: 'task-6',
      title: 'Fix login page styling',
      description: 'Responsive design issues on mobile',
      priority: 'low',
      dueDate: '2025-11-15',
      status: 'todo',
      assignee: 'Jane Smith',
      comments: [],
    },
    {
      id: 'task-7',
      title: 'Database migration',
      description: 'Migrate to new schema version',
      priority: 'high',
      dueDate: '2025-11-04',
      status: 'in-progress',
      assignee: 'Mike Johnson',
      comments: [
        {
          id: 'c5',
          author: 'Mike Johnson',
          content: 'Migration script is ready. Planning to run it during the maintenance window tonight.',
          timestamp: '2025-11-03T11:00:00Z',
        },
        {
          id: 'c6',
          author: 'Sarah Williams',
          content: 'Make sure to backup the database before running the migration.',
          timestamp: '2025-11-03T11:30:00Z',
        },
      ],
    },
    {
      id: 'task-8',
      title: 'Performance optimization',
      description: 'Improve page load times',
      priority: 'medium',
      dueDate: '2025-11-20',
      status: 'todo',
      assignee: 'Sarah Williams',
      comments: [],
    },
  ],
  'board-2': [
    {
      id: 'task-9',
      title: 'Fix critical login bug',
      description: 'Users unable to login with Google OAuth',
      priority: 'high',
      dueDate: '2025-11-02',
      status: 'in-progress',
      assignee: 'John Doe',
      comments: [
        {
          id: 'c7',
          author: 'Jane Smith',
          content: 'This is affecting multiple users. High priority!',
          timestamp: '2025-11-01T08:00:00Z',
        },
      ],
    },
    {
      id: 'task-10',
      title: 'Memory leak in dashboard',
      description: 'Browser crashes after prolonged use',
      priority: 'high',
      dueDate: '2025-11-05',
      status: 'todo',
      assignee: 'Jane Smith',
      comments: [],
    },
    {
      id: 'task-11',
      title: 'Incorrect date formatting',
      description: 'Dates showing in wrong timezone',
      priority: 'medium',
      dueDate: '2025-11-08',
      status: 'todo',
      assignee: 'Mike Johnson',
      comments: [],
    },
    {
      id: 'task-12',
      title: 'Image upload fails',
      description: 'Large images fail to upload',
      priority: 'medium',
      dueDate: '2025-11-10',
      status: 'completed',
      assignee: 'Sarah Williams',
      comments: [
        {
          id: 'c8',
          author: 'Sarah Williams',
          content: 'Fixed! Increased the upload size limit to 10MB.',
          timestamp: '2025-11-09T15:30:00Z',
        },
      ],
    },
    {
      id: 'task-13',
      title: 'Search not working',
      description: 'Search returns no results',
      priority: 'low',
      dueDate: '2025-11-12',
      status: 'todo',
      assignee: 'John Doe',
      comments: [],
    },
  ],
  'board-3': [
    {
      id: 'task-14',
      title: 'Dark mode support',
      description: 'Add dark theme option',
      priority: 'medium',
      dueDate: '2025-11-18',
      status: 'todo',
      assignee: 'Jane Smith',
      comments: [
        {
          id: 'c9',
          author: 'User Feedback',
          content: 'Many users have requested this feature!',
          timestamp: '2025-11-04T12:00:00Z',
        },
      ],
    },
    {
      id: 'task-15',
      title: 'Export data feature',
      description: 'Allow users to export their data',
      priority: 'low',
      dueDate: '2025-11-25',
      status: 'todo',
      assignee: 'Mike Johnson',
      comments: [],
    },
    {
      id: 'task-16',
      title: 'Mobile app version',
      description: 'Develop native mobile application',
      priority: 'high',
      dueDate: '2025-12-01',
      status: 'in-progress',
      assignee: 'Sarah Williams',
      comments: [],
    },
    {
      id: 'task-17',
      title: 'Keyboard shortcuts',
      description: 'Add keyboard navigation support',
      priority: 'medium',
      dueDate: '2025-11-22',
      status: 'todo',
      assignee: 'John Doe',
      comments: [],
    },
    {
      id: 'task-18',
      title: 'Email notifications',
      description: 'Send email alerts for important events',
      priority: 'medium',
      dueDate: '2025-11-16',
      status: 'in-progress',
      assignee: 'Jane Smith',
      comments: [],
    },
  ],
  'board-4': [
    {
      id: 'task-19',
      title: 'Write blog post: Product launch',
      description: 'Announce new features',
      priority: 'high',
      dueDate: '2025-11-07',
      status: 'in-progress',
      assignee: 'Marketing Team',
      comments: [],
    },
    {
      id: 'task-20',
      title: 'Social media graphics',
      description: 'Create visuals for Instagram campaign',
      priority: 'medium',
      dueDate: '2025-11-09',
      status: 'todo',
      assignee: 'Design Team',
      comments: [],
    },
    {
      id: 'task-21',
      title: 'Newsletter content',
      description: 'Write monthly newsletter',
      priority: 'medium',
      dueDate: '2025-11-15',
      status: 'todo',
      assignee: 'Marketing Team',
      comments: [],
    },
  ],
  'board-5': [
    {
      id: 'task-22',
      title: 'Q4 campaign strategy',
      description: 'Plan holiday season campaigns',
      priority: 'high',
      dueDate: '2025-11-01',
      status: 'in-progress',
      assignee: 'Marketing Lead',
      comments: [],
    },
    {
      id: 'task-23',
      title: 'Influencer outreach',
      description: 'Contact potential brand ambassadors',
      priority: 'medium',
      dueDate: '2025-11-14',
      status: 'todo',
      assignee: 'PR Team',
      comments: [],
    },
  ],
};