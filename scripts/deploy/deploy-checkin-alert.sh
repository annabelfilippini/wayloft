#!/bin/bash
# Deploy check-in alert to Hetzner (same box as annie-intake: 5.78.149.180)
#
# Prerequisites on Hetzner:
#   mkdir -p /opt/wayloft/scripts /opt/wayloft/logs
#   pip3 install httpx
#   Create /opt/wayloft/.env with:
#     SUPABASE_URL=https://wjloligimlldiljeyelh.supabase.co
#     SUPABASE_SERVICE_KEY=<service_role_key>
#     TELEGRAM_BOT_TOKEN=<annie bot token>
#     ANNABEL_CHAT_ID=8519804405
#     CHECKIN_LOG_PATH=/opt/wayloft/logs/checkin-alert.log

set -euo pipefail

REMOTE="root@5.78.149.180"

echo "→ Copying script..."
scp ../checkin-alert.py "$REMOTE:/opt/wayloft/scripts/checkin-alert.py"

echo "→ Copying systemd units..."
scp checkin-alert.service checkin-alert.timer "$REMOTE:/etc/systemd/system/"

echo "→ Enabling timer..."
ssh "$REMOTE" "systemctl daemon-reload && systemctl enable --now checkin-alert.timer"

echo "→ Checking timer status..."
ssh "$REMOTE" "systemctl status checkin-alert.timer --no-pager"

echo ""
echo "✓ Deployed. Timer runs every 15 minutes."
echo "  Test manually: ssh $REMOTE 'systemctl start checkin-alert.service && journalctl -u checkin-alert -n 20 --no-pager'"
