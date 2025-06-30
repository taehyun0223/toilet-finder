# 🚀 Toilet Finder 실행 가이드

프로젝트를 실행하기 위한 기초 작업들을 안내합니다.

## ✅ 실행 전 체크리스트

### 1. 필수 환경 확인

#### Node.js (필수)

```bash
# Node.js 18+ 버전 필요
node --version  # v18.0.0 이상이어야 함
npm --version   # 최신 버전 확인
```

#### Docker (권장)

```bash
# Docker 설치 확인
docker --version
docker-compose --version

# Docker 실행 상태 확인
docker info
```

### 2. 프로젝트 초기화

#### 자동 초기화 (권장)

```bash
# 실행 권한 부여 (Linux/Mac)
chmod +x scripts/init-project.sh

# 초기화 스크립트 실행
./scripts/init-project.sh
```

#### 수동 초기화

```bash
# 1. 환경변수 파일 생성
cp backend/env.sample backend/.env
cp frontend/env.sample frontend/.env

# 2. 의존성 설치
npm install                    # 루트 dependencies
cd backend && npm install     # Backend dependencies
cd ../frontend && npm install # Frontend dependencies
cd ..
```

## 🚀 실행 방법

### 방법 1: Docker 환경 (권장)

```bash
# 전체 서비스 실행 (Frontend + Backend + PostgreSQL)
npm run docker:up

# 서비스 중지
npm run docker:down
```

**장점:**

-   데이터베이스 자동 설정
-   환경 일관성 보장
-   원클릭 실행

### 방법 2: 개별 실행

```bash
# 1. PostgreSQL 수동 설정 (필요한 경우)
docker run -d \
  --name toilet-finder-db \
  -e POSTGRES_DB=toilet_finder \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine

# 2. 스키마 적용
psql -h localhost -U postgres -d toilet_finder -f database/schema.sql

# 3. 애플리케이션 실행
npm run dev              # Frontend + Backend 동시 실행
# 또는
npm run dev:frontend     # Frontend만 (localhost:3000)
npm run dev:backend      # Backend만 (localhost:8000)
```

## 🔧 환경변수 설정

### Backend (.env)

```env
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

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🧪 실행 확인

### 1. 서비스 상태 확인

```bash
# Backend Health Check
curl http://localhost:8000/health

# Frontend 접속
open http://localhost:3000  # Mac
# 또는 브라우저에서 직접 접속
```

### 2. API 테스트

```bash
# 주변 화장실 검색 (서울 시청 기준)
curl "http://localhost:8000/api/toilets/nearby?latitude=37.5665&longitude=126.9780&radius=1000"
```

### 3. 데이터베이스 확인

```bash
# PostgreSQL 접속
psql -h localhost -U postgres -d toilet_finder

# 샘플 데이터 확인
SELECT COUNT(*) FROM toilets;
```

## ❗ 문제 해결

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000  # Frontend 포트
lsof -i :8000  # Backend 포트
lsof -i :5432  # PostgreSQL 포트

# 프로세스 종료
kill -9 <PID>
```

### Docker 관련

```bash
# Docker 컨테이너 정리
docker-compose -f infra/docker-compose.yml down -v
docker system prune -a

# 재시작
npm run docker:up
```

### 의존성 문제

```bash
# node_modules 정리 후 재설치
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 데이터베이스 연결 오류

```bash
# PostgreSQL 상태 확인
docker ps | grep postgres

# 로그 확인
docker logs toilet-finder-db
```

## 📍 접속 주소

| 서비스       | URL                          | 설명               |
| ------------ | ---------------------------- | ------------------ |
| Frontend     | http://localhost:3000        | React 애플리케이션 |
| Backend API  | http://localhost:8000        | Express API 서버   |
| Health Check | http://localhost:8000/health | 서버 상태 확인     |
| PostgreSQL   | localhost:5432               | 데이터베이스       |

## 🆘 도움이 필요한 경우

1. **README.md** 파일을 먼저 확인해주세요
2. **package.json** 스크립트를 확인해주세요
3. **로그**를 확인하여 오류 메시지를 파악해주세요
4. **Docker 로그**: `docker logs <container-name>`
5. **환경변수** 설정을 다시 확인해주세요
