# PS8 repo — Tailwind v4 + React + FastAPI scaffold

This branch switches the frontend to Tailwind v4 (CLI build) and provides a FastAPI backend stub.

Frontend:
  cd frontend
  npm install
  npm run build:css
  npm run dev

Backend:
  python -m pip install -r backend/requirements.txt
  uvicorn backend.main:app --reload
