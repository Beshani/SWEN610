import json
import uuid
import unittest
from typing import Dict, List
from tests.test_utils import get_rest_call, post_rest_call, put_rest_call, delete_rest_call
from src.db.swen610_db_utils import connect
from src.api.auth import get_session_user
from utils.tools import hash_given_entity
from utils.configs import SHORT_HASH_LEN

BASE = "http://localhost:5001"
JSON_HDR = {"Content-Type": "application/json", "Accept": "application/json"}

def jdump(obj) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)


class TestBoard(unittest.TestCase):

    def p(self, msg): print(msg, flush=True)
    def step(self, msg): self.p(f"  - {msg}")

    def login(self, username: str, password: str) -> str:
        self.step(f"POST /login as {username}")
        body = jdump({"username": username, "password": password})
        res = post_rest_call(self, f"{BASE}/login", params=body, post_header=JSON_HDR, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        sid = res.get("session_key")
        self.assertTrue(sid, "No session_key in login response")
        return sid
    
    def find_ws(self, payload, slug: str):
        for item in payload.get("workspaces", []) or []:
            w = item.get("workspace") or item
            if w.get("slug") == slug:
                return item
        return None
            
    def titles(self, boards):
        return {b.get("title") for b in (boards or [])}

    # ==========================================================
    # 1) Get all boards in workspaces user has access to
    # ==========================================================
    def test_01_get_all_boards_with_access(self):
        print("\n[TEST] Get all workspaces and boards user has access to")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        self.step("GET /w/b/me")
        res = get_rest_call(self, f"{BASE}/w/b/me", get_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("member_id", res, "Missing member_id key")
        self.assertIn("workspaces", res, "Missing workspaces key")
        self.assertGreater(len(res["workspaces"]), 0, "No workspaces returned for user")

        # Alice sees ACM Workspace boards including Private Board, and Research Lab (as Viewer)
        acm = self.find_ws(res, "acm")
        self.assertIsNotNone(acm, "ACM workspace (slug='acm') not found")
        self.assertIn("boards", acm)
        self.assertTrue({"Sprint 1", "Sprint 2", "Private Board"}.issubset(self.titles(acm.get("boards"))),
                        f"ACM boards mismatch: {self.titles(acm.get('boards'))}")

        research = self.find_ws(res, "research")
        self.assertIsNotNone(research, "Research workspace (slug='research') not found")
        self.assertIn("boards", research)
        self.assertIn("Experiments", self.titles(research.get("boards")))

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 2) Get all boards in workspaces user has access to
    # ==========================================================
    def test_02_get_board_in_workspace(self):
        print("\n[TEST] Get boards in specific workspace")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        self.step(f"GET /w/{1}/b/me")
        res = get_rest_call(self, f"{BASE}/w/{1}/b/me",
                            get_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("boards", res)
        titles = {b.get("title") for b in res["boards"]}
        self.assertTrue({"Sprint 1", "Sprint 2", "Private Board"}.issubset(titles),
                        f"ACM boards mismatch: {titles}")
        self.assertGreaterEqual(len(res["boards"]), 3)

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 3) Create new board if user has access level
    # ==========================================================
    def test_03_create_board_if_access(self):
        print("\n[TEST] Create a new board if user has access")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        conn = connect()
        member_id = get_session_user(conn, sid)
        conn.close()

        self.step(f"POST /w/{1}/b/add")
        body = jdump({
            "name": "Sprint 1 Retrospective",
            "description": "Describe key takeaways from last sprint"
        })
        res = post_rest_call(
            self,
            f"{BASE}/w/{1}/b/add",
            params=body,
            post_header={**JSON_HDR, **auth},
            expected_code=200
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertEqual("success", res["status"], "Something went wrong")

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 4) Retrieve board board details if user has access
    # ==========================================================
    def test_04_get_board_if_access(self):
        print("\n[TEST] Get board if user has access")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        url = f"{BASE}/w/{1}/b/{3}"
        res = get_rest_call(self, url, get_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertEqual(res["status"], "success", f"Received: {res}")

        self.assertEqual(res.get("status"), "success")
        self.assertEqual(res.get("workspace_id"), 1)
        board = res.get("board") or {}

        self.assertEqual(board.get("id"), 3, "Expected board id=3")
        self.assertEqual(board.get("workspaceId"), 1, "Expected workspace 1")

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 5) Retrieve board board details if user has no access
    # ==========================================================
    def test_05_get_board_if_no_access(self):
        print("\n[TEST] Get board when logged in as Ben (no board membership)")
        sid = self.login("ben", "YVJ_ewf8hye7gvp.fva")
        auth = {"Authorization": f"Bearer {sid}"}

        url = f"{BASE}/w/{1}/b/{3}"
        res = get_rest_call(
            self,
            url,
            get_header={**JSON_HDR, **auth},
            expected_code=403,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("detail", res)

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(
            self,
            f"{BASE}/logout",
            params={},
            post_header=auth,
            expected_code=200,
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 6) Edit created board if user has access level
    # ==========================================================
    def test_06_edit_board_if_access(self):
        print("\n[TEST] Edit a board if user has access")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        board_id = 1

        self.step(f"PUT /w/{1}/b/{board_id}/update")
        body = jdump({
            "workspace_id": 1,
            "board_id": board_id,
            "title": "Sprint 1",
            "description": "Last Sprint"
        })
        res = put_rest_call(self, f"{BASE}/w/{1}/b/{board_id}/update", 
                             params=body, 
                             put_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertEqual("success", res["status"], "Something went wrong")

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 7) Edit created board if user does not access level
    # ==========================================================
    def test_07_edit_board_if_no_access(self):
        print("\n[TEST] Edit a board if user does not necessary access")
        sid = self.login("user_1bf8g5", "Strong#Passw0rd!")
        auth = {"Authorization": f"Bearer {sid}"}

        board_id = 3

        self.step(f"PUT /w/{1}/b/{board_id}/update")
        body = jdump({
            "workspace_id": 1,
            "board_id": board_id,
            "title": "Sprint 1 Retrospective",
            "description": "Delete this"
        })
        res = put_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/update", 
            params=body, 
            put_header={**JSON_HDR, **auth},
            expected_code=403
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("detail", res)
        self.assertIn(
            res["detail"].lower(),
            {
                "not a member of this board",
                "forbidden",
                "requires board admin role",
                "requires board admin role or workspace access",
            }
        )
        
        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 8) Delete a board if user has access level
    # ==========================================================
    def test_08_delete_board_if_auth(self):
        print("\n[TEST] Delete a board if user has access")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        conn = connect()
        member_id = get_session_user(conn, sid)
        conn.close()
        
        self.step(f"POST /w/{1}/b/add")
        body = jdump({
            "name": "Test Board",
            "description": "Should be deleted"
        })
        res = post_rest_call(
            self,
            f"{BASE}/w/{1}/b/add",
            params=body,
            post_header={**JSON_HDR, **auth},
            expected_code=200
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertEqual("success", res["status"], "Something went wrong")

        board_id = res["board"]["id"]

        self.step(f"DELETE /w/{1}/b/{board_id}/delete")
        res = delete_rest_call(
            self,
            f"{BASE}/w/{1}/b/{board_id}/delete",  
            delete_header=auth,
            expected_code=200
        )
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertEqual("success", res["status"], "Something went wrong")

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")
