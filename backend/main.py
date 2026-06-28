from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title='Lunar Analysis API')

class Health(BaseModel):
    status: str

@app.get('/', response_model=Health)
def root():
    return { 'status': 'ok' }

@app.get('/api/hello')
def hello():
    return { 'message': 'Hello from FastAPI backend' }

# To run: uvicorn backend.main:app --reload
