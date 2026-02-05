import os
import google.generativeai as genai
import json
import time
from typing import List, Dict

MODEL_NAME = "gemini-3-flash-preview"

PROMPT_1_UNITS = """
Actúa como un experto en análisis de discurso y lingüística cognitiva.
Identifica las "unidades de información" independientes del siguiente texto. 
Diferencia entre Idea Central e Ideas de Soporte.

Texto: {text}
"""

PROMPT_2_GRAPH = """
Rol: Arquitecto de Conocimiento. 
Contexto: Ideas extraídas anteriormente:
{units_analysis}

Tarea: Construye un Grafo de Conocimiento (Mermaid graph TD) y una lista de adyacencia explicada ([A] -> (Relación) -> [B]).
"""

PROMPT_3_JSON = """
Consolida el siguiente análisis en una lista JSON de Chunks estructurados (id, text, tags, related_ids).
Asegúrate de que cada texto sea un párrafo coherente y descontextualizado.

Análisis: {graph_analysis}

Responde ÚNICAMENTE con el JSON.
"""

def run_deep_atomization(text_path, output_path):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY no encontrada.")
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_NAME)

    with open(text_path, 'r') as f:
        text = f.read()

    try:
        print("--- Paso 1: Extrayendo unidades ---")
        res1 = model.generate_content(PROMPT_1_UNITS.format(text=text))
        units = res1.text
        time.sleep(10) # Pausa para evitar cuota

        print("--- Paso 2: Construyendo Grafo ---")
        res2 = model.generate_content(PROMPT_2_GRAPH.format(units_analysis=units))
        graph = res2.text
        time.sleep(10)

        print("--- Paso 3: Generando JSON final ---")
        res3 = model.generate_content(PROMPT_3_JSON.format(graph_analysis=graph))
        
        with open(output_path, 'w') as f:
            f.write(res3.text)
        
        print(f"✅ Proceso completado. Resultado en {output_path}")

    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Uso: python3 deep_chunker.py <input.txt> <output.txt>")
    else:
        run_deep_atomization(sys.argv[1], sys.argv[2])
