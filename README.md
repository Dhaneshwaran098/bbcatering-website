# Madurai Koorai Kadai — Website + Admin Dashboard

A catering website with a real admin login where you (or your staff) can:
- Add, edit, and delete **menu items and prices**
- Upload and delete **gallery photos**
- Edit **site settings** — phone, WhatsApp number, address, socials, and the homepage hero photo

Changes made in the admin panel appear on the public website **immediately** — no code editing required.

**This version has zero external dependencies.** No Express, no EJS, no Multer — it runs on plain Node.js using only built-in modules. That means **no `npm install` step at all** — just install Node.js and run it.

---

## 1. Run it (2 minutes)

**Requirement:** [Node.js](https://nodejs.org) version 18 or newer installed on your computer. Nothing else.

```bash
# 1. Generate your admin password hash (pick your own password)
node scripts/hash-password.js "yourChosenPassword"

# 2. Copy the environment template
cp .env.example .env

# 3. Open .env and paste in the ADMIN_PASSWORD_HASH line printed in step 1

# 4. Add a SESSION_SECRET to .env — any long random string works:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# copy that output into .env as SESSION_SECRET=...

# 5. Start the server — no install step needed
node server.js
```

Then open:
- **Public site:** http://localhost:3000
- **Admin login:** http://localhost:3000/admin/login (username: `admin`, password: whatever you chose in step 1)

---

## 2. Using the admin panel

Once logged in at `/admin` you'll see three sections:

- **Menu & Prices** — add a dish (name, category, price, unit like "per kg" or "per plate", spice level, photo), edit any existing dish, or delete one. Mark a dish "Featured" to have it show up in the "Popular Dishes" section on the homepage.
- **Gallery Photos** — upload a photo with a caption and category (dishes / prep / events / setups). It appears instantly in the public gallery with filtering already wired up.
- **Site Settings** — phone number, WhatsApp number, address, social links, Google Maps embed URL, and the homepage hero photo.

Photos are stored in `public/uploads/`. Menu, gallery and settings data are stored as simple JSON files in the `data/` folder — you can open and read them directly if you ever want to inspect or back up your content.

---

## 3. Deploying so it's live on the internet

You need a host that runs Node.js continuously (not static hosting). Good beginner-friendly options:

| Host | Notes |
|---|---|
| [Render.com](https://render.com) | Free tier available, easiest for beginners |
| [Railway.app](https://railway.app) | Simple, usage-based pricing |
| A VPS (DigitalOcean, Hostinger VPS, etc.) | More control, more setup |

General steps for Render/Railway:
1. Push this project to a GitHub repository (`.gitignore` already excludes your real `.env`).
2. Create a new "Web Service" and connect your repo.
3. Set the **Start Command** to `node server.js` (there's nothing to build/install).
4. Add your environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `PORT`) in the host's dashboard — never commit your real `.env`.
5. Deploy. Your admin panel will be at `https://your-app-url.com/admin/login`.

### Important: photo storage on hosting

Uploaded photos are saved to a folder on disk (`public/uploads/`). Some hosting platforms (including Render's free tier) use **ephemeral storage**, meaning uploaded files can be wiped on redeploy or restart. For a production catering site with real customer-facing photos, ask about **persistent disk storage** when you set up your host, or consider upgrading later to cloud storage (e.g. Cloudflare R2 or AWS S3) if photo loss becomes an issue. This doesn't affect local testing at all.

### Important: sessions reset on restart

Admin login sessions are stored in memory. If the server restarts (redeploy, crash, host sleep on free tiers), everyone gets logged out and needs to log in again. This is a reasonable trade-off for a small single-admin site — it's not a bug, just a limitation worth knowing about.

---

## 4. Security notes

- Change the default admin password immediately (step 1 above) — never leave an example password in place.
- Keep your `.env` file private. Never share it, screenshot it, or commit it to a public repository.
- Login attempts are throttled (max 8 attempts per 10 minutes per IP) to slow down guessing.
- Sessions expire after 8 hours of the cookie being issued.
- This is built for a small single-admin catering business. If you need multiple staff logins with different permissions down the line, that's a bigger upgrade — just ask.

---

## 5. Project structure

```
server.js               Main entry point — plain Node http server, no framework
lib/
  router.js              Tiny path-based router (replaces Express Router)
  template.js            EJS-compatible template engine with HTML escaping
  session.js             In-memory session store + cookie handling
  cookies.js             Cookie parse/serialize helpers
  bodyParser.js          Parses regular form POSTs (login, etc.)
  upload.js               Parses multipart/form-data uploads (replaces Multer)
  static.js               Serves the public/ folder (replaces express.static)
  store.js                Reads/writes the JSON data files
  password.js             Password hashing using Node's built-in crypto
  dotenv.js               Tiny .env file loader (replaces the dotenv package)
routes/
  site.js                 Public pages (home, about, services, menu, gallery, contact)
  auth.js                 Admin login/logout
  admin.js                Admin CRUD for menu, gallery, settings
middleware/
  requireAdmin.js          Blocks access to admin routes unless logged in
  upload.js                 Re-exports lib/upload.js
data/                      dishes.json, gallery.json, settings.json — your content
views/                      All page templates (EJS syntax)
views/admin/                Admin panel templates
public/                     CSS, JS, and uploaded photos
scripts/hash-password.js   One-time helper to generate your admin password hash
```

---

## 6. Why no dependencies?

This was originally built on Express + EJS + Multer + express-session, which is a completely standard, well-supported way to build something like this. It was rewritten to zero dependencies so it could be verified end-to-end (login, file uploads, CRUD, sessions) with real HTTP requests, rather than shipped as code that merely looks correct. Every route, the login flow, image uploads, edits, and deletes have been tested against the actual running server.
