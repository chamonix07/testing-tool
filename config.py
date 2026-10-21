import os
import json
import tempfile

IS_VERCEL = bool(os.environ.get("VERCEL"))
SETTINGS_FILE = os.path.join(tempfile.gettempdir(), "settings.json") if IS_VERCEL else "settings.json"
DEFAULT_DOWNLOADS = os.path.join(tempfile.gettempdir(), "downloads") if IS_VERCEL else os.path.abspath("downloads")

DEFAULT_SETTINGS = {
    "output_dir": DEFAULT_DOWNLOADS,
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
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, indent=4)
    except Exception:
        pass
    return current
