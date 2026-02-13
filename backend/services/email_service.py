"""Certificate email delivery service using smtplib."""

import logging
import smtplib
import time
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from sqlalchemy.orm import Session

from config import settings
from models import Certificate, Workshop

logger = logging.getLogger(__name__)

# Paths
MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"

# Safety limits
MAX_BATCH_SIZE = 1000
SEND_DELAY_SECONDS = 0.3


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_email_configured() -> bool:
    """Return True if SMTP settings are present."""
    return bool(settings.EMAIL_HOST and settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD)


def _build_email_message(
    cert: Certificate,
    workshop_name: str,
    png_path: Path,
) -> EmailMessage:
    """Build an EmailMessage with the certificate PNG attached."""
    msg = EmailMessage()
    msg["Subject"] = f"Your ACM Certificate - {workshop_name}"
    msg["From"] = settings.EMAIL_FROM or settings.EMAIL_USERNAME
    msg["To"] = cert.email

    verify_url = f"{settings.FRONTEND_VERIFY_URL}/{cert.verification_code}"

    body = (
        f"Dear {cert.recipient_name},\n\n"
        f"Congratulations on participating in {workshop_name}.\n"
        f"Please find your certificate attached.\n\n"
        f"You can verify your certificate here:\n"
        f"{verify_url}\n\n"
        f"Regards,\n"
        f"ACM Team"
    )
    msg.set_content(body)

    # Attach certificate PNG
    with open(png_path, "rb") as f:
        img_data = f.read()
    msg.add_attachment(
        img_data,
        maintype="image",
        subtype="png",
        filename=f"certificate-{cert.code}.png",
    )

    return msg


def _smtp_send(msg: EmailMessage) -> None:
    """Send an EmailMessage via SMTP."""
    if settings.EMAIL_USE_TLS:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.ehlo()
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
            server.send_message(msg)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def send_certificate_email(db: Session, certificate_id: str, force: bool = False) -> bool:
    """Send the certificate email for a single certificate.

    Returns True on success, False on failure. All errors are caught and logged.
    """
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        logger.error("Certificate %s not found", certificate_id)
        return False

    # Guard: must be generated
    if cert.status != "GENERATED":
        logger.warning("Certificate %s not generated yet (status=%s)", cert.code, cert.status)
        return False

    # Guard: file must exist
    if not cert.file_path:
        logger.warning("Certificate %s has no file_path", cert.code)
        return False

    png_path = MEDIA_DIR / cert.file_path
    if not png_path.exists():
        _mark_failed(db, cert, f"File not found: {cert.file_path}")
        return False

    # Guard: idempotency — skip if already sent (unless forced)
    if cert.email_status == "SENT" and not force:
        logger.info("Certificate %s already sent, skipping", cert.code)
        return True  # not an error, already done

    # Guard: email config
    if not _is_email_configured():
        _mark_failed(db, cert, "SMTP not configured (EMAIL_HOST / EMAIL_USERNAME / EMAIL_PASSWORD missing)")
        return False

    try:
        msg = _build_email_message(cert, cert.workshop_name, png_path)
        _smtp_send(msg)

        # Success
        cert.email_status = "SENT"
        cert.email_sent_at = datetime.utcnow()
        cert.email_error = None
        db.commit()
        logger.info("Email sent for certificate %s → %s", cert.code, cert.email)
        return True

    except smtplib.SMTPAuthenticationError as e:
        _mark_failed(db, cert, f"SMTP authentication failed: {e}")
        return False
    except smtplib.SMTPException as e:
        _mark_failed(db, cert, f"SMTP error: {e}")
        return False
    except FileNotFoundError as e:
        _mark_failed(db, cert, f"File not found: {e}")
        return False
    except Exception as e:
        _mark_failed(db, cert, f"Unexpected error: {e}")
        return False


def send_bulk_certificate_emails(
    db: Session,
    workshop_id: str,
    force: bool = False,
) -> dict:
    """Send emails for all generated certificates in a workshop.

    Returns {total, sent, skipped, failed}.
    """
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        logger.error("Workshop %s not found", workshop_id)
        return {"total": 0, "sent": 0, "skipped": 0, "failed": 0}

    # Build query for eligible certificates
    query = (
        db.query(Certificate)
        .filter(
            Certificate.workshop_name == workshop.title,
            Certificate.status == "GENERATED",
        )
    )
    if not force:
        query = query.filter(Certificate.email_status != "SENT")

    certs = query.limit(MAX_BATCH_SIZE).all()

    total = len(certs)
    sent = 0
    skipped = 0
    failed = 0

    for cert in certs:
        # Double-check idempotency inside the loop
        if cert.email_status == "SENT" and not force:
            skipped += 1
            continue

        result = send_certificate_email(db, cert.id, force=force)
        if result:
            sent += 1
        else:
            # Check if it was skipped (already sent) vs actually failed
            db.refresh(cert)
            if cert.email_status == "SENT":
                skipped += 1
            else:
                failed += 1

        # Rate limit
        time.sleep(SEND_DELAY_SECONDS)

    logger.info(
        "Bulk email for workshop %s: total=%d sent=%d skipped=%d failed=%d",
        workshop_id, total, sent, skipped, failed,
    )
    return {"total": total, "sent": sent, "skipped": skipped, "failed": failed}


def _mark_failed(db: Session, cert: Certificate, error_msg: str) -> None:
    """Mark a certificate email as FAILED with the given error message."""
    logger.error("Email failed for %s: %s", cert.code, error_msg)
    cert.email_status = "FAILED"
    cert.email_error = error_msg[:2000]  # Truncate to avoid huge DB entries
    db.commit()
