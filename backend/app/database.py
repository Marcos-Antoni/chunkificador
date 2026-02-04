import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "brain.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Sources (Origen)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        raw_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # 2. Ideas (Chunks)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        content TEXT NOT NULL,
        tags TEXT, -- Lista de tags separados por coma
        obsidian_path TEXT,
        embedding BLOB, -- Reservado para vectores
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_id) REFERENCES sources (id)
    )
    ''')

    # 3. Connections (Grafo)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_idea_id INTEGER NOT NULL,
        to_idea_id INTEGER NOT NULL,
        connection_type TEXT CHECK(connection_type IN ('sequential', 'thematic')) DEFAULT 'sequential',
        weight REAL DEFAULT 1.0,
        FOREIGN KEY (from_idea_id) REFERENCES ideas (id),
        FOREIGN KEY (to_idea_id) REFERENCES ideas (id)
    )
    ''')

    conn.commit()
    conn.close()
    print(f"Base de datos inicializada en: {DB_PATH}")

if __name__ == "__main__":
    init_db()
