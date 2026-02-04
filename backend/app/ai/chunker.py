import os
import google.generativeai as genai
import json
from typing import List, Dict

# El modelo Flash es rápido y eficiente
MODEL_NAME = "gemini-3-flash-preview"

ATOMIZATION_PROMPT = """
Eres un Arquitecto de Conocimiento experto en descomponer información compleja en "Bloques de Ideas" interconectados.

TU TAREA:
Analiza el texto proporcionado y divídelo en "Bloques de Conocimiento" (Chunks).
Cada bloque debe representar UNA idea principal completa, explicada en un párrafo coherente.

REGLAS DE GENERACIÓN DE CHUNKS:
1. COHESIÓN: Cada chunk debe ser un párrafo breve (2-4 oraciones) que explique una idea por sí mismo.
2. DESCONTEXTUALIZACIÓN: No uses pronombres ambiguos. Si el texto dice "Su teoría...", cámbialo a "La teoría de Einstein...".
3. CONEXIONES: Identifica cómo se relacionan los bloques entre sí. Asigna IDs y crea enlaces.
4. NO AGREGACIONES: Crea los chunks solo con el texto dado aun que eso signifique solo crear 1 chunk.
5. NO RESUMAS: No resumas el texto, crea los chunks solo con el texto dado.
6. NO INVENTES: No inventes información que no esté en el texto original. Si no lo decia el texto no lo pongas.

SALIDA ESPERADA (JSON):
Devuelve ÚNICAMENTE una lista de objetos JSON con esta estructura exacta:

[
  {{
    "id": "chunk_1",
    "text": "Texto completo del párrafo explicando la idea...",
    "tags": ["tag1", "tag2"],
    "related_ids": ["chunk_2", "chunk_5"] 
  }},
  ...
]

NOTA SOBRE related_ids:
- Usa SOLO los IDs que tú mismo has generado en esta lista (chunk_X).
- Conecta bloques que tengan una relación lógica fuerte (causa-efecto, parte-todo, continuación).

TEXTO A PROCESAR:
{text}
"""

import traceback

async def atomize_text(text: str) -> List[Dict]:
    """
    Envía el texto a Gemini para ser atomizado en conceptos estructurados.
    """
    print(f"--- [DEBUG] Iniciando atomization de {len(text)} caracteres ---")
    
    try:
        # ================================================================
        # 1. CONFIGURACIÓN Y AUTENTICACIÓN
        # ================================================================
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             raise ValueError("GEMINI_API_KEY no está configurada en las variables de entorno")

        # ================================================================
        # 2. INICIALIZACIÓN DEL MODELO IA
        # ================================================================
        print(f"--- [DEBUG] Configurando con la llave y usando modelo {MODEL_NAME} ---")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(MODEL_NAME)
        
        # ================================================================
        # 3. PREPARACIÓN Y EJECUCIÓN DEL PROMPT
        # ================================================================
        # Inyectar el texto en el prompt experto
        prompt = ATOMIZATION_PROMPT.format(text=text)
        
        print("--- [DEBUG] Enviando request a Google... ---")
        # Generar respuesta de la IA
        response = model.generate_content(prompt)
        raw_content = response.text
        
        print(f"--- DEBUG GEMINI RAW RESPONSE ---\n{raw_content}\n-------------------------------")

        # ================================================================
        # 4. EXTRACCIÓN Y LIMPIEZA DE DATOS (JSON PARSING)
        # ================================================================
        # Limpieza SUPER ROBUSTA: Intentamos extraer solo el bloque entre corchetes []
        try:
            start_idx = raw_content.find('[')
            end_idx = raw_content.rfind(']')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = raw_content[start_idx : end_idx + 1]
                atoms = json.loads(json_str)
                return atoms
            else:
                 raise ValueError("No se encontraron corchetes JSON [] en la respuesta")
                 
        except Exception as parse_error:
            # Fallback 1: Si falla la extracción por corchetes, probamos limpieza de Markdown simple
            clean_text = raw_content.replace("```json", "").replace("```", "").strip()
            atoms = json.loads(clean_text)
            return atoms

    # ================================================================
    # 5. GESTIÓN DE ERRORES DE FORMATO (JSON)
    # ================================================================
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error: {e}")
        print(f"Raw Content that failed: {raw_content}")
        
        # Devolvemos un objeto de error para que el sistema no colapse
        return [{
            "statement": "ERROR: La IA no devolvió un JSON válido. El formato es incorrecto.",
            "subject": "System",
            "predicate": "failed_parsing",
            "object": "Gemini Response",
            "type": "error",
            "debug_raw": raw_content
        }]

    # ================================================================
    # 6. GESTIÓN DE ERRORES FATALES (CONEXIÓN, API KEY, ETC)
    # ================================================================
    except Exception as e:
        error_msg = f"ERROR FATAL en chunker.py: {str(e)}"
        print(error_msg)
        traceback.print_exc() 
        return [{"error": error_msg}]
