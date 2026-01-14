SET search_path TO dev;

-- ===== Members =====
INSERT INTO member (first_name, last_name, username, email, handle, status)
VALUES
    ('Alice', 'Smith', 'alice', 'alice@example.com', '@alice', 'active'),
    ('Ben', 'Harris', 'ben', 'ben@example.com', '@ben', 'active'),
    ('Carol', 'Jones', 'carol', 'carol@example.com', '@carol', 'active'),
    ('Test', 'User', 'user_1bf8g5', 'user1bf8g5@example.com', '@user_1bf8g5', 'active'),
    ('sys_admin', '', 'sys_admin', 'sys.admin@abc.com', '@admin', 'active'),
    ('joe', 'Karl', 'joe', 'joe@example.com', '@joe', 'suspended')
ON CONFLICT (username) DO NOTHING;

-- ===== Workspaces =====
INSERT INTO workspace (name, slug, description, created_on, created_by)
SELECT 'ACM Workspace', 'acm', 'Main workspace for the ACM team', CURRENT_TIMESTAMP, m.id
FROM member m
WHERE m.username = 'alice'
ON CONFLICT (name) DO NOTHING;

INSERT INTO workspace (name, slug, description, created_on, created_by)
SELECT 'Research Lab', 'research', 'Research boards and tasks', CURRENT_TIMESTAMP, m.id
FROM member m
WHERE m.username = 'carol'
ON CONFLICT (name) DO NOTHING;

-- ===== Member ↔ Workspace =====
INSERT INTO member_workspace (member_id, workspace_id)
SELECT m.id, w.id
FROM member m
JOIN workspace w ON w.name IN ('ACM Workspace', 'Research Lab')
LEFT JOIN member_workspace mw ON mw.member_id = m.id AND mw.workspace_id = w.id
WHERE mw.id IS NULL;

-- ===== Roles =====
INSERT INTO role (name, description) VALUES
    ('Admin', 'Full access'),
    ('Member', 'Standard contributor'),
    ('Viewer', 'Read-only')
ON CONFLICT (name) DO NOTHING;

-- ===== Permissions (by role) =====
INSERT INTO permission (role_id, view_workspace, edit_workspace, delete_workspace, view_board, edit_board, delete_board, manage_workspace_members, manage_board_members)
SELECT r.id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE
FROM role r
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO permission (role_id, view_workspace, edit_workspace, delete_workspace, view_board, edit_board, delete_board, manage_workspace_members, manage_board_members)
SELECT r.id, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, TRUE
FROM role r
WHERE r.name = 'Member'
ON CONFLICT DO NOTHING;

INSERT INTO permission (role_id, view_workspace, edit_workspace, delete_workspace, view_board, edit_board, delete_board, manage_workspace_members, manage_board_members)
SELECT r.id, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE
FROM role r
WHERE r.name = 'Viewer'
ON CONFLICT DO NOTHING;

-- ========= Member Role ==========
INSERT INTO member_role (member_id, role_id)
SELECT m.id, r.id
FROM member m, role r
WHERE m.username = 'sys_admin' AND r.name = 'Admin';

-- ===== Auth credentials =====
-- alice  -> ybg2gpa7YUH-gam*qay
-- ben    -> YVJ_ewf8hye7gvp.fva
-- user_1bf8g5 -> Strong#Passw0rd!
-- sys_admin -> X5LqGD9sw55RWBXNqaVH
-- joe -> S0me$uspended!
INSERT INTO auth_credentials (member_id, password_hash) VALUES
(1, '$argon2id$v=19$m=65536,t=3,p=4$GGMitlWQDvoXqo29PuEdbw$mlTjIyZ5/n10gwGWZgKlhJwdjxEvffgFMXVRFgirSAI'),
(2, '$argon2id$v=19$m=65536,t=3,p=4$Zs3apfJ8UG3V3zK8n/Doyg$r6LOM6M5mydGU4+SVpIZHG4NhZ8exatWMDnF3+lLTqY'),
(4, '$argon2id$v=19$m=65536,t=3,p=4$0qojwc1HvRRWqAZRtSGTLA$An4qak49+G9ojkZ+So+ajUPSubJuBM3qnb4974Fe/Ok'),
(6,'$argon2id$v=19$m=65536,t=3,p=4$1VSt8XNfEfeMxTzgR3C1xw$LhvV2wJH9O493gbBA2zG3xG6u+RpYpCCDg4B5mXIMdY') 
ON CONFLICT (member_id) DO NOTHING;

insert into auth_credentials (member_id, password_hash)
select m.id, '$argon2id$v=19$m=65536,t=3,p=4$GBjai9fyZ+0F+pmKScvdkw$AsmzUg6gEoR/xmhEIWRPXWpy5cv71P2sqiZojBYpZtw'
from member m
where m.first_name='sys_admin';

-- ===== Boards =====
INSERT INTO board (workspace_id, title, description, created_on, created_by)
SELECT w.id, 'Sprint 1', 'Current sprint board', CURRENT_TIMESTAMP, m.id
FROM workspace w
JOIN member m ON m.username = 'alice'
WHERE w.name = 'ACM Workspace'
AND NOT EXISTS (SELECT 1 FROM board b WHERE b.workspace_id = w.id AND b.title = 'Sprint 1');

INSERT INTO board (workspace_id, title, description, created_on, created_by)
SELECT w.id, 'Sprint 2', 'Next sprint board', CURRENT_TIMESTAMP, m.id
FROM workspace w
JOIN member m ON m.username = 'alice'
WHERE w.name = 'ACM Workspace'
AND NOT EXISTS (SELECT 1 FROM board b WHERE b.workspace_id = w.id AND b.title = 'Sprint 2');

INSERT INTO board (workspace_id, title, description, created_on, created_by)
SELECT w.id, 'Private Board', 'Only Alice has access', CURRENT_TIMESTAMP, m.id
FROM workspace w
JOIN member m ON m.username = 'alice'
WHERE w.name = 'ACM Workspace'
AND NOT EXISTS (SELECT 1 FROM board b WHERE b.workspace_id = w.id AND b.title = 'Private Board');

INSERT INTO board (workspace_id, title, description, created_on, created_by)
SELECT w.id, 'Experiments', 'Research experiments', CURRENT_TIMESTAMP, m.id
FROM workspace w
JOIN member m ON m.username = 'carol'
WHERE w.name = 'Research Lab'
AND NOT EXISTS (SELECT 1 FROM board b WHERE b.workspace_id = w.id AND b.title = 'Experiments');

-- ===== Member ↔ Board with Role =====
-- Alice: Admin on ACM boards (incl. Private Board)
INSERT INTO member_board (member_id, board_id, role_id)
SELECT m.id, b.id, r.id
FROM member m, board b, role r
WHERE m.username = 'alice'
  AND b.title IN ('Sprint 1', 'Sprint 2', 'Private Board')
  AND r.name = 'Admin'
  AND NOT EXISTS (SELECT 1 FROM member_board mb WHERE mb.member_id = m.id AND mb.board_id = b.id);

-- Ben: Member on Sprint 1 & Sprint 2 (not on Private Board)
INSERT INTO member_board (member_id, board_id, role_id)
SELECT m.id, b.id, r.id
FROM member m, board b, role r
WHERE m.username = 'ben'
  AND b.title IN ('Sprint 1', 'Sprint 2')
  AND r.name = 'Member'
  AND NOT EXISTS (SELECT 1 FROM member_board mb WHERE mb.member_id = m.id AND mb.board_id = b.id);

-- Carol: Viewer on Sprint boards; Admin on Experiments
INSERT INTO member_board (member_id, board_id, role_id)
SELECT m.id, b.id, r.id
FROM member m, board b, role r
WHERE m.username = 'carol'
  AND b.title IN ('Sprint 1', 'Sprint 2')
  AND r.name = 'Viewer'
  AND NOT EXISTS (SELECT 1 FROM member_board mb WHERE mb.member_id = m.id AND mb.board_id = b.id);

INSERT INTO member_board (member_id, board_id, role_id)
SELECT m.id, b.id, r.id
FROM member m, board b, role r
WHERE m.username = 'carol'
  AND b.title = 'Experiments'
  AND r.name = 'Admin'
  AND NOT EXISTS (SELECT 1 FROM member_board mb WHERE mb.member_id = m.id AND mb.board_id = b.id);

-- Alice: Viewer on Experiments
INSERT INTO member_board (member_id, board_id, role_id)
SELECT m.id, b.id, r.id
FROM member m, board b, role r
WHERE m.username = 'alice'
  AND b.title = 'Experiments'
  AND r.name = 'Viewer'
  AND NOT EXISTS (SELECT 1 FROM member_board mb WHERE mb.member_id = m.id AND mb.board_id = b.id);

-- ===== Categories =====
INSERT INTO category (value, color) VALUES
    ('Bug', '#FF000F'), 
    ('Feature', '#c233eaff'), 
    ('Research', '#2899c2ff')
    -- ('To Do', '#94a3b8'), 
    -- ('In Progress','#3b82f6'), 
    -- ('Completed', '#22c55e')
ON CONFLICT DO NOTHING;

-- ===== Task Status =====
INSERT INTO task_status (value) VALUES
    ('To Do'), 
    ('In Progress'), 
    ('Completed')
    -- ('To Do', '#94a3b8'), 
    -- ('In Progress','#3b82f6'), 
    -- ('Completed', '#22c55e')
ON CONFLICT DO NOTHING;

---- task_priority ----
insert into dev.task_priority (level, color) values
('critical', '#D32F2F'),
('high', '#F57C00'),
('medium', '#FBC02D'), 
('low', '#9E9E9E');

-- ===== Tasks =====
INSERT INTO task (board_id, workspace_id, title, points, priority, category_id, created_by, assigned_to, due_date)
SELECT b.id, w.id, 'Fix login redirect', 3, 2, c.id, ca.id, be.id, '2025-11-15'
FROM board b
JOIN workspace w ON w.id = b.workspace_id
JOIN task_status c ON c.value = 'To Do'
JOIN member ca ON ca.username = 'alice'
JOIN member be ON be.username = 'ben'
WHERE b.title = 'Sprint 1'
AND NOT EXISTS (
    SELECT 1 FROM task t
    WHERE t.board_id = b.id AND t.title = 'Fix login redirect'
);

INSERT INTO task_categories (task_id, category_id)
SELECT t.id, c.id
FROM task t, category c
WHERE t.title = 'Fix login redirect' AND c.value='Bug'
AND NOT EXISTS (
    SELECT 1 FROM task_categories tc
    WHERE tc.task_id = t.id AND tc.id = c.id AND c.value='Bug'
);

INSERT INTO task (board_id, workspace_id, title, points, priority, category_id, created_by, assigned_to, due_date)
SELECT b.id, w.id, 'Implement task filters', 5, 3, c.id, al.id, al.id, '2025-12-01'
FROM board b
JOIN workspace w ON w.id = b.workspace_id
JOIN task_status c ON c.value = 'In Progress'
JOIN member al ON al.username = 'alice'
WHERE b.title = 'Sprint 2'
AND NOT EXISTS (
    SELECT 1 FROM task t
    WHERE t.board_id = b.id AND t.title = 'Implement task filters'
);

INSERT INTO task_categories (task_id, category_id)
SELECT t.id, c.id
FROM task t, category c
WHERE t.title = 'Implement task filters' AND c.value='Feature'
AND NOT EXISTS (
    SELECT 1 FROM task_categories tc
    WHERE tc.task_id = t.id AND tc.id = c.id AND c.value='Feature'
);

INSERT INTO task (board_id, workspace_id, title, points, priority, category_id, created_by, assigned_to, due_date)
SELECT b.id, w.id, 'Hyperparam search exp01', 8, 1, c.id, ca.id, ca.id, '2025-11-30'
FROM board b
JOIN workspace w ON w.id = b.workspace_id
JOIN task_status c ON c.value = 'Completed'
JOIN member ca ON ca.username = 'carol'
WHERE b.title = 'Experiments'
AND NOT EXISTS (
    SELECT 1 FROM task t
    WHERE t.board_id = b.id AND t.title = 'Hyperparam search exp01'
);

INSERT INTO task_categories (task_id, category_id)
SELECT t.id, c.id
FROM task t, category c
WHERE t.title = 'Hyperparam search exp01' AND c.value='Research'
AND NOT EXISTS (
    SELECT 1 FROM task_categories tc
    WHERE tc.task_id = t.id AND tc.id = c.id AND c.value='Research'
);

-- ===== Task Comments =====
INSERT INTO task_comments (task_id, board_id, workspace_id, author_id, message)
SELECT t.id, t.board_id, t.workspace_id, m.id, 'Please add unit tests.'
FROM task t
JOIN member m ON m.username = 'alice'
WHERE t.title = 'Implement task filters'
AND NOT EXISTS (
    SELECT 1 FROM task_comments tc
    WHERE tc.task_id = t.id AND tc.author_id = m.id AND tc.message = 'Please add unit tests.'
);

INSERT INTO task_comments (task_id, board_id, workspace_id, author_id, message)
SELECT t.id, t.board_id, t.workspace_id, m.id, 'Updated acceptance criteria.'
FROM task t
JOIN member m ON m.username = 'ben'
WHERE t.title = 'Fix login redirect'
AND NOT EXISTS (
    SELECT 1 FROM task_comments tc
    WHERE tc.task_id = t.id AND tc.author_id = m.id AND tc.message = 'Updated acceptance criteria.'
);

-- ===== Groups =====
INSERT INTO "group" (title, created_by)
SELECT 'Backend Team', m.id
FROM member m
WHERE m.username = 'alice'
AND NOT EXISTS (
    SELECT 1 FROM "group" g
    WHERE g.title = 'Backend Team'
);

INSERT INTO "group" (title, created_by)
SELECT 'Research Team', m.id
FROM member m
WHERE m.username = 'carol'
AND NOT EXISTS (
    SELECT 1 FROM "group" g
    WHERE g.title = 'Research Team'
);

-- ===== Group Members =====
INSERT INTO group_member (group_id, member_id, role_id)
SELECT g.id, m.id, r.id
FROM "group" g, member m, role r
WHERE g.title = 'Backend Team' AND r.name = 'Admin' AND m.username = 'alice'
AND NOT EXISTS (
    SELECT 1 FROM group_member gm
    WHERE gm.group_id = g.id AND gm.member_id = m.id
);

INSERT INTO group_member (group_id, member_id, role_id)
SELECT g.id, m.id, r.id
FROM "group" g, member m, role r
WHERE g.title = 'Backend Team' AND r.name = 'Member' AND m.username = 'ben'
AND NOT EXISTS (
    SELECT 1 FROM group_member gm
    WHERE gm.group_id = g.id AND gm.member_id = m.id
);

INSERT INTO group_member (group_id, member_id, role_id)
SELECT g.id, m.id, r.id
FROM "group" g, member m, role r
WHERE g.title = 'Research Team' AND r.name = 'Admin' AND m.username = 'carol'
AND NOT EXISTS (
    SELECT 1 FROM group_member gm
    WHERE gm.group_id = g.id AND gm.member_id = m.id
);

INSERT INTO group_member (group_id, member_id, role_id)
SELECT g.id, m.id, r.id
FROM "group" g, member m, role r
WHERE g.title = 'Research Team' AND r.name = 'Viewer' AND m.username = 'alice'
AND NOT EXISTS (
    SELECT 1 FROM group_member gm
    WHERE gm.group_id = g.id AND gm.member_id = m.id
);

-- ===== Member Global Roles =====
INSERT INTO member_role (member_id, role_id)
SELECT m.id, r.id
FROM member m, role r
WHERE m.username = 'alice' AND r.name = 'Admin'
AND NOT EXISTS (
    SELECT 1 FROM member_role mr
    WHERE mr.member_id = m.id AND mr.role_id = r.id
);

INSERT INTO member_role (member_id, role_id)
SELECT m.id, r.id
FROM member m, role r
WHERE m.username = 'ben' AND r.name = 'Member'
AND NOT EXISTS (
    SELECT 1 FROM member_role mr
    WHERE mr.member_id = m.id AND mr.role_id = r.id
);

INSERT INTO member_role (member_id, role_id)
SELECT m.id, r.id
FROM member m, role r
WHERE m.username = 'carol' AND r.name = 'Viewer'
AND NOT EXISTS (
    SELECT 1 FROM member_role mr
    WHERE mr.member_id = m.id AND mr.role_id = r.id
);