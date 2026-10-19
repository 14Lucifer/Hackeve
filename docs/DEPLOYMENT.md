# Deployment Guide

The portal runs as three Docker containers:

| Container | Role | Data folder |
| --- | --- | --- |
| `db` | PostgreSQL 16 | `./data/postgres` |
| `web` | Next.js app | `./data/uploads` |
| `caddy` | Reverse proxy (HTTP or HTTPS) | `./data/caddy/data`, `./data/caddy/config` |

All persistent data lives in the `./data` folder next to `docker-compose.yml`. Back up that folder and you have backed up everything.

## 1. Requirements

- A Linux server with at least 2 vCPU, 2 GB RAM, and enough disk for the uploads (videos can be up to 2 GB each)
- Docker Engine 24 or later, with the Docker Compose plugin (`docker compose version`)
- Open inbound ports: **80** for HTTP mode; **80 and 443** for HTTPS mode

## 2. Get the code and configure

```bash
git clone https://github.com/<your-account>/hackathon-submission-portal.git
cd hackathon-submission-portal
cp .env.example .env
```

Edit `.env` and set at least these values:

```bash
POSTGRES_PASSWORD=<letters-and-numbers-only>
JWT_SECRET=<output of: openssl rand -hex 32>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<a strong password>
```

Docker Compose refuses to start if `POSTGRES_PASSWORD`, `JWT_SECRET`, or `ADMIN_PASSWORD` is empty.

Then pick a deployment mode.

## 3a. HTTP mode (no SSL)

Use this for local testing, an internal network, or when another proxy in front of the server already handles TLS.

```bash
# .env
DEPLOY_MODE=http
HTTP_PORT=80
```

```bash
docker compose up -d --build
```

Open `http://<server-ip>` (add `:<HTTP_PORT>` if you changed the port).

> HTTP mode sends emails, passwords, and files unencrypted. Don't use it on the public internet.

## 3b. HTTPS mode (free SSL with Caddy)

Caddy requests a free Let's Encrypt certificate and renews it automatically.

1. Create a DNS **A record** pointing your domain to the server's public IP, for example `submission.example.com → 203.0.113.10`. Check it with `dig +short submission.example.com`.
2. Open ports **80 and 443** in your firewall or cloud security group. Let's Encrypt needs port 80 to verify the domain.
3. Configure `.env`:

   ```bash
   DEPLOY_MODE=https
   DOMAIN=submission.example.com
   ACME_EMAIL=you@example.com
   HTTP_PORT=80
   HTTPS_PORT=443
   ```

4. Start:

   ```bash
   docker compose up -d --build
   ```

5. Open `https://submission.example.com`. The first request can take a few seconds while the certificate is issued. HTTP requests are redirected to HTTPS automatically.

In HTTPS mode, `HTTP_PORT` and `HTTPS_PORT` must stay 80 and 443, because Let's Encrypt validates on those ports.

## 4. First sign-in

1. Open the site and choose the **Admin** tab.
2. Sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.
3. In **Settings**, set the event name, organizers, logo, and deadlines.

The admin account is created only on the first start. Changing `ADMIN_PASSWORD` in `.env` later has no effect; use **Admin → Settings → Admin Credentials** instead.

See the [User Guide](USER_GUIDE.md) for the rest of the event workflow.

## 5. Everyday operations

| Task | Command |
| --- | --- |
| Status | `docker compose ps` |
| Logs | `docker compose logs -f web` (or `db`, `caddy`) |
| Restart | `docker compose restart` |
| Stop | `docker compose down` |
| Update to a new version | `git pull && docker compose up -d --build` |

The database schema updates itself on start, and existing data is kept.

## 6. Switching modes

Change `DEPLOY_MODE` (and `DOMAIN` / `ACME_EMAIL` for HTTPS) in `.env`, then run:

```bash
docker compose up -d --force-recreate
```

## 7. Backup and restore

The database must be stopped for a consistent file copy:

```bash
docker compose stop
sudo tar czf backup-$(date +%F).tar.gz data .env
docker compose start
```

To restore on a new server, check out the same version of the code, extract the archive into the project folder, and run `docker compose up -d --build`.

For a backup without downtime, take a database dump and copy the uploads:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > db-$(date +%F).sql
sudo tar czf uploads-$(date +%F).tar.gz data/uploads
```

## 8. Troubleshooting

| Problem | Fix |
| --- | --- |
| `required variable ... is missing a value` | Set that variable in `.env`. |
| `502 Bad Gateway` | The app is still starting or has crashed. Check `docker compose logs web`. |
| HTTPS certificate not issued | Check that the DNS record points at this server, that ports 80 and 443 are open, and that `DOMAIN` is correct. Then check `docker compose logs caddy`. |
| Site doesn't load by IP address in HTTPS mode | This is expected: HTTPS mode only answers on `DOMAIN`. Open `https://<DOMAIN>`. |
| Port 80 or 443 already in use | Stop the other web server, or change `HTTP_PORT` (HTTP mode only). |
| Large uploads fail | Check free disk space with `df -h`. If you use another proxy in front, raise its body size limit to at least 2.1 GB. |
| Permission errors under `data/` | Run `docker compose up -d` once; the app fixes ownership of `data/uploads` on start. |

## Migrating from Docker named volumes

Older versions of this project stored data in Docker named volumes (`<project>_pgdata`, `<project>_uploads`, `<project>_caddy_data`, `<project>_caddy_config`). To move that data into `./data`:

```bash
docker compose down
PROJECT=$(basename "$PWD")
mkdir -p data/postgres data/uploads data/caddy/data data/caddy/config
for pair in pgdata:postgres uploads:uploads caddy_data:caddy/data caddy_config:caddy/config; do
  docker run --rm -v "${PROJECT}_${pair%%:*}:/from:ro" -v "$PWD/data/${pair#*:}:/to" alpine cp -a /from/. /to/
done
docker compose up -d --build
```

After you confirm everything works, you can remove the old volumes with `docker volume rm`.
