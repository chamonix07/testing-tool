import os
import sys
import io
import re
import time
import socket
import platform
import shutil
import zipfile
import tempfile
import subprocess
from datetime import datetime
from typing import List, Optional
import requests
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
from media_service import MediaService

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def sanitize_archive_name(name: str) -> str:
    """Removes emojis and problematic characters for broad zip compatibility on Windows & mobile."""
    if not name:
        return "file"
    cleaned = re.sub(r'[^\w\s\-\.\(\)]', '', name, flags=re.UNICODE).strip()
    return cleaned or "file"

app = FastAPI(title="IN DONLOtiN", description="Universal Media Downloader powered by IN")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

downloads_dir = config.load_settings().get("output_dir", os.path.abspath("downloads"))
try:
    os.makedirs(downloads_dir, exist_ok=True)
except Exception:
    pass

static_dir = os.path.join(BASE_DIR, "static")
if not os.path.exists(static_dir) and os.path.exists(os.path.join(BASE_DIR, "public", "static")):
    static_dir = os.path.join(BASE_DIR, "public", "static")

templates_dir = os.path.join(BASE_DIR, "templates")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/downloaded-media", StaticFiles(directory=downloads_dir, check_dir=False), name="downloaded-media")

@app.get("/favicon.ico")
def get_favicon():
    for fav_path in [
        os.path.join(BASE_DIR, "public", "favicon.ico"),
        os.path.join(BASE_DIR, "static", "favicon.ico"),
        os.path.join(BASE_DIR, "public", "favicon.svg"),
        os.path.join(BASE_DIR, "static", "favicon.svg")
    ]:
        if os.path.exists(fav_path):
            media_type = "image/svg+xml" if fav_path.endswith(".svg") else "image/x-icon"
            return FileResponse(fav_path, media_type=media_type)
    return Response(status_code=204)

templates = Jinja2Templates(directory=templates_dir)

current_settings = config.load_settings()
media_service = MediaService(session_id=current_settings.get("session_id"))

class PreviewRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    selected_indices: Optional[List[int]] = None
    format_id: Optional[str] = "1080p"
    naming_format: Optional[str] = "datetime"
    save_caption: Optional[bool] = True

class BatchDownloadRequest(BaseModel):
    urls: List[str]
    format_id: Optional[str] = "1080p"
    naming_format: Optional[str] = "datetime"
    save_caption: Optional[bool] = True

class BatchPreviewRequest(BaseModel):
    urls: List[str]

class SettingsUpdate(BaseModel):
    output_dir: Optional[str] = None
    naming_format: Optional[str] = None
    save_caption: Optional[bool] = None
    session_id: Optional[str] = None
    max_batch_items: Optional[int] = None

class OpenFolderRequest(BaseModel):
    folder_path: Optional[str] = None

class DeleteFolderRequest(BaseModel):
    folder_path: str

class BatchDeleteFolderRequest(BaseModel):
    folder_paths: List[str]

@app.middleware("http")
async def vercel_path_fix_middleware(request: Request, call_next):
    """Ensure Vercel serverless function rewrites preserve the original client path."""
    param_path = request.query_params.get("__path__")
    matched = request.headers.get("x-vercel-matched-path") or request.headers.get("x-matched-path")
    
    target_path = None
    if param_path and not param_path.startswith("/api/index"):
        target_path = "/" + param_path.lstrip("/")
    elif matched and not matched.startswith("/api/index"):
        target_path = "/" + matched.lstrip("/")
    
    current_path = request.scope.get("path", "")
    if target_path:
        target_path = target_path.split("?")[0]
        if len(target_path) > 1 and target_path.endswith("/"):
            target_path = target_path.rstrip("/")
        request.scope["path"] = target_path
    elif current_path in ["/api/index.py", "/api/index", "/api", "/api/"]:
        request.scope["path"] = "/"
    elif current_path.startswith("/api/index.py/"):
        request.scope["path"] = current_path[len("/api/index.py"):]
    elif current_path.startswith("/api/index/"):
        request.scope["path"] = current_path[len("/api/index"):]

    return await call_next(request)

@app.get("/", response_class=HTMLResponse)
@app.get("/api", response_class=HTMLResponse)
@app.get("/api/", response_class=HTMLResponse)
@app.get("/api/index", response_class=HTMLResponse)
@app.get("/api/index.py", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/api/preview")
def preview_post(req: PreviewRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL tidak boleh kosong.")
    try:
        data = media_service.get_info(req.url.strip())
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/batch-preview")
def batch_preview(req: BatchPreviewRequest):
    if not req.urls:
        raise HTTPException(status_code=400, detail="Daftar URL kosong.")
    
    settings = config.load_settings()
    max_batch = settings.get("max_batch_items", 20)
    urls = [u.strip() for u in req.urls if u.strip()][:max_batch]

    from concurrent.futures import ThreadPoolExecutor

    def fetch_meta(url):
        try:
            info = media_service.get_info(url)
            thumb = info.get("thumbnail")
            if not thumb and info.get("items"):
                thumb = info["items"][0].get("display_url")
            return {
                "url": url,
                "success": True,
                "platform": info.get("platform_name") or info.get("platform", "Media"),
                "platform_id": info.get("platform", "other"),
                "title": info.get("title") or info.get("caption_summary") or "Untitled Media",
                "author": info.get("author") or "Creator",
                "thumbnail": thumb,
                "duration": info.get("duration_str") or ("Video" if info.get("is_video") else "Foto"),
                "is_video": info.get("is_video", True),
                "total_items": info.get("total_items", 1)
            }
        except Exception as e:
            return {
                "url": url,
                "success": False,
                "platform": media_service.detect_platform(url).capitalize(),
                "platform_id": media_service.detect_platform(url),
                "title": url,
                "author": "-",
                "thumbnail": None,
                "duration": "-",
                "error": str(e)
            }

    with ThreadPoolExecutor(max_workers=min(len(urls), 6)) as executor:
        results = list(executor.map(fetch_meta, urls))

    return {
        "success": True,
        "total": len(results),
        "items": results
    }

@app.post("/api/download-selective")
def download_selective(req: DownloadRequest):
    try:
        settings = config.load_settings()
        out_dir = settings.get("output_dir", os.path.abspath("downloads"))
        naming = req.naming_format or settings.get("naming_format", "datetime")
        save_cap = req.save_caption if req.save_caption is not None else settings.get("save_caption", True)

        post_info = media_service.get_info(req.url.strip())
        result = media_service.download(
            post_info=post_info,
            selected_indices=req.selected_indices,
            format_id=req.format_id,
            output_base_dir=out_dir,
            naming_format=naming,
            save_caption=save_cap
        )
        return {
            "success": True,
            "message": f"Berhasil mengunduh ke {result['folder_name']}",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/download-zip")
def download_zip(req: DownloadRequest):
    try:
        url = req.url.strip()
        post_info = media_service.get_info(url)
        items_to_download = post_info.get("items", [])
        if req.selected_indices:
            items_to_download = [it for it in items_to_download if it["index"] in req.selected_indices]

        if not items_to_download:
            raise HTTPException(status_code=400, detail="Tidak ada media yang dipilih untuk diunduh.")

        with tempfile.TemporaryDirectory() as temp_dir:
            res = media_service.download(
                post_info=post_info,
                selected_indices=req.selected_indices,
                format_id=req.format_id or "1080p",
                output_base_dir=temp_dir,
                naming_format="content_name",
                save_caption=req.save_caption if req.save_caption is not None else True
            )

            folder_path = res["folder_path"]
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(folder_path):
                    for file in files:
                        abs_p = os.path.join(root, file)
                        safe_name = sanitize_archive_name(file)
                        zf.write(abs_p, arcname=safe_name)

            zip_data = zip_buffer.getvalue()

        shortcode = sanitize_archive_name(post_info.get("shortcode", "media"))
        platform = sanitize_archive_name(post_info.get("platform", "media"))
        zip_filename = f"{platform}_{shortcode}.zip"

        return Response(
            content=zip_data,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{zip_filename}"',
                "Content-Length": str(len(zip_data))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/batch-download")
def batch_download(req: BatchDownloadRequest):
    if not req.urls:
        raise HTTPException(status_code=400, detail="Daftar URL kosong.")

    settings = config.load_settings()
    out_dir = settings.get("output_dir", os.path.abspath("downloads"))
    naming = req.naming_format or settings.get("naming_format", "datetime")
    save_cap = req.save_caption if req.save_caption is not None else settings.get("save_caption", True)

    results = []
    for raw_url in req.urls:
        url = raw_url.strip()
        if not url:
            continue
        try:
            post_info = media_service.get_info(url)
            dl_res = media_service.download(
                post_info=post_info,
                selected_indices=None,
                format_id=req.format_id,
                output_base_dir=out_dir,
                naming_format=naming,
                save_caption=save_cap
            )
            results.append({
                "url": url,
                "platform": post_info.get("platform_name"),
                "shortcode": post_info.get("shortcode"),
                "status": "success",
                "folder_name": dl_res["folder_name"],
                "folder_path": dl_res["folder_path"],
                "total_downloaded": dl_res["total_downloaded"]
            })
        except Exception as e:
            results.append({
                "url": url,
                "status": "failed",
                "error": str(e)
            })

    return {
        "success": True,
        "total_processed": len(results),
        "results": results
    }

@app.get("/api/proxy-media")
def proxy_media(url: str = Query(...)):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.google.com/"
        }
        resp = requests.get(url, headers=headers, stream=True, timeout=15)
        content_type = resp.headers.get("content-type", "image/jpeg")
        return StreamingResponse(resp.iter_content(chunk_size=1024 * 32), media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download-file")
def download_file(url: str = Query(...), filename: Optional[str] = Query(None)):
    """Direct stream download for mobile browsers and Vercel cloud deployment."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.google.com/"
        }
        resp = requests.get(url, headers=headers, stream=True, timeout=30)
        content_type = resp.headers.get("content-type", "application/octet-stream")
        safe_name = sanitize_archive_name(filename) if filename else "media_download"
        if "." not in safe_name:
            if "video" in content_type or ".mp4" in url:
                safe_name += ".mp4"
            elif "image" in content_type or ".jpg" in url or ".jpeg" in url:
                safe_name += ".jpg"
            elif "audio" in content_type or ".mp3" in url:
                safe_name += ".mp3"
            else:
                safe_name += ".bin"

        response_headers = {
            "Content-Disposition": f'attachment; filename="{safe_name}"'
        }
        return StreamingResponse(resp.iter_content(chunk_size=1024 * 64), media_type=content_type, headers=response_headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/downloads")
def list_downloads():
    settings = config.load_settings()
    out_dir = settings.get("output_dir", os.path.abspath("downloads"))
    if not os.path.exists(out_dir):
        return {"output_dir": os.path.abspath(out_dir), "folders": []}

    folders = []
    scan_dirs = [out_dir]
    for sub in os.listdir(out_dir):
        p = os.path.join(out_dir, sub)
        if os.path.isdir(p):
            scan_dirs.append(p)

    visited = set()
    for directory in scan_dirs:
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            if os.path.isdir(item_path) and item_path not in visited and item_path != directory:
                visited.add(item_path)
                ctime = os.path.getctime(item_path)
                rel_name = os.path.relpath(item_path, out_dir).replace("\\", "/")
                
                files_info = []
                caption_text = None
                has_thumbnail = False
                
                try:
                    all_files = sorted(os.listdir(item_path))
                    for f in all_files:
                        f_path = os.path.join(item_path, f)
                        if os.path.isfile(f_path):
                            f_size = os.path.getsize(f_path)
                            size_human = MediaService.format_bytes(f_size)
                            ext = f.split(".")[-1].lower() if "." in f else ""
                            
                            if ext in ["mp4", "webm", "mov", "mkv"]:
                                f_type = "video"
                            elif ext in ["mp3", "m4a", "wav", "ogg", "aac"]:
                                f_type = "audio"
                            elif ext in ["jpg", "jpeg", "png", "webp", "gif"]:
                                f_type = "image"
                                has_thumbnail = True
                            elif ext == "txt":
                                f_type = "text"
                                if f == "caption.txt":
                                    try:
                                        with open(f_path, "r", encoding="utf-8") as cf:
                                            caption_text = cf.read()
                                    except Exception:
                                        pass
                            else:
                                f_type = "other"

                            rel_file_url = f"/downloaded-media/{rel_name}/{f}".replace("//", "/")
                            files_info.append({
                                "name": f,
                                "size_bytes": f_size,
                                "size_human": size_human,
                                "type": f_type,
                                "ext": ext,
                                "url": rel_file_url
                            })

                    # If no thumbnail image exists, generate one from video using ffmpeg so it's NEVER empty!
                    if not has_thumbnail:
                        vid = next((f for f in all_files if f.lower().endswith(('.mp4', '.mkv', '.webm'))), None)
                        if vid:
                            try:
                                vid_path = os.path.join(item_path, vid)
                                thumb_path = os.path.join(item_path, "thumbnail.jpg")
                                subprocess.run(["ffmpeg", "-ss", "00:00:01", "-i", vid_path, "-vframes", "1", "-q:v", "2", thumb_path, "-y"], capture_output=True, timeout=5)
                                if os.path.exists(thumb_path):
                                    rel_thumb_url = f"/downloaded-media/{rel_name}/thumbnail.jpg".replace("//", "/")
                                    files_info.insert(0, {
                                        "name": "thumbnail.jpg",
                                        "size_bytes": os.path.getsize(thumb_path),
                                        "size_human": MediaService.format_bytes(os.path.getsize(thumb_path)),
                                        "type": "image",
                                        "ext": "jpg",
                                        "url": rel_thumb_url
                                    })
                            except Exception:
                                pass

                except Exception:
                    pass

                media_count = len([fi for fi in files_info if fi["type"] in ["video", "image", "audio"]])
                if files_info:
                    folders.append({
                        "folder_name": rel_name,
                        "folder_path": os.path.abspath(item_path),
                        "file_count": media_count,
                        "total_files": len(files_info),
                        "created_time": ctime,
                        "created_str": datetime.fromtimestamp(ctime).strftime("%Y-%m-%d %H:%M"),
                        "files": files_info,
                        "caption_text": caption_text
                    })

    folders.sort(key=lambda x: x["created_time"], reverse=True)
    return {"output_dir": os.path.abspath(out_dir), "folders": folders}

def get_local_ip() -> str:
    """Detect local IP of machine for LAN access from phone/tablet."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

WMO_WEATHER_CODES = {
    0: ("Cerah", "Clear", "sunny"),
    1: ("Cerah Sebagian", "Mainly Clear", "partly_cloudy_day"),
    2: ("Cerah Berawan", "Partly Cloudy", "partly_cloudy_day"),
    3: ("Berawan Tebal", "Overcast", "cloud"),
    45: ("Berkabut", "Fog", "foggy"),
    48: ("Kabut Beku", "Depositing Rime Fog", "foggy"),
    51: ("Gerimis Ringan", "Light Drizzle", "rainy_light"),
    53: ("Gerimis Sedang", "Moderate Drizzle", "rainy"),
    55: ("Gerimis Lebat", "Dense Drizzle", "rainy_heavy"),
    61: ("Hujan Ringan", "Slight Rain", "rainy_light"),
    63: ("Hujan Sedang", "Moderate Rain", "rainy"),
    65: ("Hujan Lebat", "Heavy Rain", "rainy_heavy"),
    80: ("Hujan Lokal", "Rain Showers", "rainy"),
    81: ("Hujan Deras", "Moderate Showers", "rainy_heavy"),
    82: ("Hujan Sangat Deras", "Violent Showers", "thunderstorm"),
    95: ("Badai Petir", "Thunderstorm", "thunderstorm"),
    96: ("Badai Petir & Hujan Es", "Thunderstorm with Hail", "thunderstorm"),
    99: ("Badai Petir & Hujan Es Lebat", "Heavy Thunderstorm with Hail", "thunderstorm")
}

_telemetry_cache = {
    "data": None,
    "expires_at": 0
}

def get_system_telemetry(client_host: str = "") -> dict:
    global _telemetry_cache
    now = time.time()
    if _telemetry_cache["data"] and now < _telemetry_cache["expires_at"]:
        return _telemetry_cache["data"]

    local_ip = get_local_ip()
    host_name = socket.gethostname()
    os_name = f"{platform.system()} {platform.release()}"

    telemetry = {
        "ip": {
            "local": local_ip,
            "public": "-",
            "client": client_host or local_ip
        },
        "device": {
            "os": os_name,
            "hostname": host_name,
            "arch": platform.machine(),
            "python": platform.python_version()
        },
        "location": {
            "city": "Indonesia",
            "region": "-",
            "country": "Indonesia",
            "country_code": "ID",
            "display": "Indonesia"
        },
        "weather": {
            "temp": 30.0,
            "temp_str": "30°C",
            "condition": "Cerah Berawan",
            "condition_en": "Partly Cloudy",
            "icon": "partly_cloudy_day",
            "humidity": 60,
            "wind_speed": 10
        }
    }

    try:
        geo_resp = requests.get(
            "http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,lat,lon,query",
            timeout=3
        )
        if geo_resp.status_code == 200:
            geo_data = geo_resp.json()
            if geo_data.get("status") == "success":
                public_ip = geo_data.get("query")
                city = geo_data.get("city") or "Indonesia"
                region = geo_data.get("regionName") or ""
                country = geo_data.get("country") or "Indonesia"
                country_code = geo_data.get("countryCode") or "ID"
                lat = geo_data.get("lat")
                lon = geo_data.get("lon")

                telemetry["ip"]["public"] = public_ip
                telemetry["location"] = {
                    "city": city,
                    "region": region,
                    "country": country,
                    "country_code": country_code,
                    "display": f"{city}, {country_code}"
                }

                if lat is not None and lon is not None:
                    weather_url = (
                        f"https://api.open-meteo.com/v1/forecast?"
                        f"latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto"
                    )
                    w_resp = requests.get(weather_url, timeout=3)
                    if w_resp.status_code == 200:
                        cur_w = w_resp.json().get("current", {})
                        temp = cur_w.get("temperature_2m", 30)
                        w_code = cur_w.get("weather_code", 0)
                        cond_id, cond_en, icon = WMO_WEATHER_CODES.get(w_code, ("Cerah Berawan", "Partly Cloudy", "partly_cloudy_day"))

                        telemetry["weather"] = {
                            "temp": round(temp, 1),
                            "temp_str": f"{round(temp)}°C",
                            "condition": cond_id,
                            "condition_en": cond_en,
                            "icon": icon,
                            "humidity": cur_w.get("relative_humidity_2m", 60),
                            "wind_speed": cur_w.get("wind_speed_10m", 10)
                        }
    except Exception:
        pass

    _telemetry_cache["data"] = telemetry
    _telemetry_cache["expires_at"] = now + 600
    return telemetry

@app.get("/api/telemetry")
def get_telemetry(request: Request):
    client_ip = request.client.host if request.client else ""
    return get_system_telemetry(client_ip)

def resolve_vault_folder(fname: str, base_dir: str) -> Optional[str]:
    """Finds absolute folder path for a given vault folder name."""
    clean_fname = os.path.normpath(fname.strip()).lstrip("\\/")
    target = os.path.normpath(os.path.join(base_dir, clean_fname))
    if os.path.exists(target) and os.path.isdir(target):
        return target
    # Search one level inside platform folders (YouTube, Instagram, etc.)
    if os.path.exists(base_dir):
        for sub in os.listdir(base_dir):
            sub_p = os.path.join(base_dir, sub)
            if os.path.isdir(sub_p):
                candidate = os.path.join(sub_p, clean_fname)
                if os.path.exists(candidate) and os.path.isdir(candidate):
                    return candidate
    return None

def create_vault_zip(folder_names: List[str], base_dir: str) -> bytes:
    """Compresses selected vault folders into clean, valid zip bytes with sanitized paths."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in folder_names:
            target = resolve_vault_folder(fname, base_dir)
            if target and os.path.isdir(target):
                folder_title = sanitize_archive_name(os.path.basename(target))
                for root, _, files in os.walk(target):
                    for file in files:
                        abs_p = os.path.join(root, file)
                        clean_file = sanitize_archive_name(file)
                        rel_p = f"{folder_title}/{clean_file}"
                        zf.write(abs_p, arcname=rel_p)
    return zip_buffer.getvalue()

@app.get("/api/network-info")
def get_network_info():
    ip = get_local_ip()
    return {
        "local_ip": ip,
        "port": 8000,
        "base_url": f"http://{ip}:8000"
    }

@app.api_route("/api/vault/export-zip", methods=["GET", "POST"])
async def export_vault_zip(request: Request, folders: Optional[str] = Query(None)):
    folder_list = []
    if request.method == "POST":
        try:
            body = await request.json()
            folder_list = body.get("folder_names") or body.get("folders") or []
        except Exception:
            pass
    elif folders:
        folder_list = [f.strip() for f in folders.split(",") if f.strip()]

    settings = config.load_settings()
    out_dir = settings.get("output_dir", os.path.abspath("downloads"))

    if not folder_list:
        raise HTTPException(status_code=400, detail="Tidak ada folder yang dipilih.")

    zip_data = create_vault_zip(folder_list, out_dir)
    safe_title = sanitize_archive_name(os.path.basename(folder_list[0])) if folder_list else "media"
    filename = "IN_DONLOTiN_Media.zip" if len(folder_list) > 1 else f"{safe_title}.zip"

    return Response(
        content=zip_data,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(zip_data))
        }
    )

@app.get("/mobile-share")
def mobile_share(request: Request, folders: Optional[str] = Query(None)):
    folder_list = [f.strip() for f in folders.split(",") if f.strip()] if folders else []
    settings = config.load_settings()
    out_dir = settings.get("output_dir", os.path.abspath("downloads"))

    folders_data = []
    total_files = 0

    for fname in folder_list:
        target = resolve_vault_folder(fname, out_dir)
        if not target or not os.path.isdir(target):
            continue

        rel_name = os.path.relpath(target, out_dir).replace("\\", "/")
        media_files = []
        thumb_url = None
        caption_text = ""

        all_files = sorted(os.listdir(target))
        for f in all_files:
            f_path = os.path.join(target, f)
            if os.path.isfile(f_path):
                f_size = os.path.getsize(f_path)
                size_human = MediaService.format_bytes(f_size)
                ext = f.split(".")[-1].lower() if "." in f else ""

                if ext in ["mp4", "webm", "mov", "mkv"]:
                    f_type = "video"
                elif ext in ["mp3", "m4a", "wav", "ogg", "aac"]:
                    f_type = "audio"
                elif ext in ["jpg", "jpeg", "png", "webp", "gif"]:
                    f_type = "image"
                    if not thumb_url:
                        thumb_url = f"/downloaded-media/{rel_name}/{f}"
                elif ext == "txt" and f == "caption.txt":
                    f_type = "text"
                    try:
                        with open(f_path, "r", encoding="utf-8") as cf:
                            caption_text = cf.read()
                    except Exception:
                        pass
                else:
                    f_type = "other"

                if f_type in ["video", "audio", "image"]:
                    media_files.append({
                        "name": f,
                        "type": f_type,
                        "size_human": size_human,
                        "url": f"/downloaded-media/{rel_name}/{f}"
                    })
                    total_files += 1

        folders_data.append({
            "folder_name": os.path.basename(target),
            "rel_name": rel_name,
            "thumbnail_url": thumb_url,
            "caption_text": caption_text[:140] if caption_text else "",
            "media_files": media_files,
            "single_zip_url": f"/api/vault/export-zip?folders={rel_name}"
        })

    encoded_folders = ",".join(folder_list)
    zip_url = f"/api/vault/export-zip?folders={encoded_folders}"

    return templates.TemplateResponse(
        request=request,
        name="mobile_share.html",
        context={
            "folders_data": folders_data,
            "zip_url": zip_url,
            "total_files": total_files
        }
    )

@app.api_route("/api/open-folder", methods=["GET", "POST"])
async def open_folder(
    request: Request,
    path: Optional[str] = Query(None),
    folder_path: Optional[str] = Query(None)
):
    target_raw = path or folder_path
    if request.method == "POST":
        try:
            body = await request.json()
            if body.get("folder_path"):
                target_raw = body.get("folder_path")
        except Exception:
            pass

    settings = config.load_settings()
    target = target_raw or settings.get("output_dir", os.path.abspath("downloads"))
    clean_target = os.path.normpath(os.path.abspath(target))

    if not os.path.exists(clean_target):
        os.makedirs(clean_target, exist_ok=True)

    opened = False
    err_msg = ""

    if os.environ.get("VERCEL"):
        return {"success": False, "message": "Fitur Buka Folder Explorer hanya tersedia saat dijalankan lokal di Desktop Windows.", "is_cloud": True}

    if sys.platform == "win32":
        try:
            # Method 1: os.startfile invokes default shell association cleanly
            os.startfile(clean_target)
            opened = True
        except Exception:
            pass

        if not opened:
            try:
                # Method 2: Direct explorer.exe
                if os.path.isfile(clean_target):
                    subprocess.Popen(f'explorer.exe /select,"{clean_target}"')
                else:
                    subprocess.Popen(["explorer.exe", clean_target])
                opened = True
            except Exception:
                pass

        if not opened:
            try:
                # Method 3: Shell COM Explore
                subprocess.Popen(["powershell.exe", "-NoProfile", "-WindowStyle", "Hidden", "-Command", f"(New-Object -ComObject Shell.Application).Explore('{clean_target}')"])
                opened = True
            except Exception:
                pass

        if not opened:
            try:
                # Method 4: Rundll32 FileProtocolHandler
                subprocess.Popen(["rundll32.exe", "url.dll,FileProtocolHandler", clean_target])
                opened = True
            except Exception as e:
                err_msg = str(e)
    elif sys.platform == "darwin":
        try:
            subprocess.Popen(["open", clean_target])
            opened = True
        except Exception as e:
            err_msg = str(e)
    else:
        try:
            subprocess.Popen(["xdg-open", clean_target])
            opened = True
        except Exception as e:
            err_msg = str(e)

    if opened:
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header and request.method == "GET":
            return HTMLResponse(content=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Membuka Folder Unduhan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>setTimeout(function() {{ window.location.href = '/'; }}, 2500);</script>
    <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }}
        .card {{ background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; border: 1px solid #334155; text-align: center; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
        .icon {{ font-size: 3rem; margin-bottom: 1rem; color: #38bdf8; }}
        h2 {{ margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 700; color: #ffffff; }}
        p {{ color: #94a3b8; font-size: 0.875rem; margin: 0.5rem 0 1.25rem 0; line-height: 1.5; }}
        code {{ background: #0f172a; border: 1px solid #334155; padding: 0.5rem 0.75rem; border-radius: 0.5rem; color: #38bdf8; font-family: monospace; font-size: 0.85rem; display: block; word-break: break-all; margin-bottom: 1.5rem; }}
        a {{ display: inline-block; background: #2563eb; color: #ffffff; padding: 0.625rem 1.25rem; border-radius: 0.625rem; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: background 0.2s; }}
        a:hover {{ background: #1d4ed8; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">📁</div>
        <h2>Membuka Windows Explorer</h2>
        <p>Folder penyimpanan unduhan berhasil dibuka di komputer Anda:</p>
        <code>{clean_target}</code>
        <a href="/">← Kembali ke Aplikasi</a>
    </div>
</body>
</html>""")
        return {
            "success": True,
            "folder_path": clean_target,
            "message": f"Membuka folder {clean_target}"
        }
    raise HTTPException(status_code=500, detail=f"Gagal membuka folder: {err_msg}")

@app.post("/api/delete-folder")
def delete_folder(req: DeleteFolderRequest):
    target = os.path.abspath(req.folder_path)
    settings = config.load_settings()
    base_dir = os.path.abspath(settings.get("output_dir", "downloads"))
    
    if not target.startswith(base_dir) or target == base_dir:
        raise HTTPException(status_code=400, detail="Operasi penghapusan tidak diizinkan.")
    
    if os.path.exists(target):
        shutil.rmtree(target)
        return {"success": True, "message": "Folder berhasil dihapus"}
    raise HTTPException(status_code=404, detail="Folder tidak ditemukan")

@app.post("/api/delete-folders-batch")
def delete_folders_batch(req: BatchDeleteFolderRequest):
    settings = config.load_settings()
    base_dir = os.path.abspath(settings.get("output_dir", "downloads"))
    deleted = 0
    errors = []
    for fp in req.folder_paths:
        target = os.path.abspath(fp)
        if not target.startswith(base_dir) or target == base_dir:
            continue
        if os.path.exists(target):
            try:
                shutil.rmtree(target)
                deleted += 1
            except Exception as e:
                errors.append(str(e))
    return {"success": True, "deleted_count": deleted, "errors": errors}

@app.get("/api/settings")
def get_settings():
    return config.load_settings()

@app.post("/api/settings")
def update_settings(req: SettingsUpdate):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = config.save_settings(updates)
    if "session_id" in updates:
        media_service.set_session_id(updates["session_id"])
    return {"success": True, "settings": updated}

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host=host, port=port, reload=False)
