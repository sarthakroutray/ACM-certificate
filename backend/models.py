from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, Boolean, Table, JSON, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

# Association table for many-to-many relationship between workshops and certificates
workshop_certificate = Table(
    'workshop_certificate',
    Base.metadata,
    Column('workshop_id', String, ForeignKey('workshops.id')),
    Column('certificate_id', String, ForeignKey('certificates.id'))
)


class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    level = Column(String, nullable=False, default="Beginner")  # Beginner, Intermediate, Advanced
    instructor = Column(String, nullable=False)
    image = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    certificates = relationship(
        "Certificate",
        secondary=workshop_certificate,
        back_populates="workshops"
    )
    templates = relationship("CertificateTemplate", back_populates="workshop", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workshop(id={self.id}, title={self.title})>"


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Format: ACM-YYYY-CODE (e.g., ACM-2024-REACT)
    code = Column(String, unique=True, nullable=False, index=True)
    
    recipient_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    workshop_name = Column(String, nullable=False)
    issue_date = Column(String, nullable=False)
    skills = Column(JSON, default=list)  # List of skills
    instructor = Column(String, nullable=False)
    
    is_verified = Column(Boolean, default=True)
    verification_code = Column(String, unique=True, nullable=False, index=True)
    
    # Generation status
    status = Column(String, nullable=False, default="PENDING")  # PENDING | GENERATED
    file_path = Column(String, nullable=True)  # relative path e.g. certificates/ACM-2024-ABCD.png
    
    # Email delivery tracking
    email_status = Column(String, nullable=False, default="NOT_SENT", index=True)  # NOT_SENT | SENT | FAILED
    email_sent_at = Column(DateTime, nullable=True)
    email_error = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workshops = relationship(
        "Workshop",
        secondary=workshop_certificate,
        back_populates="certificates"
    )

    def __repr__(self):
        return f"<Certificate(id={self.id}, code={self.code})>"


class Admin(Base):
    __tablename__ = "admins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Admin(id={self.id}, email={self.email})>"


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey("workshops.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)

    # Name placeholder position (percentage 0-100 and font size in px)
    name_x = Column(Float, nullable=False, default=50)
    name_y = Column(Float, nullable=False, default=45)
    name_font_size = Column(Float, nullable=False, default=24)
    name_font_family = Column(String, nullable=False, default="Arial")
    name_alignment = Column(String, nullable=False, default="center")
    name_color = Column(String, nullable=False, default="#1a1a2e")

    # Code placeholder position
    code_x = Column(Float, nullable=False, default=50)
    code_y = Column(Float, nullable=False, default=70)
    code_font_size = Column(Float, nullable=False, default=16)
    code_font_family = Column(String, nullable=False, default="Courier New")
    code_alignment = Column(String, nullable=False, default="center")
    code_color = Column(String, nullable=False, default="#333333")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workshop = relationship("Workshop", back_populates="templates")

    def __repr__(self):
        return f"<CertificateTemplate(id={self.id}, event={self.event_id})>"

