#!/bin/bash
# setup.sh
# YT MP3 Downloader — All-in-one installer & process manager
# Author: @nvim_code | Updated: 2025-12-05

set -euo pipefail

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
NC=$'\033[0m'

log()   { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }
info()  { echo -e "${CYAN}ℹ${NC}  $1"; }
title() { echo -e "${BOLD}${BLUE}==>${NC}${BOLD} $1${NC}"; }

APP="index.js"
PID_FILE="app.pid"
LOG_FILE="app.log"
VENV_DIR="./myenv"


# =============================================
#               HELP / USAGE FUNCTION
# =============================================
show_help() {
    cat << EOF

${BOLD}${CYAN}YT MP3 Downloader — Setup & Control Script${NC}
${BOLD}Fast • Secure • No ads • Open Source${NC}

${BOLD}Usage:${NC}
    ${BOLD}./setup.sh${NC}              → Run interactive setup (default)
    ${BOLD}./setup.sh start${NC}         → Start server in background (daemon)
    ${BOLD}./setup.sh stop${NC}          → Stop the running server
    ${BOLD}./setup.sh restart${NC}       → Restart the server
    ${BOLD}./setup.sh status${NC}        → Check if server is running
    ${BOLD}./setup.sh logs${NC}          → Show live logs (tail -f)
    ${BOLD}./setup.sh update${NC}        → Update yt-dlp + dependencies
    ${BOLD}./setup.sh help${NC}          → Show this help

${BOLD}How It Works (Technical Overview):${NC}
    • Node.js runs the web server (Express.js) on http://localhost:3000
    • Python virtual environment (./myenv) isolates yt-dlp & dependencies
    • yt-dlp downloads and extracts audio from YouTube
    • FFmpeg converts it to high-quality MP3 (320kbps when available)
    • Everything runs locally — no data leaves your machine
    • Fully offline-capable after first setup

${BOLD}First-Time Setup:${NC}
    1. Make script executable:
       ${YELLOW}chmod +x setup.sh${NC}
    2. Run it:
       ${YELLOW}./setup.sh${NC}
    3. It will:
       • Create Python virtual environment
       • Install/update yt-dlp
       • Install Node.js dependencies
       • Check FFmpeg
       • Offer to start the server

${BOLD}Support the developer:${NC}
      Star on GitHub: https://github.com/yourname/ytmp3-downloader
      Buy me a coffee: https://ko-fi.com/yourname

Enjoy your music offline!

EOF
    exit 0
}
# =============================================
#             PROCESS CONTROL FUNCTIONS
# =============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/myenv"

start_app() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        warn "Server is already running (PID: $(cat $PID_FILE))"
        echo "   Open: http://localhost:3000"
        exit 0
    fi

    title "Starting YT MP3 Downloader in background..."
    info "Activating virtual environment..."
    source "$VENV_DIR/bin/activate"
    export PATH="$VENV_DIR/bin:$PATH"
    nohup node "$APP" > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"

    log "Server started successfully!"
    info "PID: $PID"
    info "Logs: tail -f $LOG_FILE"
    info "URL: ${BOLD}http://localhost:3000${NC}"
    echo ""
    info "You can now close this terminal. The server runs in the background."
}

stop_app() {
    if [ ! -f "$PID_FILE" ]; then
        warn "No PID file found. Is the server running?"
        exit 1
    fi

    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        title "Stopping server (PID: $PID)..."
        kill "$PID"
        rm -f "$PID_FILE"
        log "Server stopped."
    else
        warn "PID file exists but process is not running. Cleaning up..."
        rm -f "$PID_FILE"
    fi
}

status_app() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log "Server is RUNNING (PID: $PID)"
            echo "   → http://localhost:3000"
        else
            warn "PID file exists but process is DEAD"
        fi
    else
        info "Server is NOT running"
    fi
}

logs_app() {
    title "Live logs (press Ctrl+C to exit)"
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "No log file yet. Start the server first."
    fi
}

restart_app() {
    title "Restarting server..."
    stop_app 2>/dev/null || true
    sleep 1
    start_app
}

update_deps() {
    title "Updating yt-dlp and dependencies..."
    source "$VENV_DIR/bin/activate"
    pip install --upgrade yt-dlp >/dev/null 2>&1 && log "yt-dlp updated"
    npm install >/dev/null 2>&1 && log "Node modules updated"
}

# =============================================
#               COMMAND ROUTER
# =============================================

if [[ $# -gt 0 ]]; then
    case "$1" in
        start)    start_app ;;
        stop)     stop_app ;;
        restart)  restart_app ;;
        status)   status_app ;;
        logs)     logs_app ;;
        update)   update_deps ;;
        help|--help|-h) show_help ;;
        *) echo "Unknown command: $1"; echo "Use './setup.sh help' for usage."; exit 1 ;;
    esac
    exit 0
fi

# =============================================
#               INTERACTIVE SETUP
# =============================================
echo ""
title "YT MP3 Downloader — Setup Wizard"
echo ""

# [Rest of your original checks here — unchanged, just moved down]
# ... (keep all your existing dependency checks)


if [ ! -d "$VENV_DIR" ]; then
    info "Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR" || fail "Failed to create venv. Install python3-venv"
fi

info "Activating virtual environment..."
source "$VENV_DIR/bin/activate"
export PATH="$VENV_DIR/bin:$PATH"

# Node.js
command -v node >/dev/null && log "Node.js $(node -v)" || fail "Node.js not found → https://nodejs.org"

# npm
command -v npm >/dev/null && log "npm v$(npm -v)" || fail "npm missing"

# yt-dlp
if command -v yt-dlp >/dev/null; then
    log "yt-dlp $(yt-dlp --version)"
    echo -n "Updating yt-dlp... "
    pip install --upgrade yt-dlp -q && echo "done"
else
    warn "Installing yt-dlp..."
    pip install yt-dlp -q
    log "yt-dlp installed"
fi

# FFmpeg
if command -v ffmpeg >/dev/null; then
    log "FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}')"
else
    warn "FFmpeg not in PATH — using bundled version if available"
    [ -f "node_modules/@ffmpeg-installer/ffmpeg/ffmpeg" ] && log "Bundled FFmpeg ready" || warn "Install FFmpeg for best results"
fi

# Node modules
[ -d "node_modules" ] && [ -f "package-lock.json" ] && log "Node modules ready" || {
    warn "Installing Node dependencies..."
    npm install --silent || fail "npm install failed"
    log "Dependencies installed"
}

echo ""
log "All requirements satisfied!"
echo ""
info "Server will run at: ${BOLD}http://localhost:3000${NC}"
info "Your MP3s will appear in: ${BOLD}./downloads${NC}"
echo ""

read -p "Start the server now in background? (y/n): " choice
case "$choice" in
    y|Y) start_app ;;
    *)   info "Run './setup.sh start' when ready" ;;
esac

echo ""
info "Tip: Use './setup.sh help' anytime for full commands"