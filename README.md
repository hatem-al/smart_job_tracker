# Smart Job Tracker

**Live site:** https://smart-job-tracker-yq1v.onrender.com

Smart Job Tracker helps you organize every job application, store resumes, and fine-tune each resume for a specific role using AI. Built with a React SPA and an Express/MongoDB API.

## Features

- **Application tracking** — add jobs with company, role, status, notes, and a job description. Status options: Saved, Applied, Interview, Offer, Rejected.
- **Dashboard** — visual overview with success/rejection rates, average response time, and a status distribution pie chart with a recent-applications list.
- **Resume vault** — upload PDFs (5 MB cap), preview them inline, and delete them. Files are stored in MongoDB GridFS.
- **AI resume optimizer** — pick a stored resume, paste a job description, and get back matching keywords (present/partial/missing), prioritized suggestions, and an overall summary powered by OpenAI.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, React Router 7, Tailwind CSS, Headless UI, Heroicons |
| Backend | Node.js, Express 4, Mongoose, JWT, bcrypt, Multer (memory storage) |
| Storage | MongoDB Atlas + GridFS for PDF files |
| AI | OpenAI SDK (`gpt-4o-mini`) |
| Hosting | Render (web service) |

## Project Layout

```
smart_job_tracker/
├── client/   # React app (CRA)
└── server/   # Express API + MongoDB models/routes
```

## Quick Start

1. Install all dependencies:
   ```bash
   npm install
   ```
2. Create `server/.env` (see Environment Variables below).
3. Run the API with hot reload:
   ```bash
   npm run dev
   ```
4. In a second terminal, run the React dev server:
   ```bash
   npm --prefix client start
   ```
5. Open `http://localhost:3000`.

For a production build:
```bash
npm run build   # builds the React app
npm start       # Express serves API + static assets on :5050
```

## Environment Variables

Create `server/.env`:
```
PORT=5050
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/smart_job_tracker
JWT_SECRET=<long-random-string>
OPENAI_API_KEY=sk-xxx
OPENAI_RESUME_MODEL=gpt-4o-mini
```

`client/.env.development` (already in the repo):
```
REACT_APP_API_URL=http://localhost:5050
```

## Scripts

| Command | Description |
| --- | --- |
| `npm install` | Installs root, client, and server dependencies |
| `npm run dev` | Express + Nodemon (API only) |
| `npm start` | Express in production mode |
| `npm run build` | React production build |
| `npm --prefix client start` | CRA dev server |
| `npm --prefix client test` | React Testing Library |

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a new user, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET / POST | `/api/jobs` | List or create jobs |
| PUT / PATCH / DELETE | `/api/jobs/:id` | Update or delete a job |
| GET / POST / DELETE | `/api/resumes` | List, upload, or delete resumes |
| GET | `/api/resumes/:id/file` | Stream PDF from GridFS |
| POST | `/api/resumes/analyze` | AI analysis (`resumeId` + `jobDescription`) |

All routes except `/api/auth/*` require `Authorization: Bearer <token>`. The `/analyze` endpoint is rate-limited to 10 requests per 15 minutes per user/IP.

## Deploying to Render

1. Set **Build Command:** `npm install && npm run build`
2. Set **Start Command:** `npm start`
3. Add environment variables (same as `server/.env`) in the Render dashboard — set `NODE_ENV=production` and `CLIENT_URL` to your `.onrender.com` URL.
