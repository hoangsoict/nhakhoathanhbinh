#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${DEV_SERVER_STATE_DIR:-/tmp/nhakhoathanhbinh-dev}"
PID_FILE="$STATE_DIR/next-dev.pid"
LOG_FILE="$STATE_DIR/next-dev.log"
PORT="${PORT:-3002}"
DEV_SERVER_HOST="${DEV_SERVER_HOST:-0.0.0.0}"

if [ -d "$ROOT_DIR/.tools/node/bin" ]; then
  export PATH="$ROOT_DIR/.tools/node/bin:$PATH"
fi

is_running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

start_server() {
  mkdir -p "$STATE_DIR"

  if is_running; then
    echo "Dev server is already running."
    status_server
    return
  fi

  cd "$ROOT_DIR"
  nohup npm run dev -- --hostname "$DEV_SERVER_HOST" -p "$PORT" >"$LOG_FILE" 2>&1 &
  echo "$!" >"$PID_FILE"
  sleep 1

  if is_running; then
    echo "Dev server started."
    status_server
  else
    echo "Dev server failed to start. Log:"
    tail -n 40 "$LOG_FILE" || true
    exit 1
  fi
}

stop_server() {
  if ! is_running; then
    echo "Dev server is not running."
    rm -f "$PID_FILE"
    return
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  echo "Stopping dev server PID $pid..."
  kill "$pid" 2>/dev/null || true

  for _ in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$PID_FILE"
      echo "Dev server stopped."
      return
    fi
    sleep 0.5
  done

  echo "Force stopping dev server PID $pid..."
  kill -9 "$pid" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "Dev server stopped."
}

status_server() {
  if is_running; then
    echo "Status: running"
    echo "PID: $(cat "$PID_FILE")"
    echo "URL: http://localhost:$PORT"
    echo "Log: $LOG_FILE"
  else
    echo "Status: stopped"
    echo "Log: $LOG_FILE"
  fi
}

case "${1:-status}" in
  start)
    start_server
    ;;
  stop)
    stop_server
    ;;
  restart)
    stop_server
    start_server
    ;;
  status)
    status_server
    ;;
  logs)
    tail -n "${2:-80}" "$LOG_FILE"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [lines]}"
    exit 2
    ;;
esac
