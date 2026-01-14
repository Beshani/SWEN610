from argon2 import PasswordHasher

SESSION_LIFETIME_SECONDS = 1800 
COOKIE_NAME = "sid"
ARGON2 = PasswordHasher()

SHORT_HASH_LEN = 6

WORKSPACE_ERROR_404_MSG = "Workspace not found"
BOARD_ERROR_404_MSG = "Board not found in workspace"
TASK_ERROR_404_MSG = "Task not found on this board/workspace"
COMMENT_ERROR_404_MSG = "Comment not found for this task"