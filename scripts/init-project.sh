#!/bin/bash

# Toilet Finder 프로젝트 초기화 스크립트

set -e  # 오류 발생 시 스크립트 중단

echo "🚽 Toilet Finder 프로젝트를 초기화합니다..."
echo ""

# Node.js 버전 확인
echo "🔍 Node.js 버전을 확인합니다..."
node_version=$(node --version)
echo "   현재 Node.js 버전: $node_version"

# Node.js 18+ 버전 확인
required_version="v18"
if [[ "$node_version" < "$required_version" ]]; then
    echo "❌ Node.js 18 이상이 필요합니다. 현재 버전: $node_version"
    echo "   https://nodejs.org 에서 최신 버전을 설치해주세요."
    exit 1
fi
echo "✅ Node.js 버전 확인 완료"
echo ""

# 환경변수 파일 설정
echo "📝 환경변수 파일을 설정합니다..."
if [ ! -f backend/.env ]; then
    cp backend/env.sample backend/.env
    echo "✅ Backend .env 파일 생성됨"
else
    echo "✅ Backend .env 파일이 이미 존재합니다"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/env.sample frontend/.env
    echo "✅ Frontend .env 파일 생성됨"
else
    echo "✅ Frontend .env 파일이 이미 존재합니다"
fi
echo ""

# 루트 dependencies 설치
echo "📦 루트 dependencies를 설치합니다..."
npm install --silent
echo "✅ 루트 dependencies 설치 완료"
echo ""

# Backend dependencies 설치
echo "📦 Backend dependencies를 설치합니다..."
cd backend
npm install --silent
echo "✅ Backend dependencies 설치 완료"
cd ..
echo ""

# Frontend dependencies 설치
echo "📦 Frontend dependencies를 설치합니다..."
cd frontend
npm install --silent
echo "✅ Frontend dependencies 설치 완료"
cd ..
echo ""

# Docker 확인
echo "🐳 Docker 환경을 확인합니다..."
if command -v docker &> /dev/null; then
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker가 실행 중입니다"
        
        if command -v docker-compose &> /dev/null; then
            echo "✅ Docker Compose를 사용할 수 있습니다"
        else
            echo "⚠️  Docker Compose가 설치되지 않았습니다"
            echo "   Docker Desktop을 사용하거나 별도로 설치해주세요"
        fi
    else
        echo "⚠️  Docker가 설치되어 있지만 실행되지 않았습니다"
        echo "   Docker를 시작해주세요"
    fi
else
    echo "⚠️  Docker가 설치되지 않았습니다"
    echo "   https://docker.com 에서 Docker Desktop을 설치해주세요"
fi
echo ""

echo "🎉 프로젝트 초기화가 완료되었습니다!"
echo ""
echo "🚀 다음 명령어로 프로젝트를 실행하세요:"
echo ""
echo "   📋 전체 Docker 환경 실행 (권장):"
echo "   npm run docker:up"
echo ""
echo "   📋 개별 실행:"
echo "   npm run dev          # Frontend + Backend 동시 실행"
echo "   npm run dev:frontend # Frontend만 실행"
echo "   npm run dev:backend  # Backend만 실행"
echo ""
echo "📍 접속 주소:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Health Check: http://localhost:8000/health"
echo ""
echo "💡 도움말:"
echo "   - 처음 실행 시 Docker 환경을 권장합니다 (데이터베이스 자동 설정)"
echo "   - 개별 실행 시 PostgreSQL을 수동으로 설정해야 합니다"
echo "   - 문제 발생 시 README.md를 참고해주세요"
echo "" 