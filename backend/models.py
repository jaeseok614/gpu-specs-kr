"""
SQLAlchemy ORM models.
"""

from sqlalchemy import Column, Float, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from database import Base


class GPU(Base):
    __tablename__ = "gpus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    manufacturer = Column(String(100), index=True)
    architecture = Column(String(100))
    gpu_chip = Column(String(100))
    release_date = Column(String(50))
    bus_interface = Column(String(100))
    memory_size = Column(String(50))
    memory_type = Column(String(50))
    memory_bus = Column(String(50))
    memory_bandwidth = Column(String(50))
    gpu_clock = Column(String(50))
    memory_clock = Column(String(50))
    boost_clock = Column(String(50))
    shaders = Column(String(50))
    tmus = Column(String(50))
    rops = Column(String(50))
    tdp = Column(String(50))
    process_node = Column(String(50))
    transistors = Column(String(50))
    die_size = Column(String(50))
    source_url = Column(String(512))
    source_page = Column(String(255))
    collected_at = Column(String(30))
    last_updated_at = Column(String(30))
    memory_size_gb = Column(Float)
    tdp_w = Column(Integer)
    release_year = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
