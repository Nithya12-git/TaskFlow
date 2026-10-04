# TaskFlow SaaS

A multi-tenant task and project management platform. Teams create workspaces, organize work into projects and tasks, assign it to teammates, and control access with four roles. Built as a full-stack portfolio project: real database, real authentication, real server-side authorization.

> Add a screenshot or two of the dashboard here (see [Screenshots](#screenshots)).

## Features

- **Authentication:** register, login, logout, persistent sessions, protected routes
- **Dashboard:** project and task counts, completion ring, status and priority breakdowns, your assigned tasks, recent projects and activity
- **Projects:** create, edit, delete, search, filter by status, progress tracking, detail pages
- **Tasks:** list and Kanban board views, drag and drop between statuses, filters (project, assignee, priority, status, overdue), sorting, assignment, due dates
- **Team:** add members, change roles, remove members, with owner and admin rules enforced
- **Activity log:** every important action is recorded and shown in a grouped timeline
- **Settings:** profile, workspace name, password change
- **Billing:** owner-only plan and usage page (no real payment processing in this version)
- **Role-based access control (RBAC)** enforced on the server and mirrored in the UI
- **Multi-tenancy:** every query is scoped to the user's workspace
- **Responsive dark UI** with loading skeletons, empty and error states, toasts and confirmation dialogs

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, lucide-react |
| Backend | Node.js, Express, TypeScript, Zod |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT in an httpOnly cookie, bcrypt password hashing |
| Security | helmet, express-rate-limit, CORS allow-list |

## Architecture

Browser (Next.js, port 3000)
| fetch /api/* (httpOnly cookie)
v
Express API (port 4000)
| authenticate -> requirePermission -> controller -> service
v
Prisma -> PostgreSQL


- **Controllers** parse and validate input. **Services** hold business logic and every database query. **Middleware** handles authentication and permissions.
- `authenticate` verifies the cookie and resolves the user's workspace (`tenantId`) and role from the database on every request. Every service query then filters by that `tenantId`, so one workspace can never read or change another workspace's data. Resources from another workspace return `404`.
- The frontend never decides what is allowed. It only hides controls for a better experience. The server rejects anything the role can't do.
- The session token holds only the user ID, so role changes and removals take effect immediately.

### Project structure

taskflow/
backend/
prisma/ schema.prisma, migrations, seed.ts
scripts/ smoke-test.ps1
src/
config/ env validation, Prisma client
controllers/ request handlers
middleware/ authenticate, requirePermission, rate limits, errors
routes/ route definitions
services/ business logic and queries
validators/ Zod schemas
utils/ permissions, JWT, errors
frontend/
app/ (auth) login/register, (app) dashboard, projects, tasks, team, ...
components/ ui, layout, dashboard, projects, tasks, team, settings
hooks/ useAuth, useApi, ...
lib/ API client, helpers
types/

## Getting started

### Prerequisites

- Node.js 18.17 or newer
- PostgreSQL 14 or newer

### 1. Create the database

psql -U postgres -c "CREATE DATABASE taskflow;"


### 2. Configure environment variables

Create `backend/.env` and `frontend/.env.local` using `.env.example` as a guide.

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing sessions, at least 32 characters |
| `JWT_EXPIRES_IN` | Session lifetime, for example `7d` |
| `CLIENT_URL` | Frontend origin allowed by CORS, for example `http://localhost:3000` |
| `PORT` | API port, default `4000` |
| `NODE_ENV` | `development` or `production` |

**Frontend (`frontend/.env.local`)**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` locally, or `same-origin` in production |
| `API_URL` | Production only: backend URL that Next.js forwards `/api/*` to |

### 3. Install, migrate and seed

cd backend
npm install
npx prisma migrate dev
npx prisma db seed


### 4. Run
terminal 1

cd backend
npm run dev

terminal 2

cd frontend
npm install
npm run dev


Open http://localhost:3000. Useful database commands: `npx prisma studio` (browse data), `npx prisma migrate dev --name <change>` (new migration), `npx prisma db seed` (reset demo data).

### Demo accounts

All seeded users have the password `Password123!` (the login page has one-click buttons).

| Role | Email |
|---|---|
| Owner | owner@taskflow.dev |
| Admin | admin@taskflow.dev |
| Member | member@taskflow.dev |
| Guest | guest@taskflow.dev |
## API overview

All routes except register, login, logout and health require authentication.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id` |
| Tasks | `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id` (filters: `projectId`, `status`, `priority`, `assignedTo`, `search`, `overdue`, `sort`) |
| Team | `GET/POST /api/team`, `PUT/DELETE /api/team/:id` |
| Activity | `GET /api/activity` (`limit`, `entityType`) |
| Dashboard | `GET /api/dashboard/stats` |
| Settings | `PUT /api/settings/profile`, `PUT /api/settings/password`, `PUT /api/settings/workspace` |
| Billing | `GET /api/billing` (owner only) |

Errors use consistent JSON (`{ "message": "..." }`) and proper status codes: 400 validation, 401 not signed in, 403 not allowed, 404 not found (including other workspaces' data), 409 conflict, 429 rate limited.

## Roles and permissions

| Capability | Owner | Admin | Member | Guest |
|---|:-:|:-:|:-:|:-:|
| View projects, tasks, team, activity | yes | yes | yes | yes |
| Create and update tasks | yes | yes | yes | no |
| Delete tasks | yes | yes | no | no |
| Create and update projects | yes | yes | no | no |
| Delete projects | yes | no | no | no |
| Manage team (add, change roles, remove) | yes | yes* | no | no |
| Manage workspace settings | yes | yes | no | no |
| Billing | yes | no | no | no |

\* Admins cannot add, change or remove other admins, and nobody can change or remove the owner or themselves.

Permissions live in one place (`backend/src/utils/permissions.ts`), are checked by the `requirePermission` middleware on every route, and are sent to the frontend with the current user.

## Security

- Passwords hashed with bcrypt (cost 12) and never returned by the API
- httpOnly, SameSite cookie sessions (`Secure` in production)
- Server-side authentication, role checks and tenant scoping on every route
- Zod validation on all inputs, request body size limit
- helmet security headers, CORS allow-list, rate limits on login, registration and the API
- Login takes constant time whether or not the email exists
- Secrets only in environment variables (validated at startup), `.env` is git-ignored

Known limitations: JWTs are stateless, so changing a password does not sign out other devices; registration reveals whether an email is already taken.

## Testing

With the backend running and freshly seeded data, run the API smoke test (about 70 checks covering authentication, the permission matrix for each role, validation, team rules and tenant isolation):

cd backend
npx prisma db seed
.\scripts\smoke-test.ps1


Type-check both apps with `npx tsc --noEmit`, and build with `npm run build` in each folder.

## Deployment

1. **Database:** create a hosted PostgreSQL database (for example Neon, Supabase or Railway) and copy its connection string.
2. **Backend** (Render, Railway or similar), root directory `backend`:
   - Build command: `npm install --include=dev && npm run build`
   - Start command: `npm run db:deploy && npm start`
   - Environment: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL=<your frontend URL>`
3. **Frontend** (Vercel or similar), root directory `frontend`:
   - Environment: `NEXT_PUBLIC_API_URL=same-origin` and `API_URL=<your backend URL>`
   - Next.js forwards `/api/*` to the backend, so the login cookie stays first-party.
4. Do not run the seed script against a production database.

## Screenshots

_Add screenshots here: login, dashboard, projects, task board, team, billing._

## Future improvements

- Email invitations and password reset
- Real billing with Stripe
- Comments, attachments and task subtasks
- Real-time updates with WebSockets
- Session revocation and two-factor authentication
- Automated unit and end-to-end tests in CI
- Multiple workspaces per user with a workspace switcher

## Author

Built by **NITHYA HARI G**. Connect on [LinkedIn](www.linkedin.com/in/nithyaharig) or [GitHub](https://github.com/Nithya12-git).