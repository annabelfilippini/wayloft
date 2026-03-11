# Database Backup & Restore

## How backups work

A GitHub Actions workflow (`.github/workflows/db-backup.yml`) runs daily at 1 AM ET. It dumps roles, schema, and data from Supabase using the Supabase CLI, compresses them into a tarball, and uploads to Cloudflare R2.

Backups are stored at: `r2://[bucket]/db-backups/YYYY/MM/DD/wayloft-backup-[timestamp].tar.gz`

You can also trigger a backup manually from GitHub Actions → Database Backup → Run workflow.

## Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `SUPABASE_DB_URL` | Supabase Dashboard → Connect → Session mode pooler string (port 5432, IPv4-compatible) |
| `CF_ACCOUNT_ID` | Cloudflare Dashboard → Account ID (in sidebar or URL) |
| `CF_ACCESS_KEY_ID` | Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API Token |
| `CF_SECRET_ACCESS_KEY` | Same as above (shown once on creation) |
| `CF_BUCKET` | Name of your R2 bucket (create one first, e.g. `wayloft-backups`) |

### Getting the Supabase DB URL

1. Go to Supabase Dashboard → your project → click **Connect** (top bar)
2. Select **Session mode** (NOT transaction mode — pg_dump needs session mode)
3. Copy the connection string. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
4. This uses the Supavisor pooler which works over IPv4 (GitHub Actions runners don't reliably support IPv6)

### Setting up Cloudflare R2

1. Go to Cloudflare Dashboard → R2 Object Storage
2. Create a bucket (e.g. `wayloft-backups`)
3. Go to Manage R2 API Tokens → Create API Token
4. Grant Object Read & Write permissions on your bucket
5. Save the Access Key ID and Secret Access Key

## Restoring from backup

### 1. Download the backup

Using the Cloudflare Dashboard or wrangler CLI:
```bash
npx wrangler r2 object get wayloft-backups/db-backups/2026/03/11/wayloft-backup-2026-03-11_050000.tar.gz --file backup.tar.gz
```

### 2. Extract

```bash
tar -xzf backup.tar.gz
```

### 3. Restore to a new Supabase project

```bash
# Restore schema first
psql -h db.[ref].supabase.co -U postgres -d postgres -f schema.sql

# Then data
psql -h db.[ref].supabase.co -U postgres -d postgres -f data.sql
```

Or paste the SQL files into the Supabase Dashboard SQL Editor if you don't have direct DB access.

## Retention

R2 free tier includes 10 GB storage. At ~1-5 MB per daily backup, you get 2,000-10,000 days of backups before hitting the limit. No cleanup needed for a long time.

To add lifecycle rules later (e.g. delete backups older than 90 days), configure them in Cloudflare Dashboard → R2 → your bucket → Settings → Object lifecycle rules.

## Monitoring

Check GitHub Actions → Database Backup for run history. If a backup fails, GitHub will show the failure in the workflow run. Consider adding a notification (Slack/email) on failure once notification infrastructure is built.
