# Construction Manager - Quick Start Script for Windows
# This script helps you start both backend and frontend servers easily

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Construction Manager - Starting Application  " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if dependencies are installed
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
if (!(Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
if (!(Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# Check if database exists, if not initialize it
$dbPath = Join-Path $backendPath "database.db"
if (!(Test-Path $dbPath)) {
    Write-Host "Database not found. Initializing..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm run init-db
    Write-Host "✓ Database initialized successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Database already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Starting Servers...                          " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend App:   http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Opening in separate windows..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; npm run dev"

# Wait a bit for frontend to start
Start-Sleep -Seconds 5

# Open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✓ Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Two PowerShell windows have been opened:" -ForegroundColor Cyan
Write-Host "  1. Backend Server (port 5000)" -ForegroundColor White
Write-Host "  2. Frontend App (port 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Keep both windows open while using the application." -ForegroundColor Yellow
Write-Host "Close both windows when you're done." -ForegroundColor Yellow
Write-Host ""
