# Smart Job Tracker

Smart Job Tracker helps candidates organize every job application, keep resumes in sync, and fine-tune each resume for a specific role with AI assistance. The project ships with a React SPA and an Express/MongoDB API that stores resumes in GridFS and protects data with JWT-based auth.

## Key Features
- Track applications with status, notes, job descriptions, and linked resumes.
- Visual dashboard with success/rejection rates, response-time stats, and status distribution.
- Resume vault with PDF uploads (5 MB cap) and inline preview streaming.
- OpenAI-powered analyzer that compares any stored resume with a pasted job description.

## Tech Stack
| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router 7, Tailwind CSS, Headless UI, Heroicons |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, Multer (memory) |
| Storage | MongoDB + GridFS for PDFs |
| AI | OpenAI SDK (default model `gpt-4o-mini`) |

## Project Layout
```
smart_job_tracker/
├── client/   # React app (CRA)
└── server/   # Express API + MongoDB models/routes
```

## Quick Start
1. Install dependencies (runs client + server installs):
   ```bash
   npm install
   ```
2. Create the environment files described below.
3. Start the API with hot reload:
   ```bash
   npm run dev
   ```
4. In another terminal, start the client:
   ```bash
   npm --prefix client start
   ```
5. Visit `http://localhost:3000` (requests proxy to the API on `5050`).

For a production-style build:
```bash
npm run build   # client build
npm start       # Express serves API + static assets
```

## Environment Variables
Create `server/.env`:
```
PORT=5050
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_job_tracker
JWT_SECRET=change-this
OPENAI_API_KEY=sk-xxx
OPENAI_RESUME_MODEL=gpt-4o-mini
```

Optional `client/.env` (only if the API runs elsewhere):
```
REACT_APP_API_URL=http://localhost:5050
```

## Scripts
- `npm run dev` – Express + Nodemon.
- `npm run start` – Express (production).
- `npm run build` – React production build.
- `npm --prefix client start` – CRA dev server.
- `npm --prefix client test` – React Testing Library.

## API Snapshot
| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | User signup & login, returns JWT. |
| GET/POST/PUT/PATCH/DELETE | `/api/jobs` | CRUD for user-owned applications. |
| GET/POST/DELETE | `/api/resumes` | Manage resume metadata + uploads. |
| GET | `/api/resumes/:id/file` | Stream PDF from GridFS. |
| POST | `/api/resumes/analyze` | AI comparison (`resumeId`, `jobDescription`). |

All protected routes require `Authorization: Bearer <token>`. Rate limiting caps `/analyze` at 10 requests per 15 minutes per user/IP.
