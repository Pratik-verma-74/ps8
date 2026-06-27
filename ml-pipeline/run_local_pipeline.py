import uvicorn
import webbrowser
import threading
import time
import os

def open_browser():
    time.sleep(1.5)
    print("Opening futuristic ISRO AI Dashboard in your default web browser...")
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("="*60)
    print(" ISRO LUNAR SOUTH POLE AI MISSION CONTROL LAUNCHER ")
    print("="*60)
    print("Starting FastAPI Backend Server on port 8000...")
    
    # Start browser auto-launch thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run server
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
