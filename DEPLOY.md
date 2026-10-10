# Go-live handover (for the server team)

## What you're deploying
- **Website**: Next.js 16 (`frontend/`), runs on port 3000. This is the only thing exposed publicly.
- **API**: Node.js / Express (`backend/`), runs on `127.0.0.1:4000`. Never expose it directly.
- **Database**: one SQLite file, `backend/data/weddings.db`. There is no separate database server.

Requirements: Linux server, **Node.js 22.13+**, nginx, pm2 (or systemd), and an SSL certificate.

## Steps
```bash
git clone -b claude/awesome-cannon-dpmtpe https://github.com/gopalvserve-rgb/fitnet.git /var/www/vanya
cd /var/www/vanya
npm --prefix backend ci --omit=dev && npm --prefix frontend ci
cp backend/.env.example backend/.env      # fill in every value (see below)
npm run build
```

`backend/.env`:
| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 48+ random hex chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `IP_HASH_SALT` | another random string |
| `ALLOWED_ORIGINS` | `https://www.your-domain.com` (exact public origin; comma-separate if several) |
| `TRUST_PROXY` | `1` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin login (password 12+ chars). Applied on each start. |

## Restore the data from the dump you were given
```bash
mkdir -p backend/data
sqlite3 backend/data/weddings.db < weddings-dump.sql
# no sqlite3 CLI? use Node:
node -e "const{DatabaseSync}=require('node:sqlite');new DatabaseSync('backend/data/weddings.db').exec(require('fs').readFileSync('weddings-dump.sql','utf8'))"
```
If you skip this, the API creates an empty database and seeds the standard venues and packages on first start.
The dump contains customer enquiries and the admin password hash, so treat it as confidential.

## Start (pm2)
```bash
pm2 start "node --env-file=backend/.env --disable-warning=ExperimentalWarning backend/src/server.js" --name vanya-api
PORT=3000 API_URL=http://127.0.0.1:4000 pm2 start "npm --prefix frontend start" --name vanya-web
pm2 save && pm2 startup
```

## nginx
Use `deploy/nginx.conf`. Keep `proxy_set_header X-Forwarded-For $remote_addr;` exactly as written: rate limiting
depends on it. Port 4000 must not be reachable from outside (firewall it).

## Checks after go-live
- `curl -s http://127.0.0.1:4000/api/health` returns `{"ok":true}`
- The site loads over HTTPS, the enquiry form submits, and `/admin` login works
- `curl -sI https://www.your-domain.com | grep -i content-security-policy` shows a CSP header

## Backups
Daily: `sqlite3 backend/data/weddings.db ".backup /backups/weddings-$(date +%F).db"` (safe while running).
Or, from the project folder: `npm run db:dump -- /backups/weddings-$(date +%F).sql`
