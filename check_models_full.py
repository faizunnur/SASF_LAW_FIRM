import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

with open("available_models.txt", "w") as f:
    f.write("Checking available models...\n")
    try:
        for m in genai.list_models():
            f.write(f"Model: {m.name}, Methods: {m.supported_generation_methods}\n")
    except Exception as e:
        f.write(f"Error listing models: {e}\n")
