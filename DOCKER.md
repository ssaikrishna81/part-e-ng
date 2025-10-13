# Docker Quickstart

This project includes two ready-to-use Docker workflows:

- **Development (live reload)** – Runs `ng serve` inside a Node container and exposes it on <http://localhost:4200>.
- **Production preview** – Builds the production bundle with the existing `Dockerfile` and serves it through nginx on <http://localhost:8080>.

Use the helper script to drive everything so you do not have to remember the commands.

## Prerequisites

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Start Docker Desktop so the Docker engine is running.
3. Install PowerShell 7 (`pwsh`) or use Windows PowerShell 5.1 – both work.

## One-liner helper script

```powershell
pwsh -File scripts/docker-run.ps1 help
```

The script accepts the following modes:

- `dev` – run the portal (Angular) dev server inside Docker.
- `dev-opal` – run portal + Opal (expects an `opal` folder beside this project) on ports 4200 & 5631.
- `dev-vaccination` – run portal + Vaccination service (expects `vaccination` folder) on ports 4200 & 5632.
- `dev-water` – run portal + Water service (expects `water` folder) on ports 4200 & 5633.
- `dev-all` – run portal + every optional service whose folder exists.
- `prod` – build & run the production nginx container.
- `stop` – stop any compose stacks started by the script.
- `clean` – stop stacks and remove named volumes.

### Development mode

```powershell
# Portal only
pwsh -File scripts/docker-run.ps1 dev

# Portal + Opal (requires ./opal)
pwsh -File scripts/docker-run.ps1 dev-opal

# Portal + Vaccination (requires ./vaccination)
pwsh -File scripts/docker-run.ps1 dev-vaccination

# Portal + Water (requires ./water)
pwsh -File scripts/docker-run.ps1 dev-water

# Portal + every detected service (./opal, ./vaccination, ./water)
pwsh -File scripts/docker-run.ps1 dev-all
```

What happens in each case:

1. A Node container installs dependencies (`npm ci`, falls back to `npm install`).
2. Your source folder(s) are mounted into the container(s), so changes trigger live reloads.
3. Visit the relevant ports in your browser: portal `http://localhost:4200`, Opal `http://localhost:5631`, Vaccination `http://localhost:5632`, Water `http://localhost:5633`.

If an optional service folder is missing, the script warns you and only the portal runs. Named Docker volumes cache each service’s `node_modules` directory to speed up restarts.

### Production preview

```powershell
pwsh -File scripts/docker-run.ps1 prod
```

What happens:

1. Docker builds the production image using the root `Dockerfile`.
2. nginx serves the compiled bundle on <http://localhost:8080>.
3. Run the following when you are done:

```powershell
pwsh -File scripts/docker-run.ps1 stop
```

## Optional: full-stack dev with extra services

The current repository only contains the portal application. If you later place additional services (e.g., an `opal` service) alongside it, you can extend the Docker Compose setup by adding new services to `docker-compose.dev.yml` or creating a separate compose file. The helper script already has clean/stop commands to manage extra stacks once they are defined.

## Troubleshooting

- **Docker command not found** – open Docker Desktop to start the engine before running the script.
- **Port already in use** – stop any local processes using ports `4200` or `8080`, then rerun the command.
- **Need to rebuild dependencies** – run `pwsh -File scripts/docker-run.ps1 clean` to remove cached volumes and reinstall packages on next start.
