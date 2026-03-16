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

⚖️ Relevant Law Section: (e.g., Section 420 for Fraud - mention specific law)
💡 Easy Explanation: Simple, non-technical breakdown.
✅ Action Plan: Step-by-step guidance.
📄 Document Checklist: Documents the user should gather.

SPECIAL INSTRUCTIONS:
1. Plan B (Criminal Cases): If 'Criminal', include a "🛡️ Plan B" section explaining FIR refusal alternatives (SP Office, C.R. Case). (Translate title if needed)
2. Zimmanama (Theft/Recovery): If theft, include a "📦 Zimmanama (Property Recovery)" section explaining Section 516A CrPC. (Translate title if needed)
3. Language: Respond entirely in the requested language (English or Bangla), including all section headers. If not specified, default to English.

Maintain a professional and unbiased tone. Always include this exactly at the very end (translate to Bangla if responding in Bangla):
"⚠️ Disclaimer: I am an AI assistant, not a human lawyer. This information is for educational purposes."
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
ASK_DEADLINE_TYPE, ASK_DEADLINE_DATE = range(3, 5)

# Conversation states for signature verification
ASK_VERIFICATION_COURT, ASK_VERIFICATION_CASE, ASK_VERIFICATION_PARTIES = range(5, 8)

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

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    welcome_msg = (
        f"Greetings {user.first_name}! I am <b>Self Lawyer Bangladesh</b>, your 24/7 Digital Legal Assistant.\n\n"
        "I can help you analyze legal issues, find relevant laws in Bangladesh, and provide step-by-step roadmaps.\n\n"
        "<b>Available Commands:</b>\n"
        "/start - Start the conversation\n"
        "/help - Get help and features overview\n"
        "/generate_gd - Create a professional General Diary (GD)\n"
        "/deadline - Calculate legal deadlines\n"
        "/language - Switch between English and Bangla\n"
        "/clear - Clear your conversation history for privacy\n\n"
        "How can I assist you today? (You can type in English or Bangla)"
    )
    await update.message.reply_text(welcome_msg, parse_mode="HTML")

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
        "9. <b>Deadline Tracker:</b> Use /deadline to calculate legal deadlines.\n"
        "10. <b>Generate Verification:</b> Use /generate_verification to create a handwriting verification application.\n\n"
        "<b>Privacy:</b> Use /clear to delete your session history."
    )
    await update.message.reply_text(help_text, parse_mode="HTML")

async def clear_history(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Clear the user's conversation history."""
    user_id = update.effective_user.id
    
    # Safely remove user from both tracking dictionaries
    user_history.pop(user_id, None)
    user_prefs.pop(user_id, None)

    # Always confirm deletion to the user to avoid confusion, 
    # even if the dictionaries were already empty (e.g. after a bot restart)
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
    else:
        user_prefs[user_id]['lang'] = 'Bangla'
        await query.edit_message_text(text="ভাষা বাংলা হিসেবে সেট করা হয়েছে।")

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

async def start_verification(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the signature verification drafting."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("আসুন এভিডেন্স অ্যাক্টের ৭৩ ধারার অধীনে সাক্ষর যাচাই করার জন্য একটি আবেদন ড্রাফট করি। মাননীয় আদালতের নাম কি?")
    else:
        await update.message.reply_text("Let's draft an Application for Signature Verification under Section 73 of the Evidence Act. What is the Honorable Court Name?")
    return ASK_VERIFICATION_COURT

async def receive_verification_court(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive court name and ask for case number."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    context.user_data['verif_court'] = update.message.text
    if lang == 'Bangla':
        await update.message.reply_text("বুঝতে পেরেছি। মামলা নম্বরটি কত?")
    else:
        await update.message.reply_text("Got it. What is the Case Number?")
    return ASK_VERIFICATION_CASE

async def receive_verification_case(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive case number and ask for parties' names."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    context.user_data['verif_case'] = update.message.text
    if lang == 'Bangla':
        await update.message.reply_text("অনুগ্রহ করে পক্ষসমূহের নাম দিন (যেমন, রহিম -বনাম- করিম)।")
    else:
        await update.message.reply_text("Please provide the Parties' Names (e.g., John Doe -vs- Jane Doe).")
    return ASK_VERIFICATION_PARTIES

async def receive_verification_parties(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive parties' names, generate the document, and send it."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    context.user_data['verif_parties'] = update.message.text
    
    if lang == 'Bangla':
        await update.message.reply_text("ধন্যবাদ। আপনার আবেদন তৈরি করা হচ্ছে...")
    else:
        await update.message.reply_text("Thank you. Generating your application...")
    
    import templates
    app_text = templates.SIGNATURE_VERIFICATION_TEMPLATE.format(
        court_name=context.user_data.get('verif_court', 'Unknown Court'),
        case_number=context.user_data.get('verif_case', 'Unknown Case Number'),
        parties_names=context.user_data.get('verif_parties', 'Unknown Parties')
    )
    
    if lang == 'Bangla':
        await update.message.reply_text(f"এখানে আপনার ফরম্যাট করা আবেদন দেওয়া হলো:\n\n```\n{app_text}\n```", parse_mode="Markdown")
    else:
        await update.message.reply_text(f"Here is your formatted application:\n\n```\n{app_text}\n```", parse_mode="Markdown")
    
    context.user_data.pop('verif_court', None)
    context.user_data.pop('verif_case', None)
    context.user_data.pop('verif_parties', None)
    return ConversationHandler.END

async def cancel_verification(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel the signature verification drafting."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("সাক্ষর যাচাইয়ের আবেদন তৈরি বাতিল করা হয়েছে।")
    else:
        await update.message.reply_text("Signature verification drafting cancelled.")
    context.user_data.pop('verif_court', None)
    context.user_data.pop('verif_case', None)
    context.user_data.pop('verif_parties', None)
    return ConversationHandler.END

async def start_deadline(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Start the deadline tracker process."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    keyboard = [
        ["1. Cheque Dishonour (Notice)"],
        ["2. Cheque Dishonour (File Case)"],
        ["3. Defamation Suit"],
        ["4. Civil Suit (Money/Contract)"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)
    
    if lang == 'Bangla':
        await update.message.reply_text("আপনি কোন ধরনের আইনি ব্যবস্থার সময়সীমা ট্র্যাক করছেন? একটি বিকল্প নির্বাচন করুন:", reply_markup=reply_markup)
    else:
        await update.message.reply_text("What type of legal action are you tracking? Please select an option:", reply_markup=reply_markup)
    return ASK_DEADLINE_TYPE

async def receive_deadline_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive the deadline type."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    context.user_data['deadline_type'] = update.message.text
    # Remove the reply keyboard
    if lang == 'Bangla':
        await update.message.reply_text("চমৎকার। ঘটনা বা কারণ ঘটার তারিখটি কবে ছিল (যেমন, চেকটি কবে ডিজঅনার হয়েছিল বা চুক্তি ভঙ্গ হয়েছিল)?\n\nঅনুগ্রহ করে তারিখটি YYYY-MM-DD বা '10 March 2024' ফরম্যাটে দিন।", reply_markup=ReplyKeyboardRemove())
    else:
        await update.message.reply_text("Great. What was the date of the incident or cause of action (e.g., when the cheque bounced or the contract was breached)?\n\nPlease enter the date in YYYY-MM-DD or '10 March 2024' format.", reply_markup=ReplyKeyboardRemove())
    return ASK_DEADLINE_DATE

async def receive_deadline_date(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Calculate the deadline and respond."""
    date_str = update.message.text
    case_type = context.user_data.get('deadline_type', '')
    
    try:
        incident_date = parser.parse(date_str)
        
        reply_msg = f"<b>Incident Date:</b> {incident_date.strftime('%B %d, %Y')}\n"
        reply_msg += f"<b>Category:</b> {case_type}\n\n"
        
        if "1" in case_type or "Notice" in case_type:
            deadline = incident_date + timedelta(days=30)
            reply_msg += f"⚠️ <b>Deadline:</b> {deadline.strftime('%B %d, %Y')}\n"
            reply_msg += "Under the Negotiable Instruments Act 1881 (Sec 138), you must send a legal notice within <b>30 days</b> of receiving the slip that the cheque bounced."
        
        elif "2" in case_type or "File Case" in case_type:
            reply_msg += "Under NI Act 1881 (Sec 138), after sending the legal notice, the sender gets 15 days to pay. If they don't, you must file the case within <b>30 days</b> immediately after that 15-day grace period expires."
            
        elif "3" in case_type or "Defamation" in case_type:
            deadline = incident_date.replace(year=incident_date.year + 1)
            reply_msg += f"⚠️ <b>Deadline:</b> {deadline.strftime('%B %d, %Y')}\n"
            reply_msg += "Under the Limitation Act 1908, the limitation period for filing a suit for compensation for libel or slander is <b>1 year</b> from the date the publication or words spoken."
        
        elif "4" in case_type or "Civil Suit" in case_type:
            deadline = incident_date.replace(year=incident_date.year + 3)
            reply_msg += f"⚠️ <b>Deadline:</b> {deadline.strftime('%B %d, %Y')}\n"
            reply_msg += "Under the Limitation Act 1908, a general civil suit for breach of contract or money recovery must typically be filed within <b>3 years</b> from the time the cause of action arises."
        
        else:
            reply_msg += "I'm sorry, I don't have a specific deadline calculation for that case type yet. Please consult a legal professional."
            
        await update.message.reply_text(reply_msg, parse_mode="HTML")
        
    except Exception as e:
        await update.message.reply_text("I couldn't understand that date format. Please try the command `/deadline` again with a clear format like `2024-03-10` or `10 March 2024`.")
        
    context.user_data.pop('deadline_type', None)
    return ConversationHandler.END

async def cancel_deadline(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Cancel the deadline tracker."""
    user_id = update.effective_user.id
    lang = user_prefs.get(user_id, {}).get('lang', 'English')
    
    if lang == 'Bangla':
        await update.message.reply_text("ডেডলাইন ট্র্যাকিং বাতিল করা হয়েছে।", reply_markup=ReplyKeyboardRemove())
    else:
        await update.message.reply_text("Deadline tracking cancelled.", reply_markup=ReplyKeyboardRemove())
    context.user_data.pop('deadline_type', None)
    return ConversationHandler.END

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming messages and query Gemini with RAG context."""
    user_id = update.effective_user.id
    user_text = update.message.text

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
            bot_response += "\n\n⚠️ *Legal Warning:* Under Section 193 of the Penal Code 1860, giving or fabricating false evidence in a judicial proceeding is a serious crime. If a signature you claim is fake is proven to be yours, you may face up to 7 years in prison and a fine."
            
        if any(kw in lower_combined for kw in ["cid", "forensics", "pbi"]):
            bot_response += "\n\n⏳ *Expected Timeline:* Forensic handwriting analysis and lab reports in Bangladesh typically take 3 to 6 months due to laboratory backlogs."

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
            CommandHandler('generate_gd', start_gd)
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
    
    # Verification Conversation Handler
    verif_conv_handler = ConversationHandler(
        entry_points=[CommandHandler('generate_verification', start_verification)],
        states={
            ASK_VERIFICATION_COURT: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_verification_court)],
            ASK_VERIFICATION_CASE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_verification_case)],
            ASK_VERIFICATION_PARTIES: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_verification_parties)]
        },
        fallbacks=[CommandHandler('cancel', cancel_verification)]
    )
    application.add_handler(verif_conv_handler)
    
    # Deadline Tracker Conversation Handler
    deadline_conv_handler = ConversationHandler(
        entry_points=[CommandHandler('deadline', start_deadline)],
        states={
            ASK_DEADLINE_TYPE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_deadline_type)],
            ASK_DEADLINE_DATE: [MessageHandler(filters.TEXT & ~filters.COMMAND, receive_deadline_date)]
        },
        fallbacks=[CommandHandler('cancel', cancel_deadline)]
    )
    application.add_handler(deadline_conv_handler)

    # Messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Run the bot
    application.run_polling()

if __name__ == "__main__":
    main()
