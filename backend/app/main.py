from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from typing import List, Dict
import numpy as np

# Cargar variables de entorno explícitamente
load_dotenv() 
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env")) 

from .dbLite import init_db, get_db_connection, save_graph_to_db
from .ai.chunker import atomize_text
from .ai.embeddings import get_embedding, cosine_similarity
from .services.obsidian import save_to_obsidian

app = FastAPI(title="Chunkificador API", version="0.1.0")

# DATA MODELS
class TextRequest(BaseModel):
    text: str
    include_similarity: bool = True
    similarity_threshold: float = 0.85

class Chunk(BaseModel):
    id: str  # ID temporal generado por la IA (ej: "chunk_1")
    text: str
    related_ids: List[str] = [] # IDs de otros chunks con los que se conecta
    type: str = "Theoretical"   # "Practical" | "Theoretical"

class SaveRequest(BaseModel):
    global_tags: List[str] # Etiquetas globales (Materias) para todo el batch
    chunks: List[Chunk]

class SimilarRequest(BaseModel):
    text: str
    threshold: float = 0.6

# ENDPOINTS

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
    
    atoms = await atomize_text(request.text)
    
    if atoms and "error" in atoms[0] and len(atoms) == 1 and atoms[0].get("error"):
         raise HTTPException(status_code=500, detail=atoms[0]["error"])

    return {"status": "success", "atoms": atoms}

@app.post("/api/save")
async def save_endpoint(request: SaveRequest):
    try:
        # Enviar tags globales (materias) junto con los chunks
        result = save_graph_to_db(request.chunks, request.global_tags)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/find_similar")
async def find_similar_endpoint(request: SimilarRequest):
    try:
        target_v = get_embedding(request.text)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, content, tags, embedding FROM ideas WHERE embedding IS NOT NULL")
        rows = cursor.fetchall()
        
        similar_ideas = []
        for row in rows:
            v_db = np.frombuffer(row['embedding'], dtype=np.float32)
            similarity = float(cosine_similarity(target_v, v_db.tolist()))
            
            if similarity >= request.threshold:
                similar_ideas.append({
                    "id": row['id'],
                    "content": row['content'],
                    "tags": row['tags'],
                    "similarity": round(similarity, 4)
                })
        
        conn.close()
        similar_ideas.sort(key=lambda x: x['similarity'], reverse=True)
        return {"similar": similar_ideas[:5]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"similar": []}

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
