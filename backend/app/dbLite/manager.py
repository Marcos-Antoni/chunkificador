import numpy as np
import uuid
from typing import Dict, Any, List
from .database import get_db_connection
from ..ai.embeddings import get_embedding

def save_graph_to_db(chunks: list, global_tags: List[str]) -> Dict[str, Any]:
    """
    [FUNCIONALIDAD DB V2] Guarda ideas atomizadas vinculándolas a materias globales.
    Utiliza un 'batch_id' para agrupar la operación.
    """

    """
    |--------------------------------------------------------------------------
    | 1. INICIALIZACIÓN
    |--------------------------------------------------------------------------
    | Preparamos conexión, generamos el ID de lote (Batch) y normalizamos tags.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    batch_id = str(uuid.uuid4())
    # Normalizar tags: eliminar espacios extra y duplicados
    clean_tags = list(set([t.strip() for t in global_tags if t.strip()]))
    
    try:
        """
        |--------------------------------------------------------------------------
        | 2. GESTIÓN DE MATERIAS (SUBJECTS)
        |--------------------------------------------------------------------------
        | Verificamos qué materias ya existen y creamos las nuevas.
        | Obtenemos un mapa { "Física": 1, "Historia": 2 ... }
        """
        subject_map = {} # Nombre -> ID
        
        for tag_name in clean_tags:
            # Intentar buscar
            cursor.execute("SELECT id FROM subjects WHERE name = ?", (tag_name,))
            row = cursor.fetchone()
            
            if row:
                subject_map[tag_name] = row['id']
            else:
                # Crear si no existe
                cursor.execute("INSERT INTO subjects (name) VALUES (?)", (tag_name,))
                subject_map[tag_name] = cursor.lastrowid
                print(f"Nueva materia creada: {tag_name}")

        """
        |--------------------------------------------------------------------------
        | 3. MAPA DE TRADUCCIÓN DE IDs
        |--------------------------------------------------------------------------
        | Necesario para reconstruir el grafo: ID Temp "chunk_1" -> ID Real DB.
        """
        temp_to_real_id = {}

        """
        |--------------------------------------------------------------------------
        | 4. PRIMERA PASADA: GUARDAR IDEAS Y VINCULAR MATERIAS
        |--------------------------------------------------------------------------
        | Guardamos el contenido, tipo y embedding. Luego llenamos la tabla pivote.
        """
        print(f"--- Guardando {len(chunks)} bloques en Batch {batch_id[:8]}... ---")
        
        for chunk in chunks:
            # Generar embedding
            embedding = get_embedding(chunk.text)
            embedding_blob = np.array(embedding, dtype=np.float32).tobytes()
            
            # Insertar Idea
            # Validamos que el tipo sea uno de los permitidos, si no default 'Theoretical'
            idea_type = chunk.type if hasattr(chunk, 'type') and chunk.type in ['Practical', 'Theoretical'] else 'Theoretical'

            cursor.execute(
                "INSERT INTO ideas (content, embedding, type, batch_id) VALUES (?, ?, ?, ?)",
                (chunk.text, embedding_blob, idea_type, batch_id)
            )
            real_id = cursor.lastrowid
            temp_to_real_id[chunk.id] = real_id
            
            # Vincular con TODAS las materias globales
            for tag_name, subject_id in subject_map.items():
                cursor.execute(
                    "INSERT INTO ideas_subjects (idea_id, subject_id) VALUES (?, ?)",
                    (real_id, subject_id)
                )

        """
        |--------------------------------------------------------------------------
        | 5. SEGUNDA PASADA: CONEXIONES (ARISTAS)
        |--------------------------------------------------------------------------
        | Reconstruimos el grafo usando los IDs reales.
        """
        connections_count = 0
        for chunk in chunks:
            if not chunk.related_ids:
                continue
                
            from_real_id = temp_to_real_id.get(chunk.id)
            if not from_real_id: continue

            for related_temp_id in chunk.related_ids:
                to_real_id = temp_to_real_id.get(related_temp_id)
                
                if to_real_id:
                    cursor.execute(
                        "INSERT INTO connections (from_idea_id, to_idea_id) VALUES (?, ?)",
                        (from_real_id, to_real_id)
                    )
                    connections_count += 1

        """
        |--------------------------------------------------------------------------
        | 6. COMMIT FINAL
        |--------------------------------------------------------------------------
        """
        conn.commit()
        
        return {
            "status": "success", 
            "batch_id": batch_id,
            "subjects_linked": list(subject_map.keys()),
            "ideas_saved": len(chunks),
            "connections_saved": connections_count
        }

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
