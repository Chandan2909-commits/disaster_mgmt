"""
DisasterMgmt Research Paper Prototype - Local Companion Agent
Loopback-only (127.0.0.1:8765) automation & message delivery verification service.

FEATURES:
- Persistent Chrome User Profile (.chrome_profile) so WhatsApp login is saved across sessions.
- Direct phone number dispatch (https://web.whatsapp.com/send?phone=...) or contact search.
- Configurable SEND ACTION (Real transmission or draft preview).
- Live message delivery status checking (detecting single tick, double tick, or clock icons).
"""

import os
import sys
import time
import json
import re
import urllib.parse
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
last_sent_info = {
    "target": None,
    "message": None,
    "sent_at": None,
    "send_action_performed": False,
    "status": "NONE"
}

PROFILE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".chrome_profile"))
os.makedirs(PROFILE_DIR, exist_ok=True)

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
        # Persistent profile so user does NOT have to scan QR code every single run
        options.add_argument(f"--user-data-dir={PROFILE_DIR}")
        
        # Suppress noisy logging
        options.add_experimental_option('excludeSwitches', ['enable-logging'])

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
        "version": "1.1.0",
        "mode": "ACTIVE_DISPATCH_HARNESS",
        "selenium_available": selenium_ok,
        "browser_active": active_driver is not None,
        "profile_dir": PROFILE_DIR,
        "last_sent_status": last_sent_info.get("status", "NONE")
    }), 200


@app.route('/simulation/prepare-message', methods=['POST'])
@app.route('/simulation/send-message', methods=['POST'])
def send_or_prepare_message():
    global last_sent_info
    data = request.get_json(silent=True) or {}
    level = data.get("level", "0.00")
    status = data.get("status", "WARNING")
    score = data.get("score", "0.0")
    trend = data.get("trend", "RISING")
    chat_target = str(data.get("chat_target", "disaster_mgmt_research_paper")).strip()
    
    # Toggle whether to actually transmit or draft
    send_action = data.get("send_action", True) # Default to true when user asks to send
    custom_msg = data.get("message")

    if custom_msg:
        test_message = custom_msg
    else:
        test_message = (
            f"[SIMULATION ALERT] Flood monitoring demo: simulated river level is {level} m; "
            f"threat status is {status}; threat score is {score}; trend is {trend}. "
            f"Target: {chat_target}. Timestamp: {time.strftime('%H:%M:%S')}."
        )

    logger.info(f"Incoming dispatch request: Target={chat_target} SendAction={send_action}")

    driver = get_selenium_driver()
    if not driver:
        return jsonify({
            "success": False,
            "workflow_stage": "LOCAL_AGENT_FAILED",
            "message": "Selenium or Chrome WebDriver is not available. Please verify Chrome is installed.",
            "prepared_text": test_message
        }), 200

    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    try:
        # Check if chat_target is a phone number (e.g. +919876543210 or 9876543210)
        is_phone = bool(re.match(r'^\+?[0-9]{7,15}$', chat_target.replace(" ", "").replace("-", "")))
        clean_phone = re.sub(r'[^0-9]', '', chat_target) if is_phone else None

        if is_phone and len(clean_phone) >= 7:
            # Direct link navigation
            encoded_text = urllib.parse.quote(test_message)
            target_url = f"https://web.whatsapp.com/send?phone={clean_phone}&text={encoded_text}"
            logger.info(f"Navigating directly to phone chat: {target_url}")
            driver.get(target_url)

            # Wait for either QR Code, Invalid Phone alert, or Chat Compose Box
            time.sleep(3)
        else:
            # Regular contact or group name search
            if "web.whatsapp.com" not in driver.current_url:
                driver.get("https://web.whatsapp.com")
                logger.info("Opening WhatsApp Web...")

        # Wait up to 15 seconds for WhatsApp interface to load
        try:
            WebDriverWait(driver, 15).until(
                lambda d: d.find_elements(By.XPATH, '//div[@contenteditable="true"]') or 
                          d.find_elements(By.XPATH, '//canvas[@aria-label="Scan this QR code to use WhatsApp Web"]')
            )
        except Exception:
            pass

        # Check if awaiting QR code login
        qr_elements = driver.find_elements(By.XPATH, '//canvas[@aria-label="Scan this QR code to use WhatsApp Web"]')
        if qr_elements:
            last_sent_info["status"] = "AWAITING_QR_LOGIN"
            return jsonify({
                "success": False,
                "workflow_stage": "WAITING_FOR_WHATSAPP_LOGIN",
                "message": "WhatsApp Web is waiting for QR code login. Please scan the QR code on your phone to continue.",
                "prepared_text": test_message,
                "target": chat_target
            }), 200

        # Check if "Send message to" dialog is present (common when opened with send?text=...)
        dialog_elements = driver.find_elements(By.XPATH, '//div[@role="dialog"]')
        if dialog_elements:
            logger.info("Found 'Send message to' dialog in Selenium. Searching target contact...")
            try:
                # 1. Look for contact in the visible dialog list
                contact_nodes = driver.find_elements(By.XPATH, f'//div[@role="dialog"]//span[@title="{chat_target}"] | //div[@role="dialog"]//*[contains(text(), "{chat_target}")]')
                if contact_nodes:
                    contact_nodes[0].click()
                    logger.info(f"Clicked contact row for '{chat_target}' in dialog.")
                else:
                    # 2. Type into dialog search input
                    modal_inputs = driver.find_elements(By.XPATH, '//div[@role="dialog"]//input')
                    if modal_inputs:
                        modal_inputs[0].clear()
                        modal_inputs[0].send_keys(chat_target)
                        time.sleep(1.2)
                        filtered_contacts = driver.find_elements(By.XPATH, f'//div[@role="dialog"]//*[contains(text(), "{chat_target}")]')
                        if filtered_contacts:
                            filtered_contacts[0].click()
                time.sleep(0.8)
                # 3. Click green send button in dialog
                dialog_send = driver.find_elements(By.XPATH, '//div[@role="dialog"]//button[@aria-label="Send"] | //div[@role="dialog"]//span[@data-icon="send"]/ancestor::button')
                if dialog_send:
                    dialog_send[0].click()
                    logger.info("Clicked green send button inside 'Send message to' dialog!")
                    time.sleep(2.0)
                    last_sent_info = {
                        "target": chat_target,
                        "message": test_message,
                        "sent_at": time.strftime('%H:%M:%S'),
                        "send_action_performed": True,
                        "status": "SENT"
                    }
                    # Switch back to dashboard
                    try:
                        driver.execute_script("window.open('https://disastermgmt-chi.vercel.app/', '_blank');")
                        time.sleep(0.5)
                        driver.switch_to.window(driver.window_handles[-1])
                    except Exception:
                        pass
                    return jsonify({
                        "success": True,
                        "workflow_stage": "MESSAGE_SENT_SUCCESS",
                        "message": f"Message transmitted to '{chat_target}' and returned to dashboard.",
                        "chat_target": chat_target,
                        "prepared_text": test_message,
                        "is_sent": True
                    }), 200
            except Exception as e:
                logger.warning(f"Dialog handling error: {e}")

        # If not phone-direct and no modal, search for the contact in main search bar
        if not is_phone:
            try:
                # Find search box
                search_box = WebDriverWait(driver, 8).until(
                    EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@data-tab="3"] | //button[@aria-label="Search"]'))
                )
                search_box.click()
                time.sleep(0.5)
                # Select search input
                search_inputs = driver.find_elements(By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]')
                if search_inputs:
                    inp = search_inputs[0]
                    inp.clear()
                    inp.send_keys(chat_target)
                    time.sleep(1.5)
                    inp.send_keys(Keys.ENTER)
                    time.sleep(1.0)
            except Exception as e:
                logger.warning(f"Search box interaction warning: {e}")

        # Locate the compose box (data-tab="10" or main footer editable)
        compose_box = None
        try:
            compose_box = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((
                    By.XPATH,
                    '//footer//div[@contenteditable="true"] | //div[@contenteditable="true"][@data-tab="10"]'
                ))
            )
        except Exception as e:
            logger.warning(f"Compose box not found: {e}")
            last_sent_info["status"] = "CHAT_NOT_OPEN"
            return jsonify({
                "success": False,
                "workflow_stage": "CHAT_NOT_FOUND",
                "message": f"Could not find or open chat '{chat_target}'. Make sure the contact exists in WhatsApp or enter a full phone number with country code.",
                "prepared_text": test_message,
                "target": chat_target
            }), 200

        # Type message if not already populated by URL
        current_text = compose_box.text or ""
        if not current_text.strip():
            compose_box.click()
            time.sleep(0.3)
            compose_box.send_keys(test_message)
            time.sleep(0.5)

        # TRANSMISSION STEP
        if send_action:
            logger.info("Executing SEND action: pressing ENTER and clicking send button...")
            try:
                compose_box.send_keys(Keys.ENTER)
            except Exception:
                pass

            # Try clicking send button as backup
            try:
                send_btn = driver.find_elements(By.XPATH, '//button[@aria-label="Send"] | //span[@data-icon="send"]/parent::button')
                if send_btn:
                    send_btn[0].click()
            except Exception:
                pass

            time.sleep(2.0)
            last_sent_info = {
                "target": chat_target,
                "message": test_message,
                "sent_at": time.strftime('%H:%M:%S'),
                "send_action_performed": True,
                "status": "SENT"
            }

            # Once the message is sent, switch the tab back to the dashboard so the user returns to the UI
            try:
                logger.info("Message sent! Switching tab to https://disastermgmt-chi.vercel.app/ in the same opened browser...")
                driver.execute_script("window.open('https://disastermgmt-chi.vercel.app/', '_blank');")
                time.sleep(0.6)
                driver.switch_to.window(driver.window_handles[-1])
            except Exception as e:
                logger.warning(f"Could not switch tab to dashboard: {e}")

            return jsonify({
                "success": True,
                "workflow_stage": "MESSAGE_SENT_SUCCESS",
                "message": f"Message successfully transmitted to '{chat_target}' via WhatsApp Web.",
                "chat_target": chat_target,
                "prepared_text": test_message,
                "is_sent": True
            }), 200
        else:
            last_sent_info = {
                "target": chat_target,
                "message": test_message,
                "sent_at": time.strftime('%H:%M:%S'),
                "send_action_performed": False,
                "status": "DRAFT_PREPARED"
            }
            return jsonify({
                "success": True,
                "workflow_stage": "TEST_MESSAGE_PREPARED",
                "message": f"Message drafted in '{chat_target}' compose box. Send action skipped per draft mode.",
                "chat_target": chat_target,
                "prepared_text": test_message,
                "is_sent": False
            }), 200

    except Exception as e:
        logger.error(f"Error during WhatsApp automation: {e}")
        return jsonify({
            "success": False,
            "workflow_stage": "LOCAL_AGENT_FAILED",
            "error": str(e),
            "prepared_text": test_message
        }), 500


@app.route('/simulation/message-status', methods=['GET'])
def check_message_status():
    global active_driver, last_sent_info
    if not active_driver:
        return jsonify({
            "active": False,
            "browser_connected": False,
            "is_sent": last_sent_info.get("send_action_performed", False),
            "delivery_status": last_sent_info.get("status", "DISCONNECTED"),
            "status_label": "Local Selenium Browser is not connected",
            "last_target": last_sent_info.get("target"),
            "sent_at": last_sent_info.get("sent_at")
        }), 200

    driver = active_driver
    from selenium.webdriver.common.by import By

    try:
        # Check if WhatsApp Web is open
        if "web.whatsapp.com" not in driver.current_url:
            return jsonify({
                "active": True,
                "browser_connected": True,
                "is_sent": False,
                "delivery_status": "NOT_ON_WHATSAPP",
                "status_label": "Browser open, but not on WhatsApp Web"
            }), 200

        # Check if waiting for QR Code
        qr_elements = driver.find_elements(By.XPATH, '//canvas[@aria-label="Scan this QR code to use WhatsApp Web"]')
        if qr_elements:
            return jsonify({
                "active": True,
                "browser_connected": True,
                "is_sent": False,
                "delivery_status": "WAITING_FOR_QR",
                "status_label": "Scan WhatsApp Web QR code to log in"
            }), 200

        # Look for the last outgoing message in the chat
        outgoing_msgs = driver.find_elements(By.XPATH, '//div[contains(@class, "message-out")]')
        if not outgoing_msgs:
            # Check if compose box still has text
            compose_boxes = driver.find_elements(By.XPATH, '//footer//div[@contenteditable="true"]')
            has_draft = bool(compose_boxes and compose_boxes[0].text.strip())
            return jsonify({
                "active": True,
                "browser_connected": True,
                "is_sent": False,
                "delivery_status": "DRAFT_IN_COMPOSE" if has_draft else "NO_OUTGOING_MESSAGE",
                "status_label": "Draft sitting in compose box (Not sent yet)" if has_draft else "No outgoing message found in current chat",
                "last_target": last_sent_info.get("target")
            }), 200

        last_bubble = outgoing_msgs[-1]
        bubble_text = last_bubble.text or ""

        # Check ticks / status icon in last bubble
        # Blue double tick: data-icon="msg-dblcheck" with color or ack=read
        # Grey double tick: data-icon="msg-dblcheck"
        # Single tick: data-icon="msg-check"
        # Clock: data-icon="msg-time"
        has_dblcheck = bool(last_bubble.find_elements(By.XPATH, './/span[@data-icon="msg-dblcheck"]'))
        has_singlecheck = bool(last_bubble.find_elements(By.XPATH, './/span[@data-icon="msg-check"]'))
        has_clock = bool(last_bubble.find_elements(By.XPATH, './/span[@data-icon="msg-time"]'))

        delivery = "SENT"
        label = "Sent to WhatsApp Server (Single Tick)"

        if has_dblcheck:
            delivery = "DELIVERED"
            label = "Delivered to Recipient (Double Tick)"
        elif has_singlecheck:
            delivery = "SENT_SINGLE_TICK"
            label = "Sent to Server (Single Tick)"
        elif has_clock:
            delivery = "PENDING_CLOCK"
            label = "Sending... (Clock icon)"

        return jsonify({
            "active": True,
            "browser_connected": True,
            "is_sent": True,
            "delivery_status": delivery,
            "status_label": label,
            "last_message_preview": bubble_text[:80] if bubble_text else None,
            "last_target": last_sent_info.get("target"),
            "sent_at": last_sent_info.get("sent_at") or time.strftime('%H:%M:%S')
        }), 200

    except Exception as e:
        return jsonify({
            "active": True,
            "browser_connected": True,
            "is_sent": last_sent_info.get("send_action_performed", False),
            "delivery_status": "CHECK_ERROR",
            "status_label": f"Inspection error: {str(e)}"
        }), 200


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
    print("  DisasterMgmt Local Companion Agent v1.1                     ")
    print("  Listening on: http://127.0.0.1:8765                         ")
    print(f"  Chrome Profile: {PROFILE_DIR}                              ")
    print("  Endpoints:                                                 ")
    print("    - POST /simulation/send-message (Send to Contact / Phone)")
    print("    - GET  /simulation/message-status (Verify Sent Status)   ")
    print("==============================================================")
    app.run(host='127.0.0.1', port=8765, debug=False)
