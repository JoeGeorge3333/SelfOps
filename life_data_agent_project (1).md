# Life Data Agent Platform — Project Document

> **Status:** Idea Phase | **Last Updated:** March 2026
> **Author:** Personal Reference

---

## 1. Project Overview

A personal life data aggregation platform powered by AI agents. The goal is to bring together data from every corner of a user's daily life — health, fitness, nutrition, digital habits, and location — into a single secure, intelligent system that not only stores and organizes data, but actively analyzes it, surfaces insights, and makes personalized suggestions.

The platform will be available as a **web application** and an **iOS mobile application**, sharing the same backend and data layer. A desktop application is planned for a future phase.

---

### Use Cases

**Health & Fitness Tracking**
Log workouts, nutrition, cardio, and body metrics daily. Agents analyze patterns over time — correlating sleep quality with training performance, identifying macro trends, and surfacing actionable suggestions like "your lifts are consistently weaker on days following under 7 hours of sleep."

**Personal Knowledge & Learning**
A built-in Zettelkasten note system with linked atomic notes stored in Supabase. After writing or importing a note, an agent automatically generates spaced repetition flashcards and active recall quiz questions from the content. A knowledge graph visualizes connections between notes. An MCP bridge connects to external tools like Obsidian or Notion so existing notes aren't siloed. Combined with daily learning logs, the system tracks not just what you studied but how well you're retaining it — and can eventually correlate retention rates with health metrics like sleep and exercise.

**Cross-Domain Correlation**
The most powerful use case emerges when data categories are combined. Examples: productivity vs. sleep quality, workout performance vs. nutrition, knowledge retention vs. step count. The agent layer is designed to surface these connections automatically over time as data accumulates.

---

## 2. Core Goals

- **Centralized personal data** — one place for all life tracking data
- **AI agent-driven analysis** — agents that autonomously analyze, summarize, and suggest
- **Actionable insights** — personalized suggestions based on patterns in the data
- **Visual dashboards** — clear, interactive data visualizations including a knowledge graph
- **Security-first design** — sensitive personal data is encrypted and never shared without consent
- **Cross-platform availability** — web and iOS (desktop post-MVP)
- **Personal knowledge system** — Zettelkasten + active recall + spaced repetition as a first-class feature

---

## 3. Data Sources

### MVP Data Categories
| Category | Examples |
|---|---|
| Nutrition | Food items, calories, protein, carbs, fat, confidence rating (1-3) |
| Fitness | Weightlifting sessions, sets, reps, weight, workout type |
| Cardio | Steps (auto via Expo sensor), mileage, pace |
| Body Metrics | Daily weight, water intake |
| Productivity | Topics studied, tools used, daily learning log |
| Knowledge Base | Zettelkasten notes, flashcards, quiz results (schema laid in MVP, full UI post-MVP) |

### Post-MVP Data Categories
| Category | Notes |
|---|---|
| Location / GPS | Most sensitive data category — requires dedicated privacy design and explicit schema decisions before implementation. Excluded from MVP entirely |
| Screen time | Device usage and app tracking |
| Sleep | Duration, quality scores |
| Third-party integrations | Apple Health, Strava, Google Fit, MyFitnessPal |
| Hardware / sensors | Custom devices — communication protocol (BLE, Wi-Fi, USB) must be defined before ingestion layer work begins |

### Data Entry Methods (MVP)
- **Manual entry forms** — structured per-category log screens with dropdowns and number inputs for speed and reliability
- **Natural language quick-add** — type freely (e.g. "two built bars and a turkey sandwich"), agent parses into structured form fields, user confirms before saving. The confirmation step protects data quality and creates an implicit feedback loop for agent improvement over time
- **Expo step sensor** — automatic step count collection via phone hardware
- **CSV import** — for migrating existing spreadsheet data into the platform on day one

---

## 4. AI Agent Architecture

Agents are the core of the platform. Each agent has a defined responsibility. All agents are powered by **Ollama running locally** (see Tech Stack), triggered automatically after data is logged using a debounce pattern.

### Debounce Trigger Pattern
Agents do not fire on every individual log entry. A timer starts when data is logged and resets if more data arrives within 60 seconds. The agent pipeline runs once the user stops logging. This prevents redundant processing during bulk entry sessions and keeps the experience snappy.

### Agent Output Format
Every agent produces two outputs:
- A **human-readable text summary** displayed in the dashboard
- **Structured JSON** formatted for chart and visualization rendering

Both are saved to a dedicated `agent_results` table in Supabase with fields for result type, JSON payload, text summary, and timestamp.

### 4.1 Data Ingestion Agent
- Accepts raw data from manual forms, natural language input, CSV imports, and the Expo step sensor
- Normalizes and validates data before storage
- Parses natural language entries into structured fields for user confirmation
- Routes data to the appropriate database tables
- Handles deduplication and conflict resolution

### 4.2 Analysis Agent
- Runs after the debounce trigger fires
- Identifies trends, correlations, and anomalies across all data categories
- Examples: "your protein intake has dropped 20% this week", "step count correlates with better mood scores on the same day"
- Stores timestamped analysis results for historical reference

### 4.3 Suggestion Agent
- Consumes analysis outputs and generates human-readable, actionable suggestions
- Personalizes recommendations over time based on user feedback (helpful / not helpful ratings)
- Prioritizes specific, data-backed advice over generic tips

### 4.4 Visualization Agent
- Prepares data summaries and aggregates for dashboard rendering
- Generates chart-ready JSON for all dashboard views
- Supports natural language queries (e.g. "show me my step count vs. calories last month")

### 4.5 Knowledge Agent *(Post-MVP — schema laid in MVP)*
- Generates spaced repetition flashcards from Zettelkasten note content
- Creates active recall quiz questions per note
- Tracks review intervals using a spaced repetition algorithm (SM-2 or similar)
- Surfaces cards and quizzes at optimal review times
- Correlates knowledge retention scores with health and productivity data over time

---

## 5. Tech Stack

### Frontend
| Platform | Technology | Notes |
|---|---|---|
| Web Application | React | Primary MVP platform |
| iOS Application | Expo (React Native) | MVP — rapid cross-platform development |
| Desktop Application | TBD | Post-MVP. Evaluate Expo desktop vs. Electron at that time |

> ⚠️ **Expo Note:** Expo is the right call for MVP speed. However it has known limitations for deep native device access — specifically Bluetooth, background processes, and advanced HealthKit integration. If hardware sensor integration becomes a priority feature, evaluate ejecting to bare React Native or writing native modules at that point.

### Backend
| Component | Technology | Notes |
|---|---|---|
| API Server | Python / FastAPI | Chosen for AI and data science ecosystem compatibility |
| Task Queue | Celery | Handles async agent jobs — API returns immediately, agents run in background |
| Message Broker | Redis | Powers the Celery task queue |
| Database | Supabase (Postgres) | RLS, auth, realtime, and storage in one platform |
| AI / Agent Layer | Ollama (local) | Llama 3.2 3B as starting model — step up to Mistral 7B if hardware allows |

### Ollama Model Strategy
- **Start with:** Llama 3.2 3B (~2GB RAM) — fast, low overhead, solid structured JSON output
- **Step up to:** Mistral 7B (~4-5GB RAM) — better reasoning quality for trend analysis
- **Future consideration:** Hybrid approach using Claude API for user-facing real-time interactions where response quality and speed matter most, Ollama retained for background batch analysis

> ⚠️ **Ollama Note:** Ollama runs locally on the host machine. Agents only run when the host machine is on and Ollama is running. The iOS app calls the FastAPI backend which calls Ollama — the phone cannot call Ollama directly. This is acceptable for MVP. Revisit with a hybrid cloud inference approach if always-on agent processing becomes a requirement.

> ⚠️ **Structured Output Note:** Smaller local models can drift from requested JSON schemas. Implement robust parsing and fallback handling in the agent layer from day one — do not assume model output will always be well-formed.

### Agent Flow
```
iOS / Web App
     ↓
FastAPI
(receives log entry → drops task into Celery queue → returns 200 immediately)
     ↓
Redis + Celery
(async task queue with 60s debounce)
     ↓
Ollama
(local inference — analysis, suggestions, chart-ready JSON + text summary)
     ↓
Supabase
(results saved to agent_results table)
     ↓
Dashboard
(updates via Supabase Realtime)
```

### Infrastructure
- Cloud database: Supabase (Postgres + Auth + Storage + Realtime)
- Local inference: Ollama
- CI/CD: GitHub Actions

---

## 6. Security & Privacy

Security is a first-class concern given the sensitivity of personal health and behavioral data. The following are non-negotiable from day one.

- All data encrypted at rest and in transit (TLS)
- Supabase Row Level Security (RLS) policies written for **every table before any API endpoint is built** — never retrofitted
- User authentication required for all data access (Supabase Auth + JWT)
- No data shared with third parties without explicit user consent
- Location/GPS data explicitly excluded from MVP — requires dedicated privacy design before any implementation
- Full data export available at all times — the user always owns their data
- Regular security review as new features are added

---

## 7. Knowledge System — Zettelkasten + Active Recall + MCP

This is a post-MVP feature but the **database schema will be designed to support it from day one** to avoid painful migrations later. The note table structure, linking schema, and card metadata fields will be defined in Phase 1 even if the full UI ships in Phase 4.

This is one of the most distinctive and powerful parts of the platform — not just a note app, but a living knowledge system that the agent layer can actively work with.

### Built-in Zettelkasten
- Atomic notes stored in Supabase with bidirectional links between notes
- Notes linked to daily log entries (e.g. a note about a topic studied on a given day)
- Tags and metadata for organization and search
- Knowledge graph visualization in the dashboard showing connections between notes

### Active Recall System
- Agent automatically generates spaced repetition flashcards from note content
- Agent generates active recall quiz questions per note
- Spaced repetition scheduler surfaces cards at optimal review intervals (SM-2 algorithm)
- Quiz and review results tracked over time as a first-class data category

### MCP Bridge *(Significant standalone project — scoped as its own effort in Phase 4)*
- A custom-built MCP server connecting the platform to external tools (Obsidian, Notion)
- Allows Claude and other LLMs to read and write the knowledge base directly via MCP
- Enables two-way sync so notes created externally appear in the platform and vice versa
- Treats the personal knowledge base as a tool-accessible context layer — not just a storage format

### Cross-Domain Insight Potential
Once health and knowledge data coexist in the same platform, the analysis agent can surface correlations like:
- "Flashcard retention is 23% higher on days with 7+ hours of sleep"
- "You study most effectively on days following a workout"
- "Knowledge retention drops when daily calories fall below 1800"
- "Your most productive learning days consistently follow low screen time the night before"

---

## 8. MVP Scope

### In MVP
- Nutrition logging (manual forms + natural language quick-add with confirmation)
- Workout / weightlifting session logging
- Cardio logging (manual entry + automatic Expo step sensor)
- Body metrics logging (weight, water intake)
- Productivity / learning log
- Zettelkasten note schema (database ready, basic note creation UI)
- AI agents: analysis, suggestions, dashboard summary (Ollama via FastAPI + Celery + Redis)
- Dashboard with per-category visualizations and agent-generated summaries
- Web (React) + iOS (Expo)
- Supabase backend with RLS policies defined before any endpoints are built

### Post-MVP
- Full Zettelkasten UI (linking, tagging, graph view)
- Active recall / spaced repetition full implementation
- MCP server for Obsidian / Notion bridge
- Location / GPS data tracking (with dedicated privacy design)
- Desktop application
- Third-party integrations (Apple Health, Strava, Google Fit)
- Screen time tracking
- Hardware / sensor integrations
- Hybrid Claude API for user-facing real-time agent interactions
- Always-on cloud inference (if Ollama local limitation becomes a constraint)

---

## 9. Screen Structure (MVP)

| Screen | Description |
|---|---|
| Dashboard | Overview cards, trend charts, agent summary, step count, knowledge graph preview |
| Nutrition Log | Manual entry form + natural language quick-add field with confirmation |
| Workout Log | Exercise, sets, reps, weight, workout type entry |
| Cardio Log | Auto step count display, manual miles and pace entry |
| Body Metrics Log | Daily weight and water intake |
| Productivity Log | Topics studied, tools used, notes |
| Notes | Basic note creation (Zettelkasten foundation — full UI in Phase 4) |

---

## 10. Development Phases

### Phase 1 — Foundation
- [ ] Define full database schema (all MVP tables + notes/cards tables for future-proofing)
- [ ] Write RLS policies for all tables before writing any API endpoints
- [ ] Set up Supabase project (auth, database, storage, realtime)
- [ ] Set up FastAPI backend + Celery + Redis
- [ ] Set up Ollama locally with Llama 3.2 3B
- [ ] Build authentication (sign up / sign in)
- [ ] Build data ingestion for all MVP categories
- [ ] CSV import for existing spreadsheet data migration
- [ ] Simple web dashboard (read-only data display)

### Phase 2 — Agent Layer
- [ ] Build Analysis Agent with debounce trigger via Celery
- [ ] Build Suggestion Agent with helpful / not helpful feedback loop
- [ ] Build Visualization Agent (chart-ready JSON output)
- [ ] Surface agent results on dashboard via Supabase Realtime
- [ ] Natural language quick-add with agent parsing and confirmation step
- [ ] Robust JSON output parsing and fallback handling for Ollama responses

### Phase 3 — iOS
- [ ] Build iOS app with Expo
- [ ] Expo step sensor integration
- [ ] Push notifications on iOS for agent suggestions
- [ ] Sync and test across web and iOS

### Phase 4 — Knowledge System + MCP
- [ ] Full Zettelkasten UI (linking, tagging, graph visualization)
- [ ] Knowledge Agent — flashcard and quiz generation from notes
- [ ] Spaced repetition scheduler (SM-2 algorithm)
- [ ] MCP server build (Obsidian / Notion bridge) — scoped as standalone project
- [ ] Cross-domain correlation insights (health + knowledge data)

### Phase 5 — Integrations, Hardware & Polish
- [ ] Apple Health / Strava API integrations
- [ ] Hardware / sensor integration (define communication protocol first)
- [ ] Desktop application (evaluate Expo desktop vs. Electron)
- [ ] Location / GPS data (dedicated privacy design required before starting)
- [ ] Hybrid Claude API for user-facing real-time interactions
- [ ] Security audit
- [ ] Performance optimization and UI polish

---

## 11. Open Questions & Notes

- **Ollama on iOS:** iOS app cannot call Ollama directly — must route through FastAPI backend. Agents only run when host machine is on. Acceptable for MVP, revisit for Phase 5
- **Expo native limits:** Expo is right for MVP but may hit walls with deep Bluetooth, HealthKit, or hardware access. Evaluate ejecting to bare React Native if hardware becomes a priority
- **Desktop app:** Deferred to Phase 5. Evaluate Expo desktop vs. Electron at that time
- **Hybrid LLM:** Claude API for user-facing real-time interactions is a strong future option — faster and more reliable structured output than local models. Defer to post-MVP
- **Vector DB:** pgvector (built into Supabase/Postgres) is sufficient for semantic search over notes and logs. Revisit dedicated vector DB only if performance demands it
- **MCP server:** Custom MCP build is a significant standalone project — treat as its own scoped effort in Phase 4, not a casual add-on
- **Hardware integrations:** Completely open-ended. Communication protocol (Bluetooth, Wi-Fi, USB) must be defined before any ingestion layer work. Deferred to Phase 5
- **Ollama JSON reliability:** Smaller models can produce malformed JSON. Build a validation and retry layer in the agent pipeline from day one

---

## 12. Success Metrics

- All MVP data categories ingested and queryable
- Agent suggestions rated as helpful >70% of the time
- Dashboard loads in under 2 seconds
- Natural language quick-add parses correctly >80% of the time
- Zero unauthorized data access incidents
- RLS policies verified before first data write
- Knowledge retention scores trackable and correlatable with health data (post-MVP)
- Seamless, consistent experience across web and iOS

---

*This document is a living reference and will be updated as the project evolves.*
