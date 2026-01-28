# i-Ticket Deployment Guide

> **Production Server**: AWS EC2 (54.147.33.168) | **URL**: https://i-ticket.et
> **Stack**: Ubuntu 22.04, Node.js 20.20.0, PM2, Nginx, PostgreSQL 16.11

---

## 🚀 Standard Deployment Workflow

Follow these steps **IN ORDER** for every deployment:

### **Step 1: Build Locally & Verify** ✓

```bash
npm run build
```

**If build fails:**
- Read the error message carefully
- Fix the errors in your code
- Run `npm run build` again
- Repeat until build succeeds ✓

**If build succeeds:**
- ✅ Verify no errors in console
- ✅ Check that `.next` folder was created
- ✅ Proceed to Step 2

---

### **Step 2: Update Documentation** 📝

Update `CLAUDE.md`:
1. Increment version number (e.g., v2.10.2 → v2.10.3)
2. Add new entry to "RECENT UPDATES" section
3. Document all changes, fixes, and new features
4. Update file counts if files were added/removed

**Example changelog entry:**
```markdown
### Recent (v2.10.3 - Jan 28, 2026)

1. **Work Order Parts Request** - Mechanics can now request parts for work orders
2. **Fixed Query Bug** - Mechanics can see all assigned work orders
3. **UI Improvements** - Better contrast, seat selection simplified
```

---

### **Step 3: Commit & Push to GitHub** 🚀

```bash
# Stage all changes
git add .

# Commit with descriptive message (use heredoc for multi-line)
git commit -m "$(cat <<'EOF'
feat: v2.10.3 - Work order parts request & UI improvements

- Fixed mechanic work order JSON query bug
- Added parts request workflow for mechanics
- Improved homepage popular routes contrast
- Fixed bus type visibility in search/booking
- Simplified seat selection to two-state design
- Updated documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Push to GitHub
git push
```

**Commit Message Guidelines:**
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Include version in first line
- List all major changes
- Keep it concise but descriptive

---

### **Step 4: Deploy to AWS EC2 Server** 🌐

```bash
# 1. SSH into server
ssh -i mela-shared-key.pem ubuntu@54.147.33.168

# 2. Navigate to project directory
cd /var/www/i-ticket

# 3. Deploy (all-in-one command)
git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart i-ticket

# 4. Verify deployment
pm2 logs i-ticket --lines 50
```

**What each command does:**
- `git pull` - Pull latest code from GitHub
- `npm ci` - Clean install dependencies (faster than `npm install`)
- `npx prisma migrate deploy` - Apply database migrations
- `npm run build` - Build Next.js production bundle
- `pm2 restart i-ticket` - Restart the application

---

## 📋 Post-Deployment Verification

Check these after deployment:

```bash
# Check PM2 status (should show "online")
pm2 status

# View real-time logs
pm2 logs i-ticket

# Check for errors in last 100 lines
pm2 logs i-ticket --lines 100 --err
```

**Manual Testing Checklist:**
- [ ] Visit https://i-ticket.et (homepage loads)
- [ ] Login as different user roles
- [ ] Test new features added in this deployment
- [ ] Check browser console for errors
- [ ] Verify PM2 logs show no errors

---

## 🆘 Troubleshooting

### Build Fails on Server

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules
npm ci

# Try build again
npm run build
```

### PM2 Won't Restart

```bash
# Stop the process
pm2 stop i-ticket

# Delete and restart fresh
pm2 delete i-ticket
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Database Migration Issues

```bash
# Check migration status
npx prisma migrate status

# View migration history
npx prisma migrate resolve

# Force apply migration (if safe)
npx prisma migrate deploy --force
```

### Application Not Accessible

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Restart Nginx if needed
sudo systemctl restart nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

### Out of Memory on Build

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## 🔐 Server Access

**SSH Key Location:** `mela-shared-key.pem`
**Server IP:** 54.147.33.168
**User:** ubuntu
**Project Path:** `/var/www/i-ticket`

**Important Files:**
- PM2 config: `ecosystem.config.js`
- Nginx config: `/etc/nginx/sites-available/i-ticket.et`
- PostgreSQL: Port 5432 (localhost only)
- Environment: `.env` (contains DATABASE_URL, NEXTAUTH_SECRET, etc.)

---

## 📊 Monitoring Commands

```bash
# Server resources
htop

# Disk usage
df -h

# Application logs
pm2 logs i-ticket

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Check open connections
netstat -tlnp | grep :3000
```

---

## 🔄 Rollback Procedure

If deployment causes issues:

```bash
# 1. SSH to server
ssh -i mela-shared-key.pem ubuntu@54.147.33.168
cd /var/www/i-ticket

# 2. Find last working commit
git log --oneline -10

# 3. Rollback to previous commit
git reset --hard <commit-hash>

# 4. Rebuild and restart
npm ci && npm run build && pm2 restart i-ticket

# 5. Verify
pm2 logs i-ticket
```

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `pm2 status` | Check if app is running |
| `pm2 logs i-ticket` | View real-time logs |
| `pm2 restart i-ticket` | Restart application |
| `pm2 reload i-ticket` | Zero-downtime restart |
| `npm run build` | Build Next.js app |
| `npx prisma migrate deploy` | Apply database migrations |
| `git pull` | Get latest code |
| `npm ci` | Clean install dependencies |

---

## 📝 Notes

- Always build locally first to catch errors
- Never deploy without updating CLAUDE.md
- Keep commit messages descriptive
- Monitor logs after deployment for at least 5 minutes
- Test critical features after each deployment

---

**Last Updated:** January 28, 2026
**Maintained By:** i-Ticket Development Team
