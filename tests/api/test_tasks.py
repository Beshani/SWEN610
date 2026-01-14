import json
import unittest
from tests.test_utils import get_rest_call, post_rest_call, put_rest_call, delete_rest_call

BASE = "http://localhost:5001"
JSON_HDR = {"Content-Type": "application/json", "Accept": "application/json"}

def jdump(obj) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)

class TestTasks(unittest.TestCase):

    def p(self, msg):
        print(msg, flush=True)

    def step(self, msg):
        self.p(f"  - {msg}")

    def login(self, username: str, password: str) -> str:
        self.step(f"POST /login as {username}")
        body = jdump({"username": username, "password": password})
        res = post_rest_call(
            self,
            f"{BASE}/login",
            params=body,
            post_header=JSON_HDR,
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        sid = res.get("session_key")
        self.assertTrue(sid, "No session_key in login response")
        return sid

    # ---------- helpers -------------------------------------------------

    def _get_status_and_priority(self):
        """Fetch a valid status name and priority level from the API."""
        self.step("GET /w/t/status")
        st_res = get_rest_call(
            self,
            f"{BASE}/w/t/status",
            get_header=JSON_HDR,
            expected_code=200,
        )
        self.p(f"    => statuses: {json.dumps(st_res, indent=2)}")
        statuses = st_res.get("statuses") or []
        self.assertGreater(len(statuses), 0, "No statuses returned from /w/t/status")
        status_name = statuses[0]["name"]

        self.step("GET /w/t/priorities")
        pr_res = get_rest_call(
            self,
            f"{BASE}/w/t/priorities",
            get_header=JSON_HDR,
            expected_code=200,
        )
        self.p(f"    => priorities: {json.dumps(pr_res, indent=2)}")
        priorities = pr_res.get("task_priorities") or []
        self.assertGreater(len(priorities), 0, "No priorities returned from /w/t/priorities")
        priority_level = priorities[0]["level"]

        return status_name, priority_level

    def _create_task(self, auth, workspace_id=1, board_id=1, title="Test task from API"):
        """
        Create a task using the current API contract.
        Uses string-based insert path (SQL_INSERT_TASK_STR).
        """
        status_name, priority_level = self._get_status_and_priority()

        payload = {
            "title": title,
            "description": "Created via tests",
            "points": 5,
            "status": status_name,
            "priority": priority_level,
            "creator": "alice",   
            "assignee": "alice",  
            "dueDate": "2030-01-01",
        }

        self.step(f"POST /w/{workspace_id}/b/{board_id}/t (create_task)")
        res = post_rest_call(
            self,
            f"{BASE}/w/{workspace_id}/b/{board_id}/t",
            params=jdump(payload),
            post_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => create_task: {json.dumps(res, indent=2)}")

        self.assertEqual(res.get("status"), "success")
        task = res.get("task")
        self.assertIsNotNone(task, "No 'task' object in create_task response")

        return task["id"], status_name, priority_level

    # ----------------------------------------------------------
    # 1) List tasks in an accessible board
    # ----------------------------------------------------------
    def test_01_list_tasks_in_board_access(self):
        """
        Alice has access to board 1 (Sprint 1).
        Create a task, then verify that listing tasks works and includes it.
        """
        print("\n[TEST] List tasks in Sprint 1 (Alice has access)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        board_id = 1  # Sprint 1

        # Ensure at least one task exists by creating it
        tid, _, _ = self._create_task(auth, workspace_id=1, board_id=board_id, title="List-test task")

        self.step(f"GET /w/{1}/b/{board_id}/t")
        res = get_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t",
            get_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")

        self.assertIn("status", res)
        self.assertIn("total", res)
        tasks = res.get("tasks") or []
        self.assertIsInstance(tasks, list)
        self.assertTrue(any(t["id"] == tid for t in tasks), "Created task not found in list")

        self.step("POST /logout")
        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 2) Listing tasks on a board without membership should fail
    # ----------------------------------------------------------
    def test_02_list_tasks_forbidden_private_board(self):
        print("\n[TEST] List tasks in Private Board (Ben is not a member)")
        sid = self.login("ben", "YVJ_ewf8hye7gvp.fva")
        auth = {"Authorization": f"Bearer {sid}"}

        board_id = 3  # Private Board

        self.step(f"GET /w/{1}/b/{board_id}/t => expect 403")
        res = get_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t",
            get_header={**JSON_HDR, **auth},
            expected_code=403,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("detail", res)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 3) Create a task 
    # ----------------------------------------------------------
    def test_03_create_task_if_access(self):
        print("\n[TEST] Create task on Sprint 1 (Alice board member)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}
        board_id = 1

        tid, status_name, priority_level = self._create_task(
            auth,
            workspace_id=1,
            board_id=board_id,
            title="Create-test task",
        )
        self.step(f"GET /w/1/b/{board_id}/t/{tid}")
        res = get_rest_call(
            self,
            f"{BASE}/w/1/b/{board_id}/t/{tid}",
            get_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")

        self.assertEqual(res.get("status"), "success")
        self.assertIsNotNone(res.get("task"))
        self.assertEqual(res["task"]["id"], tid)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 4) Update a task (Member of board)
    # ----------------------------------------------------------
    def test_04_update_task_member(self):
        """
        Create a task, then update its fields using the same
        priority/status/assignee strings so SQL_UPDATE_TASK matches.
        """
        print("\n[TEST] Update task on Sprint 1 (Alice board member)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}
        board_id = 1

        # Create initial task
        tid, status_name, priority_level = self._create_task(
            auth,
            workspace_id=1,
            board_id=board_id,
            title="Update-test original",
        )

        # Now update it
        payload = {
            "title": "Update-test modified",
            "description": "Updated description",
            "points": 13,
            "status": status_name,       
            "priority": priority_level,  
            "assignee": "alice",         
            "dueDate": "2031-01-01",
        }

        self.step(f"PUT /w/1/b/{board_id}/t/{tid}/update")
        res = put_rest_call(
            self,
            f"{BASE}/w/1/b/{board_id}/t/{tid}/update",
            params=jdump(payload),
            put_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")

        self.assertEqual(res.get("status"), "success")
        task = res.get("task")
        self.assertIsNotNone(task)
        self.assertEqual(task["title"], "Update-test modified")
        self.assertEqual(task["points"], 13)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 5) Update forbidden for non-member of board
    # ----------------------------------------------------------
    def test_05_update_task_forbidden_non_member(self):
        print("\n[TEST] Update a task in Private Board should fail (Ben not member)")
        sid = self.login("ben", "YVJ_ewf8hye7gvp.fva")
        auth = {"Authorization": f"Bearer {sid}"}
        board_id = 3  # Private Board

        # Expect 403 whether or not task exists (membership fails first)
        self.step(f"PUT /w/{1}/b/{board_id}/t/999999/update => 403")
        res = put_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/999999/update",
            params=jdump({"title": "Nope"}),
            put_header={**JSON_HDR, **auth},
            expected_code=403,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("detail", res)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 6) Delete a task (Admin/board member)
    # ----------------------------------------------------------
    def test_06_delete_task_if_access(self):
        """
        Create a task in Sprint 1 as Alice, then delete it.
        """
        print("\n[TEST] Delete a task in Sprint 1 (Alice board member)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}
        board_id = 1

        tid, _, _ = self._create_task(
            auth,
            workspace_id=1,
            board_id=board_id,
            title="Delete-test task",
        )

        self.step(f"DELETE /w/{1}/b/{board_id}/t/{tid}/delete")
        delres = delete_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{tid}/delete",
            delete_header=auth,
            expected_code=200,
        )
        self.p(f"    => {json.dumps(delres, indent=2)}")
        self.assertEqual(delres.get("status"), "success")

        # Confirm a second delete fails with 404
        self.step(f"DELETE /w/{1}/b/{board_id}/t/{tid}/delete again => 404")
        res_404 = delete_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{tid}/delete",
            delete_header=auth,
            expected_code=404,
        )
        self.p(f"    => {json.dumps(res_404, indent=2)}")
        self.assertIn("detail", res_404)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )
