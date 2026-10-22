import os
import re
import json
import time
import html
import subprocess
import unicodedata
from datetime import datetime
from typing import List, Dict, Any, Optional
import requests
import yt_dlp

try:
    import yt_dlp.utils._jsruntime
    # Node 20.x supports --experimental-permission which yt-dlp needs
    yt_dlp.utils._jsruntime.NodeJsRuntime.MIN_SUPPORTED_VERSION = (20, 0, 0)
except Exception:
    pass

import config
from ig_service import InstagramService

class MediaService:
    def __init__(self, session_id: Optional[str] = None):
        self.ig_service = InstagramService(session_id=session_id)
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8"
        }
        self.session.headers.update(self.headers)
        # Fast in-memory cache for sub-millisecond repeated lookups
        self._cache: Dict[str, Dict[str, Any]] = {}

    def set_session_id(self, session_id: str):
        self.ig_service.set_session_id(session_id)

    @staticmethod
    def detect_platform(url: str) -> str:
        """Detect platform from URL."""
        url_lower = url.lower().strip()
        if "instagram.com" in url_lower or "instagr.am" in url_lower:
            return "instagram"
        elif "youtube.com" in url_lower or "youtu.be" in url_lower:
            return "youtube"
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            return "twitter"
        elif "threads.net" in url_lower or "threads.com" in url_lower:
            return "threads"
        elif "pinterest.com" in url_lower or "pin.it" in url_lower:
            return "pinterest"
        elif "tiktok.com" in url_lower:
            return "tiktok"
        return "other"

    @staticmethod
    def sanitize_filename(text: str, max_length: int = 40) -> str:
        if not text:
            return "untitled"
        text = unicodedata.normalize('NFKD', text)
        text = re.sub(r'[\\/*?:"<>|]', '', text)
        text = re.sub(r'\s+', '_', text.strip())
        text = re.sub(r'[^a-zA-Z0-9_\-]', '', text)
        cleaned = text[:max_length].strip('_-')
        return cleaned or "untitled"

    @staticmethod
    def format_bytes(size_bytes: Optional[int]) -> str:
        if not size_bytes or size_bytes <= 0:
            return "Bervariasi"
        if size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

    @staticmethod
    def sanitize_youtube_url(url: str) -> str:
        """Strip mix/playlist parameters if a specific video is targeted."""
        if "youtube.com/playlist" in url and "v=" not in url:
            return url
        m = re.search(r"(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{11})", url)
        if m:
            return f"https://www.youtube.com/watch?v={m.group(1)}"
        return url

    def get_info(self, url: str) -> Dict[str, Any]:
        """Unified extractor with cache and sub-second fast path."""
        url = url.strip()
        
        # Check in-memory cache
        if url in self._cache:
            return self._cache[url]

        platform = self.detect_platform(url)

        if platform == "youtube":
            data = self._extract_youtube_fast(url)
        elif platform == "instagram":
            data = self._extract_instagram(url)
        elif platform == "twitter":
            data = self._extract_twitter(url)
        elif platform == "pinterest":
            data = self._extract_pinterest(url)
        elif platform == "threads":
            data = self._extract_threads(url)
        elif platform == "tiktok":
            data = self._extract_tiktok(url)
        else:
            data = self._extract_generic(url)

        # Cache valid response
        if data.get("success"):
            self._cache[url] = data
        return data

    def _extract_instagram(self, url: str) -> Dict[str, Any]:
        data = self.ig_service.get_post_info(url)
        data["platform"] = "instagram"
        data["platform_name"] = "Instagram"
        data["platform_icon"] = "instagram"

        # Check video size for Reels
        if data.get("is_video") or data.get("content_type") == "reel":
            video_url = data["items"][0].get("video_url")
            size_str = "Kualitas Asli"
            if video_url:
                try:
                    h = self.session.head(video_url, timeout=2)
                    size_b = int(h.headers.get("content-length", 0))
                    if size_b > 0:
                        size_str = self.format_bytes(size_b)
                except Exception:
                    pass

            data["available_formats"] = [
                {"id": "best_video", "label": "Full HD Video Asli", "size": size_str, "badge": "1080p/HD"},
                {"id": "720p", "label": "HD 720p (Standar)", "size": "Otomatis", "badge": "720p"},
                {"id": "audio_mp3", "label": "Audio Lagu Saja (MP3)", "size": "MP3", "badge": "Audio MP3"}
            ]
        else:
            data["available_formats"] = []

        if not data.get("thumbnail") and data.get("items"):
            data["thumbnail"] = data["items"][0].get("display_url")
        if not data.get("duration_str"):
            data["duration_str"] = "Reel" if data.get("is_video") else "Foto"
        return data

    def _extract_youtube_fast(self, url: str) -> Dict[str, Any]:
        """Sub-second YouTube metadata extractor via oEmbed with full resolution formats."""
        clean_url = self.sanitize_youtube_url(url)
        video_id_match = re.search(r"(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{11})", clean_url)
        video_id = video_id_match.group(1) if video_id_match else "yt_video"
        
        is_shorts = "shorts" in url.lower()
        content_type = "shorts" if is_shorts else "video"

        # Fast oEmbed request (takes ~0.5s - 0.8s)
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        title = "YouTube Video"
        author = "YouTube Creator"
        thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

        try:
            resp = self.session.get(oembed_url, timeout=2)
            if resp.status_code == 200:
                o_data = resp.json()
                title = o_data.get("title") or title
                author = o_data.get("author_name") or author
                thumbnail = o_data.get("thumbnail_url") or thumbnail
        except Exception:
            pass

        duration_str = "Shorts (<1m)" if is_shorts else "Video"
        try:
            yt_page = self.session.get(f"https://www.youtube.com/watch?v={video_id}", timeout=2.5).text
            dur_match = re.search(r'"lengthSeconds":"(\d+)"', yt_page)
            if dur_match:
                sec = int(dur_match.group(1))
                duration_str = f"{sec//60}:{sec%60:02d}"
        except Exception:
            pass

        # Estimate file size ranges based on standard YouTube bitrates
        # Formats list: 2K, 1080p, 720p, 480p, 360p, MP3
        formats = [
            {"id": "1440p", "label": "2K QHD (1440p)", "size": "Maksimal", "badge": "2K / 1440p"},
            {"id": "1080p", "label": "Full HD 1080p", "size": "Sangat Jernih", "badge": "1080p FHD"},
            {"id": "720p", "label": "HD 720p", "size": "Rekomendasi", "badge": "720p HD"},
            {"id": "480p", "label": "SD 480p", "size": "Sedang", "badge": "480p SD"},
            {"id": "360p", "label": "Hemat Kuota 360p", "size": "Ukuran Kecil", "badge": "360p"},
            {"id": "audio_mp3", "label": "Audio / Lagu Saja (MP3 320kbps)", "size": "Ringan", "badge": "Audio MP3"}
        ]

        return {
            "success": True,
            "platform": "youtube",
            "platform_name": "YouTube",
            "platform_icon": "youtube",
            "shortcode": video_id,
            "url": clean_url,
            "author": author,
            "title": title,
            "caption": title,
            "caption_summary": title[:100],
            "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date_iso": datetime.now().isoformat(),
            "content_type": content_type,
            "is_video": True,
            "duration_str": duration_str,
            "thumbnail": thumbnail,
            "total_items": 1,
            "available_formats": formats,
            "items": [{
                "index": 1,
                "is_video": True,
                "display_url": thumbnail,
                "video_url": None,
                "download_url": None
            }]
        }

    def _extract_twitter(self, url: str) -> Dict[str, Any]:
        """Extract tweet information (video, gif, or gallery of photos)."""
        tweet_id_match = re.search(r"/(?:status|statuses)/(\d+)", url)
        if tweet_id_match:
            tweet_id = tweet_id_match.group(1)
            try:
                fx_url = f"https://api.fxtwitter.com/status/{tweet_id}"
                resp = self.session.get(fx_url, timeout=3)
                if resp.status_code == 200:
                    data = resp.json()
                    tweet = data.get("tweet", {})
                    author = tweet.get("author", {}).get("screen_name") or tweet.get("author", {}).get("name") or "twitter_user"
                    text = tweet.get("text", "")
                    media_obj = tweet.get("media", {})
                    
                    items = []
                    videos = media_obj.get("videos") or []
                    photos = media_obj.get("photos") or []

                    if videos:
                        vid = videos[0]
                        vid_url = vid.get("url")
                        size_str = "Video MP4"
                        if vid_url:
                            try:
                                h = self.session.head(vid_url, timeout=2)
                                size_b = int(h.headers.get("content-length", 0))
                                if size_b > 0:
                                    size_str = self.format_bytes(size_b)
                            except Exception:
                                pass

                        items.append({
                            "index": 1,
                            "is_video": True,
                            "display_url": vid.get("thumbnail_url"),
                            "video_url": vid_url,
                            "download_url": vid_url,
                            "size": size_str
                        })
                    elif photos:
                        for idx, p in enumerate(photos):
                            items.append({
                                "index": idx + 1,
                                "is_video": False,
                                "display_url": p.get("url"),
                                "video_url": None,
                                "download_url": p.get("url")
                            })

                    if items:
                        is_video = any(it["is_video"] for it in items)
                        formats = []
                        if is_video:
                            v_size = items[0].get("size", "MP4")
                            formats = [
                                {"id": "best_video", "label": f"Video Terbaik ({v_size})", "size": v_size, "badge": "MP4 HD"},
                                {"id": "720p", "label": "Video 720p", "size": "Standar", "badge": "720p"},
                                {"id": "audio_mp3", "label": "Ekstrak Audio Saja", "size": "MP3", "badge": "Audio"}
                            ]

                        return {
                            "success": True,
                            "platform": "twitter",
                            "platform_name": "Twitter / X",
                            "platform_icon": "twitter",
                            "shortcode": tweet_id,
                            "url": url,
                            "author": author,
                            "title": text[:60] if text else f"Tweet @{author}",
                            "caption": text,
                            "caption_summary": text[:100] + ("..." if len(text) > 100 else ""),
                            "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "date_iso": datetime.now().isoformat(),
                            "content_type": "carousel" if len(items) > 1 else ("video" if is_video else "image"),
                            "is_video": is_video,
                            "duration_str": "Video" if is_video else "Foto",
                            "thumbnail": items[0]["display_url"] if items else None,
                            "total_items": len(items),
                            "available_formats": formats,
                            "items": items
                        }
            except Exception:
                pass

        return self._extract_generic(url, platform_name="Twitter / X", platform_icon="twitter")

    def _extract_pinterest(self, url: str) -> Dict[str, Any]:
        """Extract Pinterest pin (image or video)."""
        if "pin.it" in url.lower():
            try:
                r = self.session.get(url, allow_redirects=True, timeout=3)
                url = r.url
            except Exception:
                pass

        resp = self.session.get(url, timeout=3)
        html = resp.text

        title_match = re.search(r"<meta\s+property=\"og:title\"\s+content=\"([^\"]+)\"", html)
        title = title_match.group(1) if title_match else "Pinterest Pin"

        img_match = re.search(r"<meta\s+property=\"og:image\"\s+content=\"([^\"]+)\"", html)
        if not img_match:
            img_match = re.search(r"\"image\":\s*\"([^\"]+)\"", html)

        if not img_match:
            return self._extract_generic(url, platform_name="Pinterest", platform_icon="pin")

        img_url = img_match.group(1)
        orig_url = re.sub(r"/\d+x/", "/originals/", img_url)

        pin_id_match = re.search(r"/pin/(\d+)", url)
        pin_id = pin_id_match.group(1) if pin_id_match else "pin"

        return {
            "success": True,
            "platform": "pinterest",
            "platform_name": "Pinterest",
            "platform_icon": "pin",
            "shortcode": pin_id,
            "url": url,
            "author": "pinterest",
            "title": title,
            "caption": title,
            "caption_summary": title[:100],
            "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "date_iso": datetime.now().isoformat(),
            "content_type": "image",
            "is_video": False,
            "duration_str": "Pin",
            "thumbnail": orig_url,
            "total_items": 1,
            "available_formats": [],
            "items": [{
                "index": 1,
                "is_video": False,
                "display_url": orig_url,
                "video_url": None,
                "download_url": orig_url
            }]
        }

    def _extract_threads(self, url: str) -> Dict[str, Any]:
        """Extract Threads post (single image, carousel, or video). Supports threads.com, threads.net, share links."""
        try:
            # 1. Resolve redirect if it's a share link (e.g. threads.com/share/..., threads.net/t/...)
            resp = self.session.get(url, allow_redirects=True, timeout=10)
            final_url = resp.url

            # 2. Fetch using facebookexternalhit to get rich OpenGraph tags
            fb_headers = {
                "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
                "Accept-Language": "en-US,en;q=0.9"
            }
            fb_resp = self.session.get(final_url, headers=fb_headers, timeout=10)
            page_text = fb_resp.text

            title_m = re.search(r'<meta\s+property="og:title"\s+content="([^"]*)"', page_text)
            desc_m = re.search(r'<meta\s+property="og:description"\s+content="([^"]*)"', page_text)
            img_m = re.search(r'<meta\s+property="og:image"\s+content="([^"]*)"', page_text)
            vid_m = re.search(r'<meta\s+property="og:video(?::secure_url)?"\s+content="([^"]*)"', page_text)

            shortcode_m = re.search(r'/(?:post|t|share)/([A-Za-z0-9_-]+)', final_url)
            shortcode = shortcode_m.group(1) if shortcode_m else "threads_post"

            author = "threads_user"
            if title_m:
                raw_title = html.unescape(title_m.group(1))
                am = re.search(r'@([a-zA-Z0-9._]+)', raw_title)
                if am:
                    author = am.group(1)
            if author == "threads_user":
                u_match = re.search(r'@([a-zA-Z0-9._]+)', final_url)
                if u_match:
                    author = u_match.group(1)

            caption = html.unescape(desc_m.group(1)) if desc_m else ""
            image_url = html.unescape(img_m.group(1)).replace("&amp;", "&") if img_m else None
            video_url = html.unescape(vid_m.group(1)).replace("&amp;", "&") if vid_m else None

            # Fallback search for video in page if not in og:video
            if not video_url:
                v_matches = re.findall(r'https://[^"\'\s<>\\]+?\.mp4[^"\'\s<>\\]*', page_text)
                if v_matches:
                    video_url = html.unescape(v_matches[0]).replace("\\u0026", "&").replace("&amp;", "&")

            is_video = bool(video_url)

            items = []
            if is_video:
                items.append({
                    "index": 1,
                    "is_video": True,
                    "display_url": image_url or "",
                    "video_url": video_url,
                    "download_url": video_url
                })
                formats = [
                    {"id": "best_video", "label": "Video HD MP4", "size": "MP4", "badge": "HD"},
                    {"id": "audio_mp3", "label": "Audio Saja (MP3)", "size": "MP3", "badge": "MP3"}
                ]
            else:
                fb_imgs = re.findall(r'https://[^"\'\s<>\\]+?fbcdn\.net/[^"\'\s<>\\]+', page_text)
                clean_imgs = []
                seen = set()
                for u in fb_imgs:
                    u_clean = html.unescape(u).replace("\\u0026", "&").replace("&amp;", "&")
                    if "_n.jpg" in u_clean or "_n.png" in u_clean or "urlgen" in u_clean:
                        base = u_clean.split("?")[0]
                        if base not in seen:
                            seen.add(base)
                            clean_imgs.append(u_clean)

                if not clean_imgs and image_url:
                    clean_imgs = [image_url]

                for i, u in enumerate(clean_imgs, start=1):
                    items.append({
                        "index": i,
                        "is_video": False,
                        "display_url": u,
                        "video_url": None,
                        "download_url": u
                    })
                formats = []

            if not items and not image_url:
                return self._extract_generic(final_url, platform_name="Threads", platform_icon="message-circle")

            return {
                "success": True,
                "platform": "threads",
                "platform_name": "Threads",
                "platform_icon": "message-circle",
                "shortcode": shortcode,
                "url": url,
                "resolved_url": final_url,
                "author": author,
                "title": caption[:60] if caption else f"Threads @{author}",
                "caption": caption,
                "caption_summary": caption[:100] + ("..." if len(caption) > 100 else ""),
                "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "date_iso": datetime.now().isoformat(),
                "content_type": "carousel" if len(items) > 1 else ("video" if is_video else "image"),
                "is_video": is_video,
                "duration_str": "Video" if is_video else "Post",
                "thumbnail": items[0]["display_url"] if items else None,
                "total_items": len(items),
                "available_formats": formats,
                "items": items
            }
        except Exception:
            return self._extract_generic(url, platform_name="Threads", platform_icon="message-circle")

    def _extract_tiktok(self, url: str) -> Dict[str, Any]:
        return self._extract_generic(url, platform_name="TikTok", platform_icon="video")

    def _build_ydl_opts(
        self,
        format_id: Optional[str] = None,
        out_template: Optional[str] = None,
        skip_download: bool = False
    ) -> Dict[str, Any]:
        settings = config.load_settings()
        cookies_mode = settings.get("cookies_mode", "auto")
        cookies_browser = settings.get("cookies_browser", "firefox")

        ydl_opts: Dict[str, Any] = {
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'no_check_certificates': True,
            'remote_components': ['ejs:github'],
            'js_runtimes': {'node': {}},
            'extractor_args': {
                'youtube': {
                    'player_client': ['web_embedded', 'android', 'mweb']
                }
            }
        }

        if out_template:
            ydl_opts['outtmpl'] = out_template
            ydl_opts['concurrent_fragment_downloads'] = 6
            ydl_opts['buffersize'] = 1024 * 1024 * 4
            ydl_opts['http_chunk_size'] = 10485760

        if skip_download:
            ydl_opts['skip_download'] = True

        # Attach cookies based on configuration
        cookies_path = config.get_cookies_path()
        if cookies_mode == "file":
            if cookies_path and os.path.exists(cookies_path) and os.path.getsize(cookies_path) > 5:
                ydl_opts['cookiefile'] = cookies_path
        elif cookies_mode == "browser":
            if cookies_browser:
                ydl_opts['cookiesfrombrowser'] = (cookies_browser,)
        elif cookies_mode == "auto":
            # Auto: If cookies.txt exists and has content, use it!
            if cookies_path and os.path.exists(cookies_path) and os.path.getsize(cookies_path) > 10:
                ydl_opts['cookiefile'] = cookies_path

        # Format specification
        if format_id:
            if format_id == "audio_mp3":
                ydl_opts.update({
                    'format': 'bestaudio/best',
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '320',
                    }]
                })
            elif format_id in ["1440p", "2k"]:
                ydl_opts.update({
                    'format': 'bestvideo[height<=1440]+bestaudio/best[height<=1440]/best',
                    'merge_output_format': 'mp4'
                })
            elif format_id == "1080p":
                ydl_opts.update({
                    'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
                    'merge_output_format': 'mp4'
                })
            elif format_id == "720p":
                ydl_opts.update({
                    'format': 'bestvideo[height<=720]+bestaudio/best[height<=720]/best',
                    'merge_output_format': 'mp4'
                })
            elif format_id == "480p":
                ydl_opts.update({
                    'format': 'bestvideo[height<=480]+bestaudio/best[height<=480]/best',
                    'merge_output_format': 'mp4'
                })
            elif format_id == "360p":
                ydl_opts.update({
                    'format': 'bestvideo[height<=360]+bestaudio/best[height<=360]/best',
                    'merge_output_format': 'mp4'
                })
            else:  # best_video
                ydl_opts.update({
                    'format': 'bestvideo+bestaudio/best',
                    'merge_output_format': 'mp4'
                })

        return ydl_opts

    def _execute_ytdlp(self, url: str, ydl_opts: Dict[str, Any], download: bool = False) -> Any:
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                if download:
                    return ydl.download([url])
                else:
                    return ydl.extract_info(url, download=False)
        except Exception as first_err:
            err_str = str(first_err).lower()

            # Handle browser cookies extraction failure (locked database, DPAPI decryption, etc.)
            if 'cookiesfrombrowser' in ydl_opts and ('cookie' in err_str or 'dpapi' in err_str or 'database' in err_str or 'permission denied' in err_str):
                opts_retry = dict(ydl_opts)
                del opts_retry['cookiesfrombrowser']
                try:
                    with yt_dlp.YoutubeDL(opts_retry) as ydl:
                        if download:
                            return ydl.download([url])
                        else:
                            return ydl.extract_info(url, download=False)
                except Exception as second_err:
                    first_err = second_err
                    err_str = str(second_err).lower()

            # Handle bot detection / login required
            if "sign in" in err_str or "confirm you're not a bot" in err_str or "--cookies" in err_str or "login" in err_str or "requested format is not available" in err_str:
                # Try fallback client without any cookies and with web_embedded
                opts_fallback = dict(ydl_opts)
                if 'cookiesfrombrowser' in opts_fallback:
                    del opts_fallback['cookiesfrombrowser']
                if 'cookiefile' in opts_fallback:
                    del opts_fallback['cookiefile']
                opts_fallback['extractor_args'] = {
                    'youtube': {
                        'player_client': ['web_embedded', 'android', 'mweb']
                    }
                }
                try:
                    with yt_dlp.YoutubeDL(opts_fallback) as ydl:
                        if download:
                            return ydl.download([url])
                        else:
                            return ydl.extract_info(url, download=False)
                except Exception:
                    pass

                raise RuntimeError(
                    "YouTube/Platform mewajibkan otentikasi login ('Sign in use --cookies-from-browser or --cookie'). "
                    "Solusi: Buka menu 'Pengaturan' di aplikasi, pilih Cookies Browser (Firefox/Edge) atau upload file cookies.txt."
                )

            raise first_err

    def _extract_generic(
        self,
        url: str,
        platform_name: str = "Media",
        platform_icon: str = "play"
    ) -> Dict[str, Any]:
        ydl_opts = self._build_ydl_opts(skip_download=True)
        info = self._execute_ytdlp(url, ydl_opts, download=False)
        if not info:
            raise ValueError(f"Gagal mengambil metadata dari link {url}")

            title = info.get("title") or info.get("description") or "Video"
            author = info.get("uploader") or info.get("channel") or "Creator"
            item_id = info.get("id") or "media"
            thumbnail = info.get("thumbnail")
            dur = info.get("duration")
            dur_str = info.get("duration_string")
            if dur_str:
                duration_str = dur_str
            elif dur:
                duration_str = f"{int(dur)//60}:{int(dur)%60:02d}"
            else:
                duration_str = "Video"

            return {
                "success": True,
                "platform": self.detect_platform(url),
                "platform_name": platform_name,
                "platform_icon": platform_icon,
                "shortcode": item_id,
                "url": url,
                "author": author,
                "title": title[:80],
                "caption": title,
                "caption_summary": title[:100] + ("..." if len(title) > 100 else ""),
                "date_str": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "date_iso": datetime.now().isoformat(),
                "content_type": "video",
                "is_video": True,
                "duration_str": duration_str,
                "thumbnail": thumbnail,
                "total_items": 1,
                "available_formats": [
                    {"id": "best_video", "label": "Video Kualitas Tertinggi", "size": "MP4", "badge": "1080p/HD"},
                    {"id": "720p", "label": "HD 720p", "size": "MP4", "badge": "720p"},
                    {"id": "audio_mp3", "label": "Ekstrak Audio Saja", "size": "MP3", "badge": "Audio MP3"}
                ],
                "items": [{
                    "index": 1,
                    "is_video": True,
                    "display_url": thumbnail,
                    "video_url": info.get("url"),
                    "download_url": info.get("url")
                }]
            }

    def generate_folder_name(self, post_info: Dict[str, Any], naming_format: str) -> str:
        """Generate formatted folder name based on post info."""
        author = self.sanitize_filename(post_info.get("author", "user"), max_length=20)
        shortcode = post_info.get("shortcode", "media")
        
        caption = post_info.get("title") or post_info.get("caption", "")
        caption_slug = self.sanitize_filename(caption, max_length=35)
        
        date_str = post_info.get("date_str", "")
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
        except Exception:
            dt = datetime.now()

        dt_full = dt.strftime("%Y-%m-%d_%H-%M-%S")
        dt_day = dt.strftime("%Y-%m-%d")

        if naming_format == 'datetime':
            return f"{dt_full}_{shortcode}"
        elif naming_format == 'content_name':
            return f"{author}_{caption_slug}_{shortcode}"
        elif naming_format == 'datetime_content':
            return f"{dt_day}_{author}_{caption_slug}"
        else:
            return f"{dt_full}_{author}_{shortcode}"

    def download(
        self,
        post_info: Dict[str, Any],
        selected_indices: Optional[List[int]] = None,
        format_id: Optional[str] = "1080p",
        output_base_dir: Optional[str] = None,
        naming_format: str = "datetime",
        save_caption: bool = True
    ) -> Dict[str, Any]:
        """Fast download engine that always saves thumbnail.jpg for video/audio folders."""
        if not output_base_dir:
            output_base_dir = config.load_settings().get("output_dir", os.path.abspath("downloads"))
        platform = post_info.get("platform", "other")
        platform_folder = post_info.get("platform_name", "Downloads")
        
        platform_dir = os.path.join(output_base_dir, platform_folder)
        folder_name = self.generate_folder_name(post_info, naming_format)
        target_dir = os.path.join(platform_dir, folder_name)
        os.makedirs(target_dir, exist_ok=True)

        downloaded_files = []

        # 1. ALWAYS SAVE THUMBNAIL as thumbnail.jpg in the target folder so it's never empty!
        thumb_url = None
        if post_info.get("items") and len(post_info["items"]) > 0:
            thumb_url = post_info["items"][0].get("display_url")

        if thumb_url:
            try:
                r_thumb = self.session.get(thumb_url, timeout=10)
                if r_thumb.status_code == 200:
                    thumb_path = os.path.join(target_dir, "thumbnail.jpg")
                    with open(thumb_path, "wb") as tf:
                        tf.write(r_thumb.content)
                    downloaded_files.append(thumb_path)
            except Exception:
                pass

        # 2. DOWNLOAD VIDEO / AUDIO VIA YT-DLP
        if post_info.get("is_video") and platform in ["youtube", "tiktok", "other"]:
            format_id = format_id or "1080p"
            out_template = os.path.join(target_dir, "%(title).50s.%(ext)s")
            ydl_opts = self._build_ydl_opts(format_id=format_id, out_template=out_template)
            download_target_url = self.sanitize_youtube_url(post_info["url"]) if platform == "youtube" else post_info["url"]
            self._execute_ytdlp(download_target_url, ydl_opts, download=True)

            for f in os.listdir(target_dir):
                if not f.endswith(".txt") and os.path.join(target_dir, f) not in downloaded_files:
                    downloaded_files.append(os.path.join(target_dir, f))
                    downloaded_files.append(os.path.join(target_dir, f))

        else:
            # Direct media downloads (Instagram Carousel, Twitter photos, Pinterest images, etc.)
            items = post_info.get("items", [])
            if selected_indices:
                items = [it for it in items if it["index"] in selected_indices]

            for item in items:
                idx = item["index"]
                is_video = item["is_video"]
                ext = "mp4" if is_video else "jpg"
                filename = f"slide_{idx:02d}.{ext}" if len(items) > 1 else f"media.{ext}"
                file_path = os.path.join(target_dir, filename)

                dl_url = item.get("download_url") or item.get("video_url") or item.get("display_url")
                if not dl_url:
                    continue

                resp = self.session.get(dl_url, stream=True, timeout=30)
                if resp.status_code == 200:
                    with open(file_path, "wb") as f:
                        for chunk in resp.iter_content(chunk_size=1024 * 128):
                            if chunk:
                                tf_write = f.write(chunk)
                    downloaded_files.append(file_path)

            # If user requested MP3 extraction for direct video
            if format_id == "audio_mp3":
                for df in list(downloaded_files):
                    if df.endswith(".mp4"):
                        mp3_path = df[:-4] + ".mp3"
                        try:
                            subprocess.run(["ffmpeg", "-i", df, "-vn", "-b:a", "320k", mp3_path, "-y"], capture_output=True, timeout=30)
                            if os.path.exists(mp3_path):
                                downloaded_files.append(mp3_path)
                                try:
                                    os.remove(df)
                                    downloaded_files.remove(df)
                                except Exception:
                                    pass
                        except Exception:
                            pass

        # Save caption
        if save_caption and (post_info.get("caption") or post_info.get("title")):
            caption_file = os.path.join(target_dir, "caption.txt")
            with open(caption_file, "w", encoding="utf-8") as f:
                f.write(f"Platform: {post_info.get('platform_name')}\n")
                f.write(f"Author: @{post_info.get('author')}\n")
                f.write(f"Date: {post_info.get('date_str')}\n")
                f.write(f"URL: {post_info.get('url')}\n")
                f.write("-" * 40 + "\n\n")
                f.write(post_info.get("caption") or post_info.get("title", ""))

        return {
            "folder_name": f"{platform_folder}/{folder_name}",
            "folder_path": os.path.abspath(target_dir),
            "total_downloaded": len(downloaded_files),
            "files": downloaded_files
        }
