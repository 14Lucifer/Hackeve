# Hackathon Submission Portal

A self-hosted web app for running a hackathon from submission to final ranking. Participants submit their projects, admins manage the event, and judges score the finalists from a laptop or phone.

Built with Next.js 14, PostgreSQL 16, and Prisma, and deployed with Docker Compose behind Caddy. Caddy runs in plain HTTP mode or HTTPS mode with a free automatic certificate.

## Features

**Participants**
- Sign in with a registered email (no password)
- One shared submission per team: team name, project name, description, a summary file, up to 20 screenshots, and one video
- Searchable team-member picker
- Live deadline countdown; save a draft, then edit and resubmit until the deadline

**Admins**
- Event branding: event name, organizer line, and logo, all editable in the portal
- Participants: CSV import, manual add, search, lock/unlock, delete, bulk actions
- Submissions: table, detail view, CSV export, per-project zip, and batch zip (one zip per project plus `manifest.csv`)
- Judging: up to 3 judge accounts, up to 10 finalists, 3 recommended questions per finalist
- Submission deadline, judging deadline, ranking publication, and admin credential management
- Overall and per-judge rankings with 🥇 🥈 🥉

**Judges**
- Responsive portal for mobile and laptop
- Review finalist materials (summary, screenshots, video, team, questions)
- Score 5 weighted categories from 1 to 5, and edit scores until judging closes
- View rankings once the admin publishes them

## Quick start

```bash
git clone https://github.com/<your-account>/hackathon-submission-portal.git
cd hackathon-submission-portal
cp .env.example .env        # then edit the passwords and JWT_SECRET
docker compose up -d --build
```

Open `http://<server-ip>`, choose the **Admin** tab, and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

## Documentation

- [Deployment guide](docs/DEPLOYMENT.md): HTTP and HTTPS modes, updates, backups, troubleshooting
- [User guide](docs/USER_GUIDE.md): how admins, participants, and judges use the portal

## Configuration

All deployment settings are in `.env` (see [.env.example](.env.example)):

| Variable | Purpose |
| --- | --- |
| `DEPLOY_MODE` | `http` (plaintext) or `https` (automatic Let's Encrypt certificate) |
| `DOMAIN`, `ACME_EMAIL` | Domain and certificate contact email (HTTPS mode only) |
| `HTTP_PORT`, `HTTPS_PORT` | Host ports published by Caddy |
| `DATA_DIR` | Folder for all persistent data (default `./data`) |
| `POSTGRES_*` | Database credentials |
| `JWT_SECRET` | Session signing key (at least 32 random characters) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | First admin account, created on first start |

Event name, organizer line, logo, and deadlines are set in **Admin → Settings**, not in `.env`.

## File limits

| File | Formats | Limit |
| --- | --- | --- |
| Project summary (required) | PDF, DOC, DOCX, TXT, MD, ZIP | 25 MB |
| Screenshots | PNG, JPG, WEBP, GIF | 10 MB each, up to 20 |
| Video | MP4, MOV, WEBM, MKV | 2 GB |
| Event logo | PNG, JPG, WEBP, GIF, SVG | 2 MB |

To change the submission limits, edit `LIMITS` in `src/lib/util.ts`. Uploads are streamed to disk, so large videos don't use much server memory.

## Scoring

| Category | Weight |
| --- | --- |
| Value & Practicality | 30% |
| Creativity & Differentiation | 30% |
| AI Application & Technical Quality | 20% |
| Product Completeness & UX | 10% |
| Feasibility & Responsible AI | 10% |

Each category is scored 1 to 5. The overall ranking averages all judges' completed scorecards. Ties are broken by category, in order of weight.

## Security notes

- **Participant login is email-only.** Anyone who knows a registered email can sign in as that participant. This is a deliberate trade-off for a controlled event; lock accounts you don't trust.
- Admin and judge passwords are bcrypt-hashed. Sessions are HttpOnly JWT cookies, marked `Secure` in HTTPS mode.
- Uploaded files are never served publicly; every download goes through an access-checked endpoint.
- **HTTP mode sends logins and files unencrypted.** Use HTTPS mode for anything reachable from the internet.

## Development

```bash
npm install
# Run PostgreSQL locally and set DATABASE_URL and JWT_SECRET in .env.local
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

## Project structure

```
src/app/            Pages and API routes (login, (portal), admin, judge, api)
src/components/     Shared UI components
src/lib/            Auth, database, storage, branding, scoring, ranking, zip helpers
prisma/             Database schema and seed script
caddy/              Caddyfile.http and Caddyfile.https
docs/               Deployment and user guides
```

## License

[MIT](LICENSE)
