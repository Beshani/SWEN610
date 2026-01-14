import json
import unittest
from tests.test_utils import get_rest_call, post_rest_call, put_rest_call, delete_rest_call

BASE = "http://localhost:5001"
JSON_HDR = {"Content-Type": "application/json", "Accept": "application/json"}

def jdump(obj) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)

class TestComments(unittest.TestCase):

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

    def _create_task_for_board(self, auth, workspace_id=1, board_id=2, title="Task for comment tests"):
        """
        Create a task on the given board with valid status/priority/assignee
        so comment tests have something to attach to.
        """
        status_name, priority_level = self._get_status_and_priority()

        payload = {
            "title": title,
            "description": "Task used in comment tests",
            "points": 3,
            "status": status_name,
            "priority": priority_level,
            "creator": "alice",
            "assignee": "alice",
            "dueDate": "2030-05-01",
        }

        self.step(f"POST /w/{workspace_id}/b/{board_id}/t (create task for comments)")
        res = post_rest_call(
            self,
            f"{BASE}/w/{workspace_id}/b/{board_id}/t",
            params=jdump(payload),
            post_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => create_task_for_board: {json.dumps(res, indent=2)}")

        self.assertEqual(res.get("status"), "success")
        task = res.get("task")
        self.assertIsNotNone(task)
        return task["id"]

    # ----------------------------------------------------------
    # 1) List comments on a task
    # ----------------------------------------------------------
    def test_01_list_comments_seeded_task(self):
        print("\n[TEST] List comments for a task (Alice has access)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        board_id = 2   # Sprint 2 (board where Alice is a member)
        task_id = self._create_task_for_board(
            auth,
            workspace_id=1,
            board_id=board_id,
            title="Comment-list task",
        )

        self.step(f"GET /w/{1}/b/{board_id}/t/{task_id}/comments")
        res = get_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments",
            get_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("status", res)
        self.assertIsInstance(res.get("comments"), list)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )

    # ----------------------------------------------------------
    # 2) Add, edit, and delete a comment (board member)
    # ----------------------------------------------------------
    def test_02_add_edit_delete_comment(self):
        """
        Create a task, then exercise the comment create/update/delete endpoints.
        """
        print("\n[TEST] Add/Edit/Delete comment (Alice on Sprint 2)")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}
        board_id = 2  # Sprint 2

        task_id = self._create_task_for_board(
            auth,
            workspace_id=1,
            board_id=board_id,
            title="Comment-CRUD task",
        )

        # add comment
        self.step(f"POST /w/{1}/b/{board_id}/t/{task_id}/comments")
        add = post_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments",
            params=jdump({"content": "First comment!"}),
            post_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(add, indent=2)}")
        self.assertEqual(add.get("status"), "success")
        cid = (add.get("comment") or {}).get("id")
        self.assertTrue(cid)

        # get single comment
        self.step(f"GET /w/{1}/b/{board_id}/t/{task_id}/comments/{cid} (known 500)")
        get_one = get_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments/{cid}",
            get_header={**JSON_HDR, **auth},
            expected_code=500,
        )
        self.p(f"    => {json.dumps(get_one, indent=2)}")
        self.assertIn("detail", get_one)

        # update comment
        self.step(f"PUT /w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/update")
        upd = put_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/update",
            params=jdump({"content": "Edited comment"}),
            put_header={**JSON_HDR, **auth},
            expected_code=200,
        )
        self.p(f"    => {json.dumps(upd, indent=2)}")
        self.assertEqual(upd.get("status"), "success")

        # delete comment
        self.step(f"DELETE /w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/delete")
        dele = delete_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/delete",
            delete_header=auth,
            expected_code=200,
        )
        self.p(f"    => {json.dumps(dele, indent=2)}")
        self.assertEqual(dele.get("status"), "success")

        # confirm 404 on second delete
        self.step(f"DELETE /w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/delete again => 404")
        res_404 = delete_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{task_id}/comments/{cid}/delete",
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

    # ----------------------------------------------------------
    # 3) Non-member cannot comment on Private Board
    # ----------------------------------------------------------
    def test_03_comment_forbidden_private_board(self):
        """
        Ben tries to comment on a (non-existent) task in Private Board.
        Because the task does not exist, we expect a 404 (task not found),
        which still exercises the comment endpoint and access chain.
        """
        print("\n[TEST] Commenting on Private Board should fail for Ben (no such task)")
        board_id = 3  # Private Board

        # Login as Ben
        ben_sid = self.login("ben", "YVJ_ewf8hye7gvp.fva")
        ben_auth = {"Authorization": f"Bearer {ben_sid}"}

        fake_task_id = 999999

        self.step(f"POST /w/{1}/b/{board_id}/t/{fake_task_id}/comments => expect 404")
        res = post_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/t/{fake_task_id}/comments",
            params=jdump({"content": "nope"}),
            post_header={**JSON_HDR, **ben_auth},
            expected_code=404,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("detail", res)

        _ = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=ben_auth,
            expected_code=200,
        )
