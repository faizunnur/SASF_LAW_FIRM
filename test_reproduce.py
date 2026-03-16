import os
import google.generativeai as genai
from dotenv import load_dotenv
from rag_system import LegalRAG

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction="You are a legal assistant."
)

rag = LegalRAG()
user_text = "someone has stolen my money.what Bangladesh laws says"

print(f"Querying RAG for: {user_text}")
try:
    search_results = rag.query_laws(user_text, n_results=1)
    print(f"Search Results: {search_results}")
    context_text = "\n\n".join(search_results['documents'][0])
    print(f"Context: {context_text[:100]}...")
except Exception as e:
    print(f"RAG Error: {e}")
    context_text = ""

prompt_with_context = f"Relevant Law Context:\n{context_text}\n\nUser Question: {user_text}"

print("Querying Gemini...")
try:
    chat_session = model.start_chat(history=[])
    response = chat_session.send_message(prompt_with_context)
    if not response.candidates:
        print("No candidates returned.")
    else:
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Gemini Error: {e}")
