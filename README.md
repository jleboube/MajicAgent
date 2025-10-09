# ✨ MajicAgent

## 🚀 Real Estate Assistant Platform

MajicAgent is the command center for real estate professionals—an agent-first platform that removes friction from lead intake all the way through transaction close. It is built on four core modules that share a single agent graph (leads, listings, tasks, cadences, artifacts) and a unified AI/automation layer.

### Current Features

- **Majic Photo Studio**
  - Embedded staging studio with AI-powered enhancements.
  - One-click “Open in new tab” and direct embed for live editing.
  - Asset vault uses Akamai object storage with user-level isolation.

- **Listing Command Center**
  - Create/import listings with guided forms.
  - “Next Best Actions” card surfaces outstanding tasks (pricing, marketing, seller comms).
  - AI-generated MLS description, social caption, email subject/body.
  - Quick actions: copy to clipboard, spin up a Messenger cadence, or trigger n8n workflows.

- **Majic Messenger**
  - Cadence builder for email/SMS/voice touchpoints.
  - Auto-seeded “New Lead Drip” and “Listing Updates” cadences whenever a lead/listing is created.
  - Active/inactive toggles and metrics (sent/open/responded counts).

- **Market Insights**
  - Lead-stage distribution with momentum callouts.
  - Listing rollups with total value, status counts, and seller reporting prompts.
  - Live task/interaction feed for quick follow-up.

- **Secure Artifact Vault**
  - Upload/download artifacts with presigned URLs.
  - Uploaded documents/photos are tagged to the owner and stored in Akamai buckets.
  - Storage health badge confirms object storage reachability.

- **Authentication & Permissions**
  - Google OAuth-only onboarding.
  - Roles: solo_agent (today) with expansion path to team_admin and broker_admin.

- **AI & Automation Indicators**
  - Dashboard badges confirm OpenAI/Claude readiness and n8n connectivity.
  - Buyer intake and listing guidance prompts exposed via `/api/ai/buyer-intake` and `/api/ai/listing-guide` for future UI hooks.

- **n8n Workflow Hooks**
  - `n8nService` triggers `lead_created` and `listing_created` events if `N8N_*` env vars are provided.
  - Ready-to-import workflow templates in `n8n/`:
    - `listing_automation.workflow.json`: Listing webhook → normalize → AI copy → sheets archive → MLS/web → social → Slack.
    - `buyer_intake.workflow.json`: Buyer webhook → AI summary → CRM lead → archive → Slack → calendar hold.

### Roadmap / Future Enhancements

- **Majic Photo Studio**
  - Brokerage-level preset designer.
  - MLS media slot syncing and automated virtual tours.

- **Listing Command Center**
  - Contract/disclosure template library.
  - MLS/API syndication dashboards.
  - Seller portal with activity feed and offer tracking.

- **Majic Messenger**
  - Conversational AI for buyer/seller updates.
  - A/B testing and deliverability analytics.
  - Direct send scheduling / outbox overview.

- **Market Insights**
  - Predictive listing likelihood scores using lead + market data.
  - Portfolio performance benchmarking (DOM, price trends, marketing ROI).
  - Heatmaps for lead sources and referral networks.

- **Lead Intake Journeys**
  - Buyer and seller intake wizards in-app (leveraging existing AI prompts).
  - Calendar + call assistant integrations for instant follow-up bookings.

- **n8n / External Automations**
  - Packaged nodes for MLS, CRM, and marketing services.
  - Bi-directional sync for showing feedback, offer updates, and post-close checklists.

- **Team & Brokerage Ops**
  - Role-based dashboards with productivity metrics.
  - White-label portal for brokerage branding.
  - Commission plan tracking and transaction compliance workflows.

### Local Development

```bash
cp env.example .env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Backend runs on `http://localhost:4004` and uses MongoDB plus MinIO (S3 compatible) for local artifact storage.
- Frontend runs on `http://localhost:5173` (Vite dev server) and targets the backend API. Update `frontend/.env` to point at production hosts when ready.
- Provide valid credentials for Google OAuth, OpenAI, Anthropic, and Akamai Object Storage in `.env` to unlock AI copy generation and secure storage flows.

> Legacy static assets now live in `frontend-legacy/`. Set `SERVE_LEGACY_FRONTEND=true` in `.env` if you need the previous experience served directly from the backend container.

> Save time, cut costs, and reduce stress with professional, AI-powered Real Estate photography.
> We transform simple Real Estate images into captivating, ready-to-use photos without the hassle of a traditional photoshoot.
> Sign up today to receive 10 free AI photo enhancements.  https://majicagent.com/

[![GitHub stars](https://img.shields.io/github/stars/jleboube/Majic-Photo?style=social)](https://github.com/jleboube/Majic-Photo/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jleboube/Majic-Photo?style=social)](https://github.com/jleboube/Majic-Photo/network/members)
[![GitHub issues](https://img.shields.io/github/issues/jleboube/Majic-Photo)](https://github.com/jleboube/Majic-Photo/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/jleboube/Majic-Photo)](https://github.com/jleboube/Majic-Photo/pulls)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)
<!-- [![License](https://img.shields.io/github/license/jleboube/call-bio)](LICENSE) -->

---

## 🚩 The Problem with Real Estate Photography

- ⏱ **Time Wasting**
  Traditional photoshoots require extensive planning, logistics, location scouting, and post-production, leading to long delays.

- 💰 **High Cost**
  Real Estate staging services can cost anywhere from $1,500 - $5,000.  Reduce these significant expenses for staging, making professional Real Estate photography inaccessible for many.

- ⚙️ **Complex Process**
  Hiring photographers and editing images requires specialized skills and coordination, adding complexity and stress to your workflow.

---

## 💡 Our Solution

- ⚡ **AI-Powered Photo Generation**
  Instantly create stunning visuals by transforming your existing product photos with generative AI.

- 🎨 **Full Customization**
  Provide your photo, and our AI will generate images that match your desired aesthetic, lighting, and scene.

- 🚀 **Lightning Fast Turnaround**
  Achieve your ideal photoshoot faster than ever, with final images delivered in a fraction of the time of a traditional production.

- 🌐 **Seamless & Simple**
  Just upload your product photo. We handle every step to deliver a polished, custom final image. We even allow you to reprocess the image if you don't like it.

---

## ⚙️ How It Works

1.  **Provide Product Photo**
    Upload a Real Estate image of your home or room in your home.

2.  **Submit Your Brief**
    Specify the site address and room image is assigned to.

3.  **Receive Your Enhanced Image**
    Our AI-powered creative service generates a professional, ready-to-use photo that meets your needs.  We even allow you to reprocess the image if you don't like it.

---

## 🎯 Benefits

- ⏳ **Save Time and Budget**
  Cut costs by up to 90% and save up to 10x the time compared to physical photoshoots.

- 🧠 **Boost Creative Potential**
  Push the boundaries of creativity with AI, placing your product in realistic or surreal scenes previously limited by budget or imagination.

- 🤝 **Simple Workflow**
  Eliminate the need for physical productions, post-editing, or technical skills.

- 🔌 **Professional Quality**
  Every image is ensured to meet the highest standards of quality with our team of B2B-B2C-driven design experts.

- 💼 **Google Authentication**
  Latest update includes ability to use Google OAuth to register and login to Majic-Photo.

---

## 🚀 Ready to Transform Your Real Estate Photos?

Join thousands of Realtors that have already streamlined their product photography with our professional AI service.

---

## 📚 Resources

- Features
- API Documentation
- Integrations

## 🏢 Company

- About
- Contact
- Support / Help Center

## 📜 Legal

- Privacy Policy
- Terms of Service
- Status

---
