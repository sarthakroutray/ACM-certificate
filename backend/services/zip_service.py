"""Create in-memory ZIP archives of generated certificate PNGs."""

import logging
import zipfile
from io import BytesIO
from pathlib import Path

from sqlalchemy.orm import Session

from models import Certificate, Workshop

logger = logging.getLogger(__name__)

MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"


def create_certificates_zip(db: Session, workshop_id: str) -> BytesIO | None:
    """
    Build a ZIP containing all generated certificate PNGs for a workshop.

    Returns a seeked-to-0 BytesIO on success, None if no files found.
    """
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        logger.error("Workshop %s not found", workshop_id)
        return None

    certs = (
        db.query(Certificate)
        .filter(
            Certificate.workshop_name == workshop.title,
            Certificate.status == "GENERATED",
            Certificate.file_path.isnot(None),
        )
        .all()
    )

    if not certs:
        return None

    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for cert in certs:
            full_path = MEDIA_DIR / cert.file_path
            if full_path.exists():
                arcname = f"{cert.recipient_name} - {cert.code}.png"
                zf.write(str(full_path), arcname)
            else:
                logger.warning("File missing for %s: %s", cert.code, full_path)

    buf.seek(0)
    return buf
