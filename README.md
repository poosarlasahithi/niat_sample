# AskFlow AI 🚀

A full-stack AI conversational workspace built with **React.js (TypeScript)**, **Tailwind CSS**, **React Router**, **Node.js (Express.js)**, **Supabase Auth & PostgreSQL**, **Gemini API (`@google/genai`)**, and **Zod validation**.

---

## 🌟 Key Features

1. **Secure Architecture**:
   - Express Node.js backend handles all Google Gemini API (`@google/genai`) interactions.
   - Neither the Gemini API key nor the Supabase Service Role key are exposed to the client.
   - Supabase JWT Bearer Authentication on all Express backend endpoints.
2. **Supabase Database & Row Level Security (RLS)**:
   - Tables for `conversations` and `messages`.
   - Strict RLS policies (`auth.uid() = user_id`) guaranteeing each user can only read, write, and delete their own data.
3. **Responsive Left Sidebar Layout**:
   - Navigation menu with **Dashboard** and **AI Chatbot**.
   - User profile badge displaying logged-in user's name and email.
   - Logout button.
4. **Dashboard Page**:
   - Personalized welcome banner.
   - **Total AI Conversations** counter card.
   - **Start New Chat** action button card.
5. **Full-Page AI Chatbot**:
   - Maximized viewport design.
   - Multi-turn conversation history.
   - User and AI message bubbles with timestamp formatting.
   - Loading indicator when AI is generating responses.
   - "New Chat" button to instantly reset chat context.
   - Side drawer to switch between or delete past conversations.
6. **Zod Validation**:
   - Form data validation for Signup, Login, and Chat input on both client and server.

---

## 📁 Repository Structure

```
NIAT SAMPLE/
├── client/                     # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # AppLayout, Sidebar, ProtectedRoute
│   │   ├── context/            # AuthContext (Supabase Auth)
│   │   ├── lib/                # api.ts, supabaseClient.ts, validation.ts
│   │   ├── pages/              # LoginPage, SignupPage, DashboardPage, ChatPage
│   │   ├── types/              # TypeScript Interfaces
│   │   ├── App.tsx             # React Router Setup
│   │   ├── index.css           # Tailwind & Global Styles
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Gemini (@google/genai) & Supabase admin
│   │   ├── middleware/         # Bearer JWT auth middleware
│   │   ├── routes/             # chatRoutes.ts
│   │   ├── services/           # geminiService.ts
│   │   ├── utils/              # validation.ts (Zod schemas)
│   │   └── index.ts            # Server entry point
│   ├── .env.example
│   └── package.json
├── supabase/
│   └── schema.sql              # SQL script for PostgreSQL tables & RLS
└── README.md
```

---

## 🛠️ Step-by-Step Setup Instructions

### 1. Database Setup (Supabase PostgreSQL)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. Go to the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run it.
   - This creates `conversations` and `messages` tables.
   - This enables Row Level Security (RLS) and attaches policy definitions.

---

### 2. Backend Server Setup (`server/`)

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your environment variables in `server/.env`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=AIzaSy... (Your key from https://aistudio.google.com/)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *The Express server will start on `http://localhost:5000` with health check available at `http://localhost:5000/api/health`.*

---

### 3. Frontend Client Setup (`client/`)

1. Open a second terminal window and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your environment variables in `client/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React app will start on `http://localhost:5173`.*

---

## 🧪 Verification & Usage Guide

1. Open `http://localhost:5173` in your web browser.
2. Click **"Create account"** and sign up with a name, email, and password (validated by Zod).
3. Once logged in, you will be redirected to the **Dashboard** page showing your welcome greeting and 2 cards:
   - **Total AI Conversations**: Live count of your conversations.
   - **Start New Chat**: Click to open the full-page chatbot.
4. On the **AI Chatbot** page:
   - Type a prompt and hit Enter or click **Send**.
   - Notice the loading indicator while the Node.js backend communicates with Google Gemini.
   - Notice user and AI message bubbles rendered in real-time.
   - Click **"New Chat"** at any time to start a fresh conversation session.
   - Click **"History"** to view and switch between previous chat threads.
5. In the left sidebar:
   - View your user avatar, full name, and email address at the bottom.
   - Click the Logout button to destroy your Supabase session.
