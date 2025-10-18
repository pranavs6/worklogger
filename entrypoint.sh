#!/bin/bash
# entrypoint.sh
# Make executable: chmod +x entrypoint.sh
# Usage: ./entrypoint.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ----------------------------
# Function to kill process by port
# ----------------------------
kill_port() {
    PORT=$1
    # Check if lsof exists
    if ! command -v lsof >/dev/null 2>&1; then
        echo "⚠️ lsof not installed. Installing..."
        if [ -f /etc/debian_version ]; then
            sudo apt update && sudo apt install lsof -y
        else
            sudo yum install lsof -y
        fi
    fi

    PID=$(lsof -t -i :"$PORT")
    if [ -n "$PID" ]; then
        echo "Killing process on port $PORT (PID: $PID)..."
        kill -9 $PID
    else
        echo "No process running on port $PORT"
    fi
}

# Kill old processes
kill_port 5051
kill_port 3000

# ----------------------------
# Start Backend
# ----------------------------
echo "🚀 Starting backend..."
cd "$ROOT_DIR/backend" || exit

# Check for Python and pip
if ! command -v python3 >/dev/null 2>&1; then
    echo "Python3 not found. Installing..."
    if [ -f /etc/debian_version ]; then
        sudo apt update && sudo apt install python3 python3-venv python3-pip -y
    else
        sudo yum install python3 python3-venv python3-pip -y
    fi
fi

# Create virtual environment if not present
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Run backend with Python in nohup
BACKEND_LOG="$ROOT_DIR/backend/worklog.log"
nohup python app.py > "$BACKEND_LOG" 2>&1 &
echo "✅ Backend started on port 5051 (logs: $BACKEND_LOG)"

# ----------------------------
# Start Frontend
# ----------------------------
echo "🌐 Starting frontend..."
cd "$ROOT_DIR/frontend" || exit

# Install Node.js and npm if missing
if ! command -v npm >/dev/null 2>&1; then
    echo "Node.js/npm not found. Installing..."
    if [ -f /etc/debian_version ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi

# Install Node dependencies
npm install

# Run frontend in dev mode with nohup
FRONTEND_LOG="$ROOT_DIR/frontend/frontend.log"
nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
echo "✅ Frontend started on port 3000 (logs: $FRONTEND_LOG)"

echo "🎉 All services are running in nohup mode!"
