#!/bin/bash
# Auto-push Mission Control changes to GitHub
# Watches for file changes and commits/pushes automatically

PROJECT_DIR="$HOME/projects/mission-control"
GIT="/Applications/Xcode.app/Contents/Developer/usr/bin/git"
LOG="$HOME/projects/mission-control/scripts/auto-push.log"

cd "$PROJECT_DIR" || exit 1

echo "[$(date)] Auto-push watcher started" >> "$LOG"

# Use fswatch to monitor for changes (excludes node_modules, .git, .next, logs)
fswatch -o \
  --exclude "node_modules" \
  --exclude "\.git" \
  --exclude "\.next" \
  --exclude "auto-push\.log" \
  --exclude "\.swp" \
  --exclude "~$" \
  --latency 5 \
  "$PROJECT_DIR" | while read -r count; do

  cd "$PROJECT_DIR" || continue

  # Check if there's anything to commit
  if $GIT diff --quiet && $GIT diff --cached --quiet && [ -z "$($GIT ls-files --others --exclude-standard)" ]; then
    continue
  fi

  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  echo "[$TIMESTAMP] Changes detected, committing..." >> "$LOG"

  $GIT add -A
  $GIT commit -m "Auto-update: $TIMESTAMP" >> "$LOG" 2>&1
  $GIT push origin main >> "$LOG" 2>&1

  echo "[$TIMESTAMP] Pushed to GitHub" >> "$LOG"
done
