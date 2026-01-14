import unittest
from src.db.swen610_db_utils import connect, exec_sql_file, exec_get_all, exec_get_one, exec_commit
from datetime import datetime

@unittest.skip("This was for sanity")
class TestChat(unittest.TestCase):

    # def setUp(self):
    #     """Build the tables"""
    #     exec_sql_file("src/db/schema.sql")
    #     exec_sql_file("src/db/seed.sql")
   
    def test_workspace_count(self):
        """Test if workspace count is correct"""
        res, _ = exec_get_one("SELECT COUNT(1) AS cnt FROM dev.workspace;")

        self.assertEqual(2, res[0], f"Records fo not match {1} != {res[0]}")

    def test_boards_grouped_by_workspace(self):
        """Test if all boards are grouped by workspace"""
        res, _ = exec_get_all("""
                              SELECT w.id, w.name, count(b.id) AS num_boards 
                              FROM dev.workspace w
                              INNER JOIN dev.board b
                              ON w.id = b.workspace_id
                              GROUP BY w.id, w.name;
                              """)
        assert len(res) == 2
        self.assertEqual(1, res[0][2], f"Records fo not match {1} != {res[0][2]}")
   