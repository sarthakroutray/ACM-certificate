import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import Admin, Certificate, Workshop
from schemas import (
    CertificateCreate,
    CertificateResponse,
    CertificateVerifyResponse,
    CertificateUpdate,
    BulkGenerateResponse,
    EmailStatusResponse,
    BulkEmailResponse,
)
from auth import get_current_admin
from crud import (
    create_certificate,
    get_certificate_by_code,
    get_certificate_by_id,
    get_certificates,
    get_certificates_by_email,
    update_certificate,
    delete_certificate,
    get_certificates_count,
)
from services.certificate_service import (
    generate_single_certificate,
    generate_certificates_for_workshop,
    MEDIA_DIR,
)
from services.zip_service import create_certificates_zip
from services.email_service import send_certificate_email, send_bulk_certificate_emails

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


# ============ Public Routes ============

@router.get("/verify/{code}", response_model=CertificateVerifyResponse)
def verify_certificate(code: str, db: Session = Depends(get_db)):
    """
    Verify a certificate by code (public endpoint)
    Returns only public information
    """
    certificate = get_certificate_by_code(db, code.upper())
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    
    if not certificate.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate is not valid",
        )
    
    # Build certificate_url if file exists
    cert_url = None
    if certificate.file_path:
        full = MEDIA_DIR / certificate.file_path
        if full.exists():
            cert_url = f"/media/{certificate.file_path}"

    return CertificateVerifyResponse(
        id=certificate.id,
        code=certificate.code,
        recipient_name=certificate.recipient_name,
        workshop_name=certificate.workshop_name,
        issue_date=certificate.issue_date,
        skills=certificate.skills,
        instructor=certificate.instructor,
        is_verified=certificate.is_verified,
        certificate_url=cert_url,
    )


@router.get("/search", response_model=list[CertificateVerifyResponse])
def search_certificates(
    email: str = Query(..., description="Email to search"),
    db: Session = Depends(get_db),
):
    """
    Search certificates by email (public endpoint)
    Returns only public information
    """
    certificates = get_certificates_by_email(db, email)
    return certificates


# ============ Admin Routes ============

@router.post("/", response_model=CertificateResponse)
def create_new_certificate(
    certificate_data: CertificateCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Create a new certificate (admin only)
    """
    certificate = create_certificate(db, certificate_data)
    return certificate


@router.get("/admin/all", response_model=list[CertificateResponse])
def get_all_certificates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get all certificates (admin only)
    """
    certificates = get_certificates(db, skip=skip, limit=limit)
    return certificates


@router.get("/admin/stats")
def get_certificate_stats(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get certificate statistics (admin only)
    """
    total = get_certificates_count(db)
    return {
        "total_certificates": total,
    }


@router.get("/admin/{certificate_id}", response_model=CertificateResponse)
def get_certificate_detail(
    certificate_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get a specific certificate (admin only)
    """
    certificate = get_certificate_by_id(db, certificate_id)
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    return certificate


@router.patch("/admin/{certificate_id}", response_model=CertificateResponse)
def update_certificate_details(
    certificate_id: str,
    certificate_update: CertificateUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Update a certificate (admin only)
    """
    certificate = update_certificate(
        db, certificate_id, certificate_update.model_dump(exclude_unset=True)
    )
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    return certificate


@router.delete("/admin/{certificate_id}")
def delete_certificate_by_id(
    certificate_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a certificate (admin only)
    """
    success = delete_certificate(db, certificate_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    return {"success": True, "message": "Certificate deleted successfully"}


@router.post("/admin/bulk-create")
def bulk_create_certificates(
    certificates_data: list[CertificateCreate],
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Create multiple certificates at once (admin only).
    Individual rows that fail (e.g. duplicate code) are reported
    without aborting the entire batch.
    """
    created_certificates = []
    errors = []
    for i, cert_data in enumerate(certificates_data):
        try:
            certificate = create_certificate(db, cert_data)
            created_certificates.append(certificate)
        except Exception as e:
            db.rollback()
            errors.append({
                "row": i + 1,
                "name": cert_data.recipient_name,
                "error": str(e),
            })
    
    return {
        "success": len(errors) == 0,
        "count": len(created_certificates),
        "certificates": created_certificates,
        "errors": errors,
    }


# ============ Generation Routes ============

@router.post("/admin/generate/{certificate_id}")
def generate_certificate(
    certificate_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Generate a single certificate image (admin only)
    """
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    result = generate_single_certificate(db, certificate_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate certificate. Check template exists for this workshop.",
        )
    return {"success": True, "file_path": result, "download_url": f"/media/{result}"}


@router.post("/admin/generate-workshop/{workshop_id}", response_model=BulkGenerateResponse)
def bulk_generate_certificates(
    workshop_id: str,
    background_tasks: BackgroundTasks,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Generate all pending certificates for a workshop (admin only).
    Runs synchronously for reliability.
    """
    result = generate_certificates_for_workshop(db, workshop_id)
    return BulkGenerateResponse(**result)


@router.get("/admin/download-zip/{workshop_id}")
def download_certificates_zip(
    workshop_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Download a ZIP of all generated certificates for a workshop (admin only)
    """
    buf = create_certificates_zip(db, workshop_id)
    if not buf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No generated certificates found for this workshop",
        )
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=certificates-{workshop_id[:8]}.zip"},
    )


@router.get("/download/{code}")
def download_certificate_by_code(
    code: str,
    db: Session = Depends(get_db),
):
    """
    Download a generated certificate PNG by code (public)
    """
    cert = get_certificate_by_code(db, code.upper())
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    if not cert.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate image has not been generated yet",
        )
    full_path = MEDIA_DIR / cert.file_path
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate file not found on disk",
        )
    return FileResponse(
        str(full_path),
        media_type="image/png",
        filename=f"certificate-{cert.code}.png",
    )


# ============ Email Routes ============

def _bg_send_single_email(certificate_id: str, force: bool) -> None:
    """Background task: send one email using a fresh DB session."""
    db = SessionLocal()
    try:
        send_certificate_email(db, certificate_id, force=force)
    except Exception:
        logger.exception("Background email send failed for %s", certificate_id)
    finally:
        db.close()


def _bg_send_workshop_emails(workshop_id: str, force: bool) -> None:
    """Background task: send bulk emails using a fresh DB session."""
    db = SessionLocal()
    try:
        send_bulk_certificate_emails(db, workshop_id, force=force)
    except Exception:
        logger.exception("Background bulk email failed for workshop %s", workshop_id)
    finally:
        db.close()


@router.post("/admin/send-email/{certificate_id}")
def send_email(
    certificate_id: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Re-send even if already SENT"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Send certificate email to recipient (admin only).
    Runs in background — returns immediately.
    """
    cert = get_certificate_by_id(db, certificate_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found",
        )
    if cert.status != "GENERATED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Certificate must be generated before sending email",
        )
    background_tasks.add_task(_bg_send_single_email, certificate_id, force)
    return {"success": True, "message": "Email send initiated"}


@router.post("/admin/send-workshop-emails/{workshop_id}", response_model=BulkEmailResponse)
def send_workshop_emails(
    workshop_id: str,
    background_tasks: BackgroundTasks,
    force: bool = Query(False, description="Re-send even if already SENT"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Send emails for all generated certificates in a workshop (admin only).
    Runs in background — returns immediately.
    """
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found",
        )
    # Count eligible certificates
    total = (
        db.query(Certificate)
        .filter(
            Certificate.workshop_name == workshop.title,
            Certificate.status == "GENERATED",
        )
        .count()
    )
    background_tasks.add_task(_bg_send_workshop_emails, workshop_id, force)
    return BulkEmailResponse(
        message=f"Sending emails for {total} certificates in background",
        total=total,
    )


@router.get("/admin/email-status/{workshop_id}", response_model=EmailStatusResponse)
def get_email_status(
    workshop_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get email delivery status summary for a workshop (admin only).
    """
    workshop = db.query(Workshop).filter(Workshop.id == workshop_id).first()
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found",
        )
    certs = (
        db.query(Certificate)
        .filter(Certificate.workshop_name == workshop.title)
        .all()
    )
    total = len(certs)
    sent = sum(1 for c in certs if c.email_status == "SENT")
    failed = sum(1 for c in certs if c.email_status == "FAILED")
    pending = total - sent - failed

    return EmailStatusResponse(
        total=total, sent=sent, failed=failed, pending=pending
    )
