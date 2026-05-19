# 🤖 Research Report Telegram Bot

> Send a topic → Get a full professional DOCX research report on Telegram!

---

## ✨ What It Does

1. You send a topic like: `Artificial Intelligence in Healthcare`
2. The bot uses **Claude AI** to do deep research
3. It generates a **polished multi-section DOCX report**
4. It sends the file **back to you on Telegram**

Works 24/7 from **anywhere** — home, office, mobile!

---

## 🛠️ Files in This Project

```
telegram-research-bot/
├── bot.py            ← Main Telegram bot (Python)
├── build_docx.js     ← DOCX generator (Node.js)
├── requirements.txt  ← Python packages
├── package.json      ← Node packages
├── railway.toml      ← Cloud deployment config
├── nixpacks.toml     ← Runtime config for Railway
└── README.md         ← This file
```

---

## 🔑 STEP 1 — Get Your API Keys

### A) Telegram Bot Token (Free)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: e.g. `My Research Bot`
4. Choose a username: e.g. `myresearch_bot`
5. BotFather gives you a token like:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. **Save this token** — it's your `TELEGRAM_BOT_TOKEN`

---

### B) Anthropic API Key (Free $5 credit on signup)

1. Go to **https://console.anthropic.com**
2. Sign up / log in
3. Click **"API Keys"** in the left sidebar
4. Click **"Create Key"**
5. Copy the key starting with `sk-ant-...`
6. **Save this key** — it's your `ANTHROPIC_API_KEY`

---

## 🚀 STEP 2 — Deploy to Railway (Free Hosting)

Railway gives your bot a **free always-on server** so it works 24/7.

### 1. Push code to GitHub

1. Create a free account at **https://github.com**
2. Create a new repository: `research-bot`
3. Upload all files from this folder into it
   - You can drag & drop files on the GitHub website

### 2. Deploy on Railway

1. Go to **https://railway.app** and sign up (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub and select `research-bot`
4. Railway will detect the config automatically

### 3. Add Environment Variables

In Railway → Your Project → **Variables** tab, add:

| Variable Name        | Value                          |
|----------------------|--------------------------------|
| `TELEGRAM_BOT_TOKEN` | `7123456789:AAHxxx...`         |
| `ANTHROPIC_API_KEY`  | `sk-ant-api03-xxx...`          |

4. Click **Deploy** — your bot is now live!

---

## 💻 STEP 2 (Alternative) — Run Locally on Your PC

If you want to test on your own computer:

### Requirements
- Python 3.10+
- Node.js 18+

### Setup

```bash
# 1. Install Python packages
pip install -r requirements.txt

# 2. Install Node packages
npm install

# 3. Set environment variables (Windows)
set TELEGRAM_BOT_TOKEN=your_token_here
set ANTHROPIC_API_KEY=your_key_here

# 3. Set environment variables (Mac/Linux)
export TELEGRAM_BOT_TOKEN=your_token_here
export ANTHROPIC_API_KEY=your_key_here

# 4. Run the bot
python bot.py
```

---

## 💬 How to Use the Bot

1. Open Telegram and find your bot by its username
2. Send `/start` to begin
3. Type any research topic:
   ```
   Electric Vehicles Market 2025
   ```
   ```
   Blockchain in Supply Chain Management
   ```
   ```
   The Future of Remote Work
   ```
4. Wait ~60-90 seconds
5. Receive your professional DOCX report! 📄

---

## 📄 Report Structure

Each report includes:
1. **Cover Page** — Title, subtitle, date
2. **Executive Summary** — Key findings at a glance
3. **Introduction & Background**
4. **Current Industry Overview**
5. **Core Technologies / Concepts**
6. **Key Players / Companies / Tools**
7. **Market Trends & Statistics** (with tables)
8. **Real-World Applications**
9. **Advantages & Benefits**
10. **Challenges & Limitations**
11. **Risks & Ethical Concerns**
12. **Future Scope & Predictions**
13. **Opportunities for Businesses**
14. **Implementation Strategy**
15. **Case Studies / Examples**
16. **Final Analysis**
17. **Conclusion**
18. **References & Sources**

---

## ⚡ Tips

- Be **specific** with topics for better results
  - ✅ `AI in Healthcare Diagnostics 2025`
  - ❌ `AI`
- Reports take **60–120 seconds** to generate
- You can send **multiple topics** one after another
- The bot handles one request at a time per user

---

## 🔒 Security Note

**Never share your API keys publicly.**  
Keep them only in Railway's environment variables or your local terminal.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not responding | Check Railway logs for errors |
| `TELEGRAM_BOT_TOKEN` error | Make sure the variable is set in Railway |
| `ANTHROPIC_API_KEY` error | Make sure the variable is set in Railway |
| Report takes too long | Normal — Claude needs ~90s for deep research |
| Node.js error | Railway auto-installs it via nixpacks.toml |

---

*Built with ❤️ using Python, Node.js, Claude AI, and python-telegram-bot*
