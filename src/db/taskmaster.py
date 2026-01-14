import os
from .swen610_db_utils import exec_sql_file

def rebuild_tables():
    exec_sql_file("src/db/schema.sql")
    exec_sql_file("src/db/seed.sql")