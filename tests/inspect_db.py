import sqlite3
import os

db_path = 'backend/data/brain.db'

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

with open("report.txt", "w", encoding="utf-8") as f:
    def log(msg):
        print(msg)
        f.write(msg + "\n")

    log(f"--- Database: {db_path} ---")

    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row['name'] for row in cursor.fetchall()]
    log(f"Tables found: {tables}")

    for table in tables:
        if table == 'sqlite_sequence': continue
        
        log(f"\n=== Table: {table} ===")
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
        count = cursor.fetchone()['count']
        log(f"Total rows: {count}")
        
        # Get columns
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col['name'] for col in cursor.fetchall()]
        log(f"Columns: {', '.join(columns)}")
        
        if count > 0:
            log("--- First 3 rows ---")
            cursor.execute(f"SELECT * FROM {table} LIMIT 3")
            rows = cursor.fetchall()
            for i, row in enumerate(rows):
                # Convert row to dict for readable printing, truncate long fields
                row_dict = dict(row)
                for k, v in row_dict.items():
                    if isinstance(v, str) and len(v) > 50:
                        row_dict[k] = v[:47] + "..."
                    if isinstance(v, bytes):
                        row_dict[k] = f"<BLOB {len(v)} bytes>"
                log(f"Row {i+1}: {row_dict}")
        else:
            log("(Empty table)")

conn.close()
