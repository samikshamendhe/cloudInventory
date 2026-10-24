"""Database configuration and SQLAlchemy session dependency."""

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""


DEFAULT_DATABASE_URL = (
    "sqlite:////data/cloudinventory.sqlite3"
    if os.path.isdir("/data")
    else "sqlite:///./cloudinventory.db"
)
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
_engine_options: dict = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **_engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """Provide one database session per request and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create tables if this is a fresh database."""
    # Import models here so SQLAlchemy knows about each mapped table.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
