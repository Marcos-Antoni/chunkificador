from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import uuid
from typing import List, Dict, Optional
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

@app.get("/api/ideas/{idea_id}")
async def get_idea_endpoint(idea_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Fetch Idea
        cursor.execute("SELECT id, content, type, batch_id, created_at FROM ideas WHERE id = ?", (idea_id,))
        idea_row = cursor.fetchone()
        
        if not idea_row:
            raise HTTPException(status_code=404, detail="Idea no encontrada")
            
        idea = dict(idea_row)
        
        # 2. Fetch Subjects
        cursor.execute('''
            SELECT s.id, s.name 
            FROM subjects s
            JOIN ideas_subjects isub ON s.id = isub.subject_id
            WHERE isub.idea_id = ?
        ''', (idea_id,))
        idea["subjects"] = [dict(row) for row in cursor.fetchall()]
        
        # 3. Fetch Incoming Connections
        cursor.execute('''
            SELECT c.id as connection_id, c.from_idea_id, i.content as from_content, c.connection_type, c.weight
            FROM connections c
            JOIN ideas i ON c.from_idea_id = i.id
            WHERE c.to_idea_id = ?
        ''', (idea_id,))
        idea["incoming_connections"] = [dict(row) for row in cursor.fetchall()]

        # 4. Fetch Outgoing Connections
        cursor.execute('''
            SELECT c.id as connection_id, c.to_idea_id, i.content as to_content, c.connection_type, c.weight
            FROM connections c
            JOIN ideas i ON c.to_idea_id = i.id
            WHERE c.from_idea_id = ?
        ''', (idea_id,))
        idea["outgoing_connections"] = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return {"status": "success", "idea": idea}
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ManualIdeaRequest(BaseModel):
    content: str
    type: str = "Theoretical"
    tags: List[str] = []

class ManualConnectionRequest(BaseModel):
    from_idea_id: int
    to_idea_id: int
    connection_type: str = "manual"
    weight: float = 1.0

@app.post("/api/ideas/manual")
async def create_manual_idea(request: ManualIdeaRequest):
    try:
        if not request.content.strip():
            raise HTTPException(status_code=400, detail="El contenido no puede estar vacío")
            
        embedding = get_embedding(request.content)
        embedding_blob = np.array(embedding, dtype=np.float32).tobytes()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        batch_id = str(uuid.uuid4())
        
        cursor.execute(
            "INSERT INTO ideas (content, embedding, type, batch_id) VALUES (?, ?, ?, ?)",
            (request.content, embedding_blob, request.type, batch_id)
        )
        idea_id = cursor.lastrowid
        
        clean_tags = list(set([t.strip() for t in request.tags if t.strip()]))
        for tag_name in clean_tags:
            cursor.execute("SELECT id FROM subjects WHERE name = ?", (tag_name,))
            row = cursor.fetchone()
            
            if row:
                subject_id = row['id']
            else:
                cursor.execute("INSERT INTO subjects (name) VALUES (?)", (tag_name,))
                subject_id = cursor.lastrowid
                
            cursor.execute(
                "INSERT INTO ideas_subjects (idea_id, subject_id) VALUES (?, ?)",
                (idea_id, subject_id)
            )
            
        conn.commit()
        conn.close()
        return {"status": "success", "idea_id": idea_id}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/connections/manual")
async def create_manual_connection(request: ManualConnectionRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO connections (from_idea_id, to_idea_id, connection_type, weight) VALUES (?, ?, ?, ?)",
            (request.from_idea_id, request.to_idea_id, request.connection_type, request.weight)
        )
        connection_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        return {"status": "success", "connection_id": connection_id}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class AdvancedSearchRequest(BaseModel):
    text: str = ""
    threshold: float = 0.6
    batch_id: Optional[str] = None
    subject_ids: List[int] = []
    idea_id: Optional[int] = None
    type: Optional[str] = None
    page: int = 1
    limit: int = 10

@app.post("/api/ideas/advanced_search")
async def advanced_search_endpoint(request: AdvancedSearchRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base query components
        where_clauses = ["1=1"]
        params = []
        
        if request.idea_id:
            where_clauses.append("i.id = ?")
            params.append(request.idea_id)
            
        if request.type:
            where_clauses.append("i.type = ?")
            params.append(request.type)
            
        if request.batch_id:
            where_clauses.append("i.batch_id = ?")
            params.append(request.batch_id)
            
        if request.subject_ids:
            # Need to join ideas_subjects if not already joined below
            pass
            
        # Case 1: Semantic Search (Text-based)
        if request.text.strip():
            target_v = get_embedding(request.text)
            
            query = "SELECT DISTINCT i.id, i.content, i.type, i.batch_id, i.created_at, i.embedding FROM ideas i "
            if request.subject_ids:
                query += "JOIN ideas_subjects isub ON i.id = isub.idea_id "
            
            query += "WHERE i.embedding IS NOT NULL AND " + " AND ".join(where_clauses)
            
            if request.subject_ids:
                placeholders = ','.join('?' * len(request.subject_ids))
                query += f" AND isub.subject_id IN ({placeholders}) "
                params.extend(request.subject_ids)
                
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            results_pool = []
            for row in rows:
                v_db = np.frombuffer(row['embedding'], dtype=np.float32)
                similarity = float(cosine_similarity(target_v, v_db.tolist()))
                
                if similarity >= request.threshold:
                    results_pool.append({
                        "id": row['id'],
                        "content": row['content'],
                        "type": row['type'],
                        "batch_id": row['batch_id'],
                        "similarity": round(similarity, 4)
                    })
            
            # Sort by similarity
            results_pool.sort(key=lambda x: x['similarity'], reverse=True)
            
            total_results = len(results_pool)
            total_pages = (total_results + request.limit - 1) // request.limit
            
            # Sub-paginate
            start = (request.page - 1) * request.limit
            end = start + request.limit
            results = results_pool[start:end]
            
            # Fetch subjects for these results
            for res in results:
                cursor.execute('''
                    SELECT s.name FROM subjects s
                    JOIN ideas_subjects isub ON s.id = isub.subject_id
                    WHERE isub.idea_id = ?
                ''', (res['id'],))
                res["subjects"] = [s['name'] for s in cursor.fetchall()]

        # Case 2: Structured Search (No text)
        else:
            # Join subjects if needed for filtering
            join_clause = ""
            if request.subject_ids:
                join_clause = "JOIN ideas_subjects isub ON i.id = isub.idea_id "
                placeholders = ','.join('?' * len(request.subject_ids))
                where_clauses.append(f"isub.subject_id IN ({placeholders})")
                params.extend(request.subject_ids)
            
            # Count total for pagination
            count_query = f"SELECT COUNT(DISTINCT i.id) FROM ideas i {join_clause} WHERE " + " AND ".join(where_clauses)
            cursor.execute(count_query, params)
            total_results = cursor.fetchone()[0]
            total_pages = (total_results + request.limit - 1) // request.limit
            
            # Fetch Current Page
            data_query = f"SELECT DISTINCT i.id, i.content, i.type, i.batch_id, i.created_at FROM ideas i {join_clause} " \
                        f"WHERE " + " AND ".join(where_clauses) + " ORDER BY i.created_at DESC LIMIT ? OFFSET ?"
            
            limit_params = params + [request.limit, (request.page - 1) * request.limit]
            cursor.execute(data_query, limit_params)
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                # Fetch subjects
                cursor.execute('''
                    SELECT s.name FROM subjects s
                    JOIN ideas_subjects isub ON s.id = isub.subject_id
                    WHERE isub.idea_id = ?
                ''', (row['id'],))
                subjects = [s['name'] for s in cursor.fetchall()]
                
                results.append({
                    "id": row['id'],
                    "content": row['content'],
                    "type": row['type'],
                    "batch_id": row['batch_id'],
                    "subjects": subjects,
                    "similarity": None
                })
        
        conn.close()
        return {
            "status": "success", 
            "results": results, 
            "total_results": total_results,
            "total_pages": total_pages,
            "current_page": request.page
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/subjects")
async def get_subjects():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM subjects ORDER BY name ASC")
        subjects = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"status": "success", "subjects": subjects}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

from .services.mermaid_export import generate_mermaid_graph

class MermaidRequest(BaseModel):
    batch_id: str

@app.post("/api/ideas/mermaid")
async def get_mermaid_graph(request: MermaidRequest):
    try:
        mermaid_string = generate_mermaid_graph(request.batch_id)
        return {"status": "success", "mermaid": mermaid_string}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from .ai.re_evaluator import re_evaluate_connections

class ReEvaluateRequest(BaseModel):
    batch_ids: str

class Proposal(BaseModel):
    from_idea_id: int
    to_idea_id: int
    connection_type: str
    weight: float = 1.0

class ApplyProposalRequest(BaseModel):
    proposals: List[Proposal]

@app.post("/api/ai/re-evaluate")
async def re_evaluate_endpoint(request: ReEvaluateRequest):
    try:
        batch_ids = [b.strip() for b in request.batch_ids.split(',') if b.strip()]
        if not batch_ids:
            raise HTTPException(status_code=400, detail="Debe proporcionar al menos un Batch ID.")
            
        conn = get_db_connection()
        cursor = conn.cursor()
        placeholders = ','.join('?' * len(batch_ids))
        cursor.execute(f"SELECT id FROM ideas WHERE batch_id IN ({placeholders})", batch_ids)
        idea_ids = [row['id'] for row in cursor.fetchall()]
        conn.close()

        if len(idea_ids) < 2:
            raise HTTPException(status_code=400, detail="Se encontraron menos de 2 ideas para los Batch IDs proporcionados.")

        proposals = await re_evaluate_connections(idea_ids)
        if proposals and "error" in proposals[0] and len(proposals) == 1:
            raise HTTPException(status_code=400, detail=proposals[0]["error"])
        return {"status": "success", "proposals": proposals}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/connections/apply-proposal")
async def apply_proposal_endpoint(request: ApplyProposalRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        count = 0
        for prop in request.proposals:
            cursor.execute('''
                SELECT id FROM connections 
                WHERE from_idea_id = ? AND to_idea_id = ?
            ''', (prop.from_idea_id, prop.to_idea_id))
            
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO connections (from_idea_id, to_idea_id, connection_type, weight)
                    VALUES (?, ?, ?, ?)
                ''', (prop.from_idea_id, prop.to_idea_id, prop.connection_type, prop.weight))
                count += 1
                
        conn.commit()
        conn.close()
        
        return {"status": "success", "connections_added": count}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
