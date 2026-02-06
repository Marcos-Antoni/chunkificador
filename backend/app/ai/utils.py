import json
from typing import List, Dict

async def run_ai_chain(model, initial_input: str, prompts: List[str]) -> str:
    """
    [FUNCIONALIDAD 3] Ejecuta una cadena de prompts secuencialmente.
    Cada paso recibe el output del anterior como '{input}'.
    """
    current_data = initial_input
    
    for i, prompt_template in enumerate(prompts):
        step_num = i + 1
        print(f"--- [DEBUG] Ejecutando Paso {step_num}/{len(prompts)} ---")
        
        formatted_prompt = prompt_template.format(input=current_data)
        
        # Usamos la versión asíncrona para no bloquear el hilo
        response = await model.generate_content_async(formatted_prompt)
        current_data = response.text
        
    return current_data

def parse_json_response(raw_content: str) -> List[Dict]:
    """
    Limpia y parsea la respuesta final para asegurar que sea un JSON válido.
    """
    try:
        # Intento 1: Buscar delimitadores de array
        start_idx = raw_content.find('[')
        end_idx = raw_content.rfind(']')
        if start_idx != -1 and end_idx != -1:
            json_str = raw_content[start_idx : end_idx + 1]
            return json.loads(json_str)
        
        # Intento 2: Limpieza agresiva de Markdown
        clean_text = raw_content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"Error parseando JSON: {e}")
        return [{"error": "No se pudo parsear el JSON final", "raw": raw_content}]
