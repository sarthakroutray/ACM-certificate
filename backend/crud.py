from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Certificate, Workshop, Admin
from schemas import CertificateCreate, WorkshopCreate
from auth import hash_password, verify_password
import uuid
from datetime import datetime


# ============ Certificate CRUD ============

def create_certificate(db: Session, certificate_data: CertificateCreate) -> Certificate:
    """Create a new certificate"""
    # Generate unique code: ACM-YYYY-RANDOM if not provided
    if certificate_data.code:
        code = certificate_data.code
        # Check for duplicate code
        existing = db.query(Certificate).filter(Certificate.code == code).first()
        if existing:
            raise ValueError(f"Certificate code '{code}' already exists")
    else:
        current_year = datetime.now().year
        random_code = str(uuid.uuid4())[:8].upper()
        code = f"ACM-{current_year}-{random_code}"
    
    # Generate verification code
    verification_code = str(uuid.uuid4())
    
    db_certificate = Certificate(
        code=code,
        recipient_name=certificate_data.recipient_name,
        email=certificate_data.email,
        workshop_name=certificate_data.workshop_name,
        issue_date=certificate_data.issue_date,
        skills=certificate_data.skills,
        instructor=certificate_data.instructor,
        verification_code=verification_code,
    )
    db.add(db_certificate)
    db.commit()
    db.refresh(db_certificate)
    return db_certificate


def get_certificate_by_code(db: Session, code: str) -> Certificate | None:
    """Get certificate by code"""
    return db.query(Certificate).filter(Certificate.code == code).first()


def get_certificate_by_id(db: Session, certificate_id: str) -> Certificate | None:
    """Get certificate by ID"""
    return db.query(Certificate).filter(Certificate.id == certificate_id).first()


def get_certificates(db: Session, skip: int = 0, limit: int = 100) -> list[Certificate]:
    """Get all certificates"""
    return db.query(Certificate).offset(skip).limit(limit).all()


def get_certificates_by_email(db: Session, email: str) -> list[Certificate]:
    """Get all certificates for an email"""
    return db.query(Certificate).filter(Certificate.email == email).all()


def update_certificate(db: Session, certificate_id: str, update_data: dict) -> Certificate | None:
    """Update a certificate"""
    db_certificate = get_certificate_by_id(db, certificate_id)
    if not db_certificate:
        return None
    
    for key, value in update_data.items():
        if value is not None:
            setattr(db_certificate, key, value)
    
    db.commit()
    db.refresh(db_certificate)
    return db_certificate


def delete_certificate(db: Session, certificate_id: str) -> bool:
    """Delete a certificate"""
    db_certificate = get_certificate_by_id(db, certificate_id)
    if not db_certificate:
        return False
    
    db.delete(db_certificate)
    db.commit()
    return True


def get_certificates_count(db: Session) -> int:
    """Get total certificate count"""
    return db.query(func.count(Certificate.id)).scalar()


# ============ Workshop CRUD ============

def create_workshop(db: Session, workshop_data: WorkshopCreate) -> Workshop:
    """Create a new workshop"""
    db_workshop = Workshop(
        title=workshop_data.title,
        date=workshop_data.date,
        description=workshop_data.description,
        level=workshop_data.level,
        instructor=workshop_data.instructor,
        image=workshop_data.image,
    )
    db.add(db_workshop)
    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def get_workshop_by_id(db: Session, workshop_id: str) -> Workshop | None:
    """Get workshop by ID"""
    return db.query(Workshop).filter(Workshop.id == workshop_id).first()


def get_workshops(db: Session, skip: int = 0, limit: int = 100) -> list[Workshop]:
    """Get all workshops"""
    return db.query(Workshop).offset(skip).limit(limit).all()


def update_workshop(db: Session, workshop_id: str, update_data: dict) -> Workshop | None:
    """Update a workshop"""
    db_workshop = get_workshop_by_id(db, workshop_id)
    if not db_workshop:
        return None
    
    for key, value in update_data.items():
        if value is not None:
            setattr(db_workshop, key, value)
    
    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def delete_workshop(db: Session, workshop_id: str) -> bool:
    """Delete a workshop"""
    db_workshop = get_workshop_by_id(db, workshop_id)
    if not db_workshop:
        return False
    
    db.delete(db_workshop)
    db.commit()
    return True


# ============ Admin CRUD ============

def create_admin(db: Session, email: str, password: str) -> Admin:
    """Create a new admin"""
    hashed_password = hash_password(password)
    db_admin = Admin(
        email=email,
        hashed_password=hashed_password,
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def get_admin_by_email(db: Session, email: str) -> Admin | None:
    """Get admin by email"""
    return db.query(Admin).filter(Admin.email == email).first()


def get_admin_by_id(db: Session, admin_id: str) -> Admin | None:
    """Get admin by ID"""
    return db.query(Admin).filter(Admin.id == admin_id).first()


def authenticate_admin(db: Session, email: str, password: str) -> Admin | None:
    """Authenticate admin"""
    admin = get_admin_by_email(db, email)
    if not admin:
        return None
    if not verify_password(password, admin.hashed_password):
        return None
    return admin
