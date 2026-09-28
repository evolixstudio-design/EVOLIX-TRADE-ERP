# EVOLIX Trade ERP — Local Development Setup

## Prerequisites
- **Python:** 3.12+
- **Node.js:** v26+
- **npm:** v11+
- **PostgreSQL:** 18.x

## 1. Database Setup
Create local development and testing databases.
```sql
CREATE DATABASE evolix_trade_dev;
CREATE DATABASE evolix_trade_test;
```
*Never connect to production databases from a development environment.*

## 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables
Copy `.env.example` to `.env` and update `DATABASE_PASSWORD`:
```bash
cp .env.example .env
```

### Database Migrations
Run the initial baseline migration to set up Alembic:
```bash
alembic upgrade head
```

### Run Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API runs at `http://localhost:8000/api/v1`

## 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

## 4. Running Tests
### Backend
```bash
cd backend
pytest -v
```

### Frontend
```bash
cd frontend
npm run build  # also runs tsc typechecking
```
