import unittest
from src.db.swen610_db_utils import connect, exec_sql_file, exec_get_all, exec_get_one, exec_commit
from datetime import datetime

class TestChat(unittest.TestCase):

#    def setUp(self):
#       """Build the tables"""
#       exec_sql_file("src/db/schema.sql")
#       exec_sql_file("src/db/seed.sql")
   
   def test_user_count(self):
      """Test if user count is correct"""
      res, _ = exec_get_one("SELECT COUNT(1) AS cnt FROM dev.member;")

      self.assertLessEqual(2, res[0], f"Records fo not match {2} != {res[0]}")
   