"""Team invite emails via Resend. Free tier: 3000/mo, 100/day. No key = log-only."""
import logging
from datetime import datetime, timedelta, timezone

from app.config import get_settings

logger = logging.getLogger(__name__)


def build_invite_link(token: str) -> str:
    settings = get_settings()
    base = (settings.FRONTEND_URL or "http://localhost:3000").rstrip("/")
    return f"{base}/join/{token}"


def invite_expiry() -> datetime:
    settings = get_settings()
    days = max(1, int(getattr(settings, "INVITE_TOKEN_DAYS", 7) or 7))
    return datetime.now(timezone.utc) + timedelta(days=days)


def send_invite_email(to_email: str, workspace_name: str, inviter_email: str, link: str) -> bool:
    """Send invite. Returns True if sent (or logged in dev without key)."""
    settings = get_settings()
    api_key = (getattr(settings, "RESEND_API_KEY", "") or "").strip()
    from_email = getattr(settings, "INVITE_FROM_EMAIL", "Quello <invite@quello.dev>")
    subject = f"You've been invited to join {workspace_name} on Quello"
    html = (
        f"<p>You've been invited by {inviter_email} to join "
        f"<strong>{workspace_name}</strong> on Quello.</p>"
        f"<p><a href=\"{link}\">Join {workspace_name}</a></p>"
        f"<p>This link expires in 7 days. If you don't have an account, "
        f"register first with this email, then open the link again.</p>"
    )
    if not api_key:
        logger.info("RESEND_API_KEY missing — invite logged only: to=%s link=%s", to_email, link)
        print(f"[invite] to={to_email} workspace={workspace_name} link={link}")
        return True
    try:
        import resend
        resend.api_key = api_key
        resend.Emails.send({"from": from_email, "to": [to_email], "subject": subject, "html": html})
        return True
    except Exception as e:
        logger.warning("Resend invite failed to %s: %s", to_email, e)
        return False
