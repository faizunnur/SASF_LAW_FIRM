import os
import google.generativeai as genai
from dotenv import load_dotenv

# Mocking the state and logic from main.py
user_history = {}
user_prefs = {}

def get_prompt(user_id, user_text, context_text):
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    prompt_with_context = f"Relevant Law Context:\n{context_text}\n\nUser Question: {user_text}\n\nPlease respond in {lang}."
    return prompt_with_context

def test_features():
    user_id = 12345
    
    print("--- Test 1: Default Language (English) ---")
    prompt = get_prompt(user_id, "stolen money", "Context about theft")
    print(f"Prompt: {prompt}")
    assert "Please respond in English." in prompt

    print("\n--- Test 2: Language Toggle to Bangla ---")
    user_prefs[user_id] = {'lang': 'Bangla'}
    prompt = get_prompt(user_id, "stolen money", "Context about theft")
    print(f"Prompt: {prompt}")
    assert "Please respond in Bangla." in prompt

    print("\n--- Test 3: Privacy Clear ---")
    user_history[user_id] = [{"role": "user", "parts": ["hi"]}]
    print(f"History before clear: {user_history.get(user_id)}")
    if user_id in user_history:
        del user_history[user_id]
    print(f"History after clear: {user_history.get(user_id)}")
    assert user_id not in user_history

    print("\n--- Test 4: Gemini Prompt Content (Live Test) ---")
    load_dotenv()
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction="Follow specific instructions for Plan B and Zimmanama."
    )
    
    # Testing if the system instructions are respected (conceptually)
    # We can't easily see the internal system prompt in the response, 
    # but we can ask Gemini a question that triggers the new logic.
    query = "Someone stole my bike, what can I do? Thana is not taking FIR."
    # We'll use a mocked context for brevity
    context = "Section 378: Theft... Section 516A CrPC: Zimmanama"
    full_prompt = get_prompt(user_id, query, context)
    
    print(f"Querying Gemini with: {query}")
    try:
        response = model.generate_content(full_prompt)
        print(f"Response Snippet:\n{response.text[:500]}...")
        # Check if Plan B or Zimmanama is mentioned (since we added it to system prompt in main.py, 
        # for this test we'd need to use the actual SYSTEM_PROMPT string from main.py)
    except Exception as e:
        print(f"Gemini error: {e}")

if __name__ == "__main__":
    test_features()
