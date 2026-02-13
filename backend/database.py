import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.ENV == "development",
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _column_exists(conn, table: str, column: str) -> bool:
    """Check whether a column exists in a table."""
    result = conn.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    )
    return result.fetchone() is not None


def upgrade_schema():
    """Add any missing columns to existing tables (lightweight migration).

    This keeps the live database in sync with the SQLAlchemy models without
    requiring a full migration framework such as Alembic.
    """
    migrations = [
        # certificates table
        ("certificates", "status", "ALTER TABLE certificates ADD COLUMN status VARCHAR NOT NULL DEFAULT 'PENDING'"),
        ("certificates", "file_path", "ALTER TABLE certificates ADD COLUMN file_path VARCHAR"),
        
        # certificate_templates table
        ("certificate_templates", "name_font_family", "ALTER TABLE certificate_templates ADD COLUMN name_font_family VARCHAR NOT NULL DEFAULT 'Arial'"),
        ("certificate_templates", "name_alignment", "ALTER TABLE certificate_templates ADD COLUMN name_alignment VARCHAR NOT NULL DEFAULT 'center'"),
        ("certificate_templates", "name_color", "ALTER TABLE certificate_templates ADD COLUMN name_color VARCHAR NOT NULL DEFAULT '#1a1a2e'"),
        ("certificate_templates", "code_font_family", "ALTER TABLE certificate_templates ADD COLUMN code_font_family VARCHAR NOT NULL DEFAULT 'Courier New'"),
        ("certificate_templates", "code_alignment", "ALTER TABLE certificate_templates ADD COLUMN code_alignment VARCHAR NOT NULL DEFAULT 'center'"),
        ("certificate_templates", "code_color", "ALTER TABLE certificate_templates ADD COLUMN code_color VARCHAR NOT NULL DEFAULT '#333333'"),
        
        # certificates – email tracking
        ("certificates", "email_status", "ALTER TABLE certificates ADD COLUMN email_status VARCHAR NOT NULL DEFAULT 'NOT_SENT'"),
        ("certificates", "email_sent_at", "ALTER TABLE certificates ADD COLUMN email_sent_at TIMESTAMP"),
        ("certificates", "email_error", "ALTER TABLE certificates ADD COLUMN email_error TEXT"),
    ]

    with engine.connect() as conn:
        for table, column, ddl in migrations:
            if not _column_exists(conn, table, column):
                conn.execute(text(ddl))
                logger.info("Added column %s.%s", table, column)

        # Indexes (idempotent via IF NOT EXISTS)
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_certificates_email_status "
            "ON certificates (email_status)"
        ))

        conn.commit()


def init_db():
    """Initialize database tables and run lightweight migrations."""
    Base.metadata.create_all(bind=engine)
    upgrade_schema()
