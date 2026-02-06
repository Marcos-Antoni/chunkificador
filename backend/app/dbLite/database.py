import sqlite3
import os

# Ruta a la base de datos
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "brain.db")

def get_db_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Subjects (Materias)
    # Tabla única para nombres de materias para evitar duplicados
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )
    ''')
    
    # 2. Ideas (Nodos de Conocimiento)
    # Eliminamos 'source_id' y 'tags'. Agregamos 'batch_id' y 'type'.
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        embedding BLOB, -- Vector numérico
        type TEXT CHECK(type IN ('Practical', 'Theoretical')) DEFAULT 'Theoretical',
        batch_id TEXT, -- UUID para identificar grupos de ideas subidas juntas
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 3. Relación Muchos a Muchos: Ideas <-> Subjects
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS ideas_subjects (
        idea_id INTEGER,
        subject_id INTEGER,
        PRIMARY KEY (idea_id, subject_id),
        FOREIGN KEY (idea_id) REFERENCES ideas (id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
    )
    ''')

    # 4. Connections (Grafo)
    # Se mantiene igual
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_idea_id INTEGER NOT NULL,
        to_idea_id INTEGER NOT NULL,
        connection_type TEXT DEFAULT 'thematic',
        weight REAL DEFAULT 1.0,
        FOREIGN KEY (from_idea_id) REFERENCES ideas (id) ON DELETE CASCADE,
        FOREIGN KEY (to_idea_id) REFERENCES ideas (id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()
    print(f"Base de datos (V2) inicializada en: {DB_PATH}")

if __name__ == "__main__":
    init_db()
