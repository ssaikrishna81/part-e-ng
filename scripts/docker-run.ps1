<#
.SYNOPSIS
  Helper script for running the portal app inside Docker.

.DESCRIPTION
  Provides a few modes:
    dev  - run ng serve inside a Node container (interactive).
    prod - build the production image and serve it through nginx on port 8080.
    stop - stop any compose stacks launched by this script.
    clean - stop stacks and remove created volumes.
    help - print instructions.

.EXAMPLE
  pwsh -File scripts/docker-run.ps1 dev
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('help', 'dev', 'dev-opal', 'dev-vaccination', 'dev-water', 'dev-all', 'prod', 'stop', 'clean')]
    [string]
    $Mode = 'help'
)

function Test-CommandExists {
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    try {
        Get-Command -Name $Name -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

if (-not (Test-CommandExists -Name 'docker')) {
    Write-Error 'Docker CLI is not available. Install Docker Desktop and try again.'
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir '..')

$profilePathMap = @{
    'opal'        = Join-Path $projectRoot 'opal'
    'vaccination' = Join-Path $projectRoot 'vaccination'
    'water'       = Join-Path $projectRoot 'water'
}

function Invoke-DockerCompose {
    param(
        [Parameter(Mandatory)]
        [string]$ComposeFile,
        [Parameter(Mandatory)]
        [string[]]$ComposeArgs,
        [string[]]$Profiles = @()
    )

    $resolvedCompose = Join-Path $projectRoot $ComposeFile
    if (-not (Test-Path $resolvedCompose)) {
        throw "Compose file not found: $ComposeFile"
    }

    $args = @('compose', '-f', $resolvedCompose)

    foreach ($profile in $Profiles) {
        $args += @('--profile', $profile)
    }

    $args += $ComposeArgs
    Write-Host "→ docker $($args -join ' ')" -ForegroundColor Cyan
    & docker @args
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose command failed with exit code $LASTEXITCODE"
    }
}

function Resolve-Profiles {
    param(
        [Parameter(Mandatory)]
        [string[]]$Profiles
    )

    $active = @()
    foreach ($profile in $Profiles) {
        if ($profilePathMap.ContainsKey($profile)) {
            $expectedPath = $profilePathMap[$profile]
            if (Test-Path $expectedPath) {
                $active += $profile
            } else {
                Write-Warning "Skipping profile '$profile' because folder '$expectedPath' was not found."
            }
        } else {
            $active += $profile
        }
    }

    return ,$active
}

switch ($Mode) {
    'dev' {
        Write-Host 'Starting development server at http://localhost:4200 ... press Ctrl+C to stop.' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.dev.yml' -ComposeArgs @('up', '--build')
        break
    }
    'dev-opal' {
        $profiles = Resolve-Profiles -Profiles @('opal')
        if ($profiles.Count -eq 0) {
            Write-Warning 'No optional services were started; launching portal only.'
        }
        Write-Host 'Starting portal + Opal dev servers (http://localhost:4200 & http://localhost:5631) ...' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.dev.yml' -ComposeArgs @('up', '--build') -Profiles $profiles
        break
    }
    'dev-vaccination' {
        $profiles = Resolve-Profiles -Profiles @('vaccination')
        if ($profiles.Count -eq 0) {
            Write-Warning 'Vaccination service folder missing; launching portal only.'
        }
        Write-Host 'Starting portal + Vaccination dev servers (http://localhost:4200 & http://localhost:5632) ...' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.dev.yml' -ComposeArgs @('up', '--build') -Profiles $profiles
        break
    }
    'dev-water' {
        $profiles = Resolve-Profiles -Profiles @('water')
        if ($profiles.Count -eq 0) {
            Write-Warning 'Water service folder missing; launching portal only.'
        }
        Write-Host 'Starting portal + Water dev servers (http://localhost:4200 & http://localhost:5633) ...' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.dev.yml' -ComposeArgs @('up', '--build') -Profiles $profiles
        break
    }
    'dev-all' {
        $profiles = Resolve-Profiles -Profiles @('opal', 'vaccination', 'water')
        if ($profiles.Count -eq 0) {
            Write-Warning 'No optional service folders detected; launching portal only.'
        }
        Write-Host 'Starting portal plus all detected services ...' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.dev.yml' -ComposeArgs @('up', '--build') -Profiles $profiles
        break
    }
    'prod' {
        Write-Host 'Building production image and running it on http://localhost:8080 ...' -ForegroundColor Green
        Invoke-DockerCompose -ComposeFile 'docker-compose.prod.yml' -ComposeArgs @('up', '--build', '-d')
        Write-Host 'Run "pwsh -File scripts/docker-run.ps1 stop" to stop the container.'
        break
    }
    'stop' {
        Write-Host 'Stopping running compose stacks...' -ForegroundColor Yellow
        foreach ($compose in @('docker-compose.dev.yml', 'docker-compose.prod.yml')) {
            try {
                Invoke-DockerCompose -ComposeFile $compose -ComposeArgs @('down')
            } catch {
                Write-Verbose "Skip stopping stack for $compose: $($_.Exception.Message)"
            }
        }
        break
    }
    'clean' {
        Write-Host 'Stopping stacks and removing volumes...' -ForegroundColor Yellow
        foreach ($compose in @('docker-compose.dev.yml', 'docker-compose.prod.yml')) {
            try {
                Invoke-DockerCompose -ComposeFile $compose -ComposeArgs @('down', '-v')
            } catch {
                Write-Verbose "Skip cleaning stack for $compose: $($_.Exception.Message)"
            }
        }
        break
    }
    default {
        Write-Host "Usage: pwsh -File scripts/docker-run.ps1 <mode>" -ForegroundColor Cyan
        Write-Host 'Modes:'
        Write-Host '  dev   - run ng serve in Docker (http://localhost:4200)' -ForegroundColor Gray
        Write-Host '  prod  - build & run production nginx container (http://localhost:8080)' -ForegroundColor Gray
        Write-Host '  stop  - stop any running compose stacks' -ForegroundColor Gray
        Write-Host '  clean - stop stacks and remove named volumes' -ForegroundColor Gray
        Write-Host 'Examples:' -ForegroundColor Cyan
        Write-Host '  pwsh -File scripts/docker-run.ps1 dev'
        Write-Host '  pwsh -File scripts/docker-run.ps1 prod'
    }
}
