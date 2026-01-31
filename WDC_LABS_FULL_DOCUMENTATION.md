# WDC Labs Project Documentation

*Generated: 2026-01-29*

This document tracks the complete technical documentation for the WDC Labs Virtual Internship Platform.

**Table of Contents**
1. [Project Overview (README)](#wdc-labs---virtual-internship-platform)
2. [Technical Requirements](#technical-requirements--system-explanation)
3. [Technical Inventory](#technical-inventory--deployment-prerequisites)
4. [Deployment Guide (AWS Lightsail)](#deployment-guide-aws-lightsail)

---
<div style="page-break-after: always;"></div>

# WDC Labs - Virtual Internship Platform

WDC Labs is an immersive virtual internship simulation designed to bridge the gap between academic learning and professional execution. Users step into a virtual office environment where they interact with AI-powered agents acting as supervisors and mentors, completing realistic tasks to build a hireable portfolio.

## 🚀 Project Overview

The platform simulates a high-pressure, professional workspace. Users are "hired" as interns and must navigate office dynamics, strict deadlines, and technical requirements.

### Key Features
- **AI-Powered Office**: Interact with 4 distinct AI personalities:
    - **Tolu (Onboarding)**: Handles administrative tasks and initial assessment.
    - **Emem (Project Manager)**: Assigns tasks, enforces deadlines, and manages workflow.
    - **Sola (Tech Lead)**: Reviews code/submissions with high standards and technical feedback.
    - **Kemi (Career Coach)**: Translates completed tasks into CV-ready bullet points and provides mock interviews.
- **Task Management**: Dynamic task generation based on track (Frontend, Backend, Design, etc.) and user level.
- **Mock Interviews**: Interactive behavioral and technical interview practice with real-time feedback.
- **Portfolio Generation**: Automated conversion of completed tasks into a professional portfolio.
- **Bounty Board**: "Gig-economy" style extra tasks for ambitious interns.
- **Gamified Progression**: Level up from "Intern" to "Associate" based on performance metrics (Speed, Quality, Communication).

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Radix UI (Shadcn), Framer Motion
- **Database/Auth**: Supabase
- **Icons**: Lucide React

### Backend (AI Service)
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **AI Model**: Google Gemini 1.5/2.0
- **Orchestration**: Custom agent orchestrator
- **Docs/Parsing**: PyPDF2, python-docx

## 📂 Project Structure

```
sandbox/
├── app/                    # Next.js App Router
│   ├── components/         # React Components (Office, UI, etc.)
│   ├── contexts/           # Global State (OfficeContext, Auth)
│   └── api/                # Next.js API Routes
├── ai_backend/             # Python AI Service
│   └── WDC-LABS-AI-2/
│       ├── app/
│       │   ├── agents/     # Agent Logic (Kemi, Sola, etc.)
│       │   ├── prompts/    # System Prompts for Agents
│       │   └── main.py     # FastAPI Entrypoint
│       └── requirements.txt
└── public/                 # Static Assets
```

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.10+
- Supabase Account
- Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    ```

2.  **Frontend Setup**
    ```bash
    cd sandbox
    npm install
    # Create .env.local with Supabase credentials
    npm run dev
    ```

3.  **Backend Setup**
    ```bash
    cd sandbox/ai_backend/WDC-LABS-AI-2
    pip install -r requirements.txt
    # Create .env with GEMINI_API_KEY
    python -m uvicorn app.main:app --reload --port 8001
    ```

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---
<div style="page-break-after: always;"></div>

# Technical Requirements & System Explanation

## 1. System Architecture

The WDC Labs platform employs a hybrid architecture separating the interactive user interface (Frontend) from the intelligence layer (AI Backend).

### 1.1 Frontend (Next.js)
- **Responsibility**: UI rendering, state management, user authentication, and direct interaction with Supabase for CRUD operations.
- **Core Components**:
    - `OfficeContext`: Centralized state management for the virtual office (tasks, chats, portfolio).
    - `TaskDashboard`: Main interface for task execution.
    - `MockInterviewModal`: Real-time interface for AI interviews.
- **Data Flow**: User actions trigger API calls to either Supabase (data persistence) or the AI Backend (intelligence/generation).

### 1.2 AI Backend (FastAPI)
- **Responsibility**: High-level reasoning, content generation, and simulated agent interactions.
- **Core Components**:
    - `Orchestrator`: Routes requests to the appropriate agent (Emem, Sola, Kemi).
    - `Agents`: Python modules encapsulating specific prompts and logic for each persona.
    - `Gemini API`: The LLM engine driving text generation.

## 2. Functional Requirements

### 2.1 User Authentication & Onboarding
- **Req-Auth-1**: Users must authenticate via Email/Password or OAuth (Supabase Auth).
- **Req-Onb-1**: New users must complete an initial "Bio Assessment" where Tolu (AI) determines their starting level (Level 0, 1, or 2).
- **Req-Onb-2**: System must generate a personalized "Tour" phase introducing the AI agents.

### 2.2 Task Execution Engine
- **Req-Task-1**: Tasks must be generated dynamically based on the user's selected track (e.g., "Frontend Dev") and current level.
- **Req-Task-2**: Each task must have a clear Brief, Deadline, and Deliverable format.
- **Req-Task-3**: Users must be able to submit text or file-based deliverables.
- **Req-Task-4**: Submissions must be reviewed by Sola (AI) for technical accuracy, providing a Pass/Fail grade and specific feedback.

### 2.3 Career Coaching (Kemi)
- **Req-Coach-1**: System must translate every approved task into a CV-ready bullet point.
- **Req-Coach-2**: Users must be able to initiate Mock Interviews.
- **Req-Coach-3**: Mock Interviews must support multiple types (Behavioral, Technical, Situational) and subtypes (Conflict, Leadership).
- **Req-Coach-4**: Real-time feedback and tips must be provided during the interview process.

## 3. Data Strategy

### 3.1 Database Schema (Supabase)
- `users`: Stores profile, level, and track info.
- `tasks`: Stores assigned tasks, status, and content.
- `bounties`: Stores available external gigs.
- `performance_metrics`: Tracks accuracy, speed, and communication scores.

### 3.2 AI Context Management
- To maintain persona consistency, the backend must accept `chat_history` and `context` objects with every request.
- Stateless design: The backend does not store conversation state; the frontend is responsible for maintaining and passing the context window.

## 4. Security & Compliance
- **API Security**: Backend endpoints should be protected (currently open for sandbox, but production requires API Gateway/Auth checks).
- **Environment Variables**: Sensitive keys (Supabase Anon Key, Gemini API Key) must be stored in `.env.local` and `.env` respectively and never committed to version control.

## 5. Performance Goals
- **UI Latency**: Interactive elements (modals, chats) should respond < 100ms.
- **AI Latency**: Generation tasks (task creation, reviews) should complete < 10s (streaming can be implemented for better UX).

---
<div style="page-break-after: always;"></div>

# Technical Inventory & Deployment Prerequisites

This document outlines the core technical components of the project to assist with deployment on **any** platform (AWS, Vercel/Render, DigitalOcean, Azure, etc.).

## 1. Project Structure Root (`sandbox/`)
The project is a **monorepo** containing two distinct applications:

1.  **Frontend**: The root directory itself (Next.js Application).
2.  **Backend**: Located in `ai_backend/WDC-LABS-AI-2/` (Python FastAPI Application).

---

## 2. Frontend Application (Next.js)

### Technical Identity
- **Framework**: Next.js 16 (React)
- **Languages**: TypeScript, JavaScript
- **Build System**: NPM / Webpack (via Next.js)

### Critical Files
- `package.json`: Lists dependencies and scripts (`dev`, `build`, `start`).
- `next.config.ts`: Main configuration file.
- `public/`: Static assets (images, fonts).
- `app/`: Source code.

### Deployment Prerequisites
To deploy this, your host needs:
- **Node.js**: Version 20.x or higher.
- **Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`: Connection string to your Supabase instance.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for Supabase.
    - `NEXT_PUBLIC_AI_BACKEND_URL`: The URL where your **Backend** is deployed (e.g., `https://api.yourdomain.com`).

### Commands
- **Install**: `npm install`
- **Build**: `npm run build` (This produces a `.next` folder).
- **Run**: `npm start` (Runs the production server, usually on port 3000).

---

## 3. Backend Application (Python AI Service)

### Location
Path: `sandbox/ai_backend/WDC-LABS-AI-2/`

### Technical Identity
- **Framework**: FastAPI (ASGI)
- **Language**: Python 3.10+
- **Server**: Uvicorn (Development) / Gunicorn (Production)

### Critical Files
- `requirements.txt`: Python package dependencies.
- `app/main.py`: Application entry point (`app` object).
- `.env`: Local environment variables (do **not** commit this).

### Deployment Prerequisites
To deploy this, your host needs:
- **Python**: Version 3.10 or higher.
- **System Packages**: `git`, `build-essential` (often needed for compiling python libs like `numpy`).
- **Environment Variables**:
    - `GEMINI_API_KEY`: API key from Google AI Studio.

### Commands
- **Install**: `pip install -r requirements.txt`
- **Run (Dev)**: `uvicorn app.main:app --reload`
- **Run (Prod)**: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000`

---

## 4. Connectivity & Data Architecture

### Database (Supabase)
This project **does not** host its own database container. It relies on **Supabase** (External/SaaS).
- **Requirement**: You must have a Supabase project created.
- **Tables**: `users`, `tasks`, `bounties`, `performance_metrics` (Schema must be applied).

### Communication Flow
1.  **Browser** requests **Frontend** (Port 3000).
2.  **Frontend** reads data directly from **Supabase**.
3.  For AI tasks (Chats, Reviews, Interviews), **Frontend** calls **Backend** (Port 8000/8001).
4.  **Backend** calls **Google Gemini API** and returns results to Frontend.

---

## 5. Deployment "Cheatsheet" for Any Platform

If you deploy to **Vercel** (Frontend) + **Render** (Backend):

1.  **Frontend (Vercel)**:
    - Root Directory: `sandbox` (or `./`)
    - Install Command: `npm install`
    - Build Command: `npm run build`
    - Env Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_AI_BACKEND_URL` (Set this to your Render URL).

2.  **Backend (Render/Railway/Heroku)**:
    - Root Directory: `sandbox/ai_backend/WDC-LABS-AI-2`
    - Build Command: `pip install -r requirements.txt`
    - Start Command: `gunicorn -k uvicorn.workers.UvicornWorker app.main:app`
    - Env Vars: `GEMINI_API_KEY`

---
<div style="page-break-after: always;"></div>

# Deployment Guide: AWS Lightsail

This guide details how to deploy the WDC Labs platform (Next.js Frontend + Python FastAPI Backend) to an AWS Lightsail instance.

## 1. Create Lightsail Instance

1.  **Log in** to AWS Console > Lightsail.
2.  **Create Instance**:
    - **Platform**: Linux/Unix
    - **Blueprint**: OS Only > **Ubuntu 22.04 LTS** (Recommended over bundled stacks for custom hybrid apps)
    - **Instance Plan**: At least **2 GB RAM** (approx $10/month) is recommended for building Next.js and running Python AI models.
3.  **Name**: `wdc-labs-prod`
4.  **Static IP**: Go to Networking > Create Static IP > Attach to `wdc-labs-prod`.

## 2. Server Setup

SSH into your instance (via browser console or terminal).

### 2.1 Update & Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

### 2.2 Install Node.js (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 3. Deployment Structure

Clone your repository.
```bash
cd /opt
sudo mkdir wdc-labs
sudo chown ubuntu:ubuntu wdc-labs
git clone <YOUR_REPO_URL> wdc-labs
cd wdc-labs/sandbox
```

## 4. Backend Setup (FastAPI)

1.  **Setup Virtual Environment**:
    ```bash
    cd ai_backend/WDC-LABS-AI-2
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install gunicorn uvicorn
    ```

2.  **Environment Variables**:
    Create a `.env` file: `nano .env`
    ```env
    GEMINI_API_KEY=your_production_key_here
    ```

3.  **Test Run**:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8001
    # Check if it runs without error, then Ctrl+C
    ```

## 5. Frontend Setup (Next.js)

1.  **Install & Build**:
    ```bash
    cd /opt/wdc-labs/sandbox
    npm install
    ```

2.  **Environment Variables**:
    Create `.env.local`: `nano .env.local`
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    NEXT_PUBLIC_AI_BACKEND_URL=https://your-domain.com/api/ai
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

## 6. Process Management (PM2)

Use PM2 to keep both services running.

### 6.1 Start Backend through Gunicorn
```bash
cd /opt/wdc-labs/sandbox/ai_backend/WDC-LABS-AI-2
pm2 start "gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8001" --name wdc-backend
```

### 6.2 Start Frontend
```bash
cd /opt/wdc-labs/sandbox
pm2 start npm --name "wdc-frontend" -- start -- -p 3000
```

### 6.3 Save Config
```bash
pm2 save
pm2 startup
# Run the command output by pm2 startup
```

## 7. Nginx Verification & SSL

Configure Nginx to proxy requests.

1.  **Edit Config**: `sudo nano /etc/nginx/sites-available/wdc-labs`

    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com; # Or your Static IP

        # Frontend (Next.js)
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend (FastAPI) - Rewritten path
        location /api/ai/ {
            proxy_pass http://localhost:8001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

2.  **Enable Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/wdc-labs /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    ```

3.  **SSL (HTTPS) with Certbot** (Requires a domain name pointing to your IP):
    ```bash
    sudo certbot --nginx -d your-domain.com
    ```

## 8. Firewall (Lightsail)

In the Lightsail Console > Networking > Firewall:
- Allow **HTTP (80)**
- Allow **HTTPS (443)**
- Keep **SSH (22)** allowed (restrict to your IP if possible)

## 9. CI/CD (Optional)

To automate updates:
1.  Setup a GitHub Action.
2.  SSH into the instance.
3.  `git pull`, `npm run build`, `pm2 restart all`.
