# GPU 스펙 DB

한국어 GPU 스펙 데이터베이스 웹사이트입니다.  
TechPowerUp의 GPU 스펙 데이터를 크롤링하여 한국어 UI로 제공합니다.

## 프로젝트 구조

```
gpu-specs-kr/
├── crawler/
│   ├── scraper.py        # TechPowerUp 크롤러
│   └── requirements.txt
├── backend/
│   ├── main.py           # FastAPI 앱 진입점
│   ├── database.py       # SQLAlchemy 데이터베이스 설정
│   ├── models.py         # ORM 모델
│   ├── schemas.py        # Pydantic 스키마
│   ├── requirements.txt
│   └── routers/
│       └── gpu.py        # GPU API 라우터
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── api.js
        ├── index.js
        ├── index.css
        ├── components/
        │   ├── SearchBar.js
        │   ├── FilterPanel.js
        │   ├── GPUCard.js
        │   └── ComparePanel.js
        └── pages/
            ├── HomePage.js
            ├── GPUDetailPage.js
            └── ComparePage.js
```

## 실행 방법

### 1단계: 크롤러 실행 (데이터 수집)

```bash
cd crawler
pip install -r requirements.txt

# 전체 크롤링 (수천 개의 GPU, 시간이 오래 걸릴 수 있음)
python scraper.py

# 테스트용 소량 크롤링 (50개만)
python scraper.py --limit 50

# 요청 간격 조절 (기본 1.5초)
python scraper.py --delay 2.0
```

크롤링된 데이터는 `backend/gpu_specs.db`에 저장됩니다.

### 2단계: 백엔드 실행

```bash
cd backend
pip install -r requirements.txt

python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드는 `http://localhost:8000`에서 실행됩니다.  
API 문서: `http://localhost:8000/docs`

### 3단계: 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| GET | `/gpus` | GPU 목록 (검색, 필터, 페이지네이션) |
| GET | `/gpus/{id}` | GPU 상세 정보 |
| GET | `/gpus/compare?ids=1,2,3` | GPU 비교 (최대 3개) |
| GET | `/gpus/manufacturers` | 제조사 목록 |
| GET | `/gpus/stats` | 전체 통계 |

### 검색/필터 파라미터 (`GET /gpus`)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `search` | string | GPU 이름, 칩셋으로 검색 |
| `manufacturer` | string | 제조사 필터 |
| `min_memory` | float | 최소 VRAM (GB) |
| `max_memory` | float | 최대 VRAM (GB) |
| `min_year` | int | 최소 출시 연도 |
| `max_year` | int | 최대 출시 연도 |
| `page` | int | 페이지 번호 (기본: 1) |
| `limit` | int | 페이지당 항목 수 (기본: 20, 최대: 100) |

## 주의사항

- 이 프로젝트는 **개인 학습 목적**으로만 사용하세요.
- 크롤링 시 요청 간격을 충분히 두어 서버에 부담을 주지 마세요 (기본 1.5초).
- 수집한 데이터의 상업적 사용은 TechPowerUp의 이용약관을 확인하세요.

## 한국어 필드명

| 영문 필드 | 한국어 |
|-----------|--------|
| manufacturer | 제조사 |
| gpu_chip | GPU 칩 |
| release_date | 출시일 |
| bus_interface | 버스 인터페이스 |
| memory_size | 메모리 용량 |
| memory_type | 메모리 종류 |
| memory_bus | 메모리 버스 |
| gpu_clock | GPU 클럭 |
| boost_clock | 부스트 클럭 |
| memory_clock | 메모리 클럭 |
| shaders | 셰이더 프로세서 |
| tmus | TMU |
| rops | ROP |
| tdp | TDP (W) |
| process_node | 공정 |
| transistors | 트랜지스터 |
| die_size | 다이 크기 |
