# ACM Certificate System

A production-grade certificate management and generation system built for the ACM Student Chapter. This application allows administrators to design certificate templates, bulk-generate certificates for workshops via CSV, and distribute them via email to participants.

## Key Features

- **Admin Dashboard**: Secure login and management interface for admins.
- **Workshop Management**: Create and manage events/workshops.
- **Certificate Template Editor**:
  - Drag-and-drop interface for positioning verification code and name.
  - Custom font selection, size, color, and alignment.
  - Real-time preview.
- **Bulk Generation**:
  - Upload CSV files with participant data.
  - Generate hundreds of certificates in seconds using Python's Pillow library.
  - Download all certificates as a ZIP archive.
- **Email Delivery System**:
  - Send certificates directly to participants via SMTP.
  - Bulk email support with rate limiting and background task processing.
  - Email status tracking (Sent, Failed, Not Sent).
- **Public Verification**:
  - Unique verification code for every certificate.
  - Public verification portal to validate authenticity.
  - Download options for recipients.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (via SQLAlchemy)
- **Image Processing**: Pillow (PIL)
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: SMTP with BackgroundTasks

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL Database

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database and email credentials

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`.
Swagger documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Environment Variables

Configure the following in `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/acm_certificates

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin User (for initial setup)
ADMIN_EMAIL=admin@acmclub.com
ADMIN_PASSWORD=admin123

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_USE_TLS=true
FRONTEND_VERIFY_URL=http://localhost:5173/verify
```

## Project Structure

```
ACM-certificate/
├── backend/
│   ├── routers/         # API endpoints (auth, certificates, workshops)
│   ├── services/        # Business logic (image gen, email, zip)
│   ├── models.py        # SQLAlchemy database models
│   ├── schemas.py       # Pydantic data schemas
│   └── main.py          # App entry point
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Page views (AdminDashboard, Home, Verify)
    │   ├── services/    # API client functions
    │   └── context/     # React context (Auth)
    └── public/          # Static assets
```
