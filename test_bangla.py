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
user_text = "আমার টাকা চুরি হয়ে গেছে" # My money has been stolen

print(f"Querying RAG for: {user_text}")
try:
    search_results = rag.query_laws(user_text, n_results=1)
    print(f"Search Results IDs: {search_results['ids']}")
    if search_results['documents'] and search_results['documents'][0]:
        context_text = search_results['documents'][0][0]
        print(f"Context Snippet: {context_text[:100]}...")
    else:
        print("No documents found.")
        context_text = ""
except Exception as e:
    print(f"RAG Error: {e}")
    context_text = ""

lang = "Bangla" # Simulation of user pref
prompt_with_context = f"Relevant Law Context:\n{context_text}\n\nUser Question: {user_text}\n\nPlease respond in {lang}."

print("Querying Gemini...")
try:
    chat_session = model.start_chat(history=[])
    response = chat_session.send_message(prompt_with_context)
    if not response.candidates:
        print("No candidates returned.")
    else:
        print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"Gemini Error: {e}")
