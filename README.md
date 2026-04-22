# SymptomThread

**A dual-database symptom tracking and correlation engine**
Course Project · NoSQL Databases · Sujan

---

## Problem Statement

Patients with chronic or recurring conditions — migraines, IBS, autoimmune disorders — see an average of 3–4 different doctors over the course of their diagnosis. Each appointment is 12 minutes. Each doctor sees only a fragment of the patient's history. The patient, who experiences all of it, has no structured way to track, correlate, or communicate their symptoms longitudinally.

Existing tools either log biometrics (Apple Health), answer *"what do I have right now"* (symptom checkers), or record what doctors enter (patient portals). None of them give the patient a structured, queryable record of their own symptom history over time — and none of them surface the **relationships** between symptoms and triggers automatically.

SymptomThread addresses this gap.

---

## What Was Built

A single-user web application where a patient logs symptoms as they occur. Each log captures the symptom name, severity (1–10), optional triggers, and a timestamp. The system stores these logs and simultaneously builds a graph of relationships — which symptoms co-occur, which triggers are associated with which symptoms, and how frequently.

The application has four screens:

| Screen | Purpose | Data Source |
|---|---|---|
| **Home Dashboard** | At-a-glance summary — recent patterns, weekly activity snapshot, top triggers | MongoDB (aggregated client-side) |
| **Log** | Record a symptom in under 30 seconds — select symptom, set severity, tag triggers, add notes | Writes to MongoDB → syncs to ArangoDB |
| **Timeline** | Chronological feed of all logged symptoms with severity color-coding and trigger tags | MongoDB (`find().sort()`) |
| **Insights Graph** | Interactive network visualization — symptoms as nodes, triggers as nodes, edges weighted by co-occurrence. Click any symptom to run a live AQL graph traversal. | ArangoDB (nodes, edges, traversal) |

---

## Database Architecture

The project deliberately uses two NoSQL databases, each chosen for the shape of problem it was designed to solve. This is the central technical argument of the project.

### MongoDB — The Ingestion Layer

Every symptom log is stored as a Mongoose document in MongoDB Atlas:

```javascript
// backend/models/SymptomLog.js
{
  userId:        String,        // "demo_user" (hardcoded for MVP)
  symptomName:   String,        // e.g. "Headache"
  severity:      Number,        // 1–10
  triggers:      [String],      // e.g. ["Poor Sleep", "Stress"]
  notes:         String,        // free-text, optional
  loggedAt:      Date,          // auto-timestamps
  syncedToGraph: Boolean        // tracks whether ArangoDB sync succeeded
}
```

**Why MongoDB:**
- Symptom logs have variable optional fields (some have triggers, some have notes, some have neither) — a rigid relational schema would require nullable columns or separate tables for every optional attribute
- Writes are high-frequency and need to be fast — document writes are append-only with no join overhead
- The `syncedToGraph` flag provides a built-in reconciliation mechanism — if ArangoDB sync fails, the log is still persisted and can be retried

### ArangoDB — The Intelligence Layer

ArangoDB is a multi-model database supporting documents, graphs, and key-value in a single engine with one query language (AQL). It is run locally via Docker and stores the relationship graph:

**Document Collections:**
| Collection | Purpose | Example Key |
|---|---|---|
| `symptoms` | One node per unique symptom per user | `demo_user_headache` |
| `triggers` | One node per unique trigger per user | `demo_user_poor-sleep` |

**Edge Collections:**
| Collection | Direction | Weight Property | Purpose |
|---|---|---|---|
| `triggered_by` | Symptom → Trigger | `occurrences` | Records how many times a trigger was tagged on a symptom |
| `co_occurs_with` | Symptom ↔ Symptom | `occurrences` | Records how many times two symptoms appeared within a 48-hour window |

**Why ArangoDB:**
- Health relationship data is fundamentally **graph-shaped** — a symptom doesn't just exist, it *co-occurs with* other symptoms and is *triggered by* external factors
- Edges carry properties: `occurrences` count, enabling a **temporal, weighted graph** — not a flat join table
- The core correlation query — *"find all symptoms that co-occurred with Headache, sorted by frequency"* — is 6 lines of AQL:

```aql
FOR v, e IN 1..1 ANY @symId co_occurs_with
  FILTER e.userId == @userId
  SORT e.occurrences DESC
  LIMIT 5
  RETURN { symptom: v.name, occurrences: e.occurrences }
```

The equivalent in SQL requires a self-join on a log table, a GROUP BY, a HAVING clause, and a correlated subquery.

---

## The Dual-Database Sync Pipeline

When a user logs a symptom, both databases are updated in a single request:

```
POST /api/log-symptom
         │
         ▼
  ┌──────────────┐
  │   MongoDB     │  ← 1. Save raw document (syncedToGraph: false)
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  syncToArango │  ← 2. Upsert symptom node (increment totalCount)
  │               │     3. Upsert trigger nodes + triggered_by edges
  │               │     4. Query MongoDB for logs in last 48 hours
  │               │     5. Upsert co_occurs_with edges for every
  │               │        distinct symptom found in that window
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   MongoDB     │  ← 6. Update syncedToGraph: true
  └──────────────┘
```

**Key implementation details:**

- **Co-occurrence window:** 48 hours. If you log *Headache* now and you logged *Fatigue* 36 hours ago, a `co_occurs_with` edge is created (or its `occurrences` count is incremented).
- **Undirected co-occurrence edges:** Keys are alphabetically sorted (`demo_user_fatigue_headache`, not `demo_user_headache_fatigue`) so that A→B and B→A resolve to the same edge.
- **Graceful degradation:** If ArangoDB sync fails, the log is still saved to MongoDB. The response includes a warning, and `syncedToGraph` remains `false`.
- **Inline sync (not queued):** Graph synchronization happens synchronously within the POST handler — a deliberate MVP tradeoff for simplicity, traceability, and correctness over throughput.

---

## Project Structure

```
NoSQL project/
├── docker-compose.yml           # ArangoDB container (port 8529)
├── README.md
│
├── backend/
│   ├── server.js                # Express app entry — connects both DBs, mounts routes
│   ├── .env                     # PORT, MONGODB_URI, ARANGODB_* credentials
│   ├── package.json             # express, mongoose, arangojs, cors, morgan, nodemon
│   ├── seed.js                  # Standalone script — calls POST /api/seed via axios
│   │
│   ├── db/
│   │   ├── mongo.js             # mongoose.connect() wrapper
│   │   └── arango.js            # arangojs Database init, auto-creates DB + collections
│   │
│   ├── models/
│   │   └── SymptomLog.js        # Mongoose schema — the MongoDB document shape
│   │
│   └── routes/
│       └── api.js               # All REST endpoints + syncToArango() logic
│
└── frontend/
    ├── index.html               # Loads Manrope font + Material Symbols
    ├── vite.config.js           # Vite + React plugin
    ├── tailwind.config.js       # Full design token system (Material 3–inspired)
    ├── postcss.config.js        # Tailwind + Autoprefixer
    │
    └── src/
        ├── main.jsx             # React 19 entry point
        ├── App.jsx              # React Router — 4 routes under a shared Layout
        ├── index.css            # Tailwind base + custom slider & timeline styles
        ├── App.css              # Legacy Vite scaffold styles (unused)
        │
        ├── pages/
        │   └── HomeDashboard.jsx   # Dashboard — pattern detection, weekly chart, triggers
        │
        └── components/
            ├── Layout.jsx          # App shell — top nav (desktop) + bottom nav (mobile)
            ├── SymptomForm.jsx     # Log screen — dropdown, severity slider, trigger chips
            ├── Timeline.jsx        # Chronological feed with severity badges
            └── GraphView.jsx       # vis-network canvas + detail panel + seed button
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/log-symptom` | Save a symptom log to MongoDB, sync graph to ArangoDB |
| `GET` | `/api/timeline` | Retrieve last 50 logs for the user, sorted newest-first |
| `GET` | `/api/graph-data` | Return all symptom nodes, trigger nodes, and both edge sets from ArangoDB |
| `GET` | `/api/correlations/:symptom` | Run AQL graph traversal — top 5 co-occurring symptoms + associated triggers |
| `POST` | `/api/seed` | Clear both databases, insert 70 synthetic logs with forced correlation patterns |

---

## ArangoDB Auto-Setup

On server startup, `backend/db/arango.js` automatically:

1. Connects to the ArangoDB instance
2. Creates the `symptomthread` database if it doesn't exist
3. Creates four collections if they don't exist:
   - `symptoms` (document collection)
   - `triggers` (document collection)
   - `triggered_by` (edge collection, type 3)
   - `co_occurs_with` (edge collection, type 3)

No manual ArangoDB configuration is required.

---

## Seed Data

The `POST /api/seed` endpoint generates 70 synthetic symptom logs spread over 30 days with **guaranteed correlation patterns** for demonstration:

| Pattern | Symptom | Triggers | Count | Purpose |
|---|---|---|---|---|
| Primary cluster | Headache | Poor Sleep, Stress | 15 | Dominant node in graph |
| Co-occurrence partner | Fatigue | Poor Sleep | 15 | Forces strong Headache ↔ Fatigue edge |
| Secondary cluster | Nausea | Dairy | 2 | Smaller, distinct cluster |
| Secondary cluster | Bloating | Dairy | 2 | Shares trigger node with Nausea |
| Random distribution | Various | Random 0–2 triggers | 36 | Fills the graph with realistic noise |

Logs are sorted chronologically before processing so that the 48-hour co-occurrence window produces meaningful edges. Each log is individually saved to MongoDB and synced to ArangoDB, replicating the exact production write path.

---

## Tech Stack

| Layer | Technology | Version | Role |
|---|---|---|---|
| Runtime | Node.js | — | Server-side JavaScript |
| Backend Framework | Express | 5.2 | REST API routing, middleware |
| Document Database | MongoDB Atlas (Mongoose 9) | — | Symptom log persistence, aggregation |
| Graph Database | ArangoDB (arangojs 10) | Docker `latest` | Graph storage, AQL traversal |
| Frontend Framework | React | 19.2 | Component-based UI |
| Build Tool | Vite | 8.0 | Dev server, HMR, bundling |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS with custom design tokens |
| Graph Visualization | vis-network | 10.0 | Interactive force-directed graph rendering |
| HTTP Client | Axios | 1.15 | API requests (frontend & seed script) |
| Typography | Manrope (Google Fonts) | — | Primary typeface across all screens |
| Icons | Material Symbols Outlined | — | System iconography |

---

## Frontend Design System

The frontend uses a **Material Design 3–inspired token system** defined in `tailwind.config.js`:

- **30+ semantic color tokens** — `primary`, `on-primary`, `surface-container-low`, `outline-variant`, `severity-high`, etc.
- **Custom typography scale** — `display-lg` (32px/700), `headline-md` (24px/600), `title-sm` (18px/600), `body-base` (16px/400), `body-sm` (14px/400), `label-caps` (12px/700)
- **Spacing tokens** — `container-margin` (24px), `section-gap` (48px), `stack-sm/md/lg` (8/16/32px)
- **Severity system** — Three-tier color coding (`low` / `medium` / `high`) with paired foreground colors

The graph visualization uses `forceAtlas2Based` physics with custom parameters for readable node distribution:
- Symptoms: indigo circles (`#4648d4`), sized by `totalCount`
- Triggers: amber squares (`#904900`), fixed size
- Co-occurrence edges: dashed lines with weight-based thickness
- Triggered-by edges: solid lines with weight-based thickness

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **No authentication** | Hardcoded `demo_user`. All ArangoDB keys are namespaced as `demo_user_<symptomName>` — the architecture supports real auth as a straightforward extension. |
| **Inline graph sync** | Simpler to demonstrate, easier to trace during a walkthrough, and correct in behavior even if not production-optimal. |
| **48-hour co-occurrence window** | Medical heuristic — symptoms appearing within 2 days of each other are potentially related. Short enough to be meaningful, long enough to catch delayed reactions. |
| **Alphabetically sorted edge keys** | Ensures undirected co-occurrence: `(Fatigue, Headache)` and `(Headache, Fatigue)` resolve to the same edge document `demo_user_fatigue_headache`. |
| **`syncedToGraph` flag** | Provides an audit trail and retry mechanism — query `SymptomLog.find({ syncedToGraph: false })` to find un-synced records. |
| **Seed via API endpoint** | The `/api/seed` route reuses the exact same `syncToArango()` function as production writes, ensuring the seeded graph is structurally identical to organically-built data. |

---

## The Core Argument

> **MongoDB answers:** *"What happened, and when?"*
> **ArangoDB answers:** *"What is connected to what, and how strongly?"*

These are structurally different questions. Answering both from a single relational database would require either a complex self-join schema that degrades at scale, or denormalized data that loses integrity. Using each database for the shape of problem it was designed for is not over-engineering — it is the correct architecture for this data.

That is the claim this project makes. The working application is the evidence.

---

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Docker** (for ArangoDB)
- **MongoDB Atlas** account (or a local MongoDB instance)

### Step 1 — Start ArangoDB

From the project root:

```bash
docker-compose up -d
```

This starts ArangoDB on port `8529` with root password `password`. The backend will auto-create the `symptomthread` database and all required collections on first connection.

### Step 2 — Configure Environment

Create or verify `backend/.env`:

```env
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
ARANGODB_URI=http://localhost:8529
ARANGODB_DATABASE=symptomthread
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=password
```

### Step 3 — Start the Backend

```bash
cd backend
npm install
npm run dev
```

Wait for all three confirmation messages:
```
MongoDB Connected: <cluster-host>
ArangoDB Connected to database: symptomthread
Server is running on port 5000
```

### Step 4 — Seed Demo Data (Recommended)

```bash
cd backend
node seed.js
```

This clears both databases and inserts 70 synthetic logs with pre-built correlation patterns. Alternatively, use the **"Seed Demo Data"** button on the Insights Graph screen.

### Step 5 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How to Use

1. **Dashboard** — View your weekly snapshot, top pattern, and most common triggers at a glance.
2. **Log a Symptom** — Select a symptom, adjust severity, tag triggers (or add custom ones), and save. The log is written to MongoDB and the graph updates in ArangoDB instantly.
3. **Timeline** — Scroll through your symptom history. Cards are color-coded by severity (green = mild, yellow = medium, red = high).
4. **Insights Graph** — Explore the correlation network. Click any **symptom node** to run a live AQL traversal and see its top co-occurring symptoms and associated triggers in the detail panel.

---

## License

This project was built as an academic course project for NoSQL Databases.
