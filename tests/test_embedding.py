from app.ai.embeddings import get_embedding
from dotenv import load_dotenv
import os

load_dotenv()

def test_embedding():
    print("Testing Gemini Embedding generation...")
    text = "La capital de Francia es París."
    try:
        vector = get_embedding(text)
        print(f"SUCCESS! Vector size: {len(vector)}")
        print(f"First 5 values: {vector[:5]}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_embedding()
