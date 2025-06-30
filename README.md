# 🚽 Toilet Finder

위치 기반 화장실 찾기 웹 애플리케이션입니다. 클린 아키텍처를 기반으로 구축되었습니다.

## 🏗️ 아키텍처

이 프로젝트는 클린 아키텍처 원칙을 따라 Frontend와 Backend가 분리되어 있습니다.

### Frontend (React + Vite + TypeScript)

```
frontend/src/
├── presentation/     # 페이지, 컴포넌트
├── application/      # 상태관리, 유스케이스
├── domain/          # Entity, Model 정의
├── infrastructure/  # API 모듈 (axios 등)
└── config/          # 환경 설정
```

### Backend (Node.js + Express + TypeScript)

```
backend/src/
├── domain/          # 엔티티 및 순수 로직
├── application/     # 유스케이스
├── infrastructure/  # DB(PostgreSQL) 및 Overpass API 연동
├── interfaces/      # Express 라우터, DTO
└── config/          # 설정 및 의존성 주입
```

## 🚀 시작하기

### 필수 조건

-   Node.js 18+
-   Docker & Docker Compose
-   PostgreSQL (Docker로 실행 시 불필요)

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd toilet-finder
```

### 2. 환경변수 설정

```bash
# Backend 환경변수
cp backend/env.sample backend/.env

# Frontend 환경변수
cp frontend/env.sample frontend/.env
```

### 3. Docker로 전체 실행

```bash
npm run docker:up
```

또는 개별 실행:

### 4. 개별 실행

#### Backend 실행

```bash
cd backend
npm install
npm run dev
```

#### Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

#### Database 실행

```bash
# PostgreSQL 실행 (Docker)
docker run -d \
  --name toilet-finder-db \
  -e POSTGRES_DB=toilet_finder \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# 스키마 적용
psql -h localhost -U postgres -d toilet_finder -f database/schema.sql
```

## 📁 프로젝트 구조

```
toilet-finder/
├── frontend/           # React 애플리케이션
│   ├── src/
│   │   ├── presentation/   # UI 컴포넌트, 페이지
│   │   ├── application/    # 상태 관리, 유스케이스
│   │   ├── domain/        # 도메인 엔티티
│   │   ├── infrastructure/ # API 클라이언트
│   │   └── config/        # 설정
│   ├── package.json
│   └── vite.config.ts
├── backend/            # Express API 서버
│   ├── src/
│   │   ├── domain/        # 도메인 엔티티, 서비스
│   │   ├── application/   # 유스케이스
│   │   ├── infrastructure/ # DB, 외부 API
│   │   ├── interfaces/    # 컨트롤러, DTO, 라우터
│   │   └── config/        # 설정, DI
│   ├── package.json
│   └── tsconfig.json
├── database/           # PostgreSQL 스키마
│   └── schema.sql
├── infra/             # Docker 설정
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
└── package.json       # 루트 package.json (monorepo)
```

## 🔧 주요 기능

-   🗺️ **위치 기반 화장실 검색**: 현재 위치에서 가까운 화장실 찾기
-   📍 **지도 표시**: Leaflet을 사용한 인터랙티브 지도
-   ♿ **접근성 정보**: 휠체어 접근 가능 여부 표시
-   🕒 **운영시간 정보**: 화장실 운영시간 확인
-   📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 🛠️ 기술 스택

### Frontend

-   **React 18** - UI 라이브러리
-   **Vite** - 빌드 도구
-   **TypeScript** - 타입 안전성
-   **React Router** - 클라이언트 사이드 라우팅
-   **Leaflet** - 지도 라이브러리
-   **Axios** - HTTP 클라이언트

### Backend

-   **Node.js** - 런타임
-   **Express** - 웹 프레임워크
-   **TypeScript** - 타입 안전성
-   **PostgreSQL** - 데이터베이스
-   **pg** - PostgreSQL 클라이언트

### Infrastructure

-   **Docker** - 컨테이너화
-   **Docker Compose** - 멀티 컨테이너 관리

## 📡 API 엔드포인트

### 주변 화장실 검색

```
GET /api/toilets/nearby?latitude=37.5665&longitude=126.9780&radius=1000&limit=10
```

### 화장실 상세 정보

```
GET /api/toilets/:id
```

### 헬스 체크

```
GET /health
```

## 🌐 외부 데이터 소스

-   **Overpass API**: OpenStreetMap 데이터에서 화장실 정보 조회
-   **PostgreSQL**: 로컬 화장실 데이터 저장

## 🔄 개발 워크플로우

```bash
# 전체 개발 서버 실행
npm run dev

# Frontend만 실행
npm run dev:frontend

# Backend만 실행
npm run dev:backend

# Docker 환경 실행
npm run docker:up

# Docker 환경 종료
npm run docker:down

# 빌드
npm run build
```

## 🧪 테스트

```bash
# Backend 테스트
cd backend && npm test

# Frontend 테스트
cd frontend && npm test
```

## 📝 환경변수

### Backend (.env)

```
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=toilet_finder
DB_USER=postgres
DB_PASSWORD=password
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 문의

프로젝트 관련 문의사항은 Issues 탭을 이용해주세요.
