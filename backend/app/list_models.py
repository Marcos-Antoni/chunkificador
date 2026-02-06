import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try looking in parent dirs if running from subfolder
    load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))
    api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    print("Listando modelos disponibles para embeddings...")
    try:
        for m in genai.list_models():
            if 'embedContent' in m.supported_generation_methods:
                print(f"- {m.name}")
    except Exception as e:
        print(f"Error listando modelos: {e}")
else:
    print("NO API KEY FOUND")
