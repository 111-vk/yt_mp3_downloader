#!/bin/bash
# check-requirements.sh
# Author: @nvim_code
# Date: 2025-11-15
# Checks all dependencies for YT MP3 Downloader (Node.js + yt-dlp + Python + FFmpeg)
# Includes process manager: start/stop/status/restart system (daemon mode)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

APP="index.js"
PID_FILE="app.pid"
LOG_FILE="app.log"

start_app() {
    echo "Starting $APP in daemon mode..."

    nohup node "$APP" > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"

    echo "Started! PID: $PID"
    echo "Logs: $LOG_FILE"
    echo "the server started successfully. You can now close this window. The server will continue to run in the background."
}

stop_app() {
    if [ ! -f "$PID_FILE" ]; then
        echo "No PID file found. App may not be running."
        exit 1
    fi

    PID=$(cat "$PID_FILE")

    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping process $PID..."
        kill "$PID"
        rm -f "$PID_FILE"
        echo "Stopped."
    else
        echo "Process not running. Cleaning PID file."
        rm -f "$PID_FILE"
    fi
}

status_app() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Running (PID: $PID)"
        else
            echo "PID file exists but process is dead."
        fi
    else
        echo "Not running."
    fi
}

restart_app() {
    stop_app
    sleep 1
    start_app
}

# Allow command-line controls:
# ./check-requirements.sh start|stop|status|restart
if [[ $# -gt 0 ]]; then
    case "$1" in
        start) start_app ;;
        stop) stop_app ;;
        status) status_app ;;
        restart) restart_app ;;
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            ;;
    esac
    exit 0
fi


echo "Checking YT MP3 Downloader Requirements..."
echo "----------------------------------------"

# Path to your virtual environment
VENV_DIR="myenv"

# Check if venv exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv "$VENV_DIR"
fi

# Activate it
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"


# 4. yt-dlp
if command -v yt-dlp >/dev/null 2>&1; then
    YTDLP_VER=$(yt-dlp --version)
    log "yt-dlp found: v$YTDLP_VER"

    echo -n "Checking for yt-dlp updates... "
    if yt-dlp -U --quiet >/dev/null 2>&1; then
        echo ""
        log "yt-dlp updated to latest version."
    else
        log "yt-dlp is up to date."
    fi
else
    warn "yt-dlp not installed. Installing now..."
    pip install --upgrade yt-dlp >/dev/null 2>&1

    if command -v yt-dlp >/dev/null 2>&1; then
        log "yt-dlp installed successfully."
    else
        fail "Failed to install yt-dlp."
    fi
fi



# 5. FFmpeg
if command -v ffmpeg >/dev/null 2>&1; then
    FFMPEG_VER=$(ffmpeg -version | head -n1 | cut -d' ' -f3)
    log "FFmpeg found: v$FFMPEG_VER"
else
    warn "FFmpeg not found in PATH."
    if [ -f "node_modules/@ffmpeg-installer/ffmpeg/ffmpeg" ]; then
        log "FFmpeg bundled via @ffmpeg-installer/ffmpeg"
    else
        fail "Install FFmpeg: sudo apt install ffmpeg | brew install ffmpeg"
    fi
fi

# 1. Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v | cut -d'v' -f2)
    log "Node.js found: v$NODE_VER"
else
    fail "Node.js is not installed. Install from https://nodejs.org"
fi

# 2. npm
if command -v npm >/dev/null 2>&1; then
    NPM_VER=$(npm -v)
    log "npm found: v$NPM_VER"
else
    fail "npm is not installed. Install with Node.js"
fi

# 7. Node modules
if [ -d "node_modules" ] && [ -f "package-lock.json" ]; then
    log "node_modules installed"
else
    warn "node_modules not found"
    echo "    Installing node modules..."
    npm install || fail "npm install failed"
    log "node_modules installed successfully"
fi


echo ""
read -p "All checks passed. Run app in daemon mode? (y/n): " choice

case "$choice" in
    y|Y )
        start_app
        ;;
    * )
        echo "Canceled."
        ;;
esac
