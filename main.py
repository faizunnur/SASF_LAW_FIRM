import os
import logging
from typing import List, Dict
from telegram import Update, ForceReply, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler, ConversationHandler
import google.generativeai as genai
from fpdf import FPDF
import tempfile
from dotenv import load_dotenv
from datetime import datetime, timedelta
from dateutil import parser
from rag_system import LegalRAG

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
print("--- STARTING SELF LAWYER BOT (v2.0) ---")
print("TARGET MODEL: gemini-flash-latest")

# System Prompt
SYSTEM_PROMPT = """
You are "Self Lawyer Bangladesh", a professional, empathetic, and unbiased legal AI assistant.
Your goal is to help citizens understand their legal rights and navigate the Bangladeshi legal system.

Identify legal categories (Criminal, Family, Property, Cybercrime, Fraud) from natural language (English, Bangla).

CRITICAL FORMATTING RULES:
- DO NOT use markdown headers like `#`, `##`, or `###`. Telegram cannot parse them correctly.
- Provide your response using the following structured sections and emojis. **IMPORTANT: You must TRANSLATE the section titles (like "Relevant Law Section", "Action Plan") into the requested language.**

⚖️ Relevant Law: (Section & Law Name)
💡 Explanation: (1-2 sentences)
✅ Action: (Brief steps)
📄 Docs: (List)
🛡️ Plan B: (FIR refusal guide - for Criminal)
📦 Zimmanama: (Recovery guide - for Theft)
Respond in the requested language. End with: "⚠️ AI Disclaimer: For educational purposes only."
"""

# Initialize model with system instruction
model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction=SYSTEM_PROMPT
)

# Initialize RAG
rag = LegalRAG()

# Conversation states for drafting documents (LEGACY / REDIRECTED)
ASK_NAME_OLD, ASK_LOCATION_OLD, ASK_OFFENSE_DETAILS_OLD = range(3)

# Conversation states for deadline tracker
ASK_DEADLINE_DESCRIPTION, ASK_DEADLINE_DATE = range(3, 5)

# Conversation states for case analysis
ASK_CASE_DESCRIPTION = 6

# Conversation states for professional GD generation
(
    ASK_GD_DATE,
    ASK_GD_THANA,
    ASK_GD_DISTRICT,
    ASK_GD_NAME,
    ASK_GD_FATHER,
    ASK_GD_ADDRESS,
    ASK_GD_INCIDENT_DATE,
    ASK_GD_INCIDENT_TIME,
    ASK_GD_INCIDENT_LOCATION,
    ASK_GD_DESCRIPTION,
    ASK_GD_MOBILE
) = range(8, 19)

# Store message history and preferences
user_history: Dict[int, List[Dict]] = {}
user_prefs: Dict[int, Dict] = {}

def get_emergency_keyboard():
    keyboard = [[InlineKeyboardButton("📞 Call 999 (Emergency)", callback_data='emergency_num')]]
    return InlineKeyboardMarkup(keyboard)

def get_main_menu(lang='English'):
    """Generate professional persistent menu with optimized grid."""
    if lang == 'Bangla':
        keyboard = [
            ["🚀 নতুন করে শুরু করুন", "🔍 স্মার্ট কেস বিশ্লেষণ"],
            ["📄 প্রফেশনাল জিডি (GD)", "📅 ডেডলাইন ট্র্যাকার"],
            ["🌐 ভাষা পরিবর্তন", "❓ সাহায্য"],
            ["🧹 ইতিহাস মুছুন"]
        ]
    else:
        keyboard = [
            ["🚀 Start New", "🔍 Smart Case Analysis"],
            ["📄 Professional GD", "📅 Deadline Tracker"],
            ["🌐 Change Language", "❓ Help & Features"],
            ["🧹 Clear History"]
        ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, is_persistent=True)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    user_id = user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    welcome_msg = (
        f"Greetings {user.first_name}! I am <b>Self Lawyer Bangladesh</b>, your 24/7 Digital Legal Assistant.\n\n"
        "I can help you analyze legal issues, find relevant laws in Bangladesh, and provide step-by-step roadmaps.\n\n"
        "Please use the menu below to explore my features or simply describe your legal issue to get started."
    )
    if lang == 'Bangla':
        welcome_msg = (
            f"শুভেচ্ছা {user.first_name}! আমি <b>সেলফ লয়ার বাংলাদেশ</b>, আপনার ২৪/৭ ডিজিটাল আইনি সহকারী।\n\n"
            "আমি আপনাকে আইনি সমস্যা বিশ্লেষণ করতে, বাংলাদেশের প্রাসঙ্গিক আইন খুঁজে পেতে এবং ধাপে ধাপে দিকনির্দেশনা দিতে সাহায্য করতে পারি।\n\n"
            "আমার ফিচারগুলো দেখতে নিচের মেনু ব্যবহার করুন অথবা আপনার আইনি সমস্যাটি লিখুন।"
        )
    
    await update.message.reply_text(welcome_msg, parse_mode="HTML", reply_markup=get_main_menu(lang))

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    help_text = (
        "<b>Self Lawyer Bangladesh - Features:</b>\n\n"
        "1. <b>AI Problem Analyzer:</b> Describe your issue, and I'll identify the legal category.\n"
        "2. <b>Auto-Law Finder:</b> Links issues to Penal Code, CrPC, Digital Security Act, etc.\n"
        "3. <b>Legal Roadmap:</b> Provides relevant sections, explanations, action plans, and document checklists.\n"
        "4. <b>Plan B Logic:</b> Advice for FIR refusal (for Criminal cases).\n"
        "5. <b>Zimmanama:</b> Recovery guidance (for Theft cases).\n"
        "6. <b>Emergency:</b> Use the persistent button or call 999.\n"
        "7. <b>Language:</b> Use /language to switch between English and Bangla.\n"
        "8. <b>Professional GD:</b> Use /generate_gd to create a formal GD application.\n"
        "9. <b>Deadline Tracker:</b> Use /deadline to calculate legal deadlines.\n\n"
        "<b>Privacy:</b> Use /clear to delete your session history."
    )
    await update.message.reply_text(help_text, parse_mode="HTML")

async def start_new(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Reset session state and show welcome message."""
    user_id = update.effective_user.id
    user_history.pop(user_id, None)
    context.user_data.clear()
    await start(update, context)

async def clear_history(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Clear the user's conversation history."""
    user_id = update.effective_user.id
    user_history.pop(user_id, None)
    user_prefs.pop(user_id, None)
    await update.message.reply_text("Your conversation history and session preferences have been cleared. Your privacy is our priority. You are now starting fresh!")

async def set_language(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Choose language."""
    keyboard = [
        [
            InlineKeyboardButton("English", callback_data='lang_en'),
            InlineKeyboardButton("বাংলা (Bangla)", callback_data='lang_bn'),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Please choose your preferred language / অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন:", reply_markup=reply_markup)

async def language_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle language selection."""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    if user_id not in user_prefs:
        user_prefs[user_id] = {}
    
    if query.data == 'lang_en':
        user_prefs[user_id]['lang'] = 'English'
        await query.edit_message_text(text="Language set to English.")
        await query.message.reply_text("Main menu updated.", reply_markup=get_main_menu('English'))
    else:
        user_prefs[user_id]['lang'] = 'Bangla'
        await query.edit_message_text(text="ভাষা বাংলা হিসেবে সেট করা হয়েছে।")
        await query.message.reply_text("প্রধান মেনু আপডেট করা হয়েছে।", reply_markup=get_main_menu('Bangla'))

async def emergency_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle emergency button click."""
    query = update.callback_query
    await query.answer()
    await query.message.reply_text("🚨 <b>National Emergency Service: 999</b>\n\nPlease dial 999 from your phone's dialer to contact the Police, Fire Service, or Ambulance immediately.", parse_mode="HTML")

async def start_gd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the professional GD drafting process."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("আসুন একটি পেশাদার জিডি প্রস্তুত করি। আজকের তারিখ কি? (যেমন: ১০ মার্চ ২০২৪)")
    else:
        await update.message.reply_text("Let's prepare a professional GD. What is today's date? (e.g., 10 March 2024)")
    return ASK_GD_DATE

async def receive_gd_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_date'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "Which Thana (Police Station)?" if lang == 'English' else "কোন থানা?"
    await update.message.reply_text(msg)
    return ASK_GD_THANA

async def receive_gd_thana(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_thana'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "Which District?" if lang == 'English' else "কোন জেলা?"
    await update.message.reply_text(msg)
    return ASK_GD_DISTRICT

async def receive_gd_district(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_district'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "What is your full name?" if lang == 'English' else "আপনার পূর্ণ নাম কি?"
    await update.message.reply_text(msg)
    return ASK_GD_NAME

async def receive_gd_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_name'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "What is your Father's Name?" if lang == 'English' else "আপনার পিতার নাম কি?"
    await update.message.reply_text(msg)
    return ASK_GD_FATHER

async def receive_gd_father(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_father'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "What is your Address?" if lang == 'English' else "আপনার ঠিকানা কি?"
    await update.message.reply_text(msg)
    return ASK_GD_ADDRESS

async def receive_gd_address(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_address'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "When did the incident happen? (Date)" if lang == 'English' else "ঘটনাটি কবে ঘটেছিল? (তারিখ)"
    await update.message.reply_text(msg)
    return ASK_GD_INCIDENT_DATE

async def receive_gd_incident_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_incident_date'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "At what time did the incident happen?" if lang == 'English' else "ঘটনাটি কখন ঘটেছিল? (সময়)"
    await update.message.reply_text(msg)
    return ASK_GD_INCIDENT_TIME

async def receive_gd_incident_time(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_incident_time'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "Where did the incident happen? (Location)" if lang == 'English' else "ঘটনাটি কোথায় ঘটেছিল? (স্থান)"
    await update.message.reply_text(msg)
    return ASK_GD_INCIDENT_LOCATION

async def receive_gd_incident_location(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_incident_location'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "Please describe the incident briefly." if lang == 'English' else "অনুগ্রহ করে ঘটনাটি সংক্ষেপে বর্ণনা করুন।"
    await update.message.reply_text(msg)
    return ASK_GD_DESCRIPTION

async def receive_gd_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data['gd_description'] = update.message.text
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    msg = "What is your Mobile Number?" if lang == 'English' else "আপনার মোবাইল নম্বর কি?"
    await update.message.reply_text(msg)
    return ASK_GD_MOBILE

async def receive_gd_mobile(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    context.user_data['gd_mobile'] = update.message.text
    
    if lang == 'Bangla':
        await update.message.reply_text("ধন্যবাদ। আপনার প্রফেশনাল জিডি তৈরি করা হচ্ছে...")
    else:
        await update.message.reply_text("Thank you. Generating your professional GD now...")
    
    # helper for date formatting
    def format_legal_date(date_str):
        try:
            d = parser.parse(date_str)
            return d.strftime("%d %B %Y") # e.g., 10 March 2026
        except:
            return date_str.strip().title()

    data = {
        'date': format_legal_date(context.user_data.get('gd_date')),
        'thana': context.user_data.get('gd_thana', '').strip().title(),
        'district': context.user_data.get('gd_district', '').strip().title(),
        'name': context.user_data.get('gd_name', '').strip().title(),
        'father_name': context.user_data.get('gd_father', '').strip().title(),
        'address': context.user_data.get('gd_address', '').strip(),
        'incident_date': format_legal_date(context.user_data.get('gd_incident_date')),
        'incident_time': context.user_data.get('gd_incident_time', '').strip(),
        'incident_location': context.user_data.get('gd_incident_location', '').strip().title(),
        'description': context.user_data.get('gd_description', '').strip(),
        'mobile': context.user_data.get('gd_mobile', '').strip()
    }
    
    import templates
    gd_text = templates.generate_GD_application(data)
    
    response_msg = "Here is your professional GD (Copy and use):\n\n" if lang == 'English' else "সহজেই কপি করার জন্য আপনার প্রফেশনাল জিডি নিচে কোড ব্লকে দেওয়া হলো:\n\n"
    await update.message.reply_text(f"{response_msg}```\n{gd_text}\n```", parse_mode="Markdown")
    
    # Generate Document (PDF)
    pdf = FPDF()
    # 1 inch = 25.4 mm
    pdf.set_margins(25.4, 25.4, 25.4)
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    # Header (Centered)
    pdf.set_font("Arial", 'B', size=16)
    pdf.cell(0, 10, txt="General Diary (GD) Application", ln=True, align='C')
    pdf.ln(10)
    
    # Content
    pdf.set_font("Arial", size=12)
    line_height = 7.0 # Reduced from 8.0 to ensure single-page fit
    for line in gd_text.split('\n'):
        if not line.strip():
            pdf.ln(4) # Slightly reduced vertical space for empty lines
            continue
        try:
            pdf.multi_cell(0, line_height, txt=line)
        except:
            pdf.multi_cell(0, line_height, txt=line.encode('latin-1', 'replace').decode('latin-1'))
    
    # Save to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_path = temp_file.name
    temp_file.close()
    pdf.output(temp_path)
    
    # Send PDF document
    try:
        with open(temp_path, 'rb') as doc_file:
            caption = "Here is your professional GD in PDF format."
            if lang == 'Bangla':
               caption = "এখানে আপনার প্রফেশনাল জিডি পিডিএফ আকারে দেওয়া হলো।"
            await update.message.reply_document(
                document=doc_file, 
                filename=f"GD_{data['name'].replace(' ', '_')}.pdf", 
                caption=caption
            )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # Clear data
    keys_to_clear = ['gd_date', 'gd_thana', 'gd_district', 'gd_name', 'gd_father', 'gd_address', 
                     'gd_incident_date', 'gd_incident_time', 'gd_incident_location', 'gd_description', 'gd_mobile']
    for key in keys_to_clear:
        context.user_data.pop(key, None)
        
    return ConversationHandler.END

async def cancel_gd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    msg = "GD generation cancelled." if lang == 'English' else "জিডি তৈরি বাতিল করা হয়েছে।"
    await update.message.reply_text(msg)
    
    keys_to_clear = ['gd_date', 'gd_thana', 'gd_district', 'gd_name', 'gd_father', 'gd_address', 
                     'gd_incident_date', 'gd_incident_time', 'gd_incident_location', 'gd_description', 'gd_mobile']
    for key in keys_to_clear:
        context.user_data.pop(key, None)
    return ConversationHandler.END

async def start_drafting(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Redirect draft_document to generate_gd or inform user."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("'/draft_document' পরিবর্তন করে '/generate_gd' করা হয়েছে। আমি অটোম্যাটিক আপনার জন্য এটি শুরু করছি...")
    else:
        await update.message.reply_text("'/draft_document' has been updated to '/generate_gd'. Starting it for you now...")
    return await start_gd(update, context) # Re-using start_gd logic


async def start_case_analysis(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the formal case analysis flow."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    msg = "Please describe your incident in detail. I will analyze the relevant laws and provide a step-by-step strategic roadmap for you."
    if lang == 'Bangla':
        msg = "অনুগ্রহ করে আপনার ঘটনাটি বিস্তারিত বর্ণনা করুন। আমি প্রাসঙ্গিক আইনগুলো বিশ্লেষণ করব এবং আপনার জন্য একটি ধাপে ধাপে কৌশলগত নির্দেশিকা প্রদান করব।"
    await update.message.reply_text(msg, reply_markup=ReplyKeyboardRemove())
    return ASK_CASE_DESCRIPTION

async def receive_case_analysis(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Pass incident description to the main analysis logic."""
    # We simply call handle_message to reuse the complex Gemini logic
    await handle_message(update, context)
    return ConversationHandler.END

async def start_deadline(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the AI-driven deadline tracker process."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("আসুন আপনার আইনি সময়সীমা (Deadline) নির্ধারণ করি। সংক্ষেপে আপনার ঘটনাটি বর্ণনা করুন (যেমন: 'আমার মালিক বেতন দেয়নি' বা 'আমি মামলা হারার পর আপিল করতে চাই')।", reply_markup=ReplyKeyboardRemove())
    else:
        await update.message.reply_text("Let's determine your legal deadline. Please briefly describe your incident (e.g., 'My employer hasn't paid me' or 'I want to appeal after losing a case').", reply_markup=ReplyKeyboardRemove())
    return ASK_DEADLINE_DESCRIPTION

async def receive_deadline_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive the incident description."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    context.user_data['deadline_description'] = update.message.text
    
    if lang == 'Bangla':
        await update.message.reply_text("চমৎকার। ঘটনা বা কারণ ঘটার তারিখটি কবে ছিল? (যেমন, ১০ মার্চ ২০২৪ বা DD/MM/YYYY ফরম্যাটে দিন)")
    else:
        await update.message.reply_text("Great. What was the date of the incident or cause of action? (e.g., 10 March 2024 or DD/MM/YYYY format)")
    return ASK_DEADLINE_DATE

async def receive_deadline_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Classify with AI, calculate the deadline using RAG context, and respond in minimalist format."""
    date_str = update.message.text
    incident_description = context.user_data.get('deadline_description', '')
    lang = user_prefs.get(update.effective_user.id, {}).get('lang', 'English')
    
    try:
        incident_date = parser.parse(date_str, dayfirst=True)
    except:
        await update.message.reply_text("Invalid date format. Use DD/MM/YYYY.")
        return ASK_DEADLINE_DATE

    # RAG Retrieval
    rag_query = f"Limitation period and time for filing for: {incident_description}"
    search_results = rag.query_laws(rag_query, n_results=3)
    rag_context = "\n\n".join(search_results['documents'][0])

    # Minimalist AI Prompt
    classification_prompt = f"""
    Context: {rag_context}
    Incident: {incident_description}
    Date: {incident_date.strftime('%d/%m/%Y')}
    
    Task: Identify legal category, section, and limitation period according to Bangladesh Law.
    Return EXACTLY this structure (no other text):
    Category: [Law/Section Name]
    Period: [Number] [days/months/years]
    Rule: [Strictly 1-sentence rule explaining the deadline]
    """
    
    try:
        response = model.generate_content(classification_prompt)
        ai_output = response.text.strip()
        
        # Parse AI output
        lines = ai_output.split('\n')
        category, rule = "Unknown", "Check Limitation Act 1908."
        period_val, period_unit = 3, "years"
        
        for line in lines:
            if "Category:" in line: category = line.split(":", 1)[1].strip()
            if "Rule:" in line: rule = line.split(":", 1)[1].strip()
            if "Period:" in line:
                parts = line.split(":", 1)[1].strip().split()
                if len(parts) >= 2:
                    try:
                        period_val = int(parts[0])
                        period_unit = parts[1].lower()
                    except: pass

        # Calculate Deadline
        from dateutil.relativedelta import relativedelta
        if "year" in period_unit:
            deadline = incident_date + relativedelta(years=period_val)
        elif "month" in period_unit:
            deadline = incident_date + relativedelta(months=period_val)
        else:
            deadline = incident_date + relativedelta(days=period_val)

        # STRICT Minimalist Format
        headers = {
            'date': "Incident Date",
            'cat': "Detected Category",
            'dead': "⚠️ Deadline",
            'rule': "Rule"
        }
        if lang == 'Bangla':
            headers = {
                'date': "ঘটনার তারিখ",
                'cat': "শনাক্তকৃত বিভাগ",
                'dead': "⚠️ আইনি সময়সীমা",
                'rule': "নিয়ম"
            }

        reply_msg = (
            f"<b>{headers['date']}:</b> {incident_date.strftime('%d/%m/%Y')}\n"
            f"<b>{headers['cat']}:</b> {category}\n"
            f"<b>{headers['dead']}:</b> {deadline.strftime('%d/%m/%Y')}\n"
            f"<b>{headers['rule']}:</b> {rule}"
        )

        await update.message.reply_text(reply_msg, parse_mode="HTML", reply_markup=get_main_menu(lang))
        
    except Exception as e:
        logger.error(f"Minimalist Deadline Error: {e}")
        await update.message.reply_text("Error calculating deadline. Please consult a lawyer.")

    context.user_data.pop('deadline_description', None)
    return ConversationHandler.END

async def cancel_deadline(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel the deadline tracker."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("ডেডলাইন ট্র্যাকিং বাতিল করা হয়েছে।", reply_markup=ReplyKeyboardRemove())
    else:
        await update.message.reply_text("Deadline tracking cancelled.", reply_markup=ReplyKeyboardRemove())
    context.user_data.pop('deadline_description', None)
    return ConversationHandler.END

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming messages and query Gemini or route menu clicks."""
    user_id = update.effective_user.id
    user_text = update.message.text
    lang = user_prefs.get(user_id, {}).get('lang', 'English')

    # Route Menu Button Clicks (Fallback for non-conversational buttons)
    menu_mapping = {
        "🚀 Start New": start_new,
        "🚀 নতুন করে শুরু করুন": start_new,
        "🌐 Change Language": set_language,
        "🌐 ভাষা পরিবর্তন": set_language,
        "❓ Help & Features": help_command,
        "❓ সাহায্য": help_command,
        "🧹 Clear History": clear_history,
        "🧹 ইতিহাস মুছুন": clear_history
    }

    if user_text in menu_mapping:
        await menu_mapping[user_text](update, context)
        return

    if user_id not in user_history:
        user_history[user_id] = []

    # RAG Retrieval - Reducing to 1 result to stay within free tier quota
    search_results = rag.query_laws(user_text, n_results=1)
    context_text = "\n\n".join(search_results['documents'][0])
    
    # Prepare prompt with context and language preference
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    prompt_with_context = f"Relevant Law Context:\n{context_text}\n\nUser Question: {user_text}\n\nPlease respond in {lang}."

    # Get response from Gemini
    try:
        # Start chat with existing history
        chat_session = model.start_chat(history=user_history[user_id])
        
        logger.info(f"Querying Gemini for user {user_id}...")
        # Check if response has content
        response = chat_session.send_message(prompt_with_context)
        
        if not response.candidates:
            raise ValueError("No response generated by the model (possibly due to safety filters).")
            
        bot_response = response.text
        logger.info("Received response from Gemini.")

        # Update persistent history with CLEAN messages (no RAG context)
        # This prevents the history from growing too fast and hitting quota limits
        user_history[user_id].append({"role": "user", "parts": [user_text]})
        user_history[user_id].append({"role": "model", "parts": [bot_response]})

        # Safeguards and Procedural Timeline logic
        lower_combined = (user_text + " " + bot_response).lower()
        if any(kw in lower_combined for kw in ["forgery", "fake signature", "fraud"]):
            bot_response += "\n\n⚠️ *Legal Warning:* Under Section 193 of the Penal Code 1860, fabricating false evidence is a crime punishable by up to 7 years in prison."

        # Send response with Markdown fallback and emergency button
        reply_markup = get_emergency_keyboard()
        try:
            await update.message.reply_text(bot_response, parse_mode="Markdown", reply_markup=reply_markup)
        except Exception as telegram_err:
            logger.warning(f"Markdown parsing failed, sending as plain text: {telegram_err}")
            await update.message.reply_text(bot_response, reply_markup=reply_markup)
            
    except genai.types.generation_types.StopCandidateException as e:
        logger.error(f"Safety filters triggered: {e}")
        await update.message.reply_text("I'm sorry, I cannot provide an answer to that specific query due to safety filters. Please try rephrasing your question.")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error handling message: {e}", exc_info=True)
        
        if "429" in error_msg or "quota" in error_msg.lower():
            await update.message.reply_text("I'm experiencing high traffic right now and reached my temporary limit. Please try sending your message again in about a minute.")
        elif "500" in error_msg or "503" in error_msg:
            await update.message.reply_text("The legal brain is a bit busy right now. Please try again in a moment.")
        else:
            await update.message.reply_text("Sorry, I encountered an error processing your request. Please check the logs or try again.")

def main() -> None:
    """Start the bot."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment.")
        return

    application = Application.builder().token(token).build()

    # Commands
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("clear", clear_history))
    application.add_handler(CommandHandler("language", set_language))
    application.add_handler(CallbackQueryHandler(language_button, pattern="^lang_"))
    application.add_handler(CallbackQueryHandler(emergency_callback, pattern="^emergency_num$"))

    # GD Professional Conversation Handler
    gd_conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler('draft_document', start_drafting),
            CommandHandler('generate_gd', start_gd),
            MessageHandler(filters.Regex(r'^(📄 Professional GD|📄 প্রফেশনাল জিডি \(GD\))$'), start_gd)
        ],
        states={
            ASK_GD_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_date)],
            ASK_GD_THANA: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_thana)],
            ASK_GD_DISTRICT: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_district)],
            ASK_GD_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_name)],
            ASK_GD_FATHER: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_father)],
            ASK_GD_ADDRESS: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_address)],
            ASK_GD_INCIDENT_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_incident_date)],
            ASK_GD_INCIDENT_TIME: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_incident_time)],
            ASK_GD_INCIDENT_LOCATION: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_incident_location)],
            ASK_GD_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_description)],
            ASK_GD_MOBILE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_gd_mobile)]
        },
        fallbacks=[CommandHandler('cancel', cancel_gd)]
    )
    application.add_handler(gd_conv_handler)
    
    # Deadline Tracker Conversation Handler
    deadline_conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler('deadline', start_deadline),
            MessageHandler(filters.Regex(r'^(📅 Deadline Tracker|📅 ডেডলাইন ট্র্যাকার)$'), start_deadline)
        ],
        states={
            ASK_DEADLINE_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_deadline_description)],
            ASK_DEADLINE_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_deadline_date)]
        },
        fallbacks=[CommandHandler('cancel', cancel_deadline)]
    )
    application.add_handler(deadline_conv_handler)

    application.add_handler(deadline_conv_handler)

    # Smart Case Analysis Conversation Handler
    case_conv_handler = ConversationHandler(
        entry_points=[
            MessageHandler(filters.Regex(r'^(🔍 Smart Case Analysis|🔍 স্মার্ট কেস বিশ্লেষণ)$'), start_case_analysis)
        ],
        states={
            ASK_CASE_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_case_analysis)]
        },
        fallbacks=[CommandHandler('cancel', clear_history)] # Fallback to clear if cancelled
    )
    application.add_handler(case_conv_handler)

    # Messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Run the bot
    application.run_polling()

if __name__ == "__main__":
    main()
