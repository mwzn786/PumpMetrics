# Deploying PumpMetrics to Hostinger (MySQL)

PumpMetrics is a Next.js app with API routes, NextAuth sessions and Prisma/MySQL, so it needs a
**running Node.js process**. Hostinger's classic shared/WordPress hosting cannot run it. Two Hostinger
plans work:

| Option | Plan | Best when |
| --- | --- | --- |
| **Managed Web Apps** (recommended) | Business Web Hosting or any Cloud plan | You want deploy-from-GitHub, managed SSL and no server admin |
| **VPS** | KVM 1 and up | You want root access, Docker, custom nginx, multiple apps |

Node.js 22 is the right runtime to pick on either option (Prisma 6 requires Node 20.19+).

---

## Before you start (both options)

1. Push this project to a GitHub repository.
2. Generate a session secret and keep it somewhere safe:

```bash
openssl rand -base64 32
```

3. Note the four environment variables the app needs. `.env.production.example` in this repo is the
   template:

```
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME"
NEXTAUTH_SECRET=<the value you just generated>
NEXTAUTH_URL=https://yourdomain.com
```

`NEXTAUTH_URL` must be the exact public URL with `https`, otherwise login redirects will break.

---

## Option A — Managed Web Apps (Business / Cloud plan)

### 1. Create the MySQL database

In hPanel go to **Databases → Management**, create a database and user, and note the database name,
user, password and hostname. Then open **Remote MySQL** and allow access so you can run migrations
from your laptop (you can restrict or remove this afterwards).

### 2. Deploy the app

In hPanel go to **Websites → Add Website → Node.js app** (or the **Web Apps** section) and:

- Source: your GitHub repository, branch `main`
- Framework preset: **Next.js**
- Node.js version: **22**
- Build command: `npm run build`
- Start command: `npm run start`

Hostinger's flow expects a free domain slot, so if the domain is already attached to a site, remove
that site first.

### 3. Add environment variables

In the app's **Environment variables** panel add `DATABASE_URL`, `NEXTAUTH_SECRET` and `NEXTAUTH_URL`,
then redeploy.

### 4. Create the tables and the first admin

The simplest route is the ready-made script. In hPanel open **phpMyAdmin**, select your database,
go to the **SQL** tab, paste the whole of `mysql/schema.sql` and press **Go**. It creates every table
and a super admin (`admin@pumpmetrics.com` / `Admin@12345`) that you should change immediately after
your first login.

Alternatively, do the same thing with Prisma from your laptop, with `DATABASE_URL` pointing at the
Hostinger MySQL host:

```bash
DATABASE_URL="mysql://user:pass@HOSTINGER_MYSQL_HOST:3306/dbname" npx prisma db push
DATABASE_URL="mysql://user:pass@HOSTINGER_MYSQL_HOST:3306/dbname" \
SEED_ADMIN_EMAIL=admin@yourdomain.com SEED_ADMIN_PASSWORD='a-strong-password' \
npm run db:seed
```

Log in at `https://yourdomain.com/login` and change the admin password.

---

## Option B — VPS

### 1. Provision

Create a KVM VPS with Ubuntu 22.04/24.04, then SSH in as root.

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs mysql-server nginx git
npm install -g pm2
```

### 2. MySQL

```bash
mysql_secure_installation
mysql -u root -p
```

```sql
CREATE DATABASE pumpmetrics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pumpmetrics'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON pumpmetrics.* TO 'pumpmetrics'@'localhost';
FLUSH PRIVILEGES;
```

Keeping the user on `localhost` means MySQL is never exposed to the internet.

### 3. App

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/YOUR_USER/pumpmetrics.git pumpmetrics
cd pumpmetrics
cp .env.production.example .env   # then edit .env with real values
npm ci
mysql -u root -p pumpmetrics < mysql/schema.sql   # tables + first super admin
npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

`ecosystem.config.js` in this repo runs the app on port 3000 and restarts it on reboot.

### 4. nginx + SSL

Create `/etc/nginx/sites-available/pumpmetrics`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/pumpmetrics /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

`X-Forwarded-Proto` matters: without it NextAuth builds `http://` callback URLs behind the proxy.

### 5. Firewall

```bash
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Do **not** open port 3306.

### Redeploying

```bash
cd /var/www/pumpmetrics && git pull && npm ci && npx prisma db push && npm run build && pm2 reload pumpmetrics
```

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Login succeeds then bounces back to `/login` | `NEXTAUTH_URL` doesn't match the real URL, or `NEXTAUTH_SECRET` is missing |
| `PrismaClientInitializationError` | `DATABASE_URL` wrong, or the MySQL user isn't allowed from the app host |
| Build fails on `prisma generate` | Node version below 20.19 — switch the app to Node 22 |
| 502 from nginx | The PM2 process isn't running; check `pm2 logs pumpmetrics` |
| Redirect loop over HTTPS | `proxy_set_header X-Forwarded-Proto $scheme;` missing from nginx |
