import google.generativeai as genai
import os
import json
from typing import List
import numpy as np

# Modelo de embeddings de Google
EMBEDDING_MODEL = "models/text-embedding-004"

def get_embedding(text: str) -> List[float]:
    """
    Genera un vector numérico (embedding) para un texto dado usando Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada")
    
    genai.configure(api_key=api_key)
    
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    
    return result['embedding']

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """
    Calcula la similitud de coseno entre dos vectores.
    Resultado entre -1 y 1 (1 es identidad).
    """
    a = np.array(v1)
    b = np.array(v2)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
