from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from typing import List, Dict

# Cargar variables de entorno explícitamente para asegurar que GEMINI_API_KEY esté disponible
load_dotenv() 
# Intento extra por si estamos ejecutando desde una ruta distinta
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env")) 

from .database import init_db, get_db_connection
from .ai.chunker import atomize_text
from .ai.embeddings import get_embedding, cosine_similarity
from .services.obsidian import save_to_obsidian
import numpy as np

# ...

app = FastAPI(title="Chunkificador API", version="0.1.0")

# DATA MODELS
class TextRequest(BaseModel):
    text: str
    include_similarity: bool = True
    similarity_threshold: float = 0.85

class Chunk(BaseModel):
    id: str  # ID temporal generado por la IA (ej: "chunk_1")
    text: str
    tags: List[str] = []
    related_ids: List[str] = [] # IDs de otros chunks con los que se conecta

class SaveRequest(BaseModel):
    title: str
    chunks: List[Chunk]

class SimilarRequest(BaseModel):
    text: str
    threshold: float = 0.6

# ...

@app.post("/api/save")
async def save_endpoint(request: SaveRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Guardar el Origen (Source)
        cursor.execute(
            "INSERT INTO sources (title, raw_text) VALUES (?, ?)",
            (request.title, "Procesado vía API Grafo")
        )
        source_id = cursor.lastrowid
        
        # Mapa para traducir ID temporal ("chunk_1") -> ID Real de Base de Datos (154)
        temp_to_real_id = {}

        # 2. Primera Pasada: Guardar NODOS (Ideas)
        print(f"--- Guardando {len(request.chunks)} bloques ---")
        for chunk in request.chunks:
            # Generar embedding del párrafo completo
            embedding = get_embedding(chunk.text)
            embedding_blob = np.array(embedding, dtype=np.float32).tobytes()
            
            # Formatear tags como string "tag1, tag2"
            tags_str = ", ".join(chunk.tags) if chunk.tags else ""

            cursor.execute(
                "INSERT INTO ideas (source_id, content, tags, embedding) VALUES (?, ?, ?, ?)",
                (source_id, chunk.text, tags_str, embedding_blob)
            )
            real_id = cursor.lastrowid
            
            # Guardar en el mapa
            temp_to_real_id[chunk.id] = real_id
            print(f"Mapeado: {chunk.id} -> DB_ID: {real_id}")

        # 3. Segunda Pasada: Guardar ARISTAS (Conexiones)
        connections_count = 0
        for chunk in request.chunks:
            if not chunk.related_ids:
                continue
                
            from_real_id = temp_to_real_id.get(chunk.id)
            if not from_real_id:
                continue # Algo raro pasó, saltamos

            for related_temp_id in chunk.related_ids:
                to_real_id = temp_to_real_id.get(related_temp_id)
                
                if to_real_id:
                    # Crear conexión direccional
                    cursor.execute(
                        "INSERT INTO connections (from_idea_id, to_idea_id, connection_type) VALUES (?, ?, ?)",
                        (from_real_id, to_real_id, 'thematic')
                    )
                    connections_count += 1
                else:
                    print(f"Warning: Intentando conectar con ID no encontrado: {related_temp_id}")

        conn.commit()
        conn.close()
        
        return {
            "status": "success", 
            "source_id": source_id, 
            "ideas_saved": len(request.chunks),
            "connections_saved": connections_count
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/find_similar")
async def find_similar_endpoint(request: SimilarRequest):
    try:
        # 1. Generar embedding del texto buscado
        target_v = get_embedding(request.text)
        
        # 2. Buscar todos los existentes en DB
        conn = get_db_connection()
        cursor = conn.cursor()
        # Seleccionamos también TAGS
        cursor.execute("SELECT id, content, tags, embedding FROM ideas WHERE embedding IS NOT NULL")
        rows = cursor.fetchall()
        
        similar_ideas = []
        for row in rows:
            # Convertir BLOB a vector (numpy array)
            v_db = np.frombuffer(row['embedding'], dtype=np.float32)
            similarity = float(cosine_similarity(target_v, v_db.tolist()))
            
            if similarity >= request.threshold:
                similar_ideas.append({
                    "id": row['id'],
                    "content": row['content'],
                    "tags": row['tags'], # Devolvemos tags al frontend
                    "similarity": round(similarity, 4)
                })
        
        conn.close()
        # Ordenar por similitud
        similar_ideas.sort(key=lambda x: x['similarity'], reverse=True)
        
        return {"similar": similar_ideas[:5]} # Devolver top 5
    except Exception as e:
        import traceback
        traceback.print_exc() # Ver error real en logs
        return {"similar": []}

# Configurar CORS para permitir que el Frontend (React) hable con el Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción esto debe ser específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Cerebro digital online 🧠"}

@app.get("/api/")
def read_api_root():
    return {"status": "ok", "message": "Cerebro digital online 🧠"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/atomize")
async def atomize_endpoint(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")
    
    # 1. Atomizar
    atoms = await atomize_text(request.text)
    
    if "error" in atoms[0] and len(atoms) == 1 and atoms[0].get("error"):
         raise HTTPException(status_code=500, detail=atoms[0]["error"])

    return {"status": "success", "atoms": atoms}
