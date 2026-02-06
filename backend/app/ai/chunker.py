import os
import google.generativeai as genai
import traceback
from typing import List, Dict
from .prompts import CHUNK_PROMPTS
from .utils import run_ai_chain, parse_json_response

# Configuración del modelo
MODEL_NAME = "gemini-3-flash-preview"

def get_ai_model():
    """
    [FUNCIONALIDAD 1] Inicializa y activa la API de Gemini.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY no está configurada")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(MODEL_NAME)

async def atomize_text(text: str) -> List[Dict]:
    """
    Orquestador principal que utiliza los módulos simplificados.
    """
    print(f"--- [DEBUG] Iniciando atomización para {len(text)} caracteres ---")
    
    try:
        # 1. Obtener modelo (Funcionalidad 1)
        model = get_ai_model()
        
        # 2. Ejecutar cadena (Funcionalidad 3)
        final_output = await run_ai_chain(model, text, CHUNK_PROMPTS)
        
        # 3. Parsear resultado
        return parse_json_response(final_output)

    except Exception as e:
        error_msg = f"ERROR en flujo de atomización: {str(e)}"
        print(error_msg)
        traceback.print_exc() 
        return [{"error": error_msg}]
