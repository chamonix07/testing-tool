import os
import json

SETTINGS_FILE = "settings.json"

DEFAULT_SETTINGS = {
    "output_dir": os.path.abspath("downloads"),
    "naming_format": "datetime",  # "datetime", "content_name", "datetime_content"
    "save_caption": True,
    "session_id": "",
    "max_batch_items": 20
}

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {**DEFAULT_SETTINGS, **data}
        except Exception:
            return DEFAULT_SETTINGS.copy()
    return DEFAULT_SETTINGS.copy()

def save_settings(new_settings):
    current = load_settings()
    current.update(new_settings)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=4)
    return current
