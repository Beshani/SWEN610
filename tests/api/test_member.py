import json
import uuid
import unittest
from datetime import datetime
from tests.test_utils import post_rest_call, put_rest_call, delete_rest_call
from src.db.swen610_db_utils import connect
from psycopg2.extras import RealDictCursor

BASE = "http://localhost:5001"
JSON_HDR = {"Content-Type": "application/json", "Accept": "application/json"}

def jdump(obj) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)

# @unittest.skip("Already passed")
class TestUser(unittest.TestCase):

    @classmethod
    def tearDownClass(cls):
        """
        Delete all test-created users and reset serial sequences.
        Runs once after the entire test suite.
        """
        PREFIXES = ("del_", "noauth_")

        def reset_sequence(conn, schema: str, table: str, id_col: str = "id"):
            with conn.cursor() as cur:
                cur.execute("SELECT pg_get_serial_sequence(%s, %s)", (f"{schema}.{table}", id_col))
                seq = cur.fetchone()[0]
                if seq:
                    cur.execute(f"SELECT COALESCE(MAX({id_col}), 0) + 1 FROM {schema}.{table}")
                    nextval = cur.fetchone()[0]
                    cur.execute("SELECT setval(%s, %s, false)", (seq, nextval))

        conn = connect()
        try:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Delete members and dependent rows
                    cur.execute(
                        """
                        WITH victims AS (
                            SELECT id FROM dev.member
                            WHERE """ + " OR ".join(["username LIKE %s"] * len(PREFIXES)) + """
                        )
                        DELETE FROM dev.member
                        WHERE id IN (SELECT id FROM victims);
                        """,
                        tuple([p + "%" for p in PREFIXES]),
                    )
                    print(f"[tearDownClass] Deleted {cur.rowcount or 0} test members")

                # Reset sequences
                reset_sequence(conn, "dev", "member")
                # reset_sequence(conn, "dev", "auth_credentials")
                reset_sequence(conn, "dev", "auth_sessions")
                print("[tearDownClass] Sequences reset successfully")
            conn.commit()

        except Exception as e:
            print(f"[tearDownClass] ERROR during teardown: {e}")
            conn.rollback()
        finally:
            conn.close()

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

    # ==========================================================
    # 1) Add a new user with a password and info
    # ==========================================================
    def test_01_add_user_success(self):
        print("\n[TEST] Add a new user with password and information")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        uname = f"user_{uuid.uuid4().hex[:8]}"
        body = jdump({
            "first_name": "New",
            "last_name": "User",
            "email": f"{uname}@example.com",
            "username": uname,
            "handle": f"@{uname}",
            "password": "Strong#Passw0rd!"
        })
        self.step("POST /members/add")
        res = post_rest_call(self, f"{BASE}/members/add", params=body, post_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("member_id", res)

        self.__class__.created_user_id = res["member_id"]
        self.__class__.created_username = uname

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    
    # ==========================================================
    # 2) If a user already exists, add user fails
    # ==========================================================
    def test_02_add_user_duplicate_fails(self):
        print("\n[TEST] Add user fails when user already exists")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        uname = getattr(self.__class__, "created_username", None)
        if not uname:
            self.skipTest("No created user from test_01; skipping duplicate check")

        body = jdump({
            "first_name": "Dup",
            "last_name": "Dup",
            "username": uname,
            "email": "dummy@abc.com",
            "handle": f"@{uname}",
            "password": "x"
        })
        self.step(f"POST /members/add duplicate username={uname}")

        res = post_rest_call(self, f"{BASE}/members/add", params=body, post_header={**JSON_HDR, **auth}, expected_code=409)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.p("Human-readable error: " + json.dumps(res))

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    
    # ==========================================================
    # 3) Login success & incorrect password fails
    # ==========================================================
    def test_03_login_success_and_bad_password(self):
        print("\n[TEST] Login succeeds with correct password; fails with incorrect password")
        self.step("Correct login")
        ok = post_rest_call(self, f"{BASE}/login", params=jdump({
            "username": "alice", "password": "ybg2gpa7YUH-gam*qay"
        }), post_header=JSON_HDR, expected_code=200)
        self.p(f"    => {json.dumps(ok, indent=2)}")
        self.assertIn("session_key", ok)

        sid = ok.get("session_key")
        auth = {"Authorization": f"Bearer {sid}"}

        self.step("Incorrect password")
        bad = post_rest_call(self, f"{BASE}/login", params=jdump({
            "username": "alice", "password": "WRONG"
        }), post_header=JSON_HDR, expected_code=401)
        self.p(f"    => {json.dumps(bad, indent=2)}")
        self.p("Human-readable error: " + json.dumps(bad))

        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")
    
    # ==========================================================
    # 4) Edit user; non-existent user fails
    # ==========================================================
    def test_04_edit_user_and_nonexistent_fails(self):
        print("\n[TEST] Edit user information; non-existent user fails")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}

        uid = getattr(self.__class__, "created_user_id", None)
        if not uid:
            self.skipTest("No created user from test_01; skipping edit")

        self.step(f"PUT /members/{uid} change first_name")
        res = put_rest_call(self, f"{BASE}/members/{uid}", params=jdump({"first_name": "Updated"}),
                            put_header={**JSON_HDR, **auth}, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")

        self.step("PUT /members/999999999 (non-existent)")
        err = put_rest_call(self, f"{BASE}/members/999999999", params=jdump({"first_name": "Nope"}),
                            put_header={**JSON_HDR, **auth}, expected_code=404)
        self.p(f"    => {json.dumps(err, indent=2)}")
        self.p("Human-readable error: " + json.dumps(err))


        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")
    
    # ==========================================================
    # 5) Remove user; non-existent user fails
    # ==========================================================
    def test_05_remove_user_and_nonexistent_fails(self):
        print("\n[TEST] Remove a user; removing a non-existent user fails")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}


        uname = f"del_{uuid.uuid4().hex[:8]}"
        add = post_rest_call(self, f"{BASE}/members/add",
                             params=jdump({"first_name": "ToDelete", 
                                           "last_name": "ToDelete",
                                           "username": uname, 
                                           "email": "dummy@abc.com", 
                                           "handle": f"@{uname}", 
                                           "password": "Tmp#1"}),
                             post_header={**JSON_HDR, **auth}, expected_code=200)
        uid = add["member_id"]
        self.p(f"    Created user {uid} to delete")

        self.step(f"DELETE /members/{uid}")
        ok = delete_rest_call(self, f"{BASE}/members/{uid}", delete_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(ok, indent=2)}")

        self.step("DELETE same user again -> expect 404")
        err = delete_rest_call(self, f"{BASE}/members/{uid}", delete_header=auth, expected_code=404)
        self.p(f"    => {json.dumps(err, indent=2)}")
        self.p("Human-readable error: " + json.dumps(err))


        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")

    # ==========================================================
    # 6) Remove existing user without correct session key fails
    # ==========================================================
    def test_06_remove_user_without_auth_fails(self):
        print("\n[TEST] Remove existing user without proper auth must fail")
        sid = self.login("alice", "ybg2gpa7YUH-gam*qay")
        auth = {"Authorization": f"Bearer {sid}"}


        uname = f"noauth_{uuid.uuid4().hex[:8]}"
        add = post_rest_call(self, f"{BASE}/members/add",
                             params=jdump({"first_name": "NoAuth", 
                                           "last_name": "NoAuth",
                                           "username": uname, 
                                           "email": "dummy@abc.com",  
                                           "handle": f"@{uname}", 
                                           "password": "Tmp#1"}),
                             post_header={**JSON_HDR, **auth}, expected_code=200)
        uid = add["member_id"]
        self.p(f"    Created user {uid} for negative test")

        self.step("DELETE without Authorization header => expect 401")
        err1 = delete_rest_call(self, f"{BASE}/members/{uid}", delete_header={}, expected_code=401)
        self.p(f"    => {json.dumps(err1, indent=2)}")

        self.step("DELETE with bad token => expect 401")
        err2 = delete_rest_call(self, f"{BASE}/members/{uid}", delete_header={"Authorization": "Bearer bad-token"}, expected_code=401)
        self.p(f"    => {json.dumps(err2, indent=2)}")


        self.step("Cleanup: DELETE with valid auth")
        _ = delete_rest_call(self, f"{BASE}/members/{uid}", delete_header=auth, expected_code=200)


        self.step("POST /logout with valid Authorization")
        res = post_rest_call(self, f"{BASE}/logout", params={}, post_header=auth, expected_code=200)
        self.p(f"    => {json.dumps(res, indent=2)}")
        self.assertIn("message", res)
        self.assertEqual(res["message"].lower(), "logged out.")
    