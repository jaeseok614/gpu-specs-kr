"""
Pydantic schemas for request/response validation.
"""

from typing import Optional, List
from pydantic import BaseModel


class GPUBase(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    architecture: Optional[str] = None
    gpu_chip: Optional[str] = None
    release_date: Optional[str] = None
    bus_interface: Optional[str] = None
    memory_size: Optional[str] = None
    memory_type: Optional[str] = None
    memory_bus: Optional[str] = None
    memory_bandwidth: Optional[str] = None
    gpu_clock: Optional[str] = None
    memory_clock: Optional[str] = None
    boost_clock: Optional[str] = None
    shaders: Optional[str] = None
    tmus: Optional[str] = None
    rops: Optional[str] = None
    tdp: Optional[str] = None
    process_node: Optional[str] = None
    transistors: Optional[str] = None
    die_size: Optional[str] = None
    source_url: Optional[str] = None


class GPUListItem(GPUBase):
    id: int

    model_config = {"from_attributes": True}


class GPUDetail(GPUBase):
    id: int

    model_config = {"from_attributes": True}


class GPUListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[GPUListItem]


class ManufacturerListResponse(BaseModel):
    manufacturers: List[str]


class StatsResponse(BaseModel):
    total_gpus: int
    total_manufacturers: int
    newest_release: Optional[str]
    oldest_release: Optional[str]


class CompareResponse(BaseModel):
    gpus: List[GPUDetail]
