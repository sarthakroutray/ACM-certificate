"""CRUD endpoints for certificate template metadata (positions) per event."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Admin, CertificateTemplate
from schemas import TemplateCreate, TemplateUpdate, TemplateResponse
from auth import get_current_admin
from database import get_db

router = APIRouter(prefix="/api/events", tags=["templates"])


@router.get("/{event_id}/templates", response_model=list[TemplateResponse])
def list_templates(event_id: str, db: Session = Depends(get_db)):
    """Return all saved templates for an event (public)."""
    return (
        db.query(CertificateTemplate)
        .filter(CertificateTemplate.event_id == event_id)
        .order_by(CertificateTemplate.created_at.desc())
        .all()
    )


@router.post("/{event_id}/templates", response_model=TemplateResponse, status_code=201)
def save_template(
    event_id: str,
    data: TemplateCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Create or update a template for a given image URL + event."""
    # Upsert: if a template with this event + image_url already exists, update it
    existing = (
        db.query(CertificateTemplate)
        .filter(
            CertificateTemplate.event_id == event_id,
            CertificateTemplate.image_url == data.image_url,
        )
        .first()
    )

    if existing:
        existing.name_x = data.name_placeholder.x
        existing.name_y = data.name_placeholder.y
        existing.name_font_size = data.name_placeholder.fontSize
        existing.name_font_family = data.name_placeholder.fontFamily
        existing.name_alignment = data.name_placeholder.alignment
        existing.name_color = data.name_placeholder.color
        existing.code_x = data.code_placeholder.x
        existing.code_y = data.code_placeholder.y
        existing.code_font_size = data.code_placeholder.fontSize
        existing.code_font_family = data.code_placeholder.fontFamily
        existing.code_alignment = data.code_placeholder.alignment
        existing.code_color = data.code_placeholder.color
        db.commit()
        db.refresh(existing)
        return existing

    template = CertificateTemplate(
        event_id=event_id,
        image_url=data.image_url,
        name_x=data.name_placeholder.x,
        name_y=data.name_placeholder.y,
        name_font_size=data.name_placeholder.fontSize,
        name_font_family=data.name_placeholder.fontFamily,
        name_alignment=data.name_placeholder.alignment,
        name_color=data.name_placeholder.color,
        code_x=data.code_placeholder.x,
        code_y=data.code_placeholder.y,
        code_font_size=data.code_placeholder.fontSize,
        code_font_family=data.code_placeholder.fontFamily,
        code_alignment=data.code_placeholder.alignment,
        code_color=data.code_placeholder.color,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{event_id}/templates/{template_id}")
def delete_template(
    event_id: str,
    template_id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Delete a template by ID."""
    template = (
        db.query(CertificateTemplate)
        .filter(
            CertificateTemplate.id == template_id,
            CertificateTemplate.event_id == event_id,
        )
        .first()
    )
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"success": True, "message": "Template deleted"}
