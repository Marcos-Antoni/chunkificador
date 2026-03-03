import json
from .prompts import get_re_evaluation_prompt
from .utils import run_ai_chain
from ..dbLite.database import get_db_connection

async def re_evaluate_connections(idea_ids: list[int]) -> list[dict]:
    """
    Takes a list of idea IDs, gets their content, and asks the AI to propose 
    new, better connections between them. Returns a list of proposed connections.
    """
    if len(idea_ids) < 2:   
        return [{"error": "Se necesitan al menos 2 ideas para re-evaluar conexiones."}]
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    placeholders = ','.join('?' * len(idea_ids))
    cursor.execute(f"SELECT id, content FROM ideas WHERE id IN ({placeholders})", idea_ids)
    ideas = [{"id": row['id'], "content": row['content']} for row in cursor.fetchall()]
    conn.close()
    
    if len(ideas) < 2:
        return [{"error": "Ideas no encontradas en la BD."}]

    from .chunker import get_ai_model
    prompt = get_re_evaluation_prompt()
    ideas_text = json.dumps(ideas, ensure_ascii=False)
    
    # We run the AI call using the shared utility from the project
    model = get_ai_model()
    response_text = await run_ai_chain(model, ideas_text, [prompt])
    
    from .utils import parse_json_response
    proposals = parse_json_response(response_text)
    print("6. Proposals:", proposals)
    
    if isinstance(proposals, dict):
        # En caso de que Gemini devuelva un solo diccionario en vez de una lista
        print("7. Proposals is a dict:", proposals)
        if "error" in proposals:
            print("RAW RESPONSE:", response_text)
            return [{"error": "La IA devolvió un formato inválido. Reintenta."}]
        proposals = [proposals]
        
    if isinstance(proposals, list) and len(proposals) > 0 and isinstance(proposals[0], dict) and "error" in proposals[0]:
        print("RAW RESPONSE:", response_text)
        return [{"error": "La IA devolvió un error interno o mal formato. Reintenta."}]
        
    # Normalización para alinear con Pydantic Proposal Model
    normalized_proposals = []
    if isinstance(proposals, list):
        for p in proposals:
            if not isinstance(p, dict):
                continue
            # Mapear claves comunes al formato estricto
            from_id = p.get("from_idea_id", p.get("from_id", p.get("origen")))
            to_id = p.get("to_idea_id", p.get("to_id", p.get("destino")))
            c_type = p.get("connection_type", p.get("type", p.get("relacion", "thematic")))
            weight = p.get("weight", p.get("peso", 1.0))
            explanation = p.get("explanation", p.get("explicacion", ""))
            if from_id is not None and to_id is not None:
                try:
                    normalized_proposals.append({
                        "from_idea_id": int(from_id),
                        "to_idea_id": int(to_id),
                        "connection_type": str(c_type),
                        "weight": float(weight),
                        "explanation": str(explanation)
                    })
                except (ValueError, TypeError):
                    pass # Ignorar propuestas con IDs corruptos
                    
    return normalized_proposals
