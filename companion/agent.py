"""
DisasterMgmt Research Paper Prototype - Local Companion Agent
Loopback-only (127.0.0.1:8765) restricted automation service.

SAFETY ENFORCEMENT:
- Operates in SIMULATION MODE ONLY.
- Can locate test research chat and type message draft into compose box.
- STRICTLY FORBIDDEN from clicking Send or submitting any real emergency message.
"""

import sys
import time
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("DisasterMgmtAgent")

app = Flask(__name__)
# Narrow CORS
CORS(app, resources={r"/*": {"origins": ["http://localhost:*", "http://127.0.0.1:*", "https://*.vercel.app"]}})

# Global automation handle
active_driver = None

ALLOWED_CHAT_TARGETS = ["disaster_mgmt_research_paper", "Disaster Mgmt Research", "Research Chat"]

def get_selenium_driver():
    global active_driver
    if active_driver is not None:
        try:
            active_driver.title
            return active_driver
        except Exception:
            active_driver = None

    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        from webdriver_manager.chrome import ChromeDriverManager

        options = Options()
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")
        # Keep user profile if specified, otherwise fresh
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        active_driver = driver
        return driver
    except Exception as e:
        logger.error(f"Failed to initialize Selenium WebDriver: {e}")
        return None


@app.route('/health', methods=['GET'])
def health():
    selenium_ok = False
    try:
        import selenium
        selenium_ok = True
    except ImportError:
        selenium_ok = False

    return jsonify({
        "status": "online",
        "agent": "DisasterMgmt Local Companion",
        "version": "1.0.0",
        "mode": "RESEARCH_SIMULATION_ONLY",
        "safety_guardrails": "SEND_ACTION_PERMANENTLY_BLOCKED",
        "selenium_available": selenium_ok,
        "browser_active": active_driver is not None
    }), 200


@app.route('/simulation/prepare-message', methods=['POST'])
def prepare_message():
    data = request.get_json(silent=True) or {}
    level = data.get("level", "0.00")
    status = data.get("status", "WARNING")
    score = data.get("score", "0.0")
    trend = data.get("trend", "RISING")
    chat_target = data.get("chat_target", "disaster_mgmt_research_paper")

    # Safety check on destination chat
    if chat_target not in ALLOWED_CHAT_TARGETS:
        chat_target = ALLOWED_CHAT_TARGETS[0]

    # Required strict template
    test_message = (
        f"[SIMULATION — NOT SENT] Flood monitoring demo: simulated river level is {level} m; "
        f"threat status is {status}; threat score is {score}; trend is {trend}. "
        f"This is a research prototype and not a real emergency warning."
    )

    logger.info(f"Incoming simulation prepare request: Level={level}m Status={status} Target={chat_target}")

    try:
        driver = get_selenium_driver()
        if not driver:
            return jsonify({
                "success": False,
                "workflow_stage": "LOCAL_AGENT_FAILED",
                "message": "Selenium or Chrome WebDriver is not installed or available. Falling back to in-app simulation.",
                "prepared_text": test_message
            }), 200

        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        # 1. Open WhatsApp Web
        if "web.whatsapp.com" not in driver.current_url:
            driver.get("https://web.whatsapp.com")
            logger.info("Opened WhatsApp Web. Waiting for user session...")

        # 2. Wait up to 10 seconds for main pane / search box
        search_box = None
        try:
            search_box = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="3"] | //button[@aria-label="Search"]'))
            )
        except Exception:
            logger.warning("WhatsApp Web not logged in or search box not immediately visible.")
            return jsonify({
                "success": True,
                "workflow_stage": "WAITING_FOR_WHATSAPP_LOGIN",
                "message": "WhatsApp Web opened. Scan QR code or log in to allow chat search.",
                "prepared_text": test_message
            }), 200

        # 3. Locate search box & search for research chat
        try:
            search_input = driver.find_element(By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]')
            search_input.click()
            search_input.clear()
            search_input.send_keys(chat_target)
            time.sleep(1.5)
            search_input.send_keys(Keys.ENTER)
        except Exception as e:
            logger.info(f"Searching chat by alternative selector: {e}")

        # 4. Prepare message in compose box
        try:
            compose_box = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="10"] | //footer//div[@contenteditable="true"]'))
            )
            compose_box.click()
            # Send message text WITHOUT pressing enter or clicking send!
            compose_box.send_keys(test_message)
            logger.info("Message draft typed into compose box successfully. SEND ACTION OMITTED PER SAFETY POLICY.")
            return jsonify({
                "success": True,
                "workflow_stage": "TEST_MESSAGE_PREPARED",
                "message": "Test message drafted in research chat. Stopped safely before transmission.",
                "chat_target": chat_target,
                "prepared_text": test_message,
                "send_blocked": True
            }), 200
        except Exception as e:
            logger.warning(f"Could not locate compose box or chat '{chat_target}': {e}")
            return jsonify({
                "success": True,
                "workflow_stage": "CHAT_NOT_FOUND",
                "message": f"Browser opened WhatsApp Web, but test chat '{chat_target}' was not found. Please create a chat or group named '{chat_target}'.",
                "prepared_text": test_message
            }), 200

    except Exception as e:
        logger.error(f"Error during browser automation: {e}")
        return jsonify({
            "success": False,
            "workflow_stage": "LOCAL_AGENT_FAILED",
            "error": str(e),
            "prepared_text": test_message
        }), 500


@app.route('/simulation/stop', methods=['POST'])
def stop_automation():
    global active_driver
    if active_driver:
        try:
            active_driver.quit()
        except Exception:
            pass
        active_driver = None
    return jsonify({"status": "stopped", "message": "Browser session closed."}), 200


if __name__ == '__main__':
    print("==============================================================")
    print("  DisasterMgmt Local Companion Agent Starting                ")
    print("  Listening on: http://127.0.0.1:8765                        ")
    print("  Safety: Send button automation is HARD-BLOCKED.             ")
    print("==============================================================")
    app.run(host='127.0.0.1', port=8765, debug=False)
