from ..dbLite.database import get_db_connection

def generate_mermaid_graph(batch_ids_str: str) -> str:
    """
    Given a comma-separated string of batch_ids, queries the database for those ideas and the
    connections between them, and returns a formatted Mermaid JS graph string.
    """
    if not batch_ids_str or not batch_ids_str.strip():
        return "graph TD;\n    Empty[\"No lote (batch_id) seleccionado\"];"
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    batch_ids = [b.strip() for b in batch_ids_str.split(',') if b.strip()]
    if not batch_ids:
        conn.close()
        return "graph TD;\n    Empty[\"Lote inválido\"];"

    placeholders = ','.join('?' * len(batch_ids))

    # 1. Fetch the requested ideas by batch_ids
    cursor.execute(f"SELECT id, content FROM ideas WHERE batch_id IN ({placeholders})", batch_ids)
    ideas = {row['id']: row['content'] for row in cursor.fetchall()}
    
    if not ideas:
        conn.close()
        return "graph TD;\n    NotFound[\"No se encontraron ideas para estos Lotes\"];"

    idea_ids = list(ideas.keys())
    placeholders = ','.join('?' * len(idea_ids))

    # 2. Fetch connections where BOTH the source and target are in our list
    # Because we only want to visualize the subgraph of selected ideas
    cursor.execute(f'''
        SELECT from_idea_id, to_idea_id, connection_type 
        FROM connections 
        WHERE from_idea_id IN ({placeholders}) 
        AND to_idea_id IN ({placeholders})
    ''', idea_ids + idea_ids)
    connections = cursor.fetchall()
    
    conn.close()
    
    # 3. Build the Mermaid String
    mermaid_lines = ["graph TD;"]
    
    # Add nodes mapping
    for i_id, content in ideas.items():
        # Truncate content for display in node, escape quotes
        display_text = content[:50].replace('"', "'").replace("\n", " ")
        if len(content) > 50:
            display_text += "..."
            
        mermaid_lines.append(f'    node{i_id}["{display_text}"];')
        
    # Add edges
    for conn in connections:
        from_id = conn['from_idea_id']
        to_id = conn['to_idea_id']
        ctype = conn['connection_type']
        
        # Format: node1-- "type" -->node2;
        mermaid_lines.append(f'    node{from_id}-- "{ctype}" -->node{to_id};')
        
    return "\n".join(mermaid_lines)
