#!/usr/bin/env python3
"""
Wayloft Check-in Alert — runs every 15 minutes on Hetzner.

Queries the upcoming_flights view for flights where check-in is open
and no alert has been sent yet (checkin_alerted_at IS NULL).
After sending, marks the flight so it won't alert again.

Env vars (in /opt/wayloft/.env):
  SUPABASE_URL          — Wayloft Supabase project URL
  SUPABASE_SERVICE_KEY  — Service role key (bypasses RLS for cron reads)
  TELEGRAM_BOT_TOKEN    — Reuses Annie's bot token
  ANNABEL_CHAT_ID       — Telegram chat ID for alerts
"""

import os
import sys
import logging
from datetime import datetime, timezone

import httpx

# ── Config ──

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.environ.get("ANNABEL_CHAT_ID", "")

LOG_PATH = os.environ.get("CHECKIN_LOG_PATH", "/opt/wayloft/logs/checkin-alert.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_PATH, mode="a"),
    ] if os.path.isdir(os.path.dirname(LOG_PATH)) else [
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("checkin-alert")

AIRLINE_NAMES = {
    "southwest": "Southwest",
    "united": "United",
    "delta": "Delta",
    "frontier": "Frontier",
}

AIRLINE_EMOJI = {
    "southwest": "🟦",
    "united": "🔵",
    "delta": "🔷",
    "frontier": "🟢",
}


def get_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def query_checkin_ready_flights() -> list[dict]:
    """Fetch flights where check-in is open and no alert has been sent."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return []

    url = (
        f"{SUPABASE_URL}/rest/v1/upcoming_flights"
        f"?flight_status=eq.checkin_open"
        f"&checkin_alerted_at=is.null"
        f"&checkin_completed_at=is.null"
        f"&select=id,airline,origin,destination,departure_at,confirmation_number,passenger_name,miles_paid,booking_type,cabin_class,seat_preference"
    )

    try:
        resp = httpx.get(url, headers=get_headers(), timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        log.error(f"Supabase query failed: {e}")
        return []


def mark_alerted(flight_id: str) -> bool:
    """Set checkin_alerted_at on the flight to prevent duplicate alerts."""
    url = (
        f"{SUPABASE_URL}/rest/v1/user_flights"
        f"?id=eq.{flight_id}"
    )
    payload = {
        "checkin_alerted_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        resp = httpx.patch(url, json=payload, headers=get_headers(), timeout=10)
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"Failed to mark flight {flight_id} as alerted: {e}")
        return False


def send_telegram(text: str) -> bool:
    """Send a message via Telegram bot API."""
    if not TELEGRAM_TOKEN or not CHAT_ID:
        log.error("Missing TELEGRAM_BOT_TOKEN or ANNABEL_CHAT_ID")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
    }

    try:
        resp = httpx.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"Telegram send failed: {e}")
        return False


def format_alert(flight: dict) -> str:
    """Format a check-in alert message."""
    airline = flight.get("airline", "")
    emoji = AIRLINE_EMOJI.get(airline, "✈️")
    name = AIRLINE_NAMES.get(airline, airline.title())
    origin = flight.get("origin", "???")
    dest = flight.get("destination", "???")
    conf = flight.get("confirmation_number", "")
    passenger = flight.get("passenger_name", "")
    departure = flight.get("departure_at", "")

    # Format departure date
    dep_str = ""
    if departure:
        try:
            dt = datetime.fromisoformat(departure.replace("Z", "+00:00"))
            dep_str = dt.strftime("%a %b %-d")
        except ValueError:
            dep_str = departure[:10]

    lines = [
        f"{emoji} *CHECK-IN NOW OPEN*",
        f"",
        f"*{name}* {origin} → {dest}",
        f"📅 {dep_str}" if dep_str else None,
        f"👤 {passenger}",
        f"🔑 Confirmation: `{conf}`",
    ]

    # Southwest urgency
    if airline == "southwest":
        lines.append("")
        lines.append("⚡ *Check in NOW* for the best boarding position!")

    # Miles info
    if flight.get("booking_type") == "miles" and flight.get("miles_paid"):
        lines.append(f"💰 {flight['miles_paid']:,} miles paid")

    return "\n".join(line for line in lines if line is not None)


def main():
    log.info("Running check-in alert scan...")

    flights = query_checkin_ready_flights()

    if not flights:
        log.info("No flights needing alert.")
        return

    log.info(f"Found {len(flights)} flight(s) with check-in open.")

    for flight in flights:
        msg = format_alert(flight)
        success = send_telegram(msg)
        if success:
            mark_alerted(flight["id"])
            log.info(
                f"Alert sent + marked: {flight.get('airline')} {flight.get('origin')}->{flight.get('destination')} "
                f"conf={flight.get('confirmation_number')}"
            )
        else:
            log.error(f"Failed to send alert for flight {flight.get('id')}")


if __name__ == "__main__":
    main()
