import os
import asyncio
from app.ai.chunker import atomize_text
from dotenv import load_dotenv

async def main():
    load_dotenv()
    text = "Cristóbal Colón fue un navegante."
    print("Testing atomize_text...")
    try:
        result = await atomize_text(text)
        print("Result:", result)
    except Exception as e:
        print("Caught exception in main:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
