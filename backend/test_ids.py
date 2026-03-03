from app.dbLite.database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

# Works?
batch_id_str = "251e8d84-7dd3-495d-98f9-dd4de5e1493a9"

# METHOD 1
print("METHOD 1:")
cursor.execute("SELECT id, content FROM ideas WHERE batch_id = ?", (batch_id_str,))
print(len(cursor.fetchall()))

# METHOD 2
print("METHOD 2:")
batch_ids = [batch_id_str]
placeholders = ','.join('?' * len(batch_ids))
cursor.execute(f"SELECT id FROM ideas WHERE batch_id IN ({placeholders})", batch_ids)
print(len(cursor.fetchall()))

conn.close()
