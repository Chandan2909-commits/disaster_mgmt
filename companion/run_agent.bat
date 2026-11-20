@echo off
title DisasterMgmt Local Companion Agent
echo Starting DisasterMgmt Companion Agent on http://127.0.0.1:8765 ...
python -m pip install -r requirements.txt
python agent.py
pause
