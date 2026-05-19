"""
🤖 Research Report Telegram Bot
Powered by Claude AI + python-telegram-bot + python-docx
"""

import os
import logging
import asyncio
import subprocess
import json
import re
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ParseMode
import anthropic

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ─── Config (from environment variables) ────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
ANTHROPIC_API_KEY  = os.environ["ANTHROPIC_API_KEY"]

# ─── Anthropic client ───────────────────────────────────────────────────────
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# ════════════════════════════════════════════════════════════════════════════
# STEP 1 – Ask Claude to produce structured JSON for the research report
# ════════════════════════════════════════════════════════════════════════════
RESEARCH_SYSTEM_PROMPT = """
You are an elite AI Research Analyst and Technical Documentation Expert.
Your task is to produce a DEEP, HIGHLY DETAILED research report in pure JSON.

Return ONLY valid JSON with this exact schema (no markdown, no commentary):

{
  "title": "Full report title",
  "subtitle": "Subtitle / tagline",
  "date": "Month YYYY",
  "executive_summary": "3-5 paragraph executive summary...",
  "sections": [
    {
      "heading": "Section heading",
      "subsections": [
        {
          "subheading": "Subheading (optional, can be empty string)",
          "paragraphs": ["paragraph 1", "paragraph 2", ...],
          "bullets": ["bullet point 1", "bullet point 2", ...],
          "table": {
            "headers": ["Col A", "Col B", "Col C"],
            "rows": [["val1","val2","val3"], ...]
          }
        }
      ]
    }
  ],
  "conclusion": "Full conclusion text...",
  "references": ["Reference 1", "Reference 2", ...]
}

RULES:
- Every section must have rich, analytical, non-generic content.
- Include REAL statistics, trends, companies, tools where relevant.
- Include tables in: market overview, key players, comparison sections.
- paragraphs and bullets are both optional per subsection — use whichever fits best.
- table is optional — include only when it adds value.
- Sections to cover (map intelligently to headings):
    1. Introduction & Background
    2. Current Industry Overview
    3. Core Technologies / Concepts
    4. Key Players / Companies / Tools
    5. Market Trends & Statistics
    6. Real-World Applications
    7. Advantages & Benefits
    8. Challenges & Limitations
    9. Risks & Ethical Concerns
   10. Future Scope & Predictions
   11. Opportunities for Businesses & Creators
   12. Implementation Strategy
   13. Case Studies / Examples
   14. Final Analysis
- Conclusion goes in the top-level "conclusion" key.
- Return ONLY the JSON object — no extra text.
"""

def research_topic(topic: str) -> dict:
    """Call Claude API and return parsed JSON research report."""
    logger.info(f"Researching topic: {topic}")
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=8000,
        system=RESEARCH_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Research topic: {topic}\n\nProduce the full professional research report as JSON."
            }
        ]
    )
    raw = message.content[0].text.strip()
    # Strip markdown fences if Claude wrapped it anyway
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


# ════════════════════════════════════════════════════════════════════════════
# STEP 2 – Convert JSON → DOCX via Node.js script
# ════════════════════════════════════════════════════════════════════════════
def build_docx(report: dict, output_path: str) -> str:
    """Write JSON to temp file, call Node builder, return docx path."""
    json_path = output_path.replace(".docx", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    script = os.path.join(os.path.dirname(__file__), "build_docx.js")
    result = subprocess.run(
        ["node", script, json_path, output_path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"DOCX builder error:\n{result.stderr}")

    os.remove(json_path)
    return output_path


# ════════════════════════════════════════════════════════════════════════════
# TELEGRAM HANDLERS
# ════════════════════════════════════════════════════════════════════════════
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 *Welcome to the Research Report Bot!*\n\n"
        "Send me any topic and I will:\n"
        "1️⃣ Perform deep AI-powered research\n"
        "2️⃣ Generate a professional 20+ page report\n"
        "3️⃣ Send you a polished *.docx* file\n\n"
        "📝 *Example:*\n"
        "`Artificial Intelligence in Healthcare 2025`\n\n"
        "Just type your topic and hit send! 🚀",
        parse_mode=ParseMode.MARKDOWN
    )

async def help_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *How to use this bot:*\n\n"
        "Simply send a topic like:\n"
        "• `Electric Vehicles Market 2025`\n"
        "• `Blockchain in Supply Chain`\n"
        "• `Rise of No-Code Platforms`\n\n"
        "The bot will research and return a full DOCX report in ~2 minutes.\n\n"
        "Commands:\n"
        "/start – Welcome message\n"
        "/help  – This help message",
        parse_mode=ParseMode.MARKDOWN
    )

async def handle_topic(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    topic = update.message.text.strip()
    if not topic:
        return

    chat_id = update.effective_chat.id
    status_msg = await update.message.reply_text(
        f"🔍 *Researching:* `{topic}`\n\n"
        "⏳ This takes ~90 seconds. Hang tight…",
        parse_mode=ParseMode.MARKDOWN
    )

    try:
        # ── Research ──────────────────────────────────────────────────────
        await ctx.bot.edit_message_text(
            chat_id=chat_id,
            message_id=status_msg.message_id,
            text=f"🧠 *Analysing topic with Claude AI…*\n`{topic}`",
            parse_mode=ParseMode.MARKDOWN
        )
        report = await asyncio.get_event_loop().run_in_executor(
            None, research_topic, topic
        )

        # ── Build DOCX ───────────────────────────────────────────────────
        await ctx.bot.edit_message_text(
            chat_id=chat_id,
            message_id=status_msg.message_id,
            text="📄 *Building your DOCX report…*",
            parse_mode=ParseMode.MARKDOWN
        )
        safe_name = re.sub(r"[^\w\s-]", "", topic)[:50].strip().replace(" ", "_")
        out_path   = f"/tmp/{safe_name}_Report.docx"
        build_docx(report, out_path)

        # ── Send file ────────────────────────────────────────────────────
        await ctx.bot.delete_message(chat_id=chat_id, message_id=status_msg.message_id)
        with open(out_path, "rb") as f:
            await update.message.reply_document(
                document=f,
                filename=f"{safe_name}_Research_Report.docx",
                caption=(
                    f"✅ *Research Report Ready!*\n\n"
                    f"📌 *Topic:* {topic}\n"
                    f"📑 *Sections:* {len(report.get('sections', []))+3}\n\n"
                    f"_Generated by Research Report Bot • Powered by Claude AI_"
                ),
                parse_mode=ParseMode.MARKDOWN
            )
        os.remove(out_path)

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        await ctx.bot.edit_message_text(
            chat_id=chat_id,
            message_id=status_msg.message_id,
            text="❌ Research parsing failed. Please try again with a clearer topic."
        )
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        await ctx.bot.edit_message_text(
            chat_id=chat_id,
            message_id=status_msg.message_id,
            text=f"❌ Something went wrong:\n`{str(e)[:200]}`",
            parse_mode=ParseMode.MARKDOWN
        )


# ════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ════════════════════════════════════════════════════════════════════════════
def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help",  help_cmd))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_topic))

    logger.info("🤖 Bot is running…")
    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
