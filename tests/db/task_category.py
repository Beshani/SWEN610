import unittest
from src.db.swen610_db_utils import connect
from psycopg2.extras import RealDictCursor

class TestCategory(unittest.TestCase):
    def test_categories_seeded(self):
        with connect() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SET search_path TO dev; SELECT value FROM category ORDER BY value;")
            rows = cur.fetchall()
            values = {r["value"] for r in rows}
            self.assertTrue({"Bug", "Chore", "Feature", "Research"}.issubset(values))
            self.assertGreaterEqual(len(values), 4)
