import os
from typing import List, Dict
import datetime

def generate_obsidian_markdown(title: str, atoms: List[Dict]) -> str:
    """
    Convierte una lista de átomos en un archivo Markdown con formato para Obsidian.
    Incluye Frontmatter y estilo de lista atómica.
    """
    date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    md_content = f"---"
    md_content += f"\ntitle: {title}"
    md_content += f"\ndate: {date_str}"
    md_content += f"\ntags: [chunkificador, conocimiento-atomico]"
    md_content += f"\n---\n\n"
    
    md_content += f"# {title}\n\n"
    md_content += f"## Unidades de Conocimiento Extraídas\n\n"
    
    for atom in atoms:
        md_content += f"### {atom['statement']}\n"
        md_content += f"- **Sujeto:** [[{atom['subject']}]]\n"
        md_content += f"- **Relación:** {atom['predicate']}\n"
        md_content += f"- **Objeto:** [[{atom['object']}]]\n"
        md_content += f"- **Tipo:** #{atom['type']}\n"
        if atom.get('tags'):
            tags = " ".join([f"#{t}" for t in atom['tags']])
            md_content += f"- **Tags:** {tags}\n"
        md_content += "\n---\n\n"
        
    return md_content

def save_to_obsidian(title: str, atoms: List[Dict]):
    """
    Guarda el contenido en la carpeta de Obsidian configurada.
    """
    # Intentar obtener ruta desde el .env, si no usar una por defecto
    obsidian_base_path = os.getenv("OBSIDIAN_PATH", "/app/data/obsidian_vault")
    
    # Asegurar que la carpeta existe
    ideas_dir = os.path.join(obsidian_base_path, "ideas")
    os.makedirs(ideas_dir, exist_ok=True)
    
    # Crear nombre de archivo seguro
    safe_title = "".join([c if c.isalnum() or c in " -_" else "_" for c in title]).strip()
    filename = f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{safe_title}.md"
    file_path = os.path.join(ideas_dir, filename)
    
    content = generate_obsidian_markdown(title, atoms)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Archivo de Obsidian guardado en: {file_path}")
    return file_path
