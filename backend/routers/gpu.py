"""
GPU router - all GPU-related API endpoints.
"""

import math
import re
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import GPU
from schemas import (
    GPUListResponse,
    GPUListItem,
    GPUDetail,
    ManufacturerListResponse,
    StatsResponse,
    CompareResponse,
)

router = APIRouter(prefix="/gpus", tags=["gpus"])


def _extract_memory_gb(memory_size: Optional[str]) -> Optional[float]:
    """Extract numeric GB value from memory size string like '8 GB'."""
    if not memory_size:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:GB|MB)", memory_size, re.IGNORECASE)
    if match:
        value = float(match.group(1))
        if "MB" in memory_size.upper():
            value = value / 1024
        return value
    return None


def _extract_year(release_date: Optional[str]) -> Optional[int]:
    """Extract 4-digit year from a date string."""
    if not release_date:
        return None
    match = re.search(r"(\d{4})", release_date)
    if match:
        return int(match.group(1))
    return None


@router.get("", response_model=GPUListResponse)
def list_gpus(
    search: Optional[str] = Query(None, description="Search by GPU name or chip"),
    manufacturer: Optional[str] = Query(None, description="Filter by manufacturer"),
    min_memory: Optional[float] = Query(None, description="Minimum VRAM in GB"),
    max_memory: Optional[float] = Query(None, description="Maximum VRAM in GB"),
    min_year: Optional[int] = Query(None, description="Minimum release year"),
    max_year: Optional[int] = Query(None, description="Maximum release year"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> GPUListResponse:
    query = db.query(GPU)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                GPU.name.ilike(search_term),
                GPU.gpu_chip.ilike(search_term),
                GPU.manufacturer.ilike(search_term),
            )
        )

    if manufacturer:
        query = query.filter(GPU.manufacturer.ilike(f"%{manufacturer}%"))

    # 최신순 정렬 (release_date 내림차순, null은 뒤로)
    all_gpus = query.order_by(GPU.release_date.desc().nulls_last()).all()

    # Memory and year filtering requires Python-side parsing since values are strings
    if min_memory is not None or max_memory is not None:
        filtered = []
        for gpu in all_gpus:
            gb = _extract_memory_gb(gpu.memory_size)
            if gb is None:
                continue
            if min_memory is not None and gb < min_memory:
                continue
            if max_memory is not None and gb > max_memory:
                continue
            filtered.append(gpu)
        all_gpus = filtered

    if min_year is not None or max_year is not None:
        filtered = []
        for gpu in all_gpus:
            yr = _extract_year(gpu.release_date)
            if yr is None:
                continue
            if min_year is not None and yr < min_year:
                continue
            if max_year is not None and yr > max_year:
                continue
            filtered.append(gpu)
        all_gpus = filtered

    total = len(all_gpus)
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    paginated = all_gpus[offset : offset + limit]

    return GPUListResponse(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        items=[GPUListItem.model_validate(g) for g in paginated],
    )


@router.get("/manufacturers", response_model=ManufacturerListResponse)
def list_manufacturers(db: Session = Depends(get_db)) -> ManufacturerListResponse:
    rows = (
        db.query(GPU.manufacturer)
        .filter(GPU.manufacturer.isnot(None))
        .filter(GPU.manufacturer != "")
        .distinct()
        .order_by(GPU.manufacturer)
        .all()
    )
    manufacturers = [r[0] for r in rows if r[0]]
    return ManufacturerListResponse(manufacturers=manufacturers)


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)) -> StatsResponse:
    total_gpus = db.query(func.count(GPU.id)).scalar() or 0
    total_manufacturers = (
        db.query(func.count(func.distinct(GPU.manufacturer)))
        .filter(GPU.manufacturer.isnot(None))
        .scalar()
        or 0
    )
    newest = (
        db.query(GPU.release_date)
        .filter(GPU.release_date.isnot(None))
        .order_by(GPU.release_date.desc())
        .first()
    )
    oldest = (
        db.query(GPU.release_date)
        .filter(GPU.release_date.isnot(None))
        .order_by(GPU.release_date.asc())
        .first()
    )
    return StatsResponse(
        total_gpus=total_gpus,
        total_manufacturers=total_manufacturers,
        newest_release=newest[0] if newest else None,
        oldest_release=oldest[0] if oldest else None,
    )


@router.get("/compare", response_model=CompareResponse)
def compare_gpus(
    ids: str = Query(..., description="Comma-separated GPU IDs, max 3"),
    db: Session = Depends(get_db),
) -> CompareResponse:
    try:
        id_list = [int(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids 파라미터는 숫자여야 합니다")

    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="최소 2개의 GPU ID가 필요합니다")
    if len(id_list) > 3:
        raise HTTPException(status_code=400, detail="최대 3개의 GPU만 비교할 수 있습니다")

    gpus = db.query(GPU).filter(GPU.id.in_(id_list)).all()
    if len(gpus) != len(id_list):
        raise HTTPException(status_code=404, detail="일부 GPU를 찾을 수 없습니다")

    gpu_map = {g.id: g for g in gpus}
    ordered = [gpu_map[i] for i in id_list if i in gpu_map]

    return CompareResponse(gpus=[GPUDetail.model_validate(g) for g in ordered])


@router.get("/{gpu_id}", response_model=GPUDetail)
def get_gpu(gpu_id: int, db: Session = Depends(get_db)) -> GPUDetail:
    gpu = db.query(GPU).filter(GPU.id == gpu_id).first()
    if gpu is None:
        raise HTTPException(status_code=404, detail="GPU를 찾을 수 없습니다")
    return GPUDetail.model_validate(gpu)
