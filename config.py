import os
import json
import tempfile

IS_VERCEL = bool(os.environ.get("VERCEL"))
SETTINGS_FILE = os.path.join(tempfile.gettempdir(), "settings.json") if IS_VERCEL else "settings.json"
DEFAULT_DOWNLOADS = os.path.join(tempfile.gettempdir(), "downloads") if IS_VERCEL else os.path.abspath("downloads")
COOKIES_FILE = os.path.join(tempfile.gettempdir(), "cookies.txt") if IS_VERCEL else os.path.abspath("cookies.txt")

DEFAULT_SETTINGS = {
    "output_dir": DEFAULT_DOWNLOADS,
    "naming_format": "datetime",  # "datetime", "content_name", "datetime_content"
    "save_caption": True,
    "session_id": "",
    "max_batch_items": 20,
    "cookies_mode": "auto",       # "auto", "browser", "file", "none"
    "cookies_browser": "firefox", # "firefox", "edge", "chrome", "brave", "opera", "vivaldi"
    "cookies_file": COOKIES_FILE
}

def get_installed_browsers():
    """Detect available browsers on the host system that yt-dlp can read cookies from."""
    browsers = []
    win_paths = {
        'firefox': os.path.expandvars('%APPDATA%\\Mozilla\\Firefox\\Profiles'),
        'chrome': os.path.expandvars('%LOCALAPPDATA%\\Google\\Chrome\\User Data'),
        'edge': os.path.expandvars('%LOCALAPPDATA%\\Microsoft\\Edge\\User Data'),
        'brave': os.path.expandvars('%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\User Data'),
        'opera': os.path.expandvars('%APPDATA%\\Opera Software\\Opera Stable'),
    }
    for name, p in win_paths.items():
        if os.path.exists(p):
            browsers.append(name)
    return browsers or ["firefox", "edge", "chrome"]

def get_cookies_path():
    """Return path to active cookies.txt file if it exists and has content."""
    # Check if cookies are supplied via environment variable (e.g. Railway / Cloud Variables)
    env_cookies = os.environ.get("YOUTUBE_COOKIES") or os.environ.get("COOKIES_TEXT") or os.environ.get("COOKIES")
    if env_cookies and (not os.path.exists(COOKIES_FILE) or os.path.getsize(COOKIES_FILE) < 10):
        try:
            with open(COOKIES_FILE, "w", encoding="utf-8") as f:
                f.write(env_cookies.strip() + "\n")
        except Exception:
            pass

    settings = load_settings()
    custom_path = settings.get("cookies_file")
    if custom_path and os.path.isabs(custom_path) and os.path.exists(custom_path):
        return custom_path
    if os.path.exists(COOKIES_FILE):
        return COOKIES_FILE
    root_cookies = os.path.abspath("cookies.txt")
    if os.path.exists(root_cookies):
        return root_cookies
    return COOKIES_FILE

def save_cookies_text(text: str) -> str:
    """Save raw cookies string (Netscape format) to cookies.txt."""
    path = get_cookies_path()
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.strip() + "\n")
    return path

def delete_cookies_file() -> bool:
    """Delete cookies.txt if it exists."""
    path = get_cookies_path()
    if os.path.exists(path):
        try:
            os.remove(path)
            return True
        except Exception:
            return False
    return False

def get_cookies_status() -> dict:
    """Return current status of cookies configuration."""
    settings = load_settings()
    path = get_cookies_path()
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    lines_count = 0
    if exists:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = [l for l in f if l.strip() and not l.strip().startswith("#")]
                lines_count = len(lines)
        except Exception:
            pass

    return {
        "file_exists": exists,
        "file_path": path,
        "file_size": size,
        "lines_count": lines_count,
        "active_mode": settings.get("cookies_mode", "auto"),
        "active_browser": settings.get("cookies_browser", "firefox"),
        "installed_browsers": get_installed_browsers()
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
