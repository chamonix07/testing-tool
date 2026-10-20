import os
import re
import unicodedata
from datetime import datetime
from typing import List, Dict, Any, Optional
import requests
import instaloader

class InstagramService:
    def __init__(self, session_id: Optional[str] = None):
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern=""
        )
        self.session_id = session_id
        if session_id:
            self.set_session_id(session_id)

    def set_session_id(self, session_id: str):
        self.session_id = session_id.strip()
        if self.session_id:
            # Inject sessionid into instaloader's requests session
            self.loader.context._session.cookies.set("sessionid", self.session_id, domain=".instagram.com")

    @staticmethod
    def extract_shortcode(url: str) -> str:
        """Extract shortcode from Instagram URL."""
        url = url.strip()
        patterns = [
            r"instagram\.com/(?:p|reel|reels|share/p)/([A-Za-z0-9_-]+)",
            r"instagr\.am/(?:p|reel|reels)/([A-Za-z0-9_-]+)",
            r"^([A-Za-z0-9_-]{8,20})$"  # Raw shortcode
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        raise ValueError("URL Instagram tidak valid. Pastikan link berisi /p/ atau /reel/.")

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

    def get_post_info(self, url: str) -> Dict[str, Any]:
        """Fetch post info and all slide/media items."""
        shortcode = self.extract_shortcode(url)
        try:
            post = instaloader.Post.from_shortcode(self.loader.context, shortcode)
            
            author = post.owner_username or "unknown"
            caption = post.caption or ""
            date_local = post.date_local
            typename = post.typename
            
            items = []
            if typename == 'GraphSidecar':
                content_type = 'carousel'
                for idx, node in enumerate(post.get_sidecar_nodes()):
                    items.append({
                        "index": idx + 1,
                        "is_video": node.is_video,
                        "display_url": node.display_url,
                        "video_url": node.video_url if node.is_video else None,
                        "download_url": node.video_url if node.is_video else node.display_url
                    })
            elif post.is_video:
                content_type = 'reel' if 'reel' in url.lower() else 'video'
                items.append({
                    "index": 1,
                    "is_video": True,
                    "display_url": post.url,
                    "video_url": post.video_url,
                    "download_url": post.video_url
                })
            else:
                content_type = 'image'
                items.append({
                    "index": 1,
                    "is_video": False,
                    "display_url": post.url,
                    "video_url": None,
                    "download_url": post.url
                })

            duration_str = "Foto"
            if post.is_video:
                dur = getattr(post, 'video_duration', None)
                if dur:
                    mins = int(dur) // 60
                    secs = int(dur) % 60
                    duration_str = f"{mins}:{secs:02d}"
                else:
                    duration_str = "Reel"
            elif typename == 'GraphSidecar':
                duration_str = f"{len(items)} Foto/Video"

            thumb = items[0]["display_url"] if items else post.url

            return {
                "success": True,
                "shortcode": shortcode,
                "url": f"https://www.instagram.com/p/{shortcode}/",
                "author": author,
                "title": caption[:60] if caption else f"Post Instagram @{author}",
                "caption": caption,
                "caption_summary": caption[:100] + ("..." if len(caption) > 100 else ""),
                "date_str": date_local.strftime("%Y-%m-%d %H:%M:%S"),
                "date_iso": date_local.isoformat(),
                "content_type": content_type,
                "duration_str": duration_str,
                "thumbnail": thumb,
                "total_items": len(items),
                "items": items
            }
        except Exception as e:
            # Fallback for Reel using yt-dlp if instaloader hits login wall
            if "reel" in url.lower() or "/p/" in url.lower():
                try:
                    return self._fallback_ytdlp_info(url, shortcode)
                except Exception:
                    pass
            raise RuntimeError(f"Gagal memuat postingan ({shortcode}): {str(e)}")

    def _fallback_ytdlp_info(self, url: str, shortcode: str) -> Dict[str, Any]:
        """Fallback extractor using yt-dlp for video/reels."""
        import yt_dlp
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise ValueError("Tidak dapat mengekstrak media dengan yt-dlp")
            
            author = info.get('uploader') or info.get('channel') or "instagram_user"
            caption = info.get('description') or info.get('title') or ""
            upload_date = info.get('upload_date') # YYYYMMDD
            if upload_date and len(upload_date) == 8:
                date_str = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]} 00:00:00"
            else:
                date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            dur = info.get("duration")
            dur_str = info.get("duration_string")
            if dur_str:
                duration_str = dur_str
            elif dur:
                duration_str = f"{int(dur)//60}:{int(dur)%60:02d}"
            else:
                duration_str = "Reel"

            return {
                "success": True,
                "shortcode": shortcode,
                "url": url,
                "author": author,
                "title": caption[:60] if caption else f"Reel @{author}",
                "caption": caption,
                "caption_summary": caption[:100] + ("..." if len(caption) > 100 else ""),
                "date_str": date_str,
                "date_iso": datetime.now().isoformat(),
                "content_type": "reel",
                "duration_str": duration_str,
                "thumbnail": display_url,
                "total_items": 1,
                "items": [{
                    "index": 1,
                    "is_video": True,
                    "display_url": display_url,
                    "video_url": download_url,
                    "download_url": download_url
                }]
            }

    def generate_folder_name(self, post_info: Dict[str, Any], naming_format: str) -> str:
        """
        Generate folder name based on naming format:
        - 'datetime': 2026-10-19_11-30-00_{shortcode}
        - 'content_name': {author}_{caption_slug}_{shortcode}
        - 'datetime_content': 2026-10-19_{author}_{caption_slug}
        """
        author = self.sanitize_filename(post_info.get("author", "user"), max_length=20)
        shortcode = post_info.get("shortcode", "post")
        
        caption = post_info.get("caption", "")
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

    def download_items(
        self,
        post_info: Dict[str, Any],
        selected_indices: Optional[List[int]],
        output_base_dir: str,
        naming_format: str,
        save_caption: bool = True
    ) -> Dict[str, Any]:
        """Download specified items (or all if selected_indices is None or empty)."""
        folder_name = self.generate_folder_name(post_info, naming_format)
        target_dir = os.path.join(output_base_dir, folder_name)
        os.makedirs(target_dir, exist_ok=True)

        items_to_download = post_info["items"]
        if selected_indices:
            items_to_download = [
                item for item in items_to_download if item["index"] in selected_indices
            ]

        downloaded_files = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        for item in items_to_download:
            idx = item["index"]
            is_video = item["is_video"]
            ext = "mp4" if is_video else "jpg"
            filename = f"slide_{idx:02d}.{ext}"
            file_path = os.path.join(target_dir, filename)

            download_url = item["download_url"]
            resp = requests.get(download_url, headers=headers, stream=True, timeout=30)
            if resp.status_code == 200:
                with open(file_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=1024 * 64):
                        if chunk:
                            f.write(chunk)
                downloaded_files.append(file_path)
            else:
                raise RuntimeError(f"Gagal mengunduh file slide {idx} (HTTP {resp.status_code})")

        if save_caption and post_info.get("caption"):
            caption_file = os.path.join(target_dir, "caption.txt")
            with open(caption_file, "w", encoding="utf-8") as f:
                f.write(f"Author: @{post_info.get('author')}\n")
                f.write(f"Date: {post_info.get('date_str')}\n")
                f.write(f"URL: {post_info.get('url')}\n")
                f.write("-" * 40 + "\n\n")
                f.write(post_info.get("caption", ""))

        return {
            "folder_name": folder_name,
            "folder_path": os.path.abspath(target_dir),
            "total_downloaded": len(downloaded_files),
            "files": downloaded_files
        }
