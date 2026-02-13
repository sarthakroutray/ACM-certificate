"""Server-side certificate image generation using Pillow."""

import logging
import os
from io import BytesIO
from pathlib import Path

import httpx
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session

from models import Certificate, CertificateTemplate, Workshop

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
MEDIA_DIR = Path(__file__).resolve().parent.parent / "media"
CERTIFICATES_DIR = MEDIA_DIR / "certificates"
FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"

# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------
# Map friendly names → .ttf filenames bundled in assets/fonts/
_FONT_MAP: dict[str, str] = {
    "Arial": "Arial.ttf",
    "Courier New": "cour.ttf",
    "Times New Roman": "times.ttf",
    "Roboto": "Roboto-Regular.ttf",
    "Inter": "Inter-Regular.ttf",
}

# Common system font directories (checked when local assets are missing)
_SYSTEM_FONT_DIRS: list[Path] = [
    Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts",  # Windows
    Path("/usr/share/fonts"),                                   # Linux
    Path("/usr/local/share/fonts"),                             # Linux alt
    Path("/System/Library/Fonts"),                              # macOS
]


def _get_font(family: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Return a Pillow font object, with robust fallback chain.

    1. Local assets/fonts/ directory
    2. System font directories (Windows, Linux, macOS)
    3. System font by exact name (Pillow internal lookup)
    4. Pillow's default font at the requested size (Pillow ≥ 10.1)
    """
    ttf_name = _FONT_MAP.get(family, f"{family}.ttf")

    # 1 – Local bundled fonts
    ttf_path = FONTS_DIR / ttf_name
    if ttf_path.is_file():
        try:
            return ImageFont.truetype(str(ttf_path), size)
        except (OSError, IOError):
            pass

    # 2 – System font directories
    for font_dir in _SYSTEM_FONT_DIRS:
        candidate = font_dir / ttf_name
        if candidate.is_file():
            try:
                return ImageFont.truetype(str(candidate), size)
            except (OSError, IOError):
                pass

    # 3 – Let Pillow try the name directly (works if font is registered)
    try:
        return ImageFont.truetype(family, size)
    except (OSError, IOError):
        pass

    # 4 – Sized default (Pillow ≥ 10.1 supports size param)
    logger.warning("Font '%s' not found anywhere, using default at size %d", family, size)
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        # Older Pillow without size param — bitmap font (not ideal but functional)
        return ImageFont.load_default()


def _alignment_anchor(alignment: str) -> str:
    """Return Pillow anchor string for the given alignment."""
    return {"left": "lm", "center": "mm", "right": "rm"}.get(alignment, "mm")


# ---------------------------------------------------------------------------
# Single certificate generation
# ---------------------------------------------------------------------------

def generate_single_certificate(db: Session, certificate_id: str) -> str | None:
    """
    Generate a PNG for one certificate.

    Returns the relative file_path on success, None on failure.
    """
    cert = db.query(Certificate).filter(Certificate.id == certificate_id).first()
    if not cert:
        logger.error("Certificate %s not found", certificate_id)
        return None

    # Already generated?
    if cert.status == "GENERATED" and cert.file_path:
        full = MEDIA_DIR / cert.file_path
        if full.exists():
            return cert.file_path

    # Find workshop + template
    workshop = (
        db.query(Workshop)
        .filter(Workshop.title == cert.workshop_name)
        .first()
    )
    if not workshop:
        logger.error("No workshop found for '%s'", cert.workshop_name)
        return None

    template: CertificateTemplate | None = (
        db.query(CertificateTemplate)
        .filter(CertificateTemplate.event_id == workshop.id)
        .order_by(CertificateTemplate.created_at.desc())
        .first()
    )
    if not template:
        logger.error("No template for workshop %s", workshop.id)
        return None

    try:
        return _render_certificate(db, cert, template)
    except Exception:
        logger.exception("Failed to render certificate %s", cert.code)
        return None


def _render_certificate(
    db: Session,
    cert: Certificate,
    tpl: CertificateTemplate,
) -> str:
    """Download template image, draw text, save PNG, update DB."""
    # 1 – Download template image
    with httpx.Client(timeout=30) as client:
        resp = client.get(tpl.image_url)
        resp.raise_for_status()

    img = Image.open(BytesIO(resp.content)).convert("RGBA")
    draw = ImageDraw.Draw(img)
    w, h = img.size

    # 2 – Draw name
    name_x = (tpl.name_x / 100) * w
    name_y = (tpl.name_y / 100) * h
    scale_factor = h / 500  # Editor preview height is ~500px
    name_font_size = max(1, int(tpl.name_font_size * scale_factor))
    name_font = _get_font(tpl.name_font_family, name_font_size)
    draw.text(
        (name_x, name_y),
        cert.recipient_name,
        font=name_font,
        fill=tpl.name_color,
        anchor=_alignment_anchor(tpl.name_alignment),
    )

    # 3 – Draw code
    code_x = (tpl.code_x / 100) * w
    code_y = (tpl.code_y / 100) * h
    code_font_size = max(1, int(tpl.code_font_size * scale_factor))
    code_font = _get_font(tpl.code_font_family, code_font_size)
    draw.text(
        (code_x, code_y),
        cert.code,
        font=code_font,
        fill=tpl.code_color,
        anchor=_alignment_anchor(tpl.code_alignment),
    )

    # 4 – Save
    CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{cert.code}.png"
    rel_path = f"certificates/{filename}"
    out_path = MEDIA_DIR / rel_path
    img.convert("RGB").save(str(out_path), "PNG", quality=95)

    # 5 – Update DB
    cert.file_path = rel_path
    cert.status = "GENERATED"
    db.commit()
    db.refresh(cert)

    logger.info("Generated %s → %s", cert.code, rel_path)
    return rel_path


# ---------------------------------------------------------------------------
# Bulk generation for a workshop
# ---------------------------------------------------------------------------

def generate_certificates_for_workshop(
    db: Session, workshop_id: str
) -> dict:
    """
    Generate certificates for all PENDING certs in a workshop.

    Returns {total, generated, skipped, failed}.
    """
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        return {"total": 0, "generated": 0, "skipped": 0, "failed": 0}

    certs = (
        db.query(Certificate)
        .filter(Certificate.workshop_name == workshop.title)
        .all()
    )

    total = len(certs)
    generated = 0
    skipped = 0
    failed = 0

    for cert in certs:
        if cert.status == "GENERATED" and cert.file_path:
            full = MEDIA_DIR / cert.file_path
            if full.exists():
                skipped += 1
                continue

        result = generate_single_certificate(db, cert.id)
        if result:
            generated += 1
        else:
            failed += 1

    return {"total": total, "generated": generated, "skipped": skipped, "failed": failed}
