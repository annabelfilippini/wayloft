#!/usr/bin/env bash
# daily-community-scan.sh — Runs the community-monitor subagent via Claude Code
# Intended to be called by cron daily at 8:00 AM local time.

set -euo pipefail

# --- Config ---
PROJECT_DIR="/Users/annabelfilippini/Documents/AI-OS/projects/wayloft"
LOG_DIR="${PROJECT_DIR}/logs/community-scan"
CLAUDE_BIN="/Users/annabelfilippini/.local/bin/claude"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${LOG_DIR}/${DATE}.log"

# Ensure PATH includes pnpm and common tool locations
export PATH="/Users/annabelfilippini/Library/pnpm:/usr/local/bin:/usr/bin:/bin:${PATH}"

# --- Setup ---
mkdir -p "${LOG_DIR}"
mkdir -p "${PROJECT_DIR}/Research/community-intel"

echo "=== Community scan starting at $(date) ===" | tee -a "${LOG_FILE}"

# --- Run agent ---
cd "${PROJECT_DIR}"

"${CLAUDE_BIN}" -p \
  "Use the community-monitor agent to scan today's discussions across Reddit, Twitter, FlyerTalk, and competitor channels. Write the report to Research/community-intel/${DATE}.md" \
  --allowedTools "WebSearch,WebFetch,Read,Write,Grep,Glob" \
  >> "${LOG_FILE}" 2>&1

EXIT_CODE=$?

if [ ${EXIT_CODE} -eq 0 ]; then
  echo "=== Scan completed successfully at $(date) ===" | tee -a "${LOG_FILE}"
else
  echo "=== Scan FAILED (exit code ${EXIT_CODE}) at $(date) ===" | tee -a "${LOG_FILE}"
fi

exit ${EXIT_CODE}
