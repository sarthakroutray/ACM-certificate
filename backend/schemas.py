from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


# Workshop Schemas
class WorkshopBase(BaseModel):
    title: str
    date: str
    description: Optional[str] = None
    level: str = "Beginner"
    instructor: str
    image: Optional[str] = None


class WorkshopCreate(WorkshopBase):
    pass


class WorkshopUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    instructor: Optional[str] = None
    image: Optional[str] = None


class WorkshopResponse(WorkshopBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Certificate Schemas
class CertificateBase(BaseModel):
    recipient_name: str
    email: EmailStr
    workshop_name: str
    issue_date: str
    skills: List[str]
    instructor: str


class CertificateCreate(CertificateBase):
    code: Optional[str] = None


class CertificateUpdate(BaseModel):
    recipient_name: Optional[str] = None
    workshop_name: Optional[str] = None
    issue_date: Optional[str] = None
    skills: Optional[List[str]] = None
    instructor: Optional[str] = None


class CertificateResponse(BaseModel):
    id: str
    code: str
    recipient_name: str
    email: str
    workshop_name: str
    issue_date: str
    skills: List[str]
    instructor: str
    is_verified: bool
    status: str = "PENDING"
    file_path: Optional[str] = None
    email_status: str = "NOT_SENT"
    email_sent_at: Optional[datetime] = None
    email_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificateVerifyResponse(BaseModel):
    """Response for certificate verification (public)"""
    id: str
    code: str
    recipient_name: str
    workshop_name: str
    issue_date: str
    skills: List[str]
    instructor: str
    is_verified: bool
    certificate_url: Optional[str] = None

    class Config:
        from_attributes = True


class BulkGenerateResponse(BaseModel):
    """Response for bulk certificate generation"""
    total: int
    generated: int
    skipped: int
    failed: int


class EmailStatusResponse(BaseModel):
    """Response for email status summary of a workshop"""
    total: int
    sent: int
    failed: int
    pending: int


class BulkEmailResponse(BaseModel):
    """Response for bulk email trigger"""
    message: str
    total: int


# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class AdminCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class AdminResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Bulk Certificate Creation
class BulkCertificateCreate(BaseModel):
    workshop_id: str
    certificates: List[CertificateCreate]


# Response Schemas
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


# Certificate Template Schemas
class PlaceholderPosition(BaseModel):
    x: float = 50
    y: float = 45
    fontSize: float = 24
    fontFamily: str = "Arial"
    alignment: str = "center"
    color: str = "#000000"


class TemplateCreate(BaseModel):
    image_url: str
    name_placeholder: PlaceholderPosition = PlaceholderPosition()
    code_placeholder: PlaceholderPosition = PlaceholderPosition(x=50, y=70, fontSize=16, fontFamily="Courier New", color="#333333")


class TemplateUpdate(BaseModel):
    name_placeholder: Optional[PlaceholderPosition] = None
    code_placeholder: Optional[PlaceholderPosition] = None


class TemplateResponse(BaseModel):
    id: str
    event_id: str
    image_url: str
    name_x: float
    name_y: float
    name_font_size: float
    name_font_family: str = "Arial"
    name_alignment: str = "center"
    name_color: str = "#1a1a2e"
    code_x: float
    code_y: float
    code_font_size: float
    code_font_family: str = "Courier New"
    code_alignment: str = "center"
    code_color: str = "#333333"

    class Config:
        from_attributes = True
