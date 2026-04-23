# SelfLawyer Bot

A sophisticated legal AI assistant built with Telegram and Google's Generative AI (Gemini). It provides guidance on laws, case analysis, and legal documentation.

## Features

- **Smart Case Analysis**: Detailed examination and analysis of legal cases using AI.
- **RAG-Powered Knowledge**: Integrated Retrieval-Augmented Generation for accurate law retrieval.
- **Bilingual Support**: Fully functional in both English and Bangla.
- **Multi-Document Drafting**: Capability to draft various legal documents.
- **Modern UI**: Clean Telegram menu interface with grid layout for better UX.

## Tech Stack

- **Python**: Core logic.
- **python-telegram-bot**: Telegram API integration.
- **Google Generative AI (Gemini)**: Powering legal reasoning and analysis.
- **ChromaDB**: For vector storage and fast retrieval.
- **Flask**: Web components (if any).

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/asifiqbal247/SelfLawyer.git
   cd SelfLawyer
   ```

2. **Environment Variables**:
   Create a `.env` file from the `.env.template` and add your keys:
   - `TELEGRAM_BOT_TOKEN`
   - `GOOGLE_API_KEY`

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Bot**:
   ```bash
   python main.py
   ```

## Documentation

- Check out the comprehensive [Doc_Self_Lawyer.pdf](Doc_Self_Lawyer.pdf) for detailed project overview.

---
Developed by [Asif Iqbal](https://github.com/asifiqbal247)
