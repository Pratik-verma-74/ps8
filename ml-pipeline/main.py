from fastapi import FastAPI

app = FastAPI()

@app.get('/')
def read_root():
    return {'message': 'ISRO Hackathon ML API is running'}