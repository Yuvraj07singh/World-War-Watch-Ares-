# 🌍 World War Watch — AI Geopolitical Intelligence Platform

**A fully automated, self-healing, AI-driven global conflict dashboard.**

World War Watch is a premium intelligence dashboard that automatically aggregates breaking geopolitical news via 12 global RSS feeds, analyzes it using a resilient 4-layer AI architecture, and presents the data in a stunning, high-performance UI.

---

## 🚀 Key Value Propositions for Buyers

1. **Zero-Maintenance Automation** 
   - Once deployed, it runs entirely on autopilot. A Node.js cron job wakes up every 60 minutes, pulls new data, processes it via AI, and caches it to MongoDB.
   
2. **Bulletproof 4-Layer AI Architecture**
   - The platform uses a fallback chain to guarantee 100% uptime:
     1. **Gemini 2.5 Flash** (Primary - Free)
     2. **Cerebras Llama 3.1 8B** (Secondary - Free)
     3. **OpenRouter Llama 3** (Tertiary - Free)
     4. **Pollinations.ai** (Last Resort fallback)
   
3. **MongoDB Data Persistence & Fast Load Times**
   - Unlike basic apps that re-fetch APIs on every page load, WWWatch caches all intelligence reports permanently into MongoDB Atlas. Users get sub-100ms load times.

4. **Built-in Audience Funnel (Monetization Ready)**
   - The UI includes a beautiful "Classified Intelligence Newsletter" capture form. Leads are securely saved to MongoDB. You are ready to start building an email list on Day 1.

5. **Premium, Viral UX/UI**
   - Built with raw HTML/CSS/JS for extreme performance without framework bloat. Features interactive SVG maps, tension meters, PDF report generation, and the iconic "Doomsday Clock."

6. **SEO & Analytics Ready**
   - Pre-configured with Google Analytics (GA4) and Open Graph tags for easy marketing and traffic tracking.

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express, node-cron
- **Frontend:** Vanilla JS, CSS3, Chart.js, HTML2Canvas
- **Database:** MongoDB Atlas (Mongoose)
- **AI Integration:** Google Gemini, Cerebras, OpenRouter
- **Hosting Compatibility:** Vercel, Render, Railway, DigitalOcean

---

## 💰 Monetization Pathways

The heavy lifting is done. As the new owner, you can monetize this asset by:
1. **Premium Subscriptions:** Put the "Daily Intelligence Briefing" and "PDF Report Exports" behind a $5/month Stripe subscription.
2. **Newsletter Sponsorships:** Use the built-in email capture to grow a newsletter and sell sponsorships (geopolitical newsletters have very high CPMs).
3. **B2B API Access:** The data the AI produces is highly structured JSON. You can sell API access to financial traders or risk-assessment firms.

---

## 📦 What You Are Buying
- Full transfer of the codebase (frontend & backend)
- All prompt engineering frameworks and AI extraction logic
- The MongoDB caching implementation and newsletter architecture
- Complete IP rights to the design and assets

## ⚙️ Quick Start for the Buyer
1. Clone the repository.
2. `npm install`
3. Add your `MONGO_URI` and `GEMINI_API_KEY` to `.env`
4. `npm run update` (to generate initial data)
5. `npm start` (Runs on http://localhost:3000)
