# Running the Opal UI (exact commands)

This file documents exact commands to run the Opal project for local development and Docker (dev and production). Use the sections below for step-by-step instructions. Commands are shown for Windows PowerShell (recommended) and generic Linux/macOS where relevant.

---

## Prerequisites

- Node.js (v18+ recommended) and npm
- Docker (for Docker sections)
- Git (to clone repository)

Run from the project root: `c:\Users\hp\service project\part-e-opal` (adjust path on your machine).

---

## 1) Quick local development (npm)

1. Install dependencies (only once or when package.json changes):

PowerShell:
```powershell
cd 'C:\Users\hp\service project\part-e-opal'
npm ci
```

2. Start development server (binds to all interfaces on port 5631):

PowerShell:
```powershell
npm start
# This runs: ng serve --host 0.0.0.0 --port 5631
```

3. Open in browser:

http://localhost:5631

Notes:
- The dev server supports live reload. Use Ctrl+C in the terminal to stop it.

---

## 2) Dev in Docker (recommended for consistent environment)

We provided `Dockerfile.dev` which runs `npm run start` inside a Node container.

1. Build the dev image (run from project root):

PowerShell:
```powershell
# Build the image named `opal-dev:local`
cd 'C:\Users\hp\service project\part-e-opal'
docker build -t opal-dev:local -f Dockerfile.dev .
```

2. Run the container and mount your workspace so code changes are visible inside the container:

PowerShell (path has spaces; use quotes):
```powershell
docker run --rm -p 5631:5631 -v 'C:\Users\hp\service project\part-e-opal':/app opal-dev:local
```

Explanation:
- `--rm` removes the container when it stops
- `-p 5631:5631` maps host port 5631 to container port 5631
- `-v 'C:\...':/app` mounts your project into the container so the dev server picks up edits

3. Open in browser: http://localhost:5631

Stop: Ctrl+C in the terminal running the container.

Troubleshooting notes for Windows Docker:
- If Docker cannot mount your drive, enable file sharing for the drive in Docker Desktop settings.

---

## 3) Production image (build + nginx)

Use the existing `Dockerfile` which builds a production bundle and serves it with nginx (container listens on port 80).

1. Build production image:

PowerShell:
```powershell
cd 'C:\Users\hp\service project\part-e-opal'
docker build -t opal-prod:local .
```

2. Run production container and map host port 5631 to nginx's port 80:

PowerShell:
```powershell
# map host 5631 -> container 80
docker run --rm -p 5631:80 opal-prod:local
```

3. Open in browser: http://localhost:5631

Notes:
- This serves the optimized built files. You do not need to run `npm start` inside the container.

---

## 4) Quick verification commands

Check that the app is reachable and the background image is served:

PowerShell:
```powershell
# Check dev or prod address
curl.exe -I http://localhost:5631/
# Check background image URL
curl.exe -I http://localhost:5631/assets/bg-portrait.jpg
```

You should see `HTTP/1.1 200 OK` for successful requests.

---

## 5) Optional: `docker-compose` (one command)

Create a `docker-compose.yml` if you want to simplify commands. Example (not included by default):

```yaml
version: '3.8'
services:
  opal-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    image: opal-dev:local
    ports:
      - "5631:5631"
    volumes:
      - ./:/app
    stdin_open: true
    tty: true

# Usage:
# docker compose up --build
# docker compose down
```

---

## 6) Short troubleshooting checklist

- If `curl` or browser returns `Cannot GET /assets/bg-portrait.jpg` or 404:
  - Ensure the file exists in `public/assets/bg-portrait.jpg` (or `src/assets` if you adjusted `angular.json`).
  - Restart the dev server or rebuild the production image.
- If Docker can't mount path on Windows: enable file sharing for the drive in Docker Desktop.
- If you need to change port: update `package.json` start script and any Docker run port mappings.

---

If you'd like, I can also add `start-dev.ps1` and `start-prod.ps1` scripts that run the build+run commands so contributors just double-click a file or run a single script.