// IN DONLOTiN - Universal Media Downloader v2.4
// Modern Interactive Engine Logic

// State Management
let currentPostData = null;
let selectedSlideIndices = new Set();
let selectedFormatId = "1080p";
let currentModalFolder = null;
let currentModalFolderPath = null;
let allLoadedFolders = [];
let currentVaultFilter = "all";
let vaultSearchQuery = "";
let pendingDeletePath = null;
let pendingDeleteName = null;
let selectedVaultFolderNames = new Set();
let isBatchDeleteModal = false;
let batchAbortController = null;
let isBatchDownloading = false;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initLanguage();
    loadSettings();
    refreshDownloadsList();
    fetchNetworkInfo();
    fetchSystemTelemetry();
    refreshIcons();
});

function refreshIcons() {
    if (window.lucide) {
        setTimeout(() => {
            lucide.createIcons();
        }, 50);
    }
}

// ==========================================
// INTERNATIONALIZATION (ID & EN)
// ==========================================
let currentLang = "id";
const translations = {
    id: {
        engine_ready: "Engine Ready",
        downloads_btn: "Downloads",
        tab_preview: "Pratinjau Media",
        tab_batch: "Batch Downloader",
        tab_vault: "File Tersimpan",
        tab_settings: "Pengaturan",
        open_folder: "Buka Folder Unduhan",
        
        single_title: "Unduh Konten Media",
        single_sub: "Tempelkan link dari Instagram, YouTube, Twitter/X, Pinterest, Threads, atau TikTok.",
        single_placeholder: "Tempel link URL media di sini...",
        single_check_btn: "Periksa Konten",
        folder_naming: "Format Nama Folder:",
        save_caption: "Simpan caption.txt",
        recent_downloads: "Riwayat Unduhan Terakhir",
        view_all_library: "Lihat Semua Library →",
        engine_status: "Status Engine",
        folder_media_saved: "Folder Media Tersimpan",
        btn_open_download_folder: "Buka Folder Unduhan",
        
        batch_title: "Batch Downloader (Unduh Sekaligus)",
        batch_sub: "Tempel beberapa link video atau audio sekaligus (satu baris per link). Sistem akan memproses dan mengunduh antrean secara otomatis secara async tanpa jeda.",
        batch_link_list: "Daftar Link Media:",
        batch_quality: "Kualitas Video / Audio:",
        batch_folder_format: "Format Nama Folder:",
        batch_btn_load_meta: "Muat Metadata",
        batch_btn_start: "Mulai Unduh Semua (Batch)",
        batch_btn_clear: "Bersihkan",
        batch_processing: "Memproses antrean batch...",
        batch_th_thumb: "Thumbnail",
        batch_th_title: "Judul & Platform",
        batch_th_duration: "Durasi",
        batch_th_status: "Status",
        batch_th_action: "Folder Hasil",
        batch_status_ready: "Siap Unduh",
        batch_status_loading_meta: "Memuat info...",
        batch_status_downloading: "Mengunduh...",
        batch_status_success: "Sukses",
        batch_status_failed: "Gagal",
        
        vault_title: "Media Vault (File Tersimpan)",
        vault_sub: "Semua folder tersimpan memiliki cover thumbnail. Klik untuk langsung memutar video, mendengarkan lagu, atau melihat foto di dalam aplikasi.",
        vault_search_placeholder: "Cari berdasarkan judul atau nama folder...",
        vault_empty: "Belum ada media yang tersimpan.",
        vault_btn_select_all: "Pilih Semua",
        vault_btn_deselect_all: "Batalkan Semua",
        vault_btn_delete_selected: "Hapus Terpilih",
        
        settings_title: "Pengaturan Aplikasi",
        settings_sub: "Konfigurasi lokasi penyimpanan, batas batch, sesi otentikasi akun, dan performa engine unduhan media.",
        setting_storage: "Folder Penyimpanan Utama",
        setting_browse: "Buka",
        setting_naming: "Format Default Nama Folder",
        setting_max_batch: "Batas Maksimal File per Sesi Batch",
        setting_max_batch_desc: "Jumlah maksimum link URL media yang dapat diproses bersamaan dalam satu sesi antrean batch.",
        setting_ig_session: "Instagram Session ID (Opsional untuk Akun Tertutup/Private)",
        setting_reset: "Reset",
        setting_save: "Simpan Pengaturan"
    },
    en: {
        engine_ready: "Engine Ready",
        downloads_btn: "Downloads",
        tab_preview: "Media Preview",
        tab_batch: "Batch Downloader",
        tab_vault: "Saved Files",
        tab_settings: "Settings",
        open_folder: "Open Downloads Folder",
        
        single_title: "Download Media Content",
        single_sub: "Paste links from Instagram, YouTube, Twitter/X, Pinterest, Threads, or TikTok.",
        single_placeholder: "Paste media URL link here...",
        single_check_btn: "Check Media",
        folder_naming: "Folder Name Format:",
        save_caption: "Save caption.txt",
        recent_downloads: "Recent Downloads",
        view_all_library: "View All Library →",
        engine_status: "Engine Status",
        folder_media_saved: "Saved Media Folders",
        btn_open_download_folder: "Open Downloads Folder",
        
        batch_title: "Batch Downloader (Multi-Download)",
        batch_sub: "Paste multiple video or audio links (one line per link). The system will asynchronously fetch metadata and download the queue automatically.",
        batch_link_list: "Media Links List:",
        batch_quality: "Video / Audio Quality:",
        batch_folder_format: "Folder Name Format:",
        batch_btn_load_meta: "Load Metadata",
        batch_btn_start: "Start Batch Download",
        batch_btn_clear: "Clear",
        batch_processing: "Processing batch queue...",
        batch_th_thumb: "Thumbnail",
        batch_th_title: "Title & Platform",
        batch_th_duration: "Duration",
        batch_th_status: "Status",
        batch_th_action: "Result Folder",
        batch_status_ready: "Ready",
        batch_status_loading_meta: "Loading info...",
        batch_status_downloading: "Downloading...",
        batch_status_success: "Success",
        batch_status_failed: "Failed",
        
        vault_title: "Media Vault (Saved Files)",
        vault_sub: "All saved folders have thumbnail covers. Click to directly play videos, listen to audio, or view images inside the app.",
        vault_search_placeholder: "Search by title or folder name...",
        vault_empty: "No saved media found.",
        vault_btn_select_all: "Select All",
        vault_btn_deselect_all: "Deselect All",
        vault_btn_delete_selected: "Delete Selected",
        
        settings_title: "Application Settings",
        settings_sub: "Configure storage directory, batch limit, account authentication session, and download engine performance.",
        setting_storage: "Main Storage Folder",
        setting_browse: "Open",
        setting_naming: "Default Folder Name Format",
        setting_max_batch: "Maximum Files per Batch Session",
        setting_max_batch_desc: "Maximum number of media URLs allowed to be processed simultaneously per batch session.",
        setting_ig_session: "Instagram Session ID (Optional for Private Accounts)",
        setting_reset: "Reset",
        setting_save: "Save Settings"
    }
};

function initLanguage() {
    currentLang = localStorage.getItem("in_donlotin_lang") || "id";
    setLanguage(currentLang);
}

function toggleLanguage() {
    setLanguage(currentLang === "id" ? "en" : "id");
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("in_donlotin_lang", lang);
    const label = document.getElementById("lang-current-label");
    if (label) label.textContent = lang.toUpperCase();
    
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
}

// ==========================================
// THEME SWITCHER (Dark & Light)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem("in_donlotin_theme") || "dark";
    setTheme(savedTheme);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
}

function setTheme(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        localStorage.setItem("in_donlotin_theme", "dark");
        updateThemeIcons(true);
    } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
        localStorage.setItem("in_donlotin_theme", "light");
        updateThemeIcons(false);
    }
}

function updateThemeIcons(isDark) {
    document.querySelectorAll(".theme-toggle-icon").forEach(el => {
        el.textContent = isDark ? "light_mode" : "dark_mode";
    });
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function switchTab(tabId) {
    const tabs = ['single', 'batch', 'downloads', 'settings'];
    tabs.forEach(id => {
        const tabEl = document.getElementById(`tab-${id}`);
        const sidebarBtn = document.getElementById(`sidebar-tab-${id}`);
        const topBtn = document.getElementById(`top-tab-${id}`);
        const mobileBtn = document.getElementById(`mobile-tab-${id}`);

        if (id === tabId) {
            if (tabEl) tabEl.classList.remove('hidden');
            if (sidebarBtn) {
                sidebarBtn.className = "sidebar-tab-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface-container-high text-secondary font-semibold border-l-2 border-secondary transition-all cursor-pointer text-left";
            }
            if (topBtn) {
                topBtn.className = "top-nav-btn text-secondary font-semibold border-b-2 border-secondary pb-1 text-sm font-button-text cursor-pointer transition-colors";
            }
            if (mobileBtn) {
                mobileBtn.className = "mobile-nav-btn flex flex-col items-center justify-center text-secondary py-1 px-3 rounded-xl cursor-pointer";
            }
        } else {
            if (tabEl) tabEl.classList.add('hidden');
            if (sidebarBtn) {
                sidebarBtn.className = "sidebar-tab-btn flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer text-left";
            }
            if (topBtn) {
                topBtn.className = "top-nav-btn text-on-surface-variant hover:text-on-surface transition-colors text-sm font-button-text cursor-pointer";
            }
            if (mobileBtn) {
                mobileBtn.className = "mobile-nav-btn flex flex-col items-center justify-center text-on-surface-variant hover:text-on-surface py-1 px-3 rounded-xl cursor-pointer";
            }
        }
    });

    if (tabId === 'downloads') {
        refreshDownloadsList();
    }
    refreshIcons();
}

// ==========================================
// CLIPBOARD PASTE & URL DETECT
// ==========================================
async function pasteClipboard(elementId = 'single-url') {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            const input = document.getElementById(elementId);
            if (input) {
                input.value = text.trim();
                onUrlInput(text.trim());
                showToast("Tautan berhasil ditempel dari clipboard!", "info");
            }
        }
    } catch (err) {
        showToast("Izinkan akses clipboard pada browser untuk menempel otomatis.", "error");
    }
}

function onUrlInput(rawUrl) {
    const url = (rawUrl || "").toLowerCase().trim();
    const pill = document.getElementById("detected-platform-pill");
    const text = document.getElementById("detected-platform-text");
    if (!pill || !text) return;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        text.textContent = "YOUTUBE";
        pill.className = "px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else if (url.includes("instagram.com") || url.includes("instagr.am")) {
        text.textContent = "INSTAGRAM";
        pill.className = "px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else if (url.includes("twitter.com") || url.includes("x.com")) {
        text.textContent = "TWITTER / X";
        pill.className = "px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else if (url.includes("threads.com") || url.includes("threads.net")) {
        text.textContent = "THREADS";
        pill.className = "px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else if (url.includes("pinterest.com") || url.includes("pin.it")) {
        text.textContent = "PINTEREST";
        pill.className = "px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else if (url.includes("tiktok.com")) {
        text.textContent = "TIKTOK";
        pill.className = "px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    } else {
        text.textContent = "UNIVERSAL";
        pill.className = "px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-[10px] font-label-mono-sm font-semibold flex items-center gap-1";
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-msg");
    const toastIcon = document.getElementById("toast-icon");
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;

    if (type === "success") {
        toastIcon.innerHTML = `<span class="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>`;
    } else if (type === "error") {
        toastIcon.innerHTML = `<span class="material-symbols-outlined text-rose-400 text-lg">error</span>`;
    } else {
        toastIcon.innerHTML = `<span class="material-symbols-outlined text-secondary text-lg">info</span>`;
    }

    toast.classList.remove("opacity-0", "translate-y-20", "pointer-events-none");
    setTimeout(hideToast, 4500);
}

function hideToast() {
    const toast = document.getElementById("toast");
    if (toast) toast.classList.add("opacity-0", "translate-y-20", "pointer-events-none");
}

// ==========================================
// SINGLE URL PREVIEW LOGIC
// ==========================================
async function loadPreview() {
    const urlInput = document.getElementById("single-url");
    const url = urlInput.value.trim();

    if (!url) {
        showToast("Masukkan link URL media terlebih dahulu", "error");
        return;
    }

    const btnText = document.getElementById("btn-preview-text");
    const btnSpinner = document.getElementById("btn-preview-spinner");
    const btnBolt = document.getElementById("btn-preview-bolt");
    const skeleton = document.getElementById("preview-skeleton");
    const container = document.getElementById("preview-container");
    const errorBox = document.getElementById("preview-error");

    if (btnText) btnText.textContent = "Memeriksa...";
    if (btnSpinner) btnSpinner.classList.remove("hidden");
    if (btnBolt) btnBolt.classList.add("hidden");
    if (skeleton) skeleton.classList.remove("hidden");
    if (container) container.classList.add("hidden");
    if (errorBox) errorBox.classList.add("hidden");

    try {
        const response = await fetch("/api/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Gagal memuat konten dari tautan ini.");
        }

        currentPostData = data;
        renderPostDetails(data);
        if (container) container.classList.remove("hidden");
    } catch (err) {
        const errTitle = document.getElementById("error-title");
        const errMsg = document.getElementById("error-message");
        if (errTitle) errTitle.textContent = "Gagal Mengekstrak Konten";
        if (errMsg) errMsg.textContent = err.message;
        if (errorBox) errorBox.classList.remove("hidden");
    } finally {
        if (btnText) btnText.textContent = "Periksa Konten";
        if (btnSpinner) btnSpinner.classList.add("hidden");
        if (btnBolt) btnBolt.classList.remove("hidden");
        if (skeleton) skeleton.classList.add("hidden");
        refreshIcons();
    }
}

function renderPostDetails(data) {
    // Badges & Header
    const platformPill = document.getElementById("badge-platform-pill");
    const contentPill = document.getElementById("badge-content-pill");
    const authorEl = document.getElementById("post-author");
    const dateEl = document.getElementById("post-date");
    const titleEl = document.getElementById("post-title");
    const captionEl = document.getElementById("post-caption");
    const summaryPill = document.getElementById("preview-item-summary-pill");

    if (platformPill) platformPill.textContent = (data.platform_name || "MEDIA").toUpperCase();
    if (contentPill) contentPill.textContent = (data.content_type || "VIDEO").toUpperCase();
    if (authorEl) authorEl.innerHTML = `@${data.author || "kreator"}`;
    if (dateEl) dateEl.textContent = data.date_str || "Terkini";
    if (titleEl) titleEl.textContent = data.title || "Konten Media";
    const captionContent = data.caption || data.title || "";
    if (captionEl) captionEl.textContent = captionContent;
    const charCountEl = document.getElementById("post-caption-char-count");
    if (charCountEl) charCountEl.textContent = `${captionContent.length} Karakter`;

    if (summaryPill) {
        summaryPill.textContent = `1 Postingan (${data.total_items || (data.items ? data.items.length : 1)} Item)`;
    }

    // Extract hashtags from caption or title
    const hashtagRegex = /#([a-zA-Z0-9_\u0600-\u06FF]+)/g;
    const matchedTags = [];
    let match;
    while ((match = hashtagRegex.exec(captionContent)) !== null) {
        if (!matchedTags.includes(match[1])) {
            matchedTags.push(match[1]);
        }
    }
    window.currentExtractedHashtags = matchedTags;
    const hashtagsContainer = document.getElementById("hashtags-container");
    const hashtagsList = document.getElementById("hashtags-list");
    if (hashtagsContainer && hashtagsList) {
        if (matchedTags.length > 0) {
            hashtagsContainer.classList.remove("hidden");
            hashtagsList.innerHTML = matchedTags.map(tag => {
                const escaped = tag.replace(/'/g, "\\'");
                return `<button type="button" onclick="copyHashtag('${escaped}')" class="px-2 py-0.5 rounded-md bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/25 text-[11px] font-label-mono-sm font-semibold cursor-pointer transition-colors shadow-xs" title="Klik untuk salin">#${tag}</button>`;
            }).join("");
        } else {
            hashtagsContainer.classList.add("hidden");
            hashtagsList.innerHTML = "";
        }
    }

    // Cover Thumbnail
    const coverImg = document.getElementById("preview-cover-img");
    const thumbUrl = (data.items && data.items.length > 0 && data.items[0].display_url) 
        ? data.items[0].display_url 
        : (data.thumbnail || "");
    if (coverImg && thumbUrl) {
        coverImg.src = `/api/proxy-media?url=${encodeURIComponent(thumbUrl)}`;
    }

    // Video Format Pills (2K, 1080p, 720p, 480p, 360p, MP3)
    const formatCard = document.getElementById("format-options-card");
    const formatGrid = document.getElementById("format-options-grid");
    
    if (data.available_formats && data.available_formats.length > 0 && formatGrid) {
        formatGrid.innerHTML = "";
        selectedFormatId = data.available_formats[0].id;

        data.available_formats.forEach((fmt, idx) => {
            const card = document.createElement("div");
            const isSelected = (idx === 0);
            card.id = `format-card-${fmt.id}`;
            card.className = `p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected 
                ? 'border-secondary bg-secondary-container/20 ring-1 ring-secondary/40 text-on-surface shadow-xs' 
                : 'border-outline-variant/30 bg-surface-container hover:border-secondary/40 text-on-surface-variant'
            }`;
            card.onclick = () => selectVideoFormat(fmt.id);

            card.innerHTML = `
                <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-xs font-label-mono-sm ${isSelected ? 'text-secondary' : 'text-on-surface'}">${fmt.badge || fmt.id}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-secondary text-surface font-bold' : 'bg-surface-container-high text-on-surface-variant'} font-label-mono-sm">
                        ${fmt.size || 'Auto'}
                    </span>
                </div>
                <p class="text-[11px] font-medium truncate ${isSelected ? 'text-on-surface' : 'text-on-surface-variant'}">${fmt.label}</p>
            `;
            formatGrid.appendChild(card);
        });
        if (formatCard) formatCard.classList.remove("hidden");
    } else if (formatCard) {
        formatCard.classList.add("hidden");
    }

    // Carousel Section
    const carouselSec = document.getElementById("carousel-section");
    if (data.content_type === "carousel" && data.items && data.items.length > 1) {
        if (carouselSec) carouselSec.classList.remove("hidden");
        renderSlides(data.items);
    } else {
        if (carouselSec) carouselSec.classList.add("hidden");
        selectedSlideIndices.clear();
        if (data.items && data.items.length > 0) {
            selectedSlideIndices.add(1);
        }
    }

    refreshIcons();
}

function selectVideoFormat(formatId) {
    selectedFormatId = formatId;
    if (!currentPostData || !currentPostData.available_formats) return;

    currentPostData.available_formats.forEach(fmt => {
        const card = document.getElementById(`format-card-${fmt.id}`);
        if (card) {
            const isSelected = (fmt.id === formatId);
            card.className = `p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected 
                ? 'border-secondary bg-secondary-container/20 ring-1 ring-secondary/40 text-on-surface shadow-xs' 
                : 'border-outline-variant/30 bg-surface-container hover:border-secondary/40 text-on-surface-variant'
            }`;
            const titleSpan = card.querySelector("span");
            if (titleSpan) {
                titleSpan.className = `font-bold text-xs font-label-mono-sm ${isSelected ? 'text-secondary' : 'text-on-surface'}`;
            }
        }
    });
}

function renderSlides(items) {
    const grid = document.getElementById("slides-grid");
    if (!grid) return;
    grid.innerHTML = "";
    selectedSlideIndices.clear();

    items.forEach(item => {
        selectedSlideIndices.add(item.index);

        const card = document.createElement("div");
        card.id = `slide-card-${item.index}`;
        card.className = "relative group rounded-xl overflow-hidden border-2 border-secondary bg-surface-container-lowest transition-all shrink-0 w-24 aspect-[4/3]";

        const previewUrl = item.display_url ? `/api/proxy-media?url=${encodeURIComponent(item.display_url)}` : '';

        card.innerHTML = `
            <div class="w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-pointer" onclick="toggleSlideSelection(${item.index})">
                ${previewUrl ? `<img src="${previewUrl}" alt="Slide ${item.index}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">` : `<span class="material-symbols-outlined text-white text-xl">play_arrow</span>`}
            </div>
            <div class="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none">
                <span class="bg-black/80 text-white text-[9px] font-bold font-label-mono-sm px-1.5 py-0.5 rounded">
                    #${item.index}
                </span>
                <div class="pointer-events-auto">
                    <input type="checkbox" id="check-slide-${item.index}" checked 
                           onchange="onCheckboxChange(${item.index}, this.checked)"
                           class="w-3.5 h-3.5 text-blue-600 rounded bg-white border-slate-300 focus:ring-secondary cursor-pointer shadow-xs">
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    refreshIcons();
}

function onCheckboxChange(index, isChecked) {
    if (isChecked) {
        selectedSlideIndices.add(index);
    } else {
        selectedSlideIndices.delete(index);
    }
    const card = document.getElementById(`slide-card-${index}`);
    if (card) {
        card.className = isChecked 
            ? "relative group rounded-xl overflow-hidden border-2 border-secondary bg-surface-container-lowest transition-all shrink-0 w-24 aspect-[4/3]"
            : "relative group rounded-xl overflow-hidden border-2 border-transparent opacity-50 bg-surface-container-lowest transition-all shrink-0 w-24 aspect-[4/3]";
    }
}

function toggleSlideSelection(index) {
    const cb = document.getElementById(`check-slide-${index}`);
    if (cb) {
        cb.checked = !cb.checked;
        onCheckboxChange(index, cb.checked);
    }
}

function selectAllSlides(selectAll) {
    if (!currentPostData || !currentPostData.items) return;
    currentPostData.items.forEach(item => {
        const cb = document.getElementById(`check-slide-${item.index}`);
        if (cb) {
            cb.checked = selectAll;
            onCheckboxChange(item.index, selectAll);
        }
    });
}

function copyCaptionText() {
    const captionEl = document.getElementById("post-caption");
    const text = captionEl ? captionEl.textContent : "";
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(currentLang === "id" ? "Teks caption berhasil disalin ke clipboard!" : "Caption text copied to clipboard!", "success");
        });
    }
}

function copyHashtag(tag) {
    if (!tag) return;
    navigator.clipboard.writeText("#" + tag).then(() => {
        showToast(currentLang === "id" ? `Hashtag #${tag} disalin!` : `Hashtag #${tag} copied!`, "success");
    }).catch(() => {
        showToast(`#${tag}`, "info");
    });
}

function copyAllHashtags() {
    if (!window.currentExtractedHashtags || window.currentExtractedHashtags.length === 0) {
        showToast(currentLang === "id" ? "Tidak ada hashtag untuk disalin." : "No hashtags to copy.", "info");
        return;
    }
    const allTags = window.currentExtractedHashtags.map(t => `#${t}`).join(" ");
    navigator.clipboard.writeText(allTags).then(() => {
        showToast(currentLang === "id" ? "Semua hashtag disalin ke clipboard!" : "All hashtags copied to clipboard!", "success");
    }).catch(() => {
        showToast(allTags, "info");
    });
}

function downloadCoverImage() {
    if (!currentPostData) return;
    const thumbUrl = (currentPostData.items && currentPostData.items.length > 0 && currentPostData.items[0].display_url) 
        ? currentPostData.items[0].display_url 
        : (currentPostData.thumbnail || "");
    if (!thumbUrl) {
        showToast(currentLang === "id" ? "Thumbnail tidak tersedia untuk konten ini." : "Thumbnail not available.", "error");
        return;
    }
    const downloadUrl = `/api/proxy-media?url=${encodeURIComponent(thumbUrl)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${currentPostData.shortcode || 'cover'}_thumbnail.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(currentLang === "id" ? "Mengunduh poster / thumbnail HD..." : "Downloading HD poster thumbnail...", "success");
}

function copyDirectMediaLink() {
    if (!currentPostData) return;
    let directUrl = "";
    if (currentPostData.items && currentPostData.items.length > 0) {
        directUrl = currentPostData.items[0].video_url || currentPostData.items[0].display_url || "";
    }
    if (!directUrl && currentPostData.download_url) {
        directUrl = currentPostData.download_url;
    }
    if (!directUrl) {
        directUrl = currentPostData.url || "";
    }
    if (directUrl) {
        navigator.clipboard.writeText(directUrl).then(() => {
            showToast(currentLang === "id" ? "Tautan media langsung disalin ke clipboard!" : "Direct media link copied!", "success");
        });
    } else {
        showToast(currentLang === "id" ? "Tautan media tidak ditemukan." : "Media link not found.", "error");
    }
}

function openQrModal() {
    if (!currentPostData || !currentPostData.url) {
        showToast(currentLang === "id" ? "Silakan periksa konten terlebih dahulu." : "Please preview content first.", "error");
        return;
    }
    const modal = document.getElementById("qr-modal");
    const qrImg = document.getElementById("qr-modal-img");
    const qrUrlText = document.getElementById("qr-modal-url");

    let targetUrl = currentPostData.url;
    if (currentPostData.items && currentPostData.items.length > 0 && currentPostData.items[0].video_url) {
        targetUrl = currentPostData.items[0].video_url;
    }

    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
    if (qrImg) qrImg.src = qrApiUrl;
    if (qrUrlText) qrUrlText.textContent = targetUrl;
    if (modal) modal.classList.remove("hidden");
    refreshIcons();
}

function closeQrModal() {
    const modal = document.getElementById("qr-modal");
    if (modal) modal.classList.add("hidden");
}

function downloadAudioOnly() {
    if (!currentPostData) return;
    selectedFormatId = "audio_mp3";
    selectVideoFormat("audio_mp3");
    downloadSelected('folder');
}

// ==========================================
// DOWNLOAD EXECUTION
// ==========================================
async function downloadSelected(type) {
    if (!currentPostData) return;

    const url = currentPostData.url;
    const naming = document.getElementById("single-naming-format").value;
    const saveCaption = document.getElementById("single-save-caption").checked;
    const indices = Array.from(selectedSlideIndices);

    if (currentPostData.content_type === "carousel" && indices.length === 0) {
        showToast("Pilih minimal satu slide media untuk diunduh.", "error");
        return;
    }

    const progressContainer = document.getElementById("single-download-progress-container");
    const progressText = document.getElementById("single-progress-text");
    const progressBar = document.getElementById("single-progress-bar");
    const progressPercent = document.getElementById("single-progress-percent");

    if (progressContainer) {
        progressContainer.classList.remove("hidden");
        if (progressBar) progressBar.style.width = "15%";
        if (progressPercent) progressPercent.textContent = "15%";
        if (progressText) progressText.textContent = type === 'zip' 
            ? (currentLang === "id" ? "Mengompresi berkas ZIP..." : "Compressing ZIP file...") 
            : (currentLang === "id" ? "Mengunduh media ke komputer..." : "Downloading media to storage...");
    }

    let currentVal = 15;
    const progressTimer = setInterval(() => {
        if (currentVal < 88) {
            currentVal += Math.floor(Math.random() * 8) + 4;
            if (currentVal > 88) currentVal = 88;
            if (progressBar) progressBar.style.width = `${currentVal}%`;
            if (progressPercent) progressPercent.textContent = `${currentVal}%`;
        }
    }, 350);

    const finishProgress = (isSuccess) => {
        clearInterval(progressTimer);
        if (progressBar) progressBar.style.width = isSuccess ? "100%" : "0%";
        if (progressPercent) progressPercent.textContent = isSuccess ? "100%" : "0%";
        if (progressText && isSuccess) {
            progressText.textContent = currentLang === "id" ? "Unduhan Berhasil 100%!" : "Download Completed 100%!";
        }
        setTimeout(() => {
            if (progressContainer) progressContainer.classList.add("hidden");
        }, 1800);
    };

    if (type === 'zip') {
        const btnZip = document.getElementById("btn-save-zip");
        const originalText = btnZip.innerHTML;
        btnZip.disabled = true;
        btnZip.innerHTML = `<span class="material-symbols-outlined text-lg animate-spin">sync</span> Mengompres...`;

        try {
            const resp = await fetch("/api/download-zip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url,
                    selected_indices: indices,
                    naming_format: naming,
                    save_caption: saveCaption
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || "Gagal membuat berkas ZIP.");
            }

            const blob = await resp.blob();
            finishProgress(true);
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${currentPostData.shortcode || 'media'}_${currentPostData.platform || 'file'}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            showToast("Berkas ZIP berhasil diunduh ke browser!", "success");
        } catch (err) {
            finishProgress(false);
            showToast(err.message, "error");
        } finally {
            btnZip.disabled = false;
            btnZip.innerHTML = originalText;
        }

    } else {
        // Direct Server / Folder Download
        const btnFolder = document.getElementById("btn-save-folder");
        const originalText = btnFolder.innerHTML;
        btnFolder.disabled = true;
        btnFolder.innerHTML = `<span class="material-symbols-outlined text-xl animate-spin">sync</span> Mengunduh...`;

        try {
            const resp = await fetch("/api/download-selective", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: url,
                    selected_indices: indices,
                    format_id: selectedFormatId,
                    naming_format: naming,
                    save_caption: saveCaption
                })
            });

            const result = await resp.json();

            if (!resp.ok) {
                throw new Error(result.detail || "Gagal mengunduh media.");
            }

            finishProgress(true);
            showToast(`Berhasil disimpan ke ${result.folder_name}!`, "success");
            refreshDownloadsList();
        } catch (err) {
            finishProgress(false);
            showToast(err.message, "error");
        } finally {
            btnFolder.disabled = false;
            btnFolder.innerHTML = originalText;
        }
    }
}

// ==========================================
// MOBILE LOCALSTORAGE VAULT & DIRECT DOWNLOAD
// ==========================================
const MOBILE_VAULT_KEY = "in_donlotin_mobile_vault";

function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function getMobileVaultItems() {
    try {
        const raw = localStorage.getItem(MOBILE_VAULT_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error reading mobile vault from localStorage:", e);
        return [];
    }
}

function saveToMobileVault(item) {
    try {
        const current = getMobileVaultItems();
        const filtered = current.filter(x => x.folder_name !== item.folder_name && x.id !== item.id);
        filtered.unshift(item);
        if (filtered.length > 50) filtered.length = 50;
        localStorage.setItem(MOBILE_VAULT_KEY, JSON.stringify(filtered));
        updateMobileVaultUI();
    } catch (e) {
        console.error("Error saving to mobile vault:", e);
    }
}

function removeFromMobileVault(identifier) {
    try {
        const current = getMobileVaultItems();
        const filtered = current.filter(x => x.id !== identifier && x.folder_name !== identifier);
        localStorage.setItem(MOBILE_VAULT_KEY, JSON.stringify(filtered));
        updateMobileVaultUI();
    } catch (e) {
        console.error("Error removing from mobile vault:", e);
    }
}

function clearMobileVault() {
    try {
        localStorage.removeItem(MOBILE_VAULT_KEY);
        updateMobileVaultUI();
        refreshDownloadsList();
        showToast(currentLang === "id" ? "Penyimpanan LocalStorage HP berhasil dikosongkan." : "Mobile LocalStorage vault cleared.", "info");
    } catch (e) {
        console.error("Error clearing mobile vault:", e);
    }
}

function clearMobileVaultPrompt() {
    const items = getMobileVaultItems();
    if (items.length === 0) {
        showToast(currentLang === "id" ? "Penyimpanan LocalStorage HP sudah kosong." : "Mobile vault is already empty.", "info");
        return;
    }
    if (confirm(currentLang === "id" ? `Kosongkan ${items.length} riwayat media dari penyimpanan LocalStorage HP?` : `Clear ${items.length} items from mobile storage?`)) {
        clearMobileVault();
    }
}

function updateMobileVaultUI() {
    const items = getMobileVaultItems();
    const countBadge = document.getElementById("mobile-vault-badge");
    const mobDockCount = document.getElementById("mobile-folder-count");
    if (countBadge) countBadge.textContent = `${items.length} File`;
    if (mobDockCount) {
        const total = items.length + (allLoadedFolders ? allLoadedFolders.filter(x => !x.is_mobile_vault).length : 0);
        mobDockCount.textContent = total;
        if (total > 0) mobDockCount.classList.remove("hidden");
        else mobDockCount.classList.add("hidden");
    }
}

async function downloadDirectToDevice() {
    if (!currentPostData) {
        showToast(currentLang === "id" ? "Silakan muat dan periksa link konten terlebih dahulu." : "Please preview media first.", "error");
        return;
    }

    const platform = currentPostData.platform || "media";
    const shortcode = currentPostData.shortcode || ("item_" + Date.now());
    const isVideo = currentPostData.is_video ?? true;
    const author = currentPostData.author || "Creator";
    const title = currentPostData.title || currentPostData.caption_summary || "Media " + platform;

    const indices = Array.from(selectedSlideIndices);
    const isMultiCarousel = currentPostData.content_type === "carousel" && indices.length > 1;

    let directMediaUrl = "";
    if (currentPostData.items && currentPostData.items.length > 0) {
        const firstIdx = (indices.length > 0) ? (indices[0] - 1) : 0;
        const targetItem = currentPostData.items[firstIdx] || currentPostData.items[0];
        if (targetItem) {
            directMediaUrl = targetItem.video_url || targetItem.display_url || "";
        }
    }
    if (!directMediaUrl && currentPostData.download_url) {
        directMediaUrl = currentPostData.download_url;
    }

    const ext = isVideo ? "mp4" : "jpg";
    const fileName = `${platform}_${shortcode}.${ext}`;

    const btn = document.getElementById("btn-save-device");
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-lg animate-spin">sync</span> Mengunduh ke HP...`;
    }

    try {
        let finalDownloadUrl = "";
        let playableUrl = "";

        if (isMultiCarousel || !directMediaUrl || platform.toLowerCase() === "youtube") {
            const naming = document.getElementById("single-naming-format")?.value || "datetime";
            const saveCaption = document.getElementById("single-save-caption")?.checked ?? true;

            const resp = await fetch("/api/download-zip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: currentPostData.url,
                    selected_indices: indices,
                    naming_format: naming,
                    save_caption: saveCaption
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || "Gagal mengunduh media.");
            }

            const blob = await resp.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `${platform}_${shortcode}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);

            finalDownloadUrl = blobUrl;
            playableUrl = (currentPostData.items && currentPostData.items[0]?.video_url) || (currentPostData.items && currentPostData.items[0]?.display_url) || "";
        } else {
            finalDownloadUrl = `/api/download-file?url=${encodeURIComponent(directMediaUrl)}&filename=${encodeURIComponent(fileName)}`;
            playableUrl = directMediaUrl;

            const a = document.createElement("a");
            a.href = finalDownloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }

        const vaultEntry = {
            id: "mob_" + Date.now(),
            folder_name: `${platform}_${shortcode}`,
            title: title,
            author: author,
            platform: platform,
            created_str: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            created_time: Date.now() / 1000,
            thumbnail: (currentPostData.items && currentPostData.items[0]?.display_url) 
                ? `/api/proxy-media?url=${encodeURIComponent(currentPostData.items[0].display_url)}` 
                : (currentPostData.thumbnail ? `/api/proxy-media?url=${encodeURIComponent(currentPostData.thumbnail)}` : null),
            caption_text: currentPostData.caption || "",
            file_count: isMultiCarousel ? indices.length : 1,
            total_files: isMultiCarousel ? indices.length : 1,
            is_mobile_vault: true,
            files: [
                {
                    name: isMultiCarousel ? `${platform}_${shortcode}.zip` : fileName,
                    type: isVideo ? "video" : "image",
                    size_human: isMultiCarousel ? "ZIP Archive" : (isVideo ? "HD Video" : "HD Photo"),
                    url: playableUrl ? `/api/proxy-media?url=${encodeURIComponent(playableUrl)}` : finalDownloadUrl,
                    download_url: finalDownloadUrl
                }
            ]
        };

        saveToMobileVault(vaultEntry);
        showToast(currentLang === "id" ? "Unduhan dimulai! Disimpan ke memori HP & LocalStorage Vault." : "Download started! Saved to phone & Mobile Vault.", "success");
        refreshDownloadsList();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}

// ==========================================
// BATCH DOWNLOADER
// ==========================================
function updateBatchUrlCount() {
    const input = document.getElementById("batch-urls-input");
    const countEl = document.getElementById("batch-url-count");
    const warningEl = document.getElementById("batch-duplicate-warning");
    const dupCountText = document.getElementById("batch-dup-count-text");
    const dupListEl = document.getElementById("batch-duplicate-list");
    const btnStart = document.getElementById("btn-start-batch");
    const btnLoad = document.getElementById("btn-load-meta-batch");

    if (!input || !countEl) return;
    const rawLines = input.value.split("\n").map(u => u.trim()).filter(u => u.length > 0);
    countEl.textContent = `${rawLines.length} link`;

    // Detect duplicate URLs
    const urlMap = {};
    rawLines.forEach(u => {
        urlMap[u] = (urlMap[u] || 0) + 1;
    });

    const duplicates = Object.keys(urlMap).filter(u => urlMap[u] > 1);

    if (duplicates.length > 0) {
        if (warningEl) warningEl.classList.remove("hidden");
        if (dupCountText) {
            dupCountText.textContent = currentLang === "id"
                ? `Terdeteksi ${duplicates.length} tautan duplikat yang sama!`
                : `Detected ${duplicates.length} duplicate URLs!`;
        }
        if (dupListEl) {
            dupListEl.innerHTML = duplicates.map(dup => `
                <div class="flex items-center justify-between gap-3 p-2.5 px-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-600 text-slate-900 dark:text-slate-100 shadow-sm">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base shrink-0">link_off</span>
                        <span class="truncate font-mono font-bold text-xs text-rose-700 dark:text-rose-300" title="${dup}">${dup}</span>
                    </div>
                    <span class="px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-[11px] shrink-0 font-label-mono-sm shadow-xs">
                        ${urlMap[dup]}x duplikat
                    </span>
                </div>
            `).join("");
        }
        // Block download and load buttons to prevent downloading duplicates
        if (btnStart) {
            btnStart.disabled = true;
            btnStart.classList.add("opacity-50", "cursor-not-allowed");
        }
        if (btnLoad) {
            btnLoad.disabled = true;
            btnLoad.classList.add("opacity-50", "cursor-not-allowed");
        }
    } else {
        if (warningEl) warningEl.classList.add("hidden");
        if (dupListEl) dupListEl.innerHTML = "";
        if (!isBatchDownloading) {
            if (btnStart) {
                btnStart.disabled = false;
                btnStart.classList.remove("opacity-50", "cursor-not-allowed");
            }
            if (btnLoad) {
                btnLoad.disabled = false;
                btnLoad.classList.remove("opacity-50", "cursor-not-allowed");
            }
        }
    }
}

function removeDuplicateBatchUrls() {
    const input = document.getElementById("batch-urls-input");
    if (!input) return;
    const rawLines = input.value.split("\n").map(u => u.trim()).filter(u => u.length > 0);
    const seen = new Set();
    const unique = [];
    rawLines.forEach(u => {
        if (!seen.has(u)) {
            seen.add(u);
            unique.push(u);
        }
    });
    input.value = unique.join("\n");
    updateBatchUrlCount();
    showToast(currentLang === "id" ? "Tautan duplikat berhasil dibersihkan otomatis." : "Duplicate links removed successfully.", "success");
}

let batchLoadedItems = [];

function clearBatchInput() {
    // 1. Immediately abort active batch download workers
    if (batchAbortController) {
        batchAbortController.abort();
        batchAbortController = null;
    }
    isBatchDownloading = false;

    // 2. Clear inputs and states
    const input = document.getElementById("batch-urls-input");
    if (input) input.value = "";
    batchLoadedItems = [];
    updateBatchUrlCount();

    // 3. Reset UI cards
    const progressCard = document.getElementById("batch-progress-card");
    const tbody = document.getElementById("batch-results-tbody");
    if (progressCard) progressCard.classList.add("hidden");
    if (tbody) tbody.innerHTML = "";

    // 4. Reset Action Buttons
    const btn = document.getElementById("btn-start-batch");
    const btnText = document.getElementById("batch-btn-text");
    const spinner = document.getElementById("batch-spinner");
    const btnIcon = document.getElementById("batch-btn-icon");
    if (btn) {
        btn.disabled = false;
        btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
    if (btnText) btnText.textContent = translations[currentLang]?.batch_btn_start || "Mulai Unduh Semua (Batch)";
    if (spinner) spinner.classList.add("hidden");
    if (btnIcon) btnIcon.classList.remove("hidden");

    const btnLoadMeta = document.getElementById("btn-load-meta-batch");
    const metaSpinner = document.getElementById("batch-meta-spinner");
    const metaIcon = document.getElementById("batch-meta-icon");
    if (btnLoadMeta) {
        btnLoadMeta.disabled = false;
        btnLoadMeta.classList.remove("opacity-50", "cursor-not-allowed");
    }
    if (metaSpinner) metaSpinner.classList.add("hidden");
    if (metaIcon) metaIcon.classList.remove("hidden");

    showToast(currentLang === "id" ? "Proses unduhan dihentikan dan antrean dibersihkan." : "Download process stopped and queue cleared.", "info");
}

async function loadBatchMetadata() {
    const input = document.getElementById("batch-urls-input");
    if (!input) return;
    const rawUrls = input.value.split("\n").map(u => u.trim()).filter(u => u.length > 0);
    if (rawUrls.length === 0) {
        showToast(currentLang === "id" ? "Masukkan setidaknya 1 link media untuk diproses." : "Enter at least 1 media link to process.", "warning");
        return;
    }

    // Check duplicates before proceeding
    const urlMap = {};
    rawUrls.forEach(u => { urlMap[u] = (urlMap[u] || 0) + 1; });
    if (Object.keys(urlMap).some(u => urlMap[u] > 1)) {
        showToast(currentLang === "id" ? "Terdapat link duplikat. Bersihkan duplikat terlebih dahulu." : "Duplicate links detected. Please remove duplicates first.", "error");
        return;
    }

    const maxLimit = window.currentMaxBatchItems || 20;
    let urls = rawUrls;
    if (urls.length > maxLimit) {
        showToast(
            currentLang === "id"
                ? `Maksimal ${maxLimit} link per sesi batch sesuai pengaturan. Hanya ${maxLimit} link pertama yang diproses.`
                : `Maximum ${maxLimit} links per session according to settings. Only first ${maxLimit} links will be processed.`,
            "warning"
        );
        urls = urls.slice(0, maxLimit);
    }

    const btnLoadMeta = document.getElementById("btn-load-meta-batch");
    const metaSpinner = document.getElementById("batch-meta-spinner");
    const metaIcon = document.getElementById("batch-meta-icon");
    const progressCard = document.getElementById("batch-progress-card");
    const progressText = document.getElementById("batch-progress-text");
    const progressBar = document.getElementById("batch-progress-bar");
    const progressPercent = document.getElementById("batch-progress-percent");
    const tbody = document.getElementById("batch-results-tbody");

    if (btnLoadMeta) btnLoadMeta.disabled = true;
    if (metaSpinner) metaSpinner.classList.remove("hidden");
    if (metaIcon) metaIcon.classList.add("hidden");
    if (progressCard) progressCard.classList.remove("hidden");
    if (progressBar) progressBar.style.width = "0%";
    if (progressPercent) progressPercent.textContent = "0%";
    if (progressText) progressText.textContent = currentLang === "id" ? `Memuat metadata untuk ${urls.length} link...` : `Loading metadata for ${urls.length} links...`;
    if (tbody) tbody.innerHTML = "";

    // Show initial loading skeleton rows
    urls.forEach((u, i) => {
        const tr = document.createElement("tr");
        tr.id = `batch-row-${i}`;
        tr.className = "hover:bg-surface-container transition-colors";
        tr.innerHTML = `
            <td class="p-3 text-center text-on-surface-variant font-bold">${i + 1}</td>
            <td class="p-3">
                <div class="w-20 h-12 rounded-lg bg-surface-container animate-pulse flex items-center justify-center text-outline">
                    <span class="material-symbols-outlined text-lg">image</span>
                </div>
            </td>
            <td class="p-3">
                <div class="space-y-1">
                    <div class="h-3 bg-surface-container rounded-sm animate-pulse w-3/4"></div>
                    <span class="text-[11px] font-mono text-outline truncate block max-w-xs">${u}</span>
                </div>
            </td>
            <td class="p-3 text-center text-outline">-</td>
            <td class="p-3 batch-status-cell">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                    <span class="material-symbols-outlined text-xs animate-spin">sync</span>
                    <span>${translations[currentLang].batch_status_loading_meta}</span>
                </span>
            </td>
            <td class="p-3 batch-action-cell text-outline">-</td>
        `;
        tbody.appendChild(tr);
    });

    batchAbortController = new AbortController();

    try {
        const resp = await fetch("/api/batch-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: batchAbortController.signal,
            body: JSON.stringify({ urls: urls })
        });
        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data.detail || "Gagal memuat metadata batch.");
        }

        batchLoadedItems = data.items || [];
        renderBatchTableItems(batchLoadedItems);
        if (progressText) progressText.textContent = currentLang === "id" ? `Metadata ${batchLoadedItems.length} item berhasil dimuat. Siap diunduh!` : `Metadata for ${batchLoadedItems.length} items loaded. Ready to download!`;
        showToast(currentLang === "id" ? `Metadata ${batchLoadedItems.length} media berhasil dimuat.` : `Metadata for ${batchLoadedItems.length} items loaded.`, "success");
    } catch (err) {
        if (err.name === 'AbortError') {
            if (progressText) progressText.textContent = "Dibatalkan.";
            return;
        }
        showToast(err.message, "error");
        if (progressText) progressText.textContent = `Error: ${err.message}`;
    } finally {
        if (btnLoadMeta) btnLoadMeta.disabled = false;
        if (metaSpinner) metaSpinner.classList.add("hidden");
        if (metaIcon) metaIcon.classList.remove("hidden");
    }
}

function renderBatchTableItems(items) {
    const tbody = document.getElementById("batch-results-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    items.forEach((item, i) => {
        const tr = document.createElement("tr");
        tr.id = `batch-row-${i}`;
        tr.className = "hover:bg-surface-container transition-colors";

        const thumbSrc = item.thumbnail ? `/api/proxy-media?url=${encodeURIComponent(item.thumbnail)}` : null;
        const thumbHtml = thumbSrc 
            ? `<div class="relative w-20 h-12 rounded-lg overflow-hidden bg-slate-900 border border-outline-variant/30 shrink-0">
                 <img src="${thumbSrc}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-outline\\'><span class=\\'material-symbols-outlined text-lg\\'>broken_image</span></div>';" loading="lazy"/>
               </div>`
            : `<div class="w-20 h-12 rounded-lg bg-surface-container flex items-center justify-center text-outline shrink-0">
                 <span class="material-symbols-outlined text-lg">play_circle</span>
               </div>`;

        // Platform badge styling
        let platformColor = "bg-blue-600/10 text-blue-600 border-blue-600/30";
        const plat = (item.platform_id || "").toLowerCase();
        if (plat === "youtube") platformColor = "bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/30";
        else if (plat === "instagram") platformColor = "bg-pink-600/10 text-pink-600 dark:text-pink-400 border-pink-600/30";
        else if (plat === "tiktok") platformColor = "bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border-cyan-600/30";
        else if (plat === "twitter") platformColor = "bg-sky-600/10 text-sky-600 dark:text-sky-400 border-sky-600/30";

        const initialStatus = item.success
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-600/10 text-blue-600 dark:text-secondary border border-blue-600/20">
                 <span class="material-symbols-outlined text-xs">hourglass_empty</span>
                 <span>${translations[currentLang].batch_status_ready}</span>
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20" title="${item.error || ''}">
                 <span class="material-symbols-outlined text-xs">error</span>
                 <span>${translations[currentLang].batch_status_failed}</span>
               </span>`;

        tr.innerHTML = `
            <td class="p-3 text-center text-on-surface-variant font-bold">${i + 1}</td>
            <td class="p-3">${thumbHtml}</td>
            <td class="p-3 max-w-xs">
                <div class="space-y-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase font-label-mono-sm ${platformColor}">${item.platform}</span>
                        ${item.author && item.author !== '-' ? `<span class="text-[11px] text-on-surface-variant font-medium">@${item.author}</span>` : ''}
                    </div>
                    <div class="font-semibold text-xs text-on-surface truncate" title="${item.title}">${item.title}</div>
                    <a href="${item.url}" target="_blank" class="text-[10px] font-mono text-outline hover:text-secondary truncate block hover:underline" title="${item.url}">${item.url}</a>
                </div>
            </td>
            <td class="p-3 text-center">
                <span class="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface font-label-mono-sm">
                    ${item.duration || "-"}
                </span>
            </td>
            <td class="p-3 batch-status-cell">${initialStatus}</td>
            <td class="p-3 batch-action-cell text-outline">-</td>
        `;
        tbody.appendChild(tr);
    });
}

async function startBatchDownload() {
    const input = document.getElementById("batch-urls-input");
    const rawUrls = input ? input.value.split("\n").map(u => u.trim()).filter(u => u.length > 0) : [];

    if (rawUrls.length === 0) {
        showToast(currentLang === "id" ? "Masukkan setidaknya 1 link media untuk diproses batch." : "Enter at least 1 media link to process.", "warning");
        return;
    }

    // Check duplicates before proceeding
    const urlMap = {};
    rawUrls.forEach(u => { urlMap[u] = (urlMap[u] || 0) + 1; });
    if (Object.keys(urlMap).some(u => urlMap[u] > 1)) {
        showToast(currentLang === "id" ? "Terdapat link duplikat. Bersihkan link duplikat terlebih dahulu." : "Duplicate links detected. Please remove duplicates first.", "error");
        return;
    }

    const maxLimit = window.currentMaxBatchItems || 20;
    let urls = rawUrls;
    if (urls.length > maxLimit) {
        showToast(
            currentLang === "id"
                ? `Maksimal ${maxLimit} link per sesi batch sesuai pengaturan. Hanya ${maxLimit} link pertama yang diproses.`
                : `Maximum ${maxLimit} links per session according to settings. Only first ${maxLimit} links will be processed.`,
            "warning"
        );
        urls = urls.slice(0, maxLimit);
    }

    // If metadata not loaded yet or URLs changed, load metadata first!
    if (!batchLoadedItems || batchLoadedItems.length === 0 || batchLoadedItems.map(b => b.url).join(",") !== urls.join(",")) {
        await loadBatchMetadata();
    }

    if (!batchLoadedItems || batchLoadedItems.length === 0) return;

    const formatId = document.getElementById("batch-video-format").value;
    const naming = document.getElementById("batch-naming-format").value;
    const saveCaption = document.getElementById("batch-save-caption").checked;

    const btn = document.getElementById("btn-start-batch");
    const btnText = document.getElementById("batch-btn-text");
    const spinner = document.getElementById("batch-spinner");
    const btnIcon = document.getElementById("batch-btn-icon");
    const progressCard = document.getElementById("batch-progress-card");
    const progressBar = document.getElementById("batch-progress-bar");
    const progressPercent = document.getElementById("batch-progress-percent");
    const progressText = document.getElementById("batch-progress-text");

    isBatchDownloading = true;
    batchAbortController = new AbortController();

    btn.disabled = true;
    if (btnText) btnText.textContent = currentLang === "id" ? `Mengunduh (${batchLoadedItems.length} item async)...` : `Downloading (${batchLoadedItems.length} items async)...`;
    if (spinner) spinner.classList.remove("hidden");
    if (btnIcon) btnIcon.classList.add("hidden");
    if (progressCard) progressCard.classList.remove("hidden");

    let completed = 0;
    const total = batchLoadedItems.length;
    let nextIndex = 0;

    // Concurrency pool (3 parallel download workers running asynchronously)
    const concurrency = Math.min(3, total);

    async function downloadWorker() {
        while (nextIndex < total) {
            if (batchAbortController && batchAbortController.signal.aborted) {
                break;
            }

            const i = nextIndex++;
            const item = batchLoadedItems[i];
            const row = document.getElementById(`batch-row-${i}`);

            if (row) {
                const statusCell = row.querySelector(".batch-status-cell");
                if (statusCell) {
                    statusCell.innerHTML = `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <span class="material-symbols-outlined text-xs animate-spin">sync</span>
                            <span>${translations[currentLang].batch_status_downloading}</span>
                        </span>
                    `;
                }
            }

            try {
                const resp = await fetch("/api/download-selective", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: batchAbortController ? batchAbortController.signal : undefined,
                    body: JSON.stringify({
                        url: item.url,
                        format_id: formatId,
                        naming_format: naming,
                        save_caption: saveCaption
                    })
                });
                const data = await resp.json();

                if (resp.ok) {
                    if (row) {
                        const statusCell = row.querySelector(".batch-status-cell");
                        const actionCell = row.querySelector(".batch-action-cell");
                        if (statusCell) {
                            statusCell.innerHTML = `
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <span class="material-symbols-outlined text-xs">check_circle</span>
                                    <span>${translations[currentLang].batch_status_success}</span>
                                </span>
                            `;
                        }
                        if (actionCell) {
                            const escapedPath = (data.folder_path || '').replace(/\\/g, '\\\\');
                            actionCell.innerHTML = `
                                <div class="flex items-center gap-2">
                                    <span class="truncate max-w-[110px] font-semibold text-xs text-on-surface" title="${data.folder_name}">${data.folder_name}</span>
                                    <button type="button" onclick="openSystemFolder('${escapedPath}')" class="p-1 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-secondary text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0" title="Buka Folder di Windows Explorer">
                                        <span class="material-symbols-outlined text-sm">folder_open</span>
                                    </button>
                                </div>
                            `;
                        }
                    }
                } else {
                    throw new Error(data.detail || "Gagal mengunduh.");
                }
            } catch (err) {
                if (err.name === 'AbortError' || (batchAbortController && batchAbortController.signal.aborted)) {
                    if (row) {
                        const statusCell = row.querySelector(".batch-status-cell");
                        if (statusCell) {
                            statusCell.innerHTML = `
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                    <span class="material-symbols-outlined text-xs">cancel</span>
                                    <span>Dibatalkan</span>
                                </span>
                            `;
                        }
                    }
                    break;
                }
                if (row) {
                    const statusCell = row.querySelector(".batch-status-cell");
                    const actionCell = row.querySelector(".batch-action-cell");
                    if (statusCell) {
                        statusCell.innerHTML = `
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20" title="${err.message}">
                                <span class="material-symbols-outlined text-xs">error</span>
                                <span>${translations[currentLang].batch_status_failed}</span>
                            </span>
                        `;
                    }
                    if (actionCell) {
                        actionCell.innerHTML = `<span class="text-rose-400 text-xs truncate max-w-[120px] block" title="${err.message}">${err.message}</span>`;
                    }
                }
            }

            if (!batchAbortController || !batchAbortController.signal.aborted) {
                completed++;
                const percent = Math.round((completed / total) * 100);
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressPercent) progressPercent.textContent = `${percent}%`;
                if (progressText) {
                    progressText.textContent = currentLang === "id"
                        ? `Mengunduh (${completed}/${total} selesai)... ${percent}%`
                        : `Downloading (${completed}/${total} completed)... ${percent}%`;
                }
            }
        }
    }

    // Launch concurrent workers asynchronously
    const workers = [];
    for (let w = 0; w < concurrency; w++) {
        workers.push(downloadWorker());
    }
    await Promise.all(workers);

    const wasAborted = batchAbortController && batchAbortController.signal.aborted;
    isBatchDownloading = false;

    if (!wasAborted) {
        if (progressText) {
            progressText.textContent = currentLang === "id"
                ? `Selesai memproses ${total} tautan (100%)!`
                : `Finished processing ${total} links (100%)!`;
        }
        if (progressBar) progressBar.style.width = "100%";
        if (progressPercent) progressPercent.textContent = "100%";
        showToast(currentLang === "id" ? `Batch download selesai (${completed}/${total} diproses).` : `Batch download completed (${completed}/${total} processed).`, "success");
    } else {
        if (progressText) progressText.textContent = "Proses unduhan batch dihentikan.";
    }

    btn.disabled = false;
    if (btnText) btnText.textContent = translations[currentLang]?.batch_btn_start || "Mulai Unduh Semua (Batch)";
    if (spinner) spinner.classList.add("hidden");
    if (btnIcon) btnIcon.classList.remove("hidden");
    refreshDownloadsList();
}

// ==========================================
// MEDIA VAULT (FILE TERSIMPAN) & BENTO WIDGET
// ==========================================
async function refreshDownloadsList() {
    try {
        let serverFolders = [];
        let baseDir = "downloads";
        try {
            const resp = await fetch("/api/downloads");
            const data = await resp.json();
            serverFolders = data.folders || [];
            baseDir = data.output_dir || "downloads";
        } catch (e) {
            console.warn("Could not fetch server downloads, using local/cache:", e);
        }

        const mobileVaultItems = getMobileVaultItems();
        const serverNames = new Set(serverFolders.map(f => f.folder_name));
        const uniqueMobileItems = mobileVaultItems.filter(m => !serverNames.has(m.folder_name));

        // Combine: mobile items first, then server folders
        allLoadedFolders = [...uniqueMobileItems, ...serverFolders];

        // Update indicators
        const sidebarPath = document.getElementById("sidebar-storage-path");
        const sidebarCount = document.getElementById("sidebar-folder-count");
        const vaultCount = document.getElementById("vault-total-count");
        const bentoCount = document.getElementById("bento-folder-count-text");

        if (sidebarPath) sidebarPath.textContent = baseDir.replace(/\\/g, '/').split('/').pop() || "downloads";
        if (sidebarCount) sidebarCount.textContent = allLoadedFolders.length;
        
        updateMobileVaultUI();

        if (vaultCount) vaultCount.textContent = `${allLoadedFolders.length} Folder`;
        if (bentoCount) bentoCount.textContent = `${allLoadedFolders.length} Folder`;

        // Update Bento Recent List on Main Screen
        renderBentoRecentList();

        // Update Media Vault Grid
        renderVaultList();
    } catch (err) {
        showToast("Gagal memuat daftar folder media.", "error");
    } finally {
        refreshIcons();
    }
}

function renderBentoRecentList() {
    const listEl = document.getElementById("bento-recent-list");
    if (!listEl) return;

    if (allLoadedFolders.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-6 text-xs text-on-surface-variant font-label-mono-sm">
                Belum ada riwayat unduhan media terkini.
            </div>
        `;
        return;
    }

    listEl.innerHTML = "";
    const recent = allLoadedFolders.slice(0, 2);

    recent.forEach((f) => {
        let previewThumb = null;
        const imgFile = f.files.find(item => item.type === 'image');
        if (imgFile) previewThumb = imgFile.url;

        let platformTag = "MEDIA";
        let platformColor = "text-secondary";
        const fLower = f.folder_name.toLowerCase();
        if (fLower.includes("youtube")) { platformTag = "YouTube"; platformColor = "text-red-500"; }
        else if (fLower.includes("instagram")) { platformTag = "Instagram"; platformColor = "text-pink-500"; }
        else if (fLower.includes("twitter")) { platformTag = "Twitter / X"; platformColor = "text-sky-400"; }
        else if (fLower.includes("threads")) { platformTag = "Threads"; platformColor = "text-indigo-400"; }
        else if (fLower.includes("pinterest")) { platformTag = "Pinterest"; platformColor = "text-rose-500"; }
        else if (fLower.includes("tiktok")) { platformTag = "TikTok"; platformColor = "text-cyan-400"; }

        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 transition-all";
        item.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden shrink-0 border border-outline-variant/30 relative">
                    ${previewThumb ? `<img src="${previewThumb}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-secondary"><span class="material-symbols-outlined text-lg">folder</span></div>`}
                </div>
                <div class="min-w-0">
                    <p class="text-xs sm:text-sm font-semibold text-on-surface truncate">${f.folder_name}</p>
                    <p class="text-[11px] font-label-mono-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span class="${platformColor} font-bold">${platformTag}</span> • ${f.file_count} file • ${f.created_str}
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 ml-2 shrink-0">
                <button onclick="openMediaModalByFolderName('${f.folder_name.replace(/'/g, "\\'")}')" class="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer" title="Putar & Lihat">
                    <span class="material-symbols-outlined text-lg">play_arrow</span>
                </button>
                <button onclick="openSystemFolderByFolderName('${f.folder_name.replace(/'/g, "\\'")}')" class="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer" title="Buka Folder di Explorer">
                    <span class="material-symbols-outlined text-lg">folder_open</span>
                </button>
            </div>
        `;
        listEl.appendChild(item);
    });
}

function getFilteredVaultFolders() {
    let filtered = allLoadedFolders;
    if (currentVaultFilter !== "all") {
        filtered = filtered.filter(f => f.folder_name.toLowerCase().includes(currentVaultFilter.toLowerCase()));
    }
    if (vaultSearchQuery.trim()) {
        const q = vaultSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(f => f.folder_name.toLowerCase().includes(q) || (f.caption_text && f.caption_text.toLowerCase().includes(q)));
    }
    return filtered;
}

function updateVaultSelectionUI() {
    const textSelectAll = document.getElementById("vault-select-all-text");
    const iconSelectAll = document.getElementById("vault-select-all-icon");
    const countBadge = document.getElementById("vault-selected-count-badge");
    const btnDelete = document.getElementById("btn-vault-delete-selected");
    const textDelete = document.getElementById("vault-delete-selected-text");
    const btnShare = document.getElementById("btn-vault-share-selected");
    const textShare = document.getElementById("vault-share-selected-text");
    const btnZip = document.getElementById("btn-vault-zip-selected");

    const filtered = getFilteredVaultFolders();
    const count = selectedVaultFolderNames.size;
    const allSelected = filtered.length > 0 && filtered.every(f => selectedVaultFolderNames.has(f.folder_name));

    if (textSelectAll) {
        textSelectAll.textContent = allSelected 
            ? (currentLang === "id" ? "Batalkan Semua" : "Deselect All")
            : (currentLang === "id" ? "Pilih Semua" : "Select All");
    }
    if (iconSelectAll) {
        iconSelectAll.textContent = allSelected ? "deselect" : "select_all";
    }
    if (countBadge) {
        countBadge.textContent = currentLang === "id" ? `${count} dipilih` : `${count} selected`;
    }

    if (count > 0) {
        if (btnShare) {
            btnShare.classList.remove("hidden");
            if (textShare) {
                textShare.textContent = currentLang === "id" ? `Kirim ke HP (${count})` : `Send to Phone (${count})`;
            }
        }
        if (btnZip) btnZip.classList.remove("hidden");
        if (btnDelete) {
            btnDelete.classList.remove("hidden");
            if (textDelete) {
                textDelete.textContent = currentLang === "id" ? `Hapus Terpilih (${count})` : `Delete Selected (${count})`;
            }
        }
    } else {
        if (btnShare) btnShare.classList.add("hidden");
        if (btnZip) btnZip.classList.add("hidden");
        if (btnDelete) btnDelete.classList.add("hidden");
    }
}

function toggleVaultFolderSelection(folderName, isChecked) {
    if (isChecked) {
        selectedVaultFolderNames.add(folderName);
    } else {
        selectedVaultFolderNames.delete(folderName);
    }
    updateVaultSelectionUI();
    renderVaultList();
}

function toggleVaultSelectAll() {
    const filtered = getFilteredVaultFolders();
    if (filtered.length === 0) return;

    const allSelected = filtered.every(f => selectedVaultFolderNames.has(f.folder_name));
    if (allSelected) {
        // Deselect all visible items
        filtered.forEach(f => selectedVaultFolderNames.delete(f.folder_name));
    } else {
        // Select all visible items
        filtered.forEach(f => selectedVaultFolderNames.add(f.folder_name));
    }
    updateVaultSelectionUI();
    renderVaultList();
}

function renderVaultList() {
    const listEl = document.getElementById("downloads-list");
    const emptyEl = document.getElementById("downloads-empty");
    if (!listEl || !emptyEl) return;

    const filtered = getFilteredVaultFolders();

    updateVaultSelectionUI();

    if (filtered.length === 0) {
        listEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        return;
    }

    emptyEl.classList.add("hidden");
    listEl.innerHTML = "";

    filtered.forEach((f) => {
        const realIdx = allLoadedFolders.indexOf(f);
        const isSelected = selectedVaultFolderNames.has(f.folder_name);
        let previewThumb = null;
        const imgFile = f.files.find(item => item.type === 'image');
        if (imgFile) previewThumb = imgFile.url;
        if (!previewThumb && f.thumbnail) previewThumb = f.thumbnail;

        let platformTag = "MEDIA";
        let platformColor = "bg-slate-900";
        const fLower = f.folder_name.toLowerCase();
        if (fLower.includes("youtube")) { platformTag = "YOUTUBE"; platformColor = "bg-red-600"; }
        else if (fLower.includes("instagram")) { platformTag = "INSTAGRAM"; platformColor = "bg-pink-600"; }
        else if (fLower.includes("twitter")) { platformTag = "TWITTER"; platformColor = "bg-sky-600"; }
        else if (fLower.includes("threads")) { platformTag = "THREADS"; platformColor = "bg-indigo-600"; }
        else if (fLower.includes("pinterest")) { platformTag = "PINTEREST"; platformColor = "bg-rose-600"; }
        else if (fLower.includes("tiktok")) { platformTag = "TIKTOK"; platformColor = "bg-cyan-600"; }

        const card = document.createElement("div");
        card.className = `bg-surface-container-low border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-500/5' : 'border-outline-variant/30'} rounded-2xl p-4 hover:border-secondary/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-3.5 group shadow-xs`;

        const escapedName = f.folder_name.replace(/'/g, "\\'");

        card.innerHTML = `
            <div class="space-y-3">
                <!-- 16:9 Thumbnail -->
                <div class="aspect-video w-full rounded-xl bg-surface-container-lowest overflow-hidden relative cursor-pointer group shadow-xs" onclick="openMediaModalByIndex(${realIdx})">
                    ${previewThumb ? `
                        <img src="${previewThumb}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
                    ` : `
                        <div class="w-full h-full flex flex-col items-center justify-center text-on-surface-variant gap-1.5">
                            <span class="material-symbols-outlined text-3xl text-secondary">music_note</span>
                            <span class="text-[11px] font-semibold font-label-mono-sm">Audio Track</span>
                        </div>
                    `}
                    <div class="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div class="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span class="material-symbols-outlined text-2xl fill-current ml-0.5">play_arrow</span>
                        </div>
                    </div>

                    <!-- Platform & Storage Tag Pills -->
                    <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white font-label-mono-sm tracking-wider ${platformColor} shadow-md">
                            ${platformTag}
                        </span>
                        ${f.is_mobile_vault ? `
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-blue-600 shadow-md flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[11px]">smartphone</span>
                                <span>HP STORAGE</span>
                            </span>
                        ` : ''}
                    </div>

                    <!-- Checkbox for Batch Selection -->
                    <label class="absolute top-2.5 right-2.5 z-20 flex items-center justify-center w-7 h-7 rounded-lg ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'bg-black/70 backdrop-blur-md border-white/30 text-white'} border cursor-pointer hover:scale-105 transition-all shadow-md select-none" onclick="event.stopPropagation();">
                        <input type="checkbox"
                                class="w-4 h-4 rounded text-blue-600 bg-white/20 border-white/40 focus:ring-secondary cursor-pointer"
                                ${isSelected ? 'checked' : ''}
                                onchange="toggleVaultFolderSelection('${escapedName}', this.checked)"/>
                    </label>

                    <span class="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/75 text-white backdrop-blur-xs font-label-mono-sm">
                        ${f.file_count} file
                    </span>
                </div>

                <!-- Info Header -->
                <div>
                    <h4 class="text-xs sm:text-sm font-bold text-on-surface truncate leading-snug" title="${f.folder_name}">
                        ${f.folder_name}
                    </h4>
                    <p class="text-[11px] text-on-surface-variant font-label-mono-sm flex items-center gap-1.5 mt-1">
                        <span class="material-symbols-outlined text-[13px] text-outline">schedule</span>
                        <span>${f.created_str}</span>
                    </p>
                </div>
            </div>

            <!-- Card Action Suite -->
            <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                <button onclick="openMediaModalByIndex(${realIdx})" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                    <span class="material-symbols-outlined text-base">play_circle</span>
                    <span>Putar & Lihat</span>
                </button>
                <div class="flex items-center gap-1">
                    ${f.is_mobile_vault ? `
                        <button onclick="downloadDirectFromVaultByIndex(${realIdx})" class="p-2 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer" title="Unduh Ulang ke HP">
                            <span class="material-symbols-outlined text-lg">download</span>
                        </button>
                    ` : `
                        <button onclick="shareVaultFolderToPhone('${escapedName}')" class="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer" title="Kirim ke HP via QR Code">
                            <span class="material-symbols-outlined text-lg">phonelink_ring</span>
                        </button>
                        <button onclick="openSystemFolderByIndex(${realIdx})" class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-all cursor-pointer" title="Buka di Windows Explorer">
                            <span class="material-symbols-outlined text-lg">folder_open</span>
                        </button>
                    `}
                    <button onclick="deleteFolderByIndex(${realIdx})" class="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer" title="Hapus Item">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
        `;
        listEl.appendChild(card);
    });
}

function filterVaultByPlatform(platform) {
    currentVaultFilter = platform;
    const chips = ['all', 'youtube', 'instagram', 'twitter', 'threads', 'pinterest', 'tiktok'];
    chips.forEach(p => {
        const btn = document.getElementById(`filter-chip-${p}`);
        if (!btn) return;
        if (p === platform) {
            btn.className = "vault-filter-chip px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer shrink-0 transition-colors";
        } else {
            btn.className = "vault-filter-chip px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high cursor-pointer shrink-0 transition-colors";
        }
    });
    renderVaultList();
}

function onVaultSearchInput(query) {
    vaultSearchQuery = query;
    renderVaultList();
}

// Helpers by folder name
function openMediaModalByFolderName(name) {
    const idx = allLoadedFolders.findIndex(f => f.folder_name === name);
    if (idx !== -1) openMediaModalByIndex(idx);
}

function openSystemFolderByFolderName(name) {
    const folder = allLoadedFolders.find(f => f.folder_name === name);
    if (folder) openSystemFolder(folder.folder_path);
}

function openMediaModalByIndex(index) {
    if (!allLoadedFolders[index]) return;
    openMediaModal(allLoadedFolders[index]);
}

// ==========================================
// IN-APP MEDIA PLAYER MODAL
// ==========================================
function openMediaModal(folder) {
    currentModalFolder = folder;
    currentModalFolderPath = folder.folder_path;

    const titleEl = document.getElementById("modal-folder-title");
    if (titleEl) titleEl.textContent = folder.folder_name;

    const modal = document.getElementById("media-modal");
    const playerContainer = document.getElementById("modal-player-container");
    const filesList = document.getElementById("modal-files-list");
    const captionContainer = document.getElementById("modal-caption-container");
    const captionText = document.getElementById("modal-caption-text");

    if (filesList) filesList.innerHTML = "";

    if (folder.caption_text) {
        if (captionText) captionText.textContent = folder.caption_text;
        if (captionContainer) captionContainer.classList.remove("hidden");
    } else {
        if (captionContainer) captionContainer.classList.add("hidden");
    }

    const playableFiles = folder.files.filter(f => f.type !== 'text');
    if (filesList) {
        folder.files.forEach(file => {
            const btn = document.createElement("button");
            btn.className = "p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left transition-all flex items-center justify-between gap-2 cursor-pointer";
            btn.onclick = () => playFileInModal(file);

            let iconName = "draft";
            if (file.type === "video") iconName = "movie";
            else if (file.type === "audio") iconName = "music_note";
            else if (file.type === "image") iconName = "image";
            else if (file.type === "text") iconName = "description";

            btn.innerHTML = `
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="material-symbols-outlined text-blue-400 text-base shrink-0">${iconName}</span>
                    <span class="truncate font-medium text-slate-200">${file.name}</span>
                </div>
                <span class="text-[10px] font-label-mono-sm text-slate-400 shrink-0">${file.size_human}</span>
            `;
            filesList.appendChild(btn);
        });
    }

    if (playableFiles.length > 0) {
        playFileInModal(playableFiles[0]);
    } else if (folder.files.length > 0) {
        playFileInModal(folder.files[0]);
    } else if (playerContainer) {
        playerContainer.innerHTML = `<p class="text-slate-500 text-xs">Folder ini kosong</p>`;
    }

    if (modal) modal.classList.remove("hidden");
    refreshIcons();
}

function playFileInModal(file) {
    const playerContainer = document.getElementById("modal-player-container");
    const statusText = document.getElementById("modal-file-status");
    if (statusText) statusText.textContent = `Memutar: ${file.name} (${file.size_human})`;
    if (!playerContainer) return;

    if (file.type === "video") {
        playerContainer.innerHTML = `
            <video controls autoplay class="max-h-[460px] w-full rounded-xl bg-black outline-hidden">
                <source src="${file.url}" type="video/mp4">
                Browser Anda tidak mendukung pemutar video HTML5.
            </video>
        `;
    } else if (file.type === "audio") {
        playerContainer.innerHTML = `
            <div class="p-8 flex flex-col items-center justify-center gap-3 w-full max-w-md">
                <div class="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg">
                    <span class="material-symbols-outlined text-4xl">music_note</span>
                </div>
                <div class="text-center">
                    <h4 class="font-bold text-sm text-slate-100 truncate">${file.name}</h4>
                    <p class="text-xs text-slate-400 font-label-mono-sm">Audio Track • ${file.size_human}</p>
                </div>
                <audio controls autoplay class="w-full mt-2">
                    <source src="${file.url}" type="audio/mpeg">
                    Browser Anda tidak mendukung pemutar audio.
                </audio>
            </div>
        `;
    } else if (file.type === "image") {
        playerContainer.innerHTML = `
            <img src="${file.url}" alt="${file.name}" class="max-h-[460px] object-contain rounded-xl shadow-lg">
        `;
    } else {
        playerContainer.innerHTML = `
            <div class="p-6 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl text-slate-500 mb-2">description</span>
                <p class="font-medium text-xs">${file.name}</p>
            </div>
        `;
    }
    refreshIcons();
}

function closeMediaModal() {
    const modal = document.getElementById("media-modal");
    const playerContainer = document.getElementById("modal-player-container");
    if (playerContainer) playerContainer.innerHTML = "";
    if (modal) modal.classList.add("hidden");
}

// ==========================================
// CUSTOM DELETE CONFIRMATION MODAL
// ==========================================
function confirmBatchDeleteVault() {
    if (selectedVaultFolderNames.size === 0) return;
    isBatchDeleteModal = true;
    pendingDeletePath = null;
    pendingDeleteName = null;
    const nameEl = document.getElementById("delete-modal-folder-name");
    if (nameEl) {
        nameEl.textContent = `${selectedVaultFolderNames.size} folder terpilih`;
    }
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.remove("hidden");
    refreshIcons();
}

function downloadDirectFromVaultByIndex(index) {
    if (!allLoadedFolders || !allLoadedFolders[index]) return;
    const item = allLoadedFolders[index];
    const dlFile = (item.files && item.files.length > 0) ? item.files[0] : null;
    const downloadUrl = (dlFile && dlFile.download_url) ? dlFile.download_url : (dlFile ? dlFile.url : null);
    if (!downloadUrl) {
        showToast(currentLang === "id" ? "Tautan unduhan tidak tersedia." : "Download link unavailable.", "error");
        return;
    }
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = (dlFile && dlFile.name) ? dlFile.name : `${item.folder_name}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(currentLang === "id" ? "Mengunduh ulang ke perangkat..." : "Re-downloading to device...", "info");
}

function deleteFolderByIndex(index) {
    if (allLoadedFolders && allLoadedFolders[index]) {
        const item = allLoadedFolders[index];
        const path = item.is_mobile_vault ? 'mobile_vault' : item.folder_path;
        openDeleteModal(path, item.folder_name);
    }
}

function openDeleteModal(folderPath, folderName) {
    isBatchDeleteModal = false;
    pendingDeletePath = folderPath;
    pendingDeleteName = folderName;
    const nameEl = document.getElementById("delete-modal-folder-name");
    if (nameEl) nameEl.textContent = `"${folderName}"`;
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.remove("hidden");
    refreshIcons();
}

function closeDeleteModal() {
    isBatchDeleteModal = false;
    pendingDeletePath = null;
    pendingDeleteName = null;
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.add("hidden");
}

async function executeDeleteFolder() {
    const btn = document.getElementById("confirm-delete-btn");
    const originalText = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> Menghapus...`;
    }

    try {
        if (isBatchDeleteModal) {
            if (selectedVaultFolderNames.size === 0) return;
            const folderPaths = [];
            allLoadedFolders.forEach(f => {
                if (selectedVaultFolderNames.has(f.folder_name)) {
                    if (f.is_mobile_vault) {
                        removeFromMobileVault(f.folder_name);
                    } else if (f.folder_path) {
                        folderPaths.push(f.folder_path);
                    }
                }
            });

            if (folderPaths.length > 0) {
                const resp = await fetch("/api/delete-folders-batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder_paths: folderPaths })
                });
                const res = await resp.json();
                if (!resp.ok) {
                    throw new Error(res.detail || "Gagal menghapus folder.");
                }
            }
            closeDeleteModal();
            selectedVaultFolderNames.clear();
            updateVaultSelectionUI();
            showToast(currentLang === "id" ? "Item terpilih berhasil dihapus." : "Selected items deleted.", "success");
            refreshDownloadsList();
        } else {
            if (!pendingDeletePath) return;
            if (pendingDeletePath === 'mobile_vault') {
                removeFromMobileVault(pendingDeleteName);
                if (pendingDeleteName) {
                    selectedVaultFolderNames.delete(pendingDeleteName);
                }
                closeDeleteModal();
                updateVaultSelectionUI();
                showToast(currentLang === "id" ? "Media berhasil dihapus dari LocalStorage HP." : "Media deleted from mobile storage.", "success");
                refreshDownloadsList();
                return;
            }
            const folderPath = pendingDeletePath;
            const resp = await fetch("/api/delete-folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder_path: folderPath })
            });
            const res = await resp.json();
            if (resp.ok) {
                if (pendingDeleteName) {
                    selectedVaultFolderNames.delete(pendingDeleteName);
                }
                closeDeleteModal();
                updateVaultSelectionUI();
                showToast("Folder berhasil dihapus permanen.", "success");
                refreshDownloadsList();
            } else {
                throw new Error(res.detail || "Gagal menghapus folder.");
            }
        }
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
        isBatchDeleteModal = false;
    }
}

// ==========================================
// SYSTEM EXPLORER OPENER
// ==========================================
function openSystemFolderByIndex(index) {
    if (allLoadedFolders && allLoadedFolders[index]) {
        openSystemFolder(allLoadedFolders[index].folder_path);
    }
}

async function openSystemFolder(folderPath = null) {
    try {
        const payload = folderPath ? { folder_path: folderPath } : {};
        const resp = await fetch("/api/open-folder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const res = await resp.json();
        if (resp.ok) {
            const cleanPath = res.folder_path || folderPath || "downloads";
            if (navigator.clipboard) {
                navigator.clipboard.writeText(cleanPath).catch(() => {});
            }
            showToast(currentLang === "id" ? `Membuka folder di Windows Explorer: ${cleanPath}` : `Opened folder in Windows Explorer: ${cleanPath}`, "success");
        } else {
            throw new Error(res.detail || "Gagal membuka folder");
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// VAULT TO SMARTPHONE SHARING & ZIP EXPORT
// ==========================================
let currentVaultShareFolders = [];
let currentVaultShareMode = 'hub'; // 'hub' or 'zip'
let currentLocalNetworkBaseUrl = '';

async function fetchNetworkInfo() {
    try {
        const resp = await fetch("/api/network-info");
        const data = await resp.json();
        currentLocalNetworkBaseUrl = data.base_url || window.location.origin;
    } catch {
        currentLocalNetworkBaseUrl = window.location.origin;
    }
}

async function openVaultShareModal(folderNames, defaultMode = 'hub') {
    if (!folderNames || folderNames.length === 0) return;
    currentVaultShareFolders = folderNames;
    currentVaultShareMode = defaultMode;

    if (!currentLocalNetworkBaseUrl) {
        await fetchNetworkInfo();
    }

    const modal = document.getElementById("vault-share-modal");
    if (modal) modal.classList.remove("hidden");

    setVaultShareMode(defaultMode);
    refreshIcons();
}

function closeVaultShareModal() {
    const modal = document.getElementById("vault-share-modal");
    if (modal) modal.classList.add("hidden");
}

function setVaultShareMode(mode) {
    currentVaultShareMode = mode;
    const tabHub = document.getElementById("tab-share-hub");
    const tabZip = document.getElementById("tab-share-zip");
    const desc = document.getElementById("vault-share-desc");

    if (mode === 'hub') {
        if (tabHub) tabHub.className = "py-2 px-3 rounded-lg bg-emerald-600 text-white shadow-xs transition-all flex items-center justify-center gap-1.5";
        if (tabZip) tabZip.className = "py-2 px-3 rounded-lg text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center gap-1.5";
        if (desc) desc.textContent = currentLang === "id"
            ? "Scan kode QR dengan kamera smartphone Anda untuk membuka Mobile Transfer Hub (bisa simpan video/foto satuan atau ZIP langsung ke Galeri HP):"
            : "Scan this QR code with your phone camera to open the Mobile Transfer Hub (save individual media or full ZIP directly to phone):";
    } else {
        if (tabHub) tabHub.className = "py-2 px-3 rounded-lg text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center gap-1.5";
        if (tabZip) tabZip.className = "py-2 px-3 rounded-lg bg-emerald-600 text-white shadow-xs transition-all flex items-center justify-center gap-1.5";
        if (desc) desc.textContent = currentLang === "id"
            ? "Scan kode QR ini untuk langsung mengunduh paket berkas .ZIP berisi seluruh media terpilih ke smartphone Anda:"
            : "Scan this QR code to immediately download the full .ZIP package of selected media to your smartphone:";
    }

    updateVaultShareModalQR();
}

function updateVaultShareModalQR() {
    const qrImg = document.getElementById("vault-share-qr-img");
    const urlText = document.getElementById("vault-share-url-text");
    if (!qrImg || !urlText) return;

    const base = currentLocalNetworkBaseUrl || window.location.origin;
    const folderParam = encodeURIComponent(currentVaultShareFolders.join(","));

    let targetUrl = "";
    if (currentVaultShareMode === 'hub') {
        targetUrl = `${base}/mobile-share?folders=${folderParam}`;
    } else {
        targetUrl = `${base}/api/vault/export-zip?folders=${folderParam}`;
    }

    urlText.textContent = targetUrl;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
}

function copyVaultShareUrl() {
    const urlText = document.getElementById("vault-share-url-text");
    const url = urlText ? urlText.textContent : "";
    if (url) {
        navigator.clipboard.writeText(url).then(() => {
            showToast(currentLang === "id" ? "Tautan transfer disalin ke clipboard!" : "Transfer link copied to clipboard!", "success");
        });
    }
}

function shareVaultSelectedToPhone() {
    if (selectedVaultFolderNames.size === 0) {
        showToast(currentLang === "id" ? "Pilih minimal satu folder terlebih dahulu." : "Select at least one folder.", "error");
        return;
    }
    const folders = Array.from(selectedVaultFolderNames);
    openVaultShareModal(folders, 'hub');
}

function shareVaultFolderToPhone(folderName) {
    if (!folderName) return;
    openVaultShareModal([folderName], 'hub');
}

function shareCurrentModalFolderToPhone() {
    if (currentModalFolder && currentModalFolder.folder_name) {
        openVaultShareModal([currentModalFolder.folder_name], 'hub');
    }
}

async function downloadVaultSelectedAsZip() {
    if (selectedVaultFolderNames.size === 0) {
        showToast(currentLang === "id" ? "Pilih minimal satu folder terlebih dahulu." : "Select at least one folder.", "error");
        return;
    }
    const folders = Array.from(selectedVaultFolderNames);
    const btnZip = document.getElementById("btn-vault-zip-selected");
    const originalText = btnZip ? btnZip.innerHTML : "";
    if (btnZip) {
        btnZip.disabled = true;
        btnZip.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> Mengompres...`;
    }

    try {
        const resp = await fetch("/api/vault/export-zip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_names: folders })
        });

        if (!resp.ok) {
            throw new Error("Gagal mengompresi folder tersimpan.");
        }

        const blob = await resp.blob();
        const dlUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `IN_DONLOTiN_Vault_${folders.length}_items.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(dlUrl);
        showToast(currentLang === "id" ? "Paket ZIP berhasil diunduh ke komputer!" : "ZIP package downloaded successfully!", "success");
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        if (btnZip) {
            btnZip.disabled = false;
            btnZip.innerHTML = originalText;
        }
    }
}

// ==========================================
// SETTINGS MANAGEMENT
// ==========================================
async function loadSettings() {
    try {
        const resp = await fetch("/api/settings");
        const settings = await resp.json();

        const outDir = document.getElementById("setting-output-dir");
        const naming = document.getElementById("setting-naming-format");
        const singleNaming = document.getElementById("single-naming-format");
        const batchNaming = document.getElementById("batch-naming-format");
        const session = document.getElementById("setting-session-id");
        const maxBatch = document.getElementById("setting-max-batch");

        if (outDir) outDir.value = settings.output_dir || "";
        if (naming) naming.value = settings.naming_format || "datetime";
        if (singleNaming) singleNaming.value = settings.naming_format || "datetime";
        if (batchNaming) batchNaming.value = settings.naming_format || "datetime";
        if (session) session.value = settings.session_id || "";
        if (maxBatch) maxBatch.value = settings.max_batch_items || 20;
        window.currentMaxBatchItems = settings.max_batch_items || 20;
    } catch (err) {
        console.error("Gagal memuat pengaturan:", err);
    }
}

async function saveSettings(event) {
    if (event) event.preventDefault();
    const outputDir = document.getElementById("setting-output-dir").value.trim();
    const namingFormat = document.getElementById("setting-naming-format").value;
    const sessionId = document.getElementById("setting-session-id").value.trim();
    const maxBatchVal = parseInt(document.getElementById("setting-max-batch")?.value) || 20;
    const msg = document.getElementById("settings-status-msg");

    try {
        const resp = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                output_dir: outputDir,
                naming_format: namingFormat,
                session_id: sessionId,
                max_batch_items: maxBatchVal
            })
        });

        if (resp.ok) {
            window.currentMaxBatchItems = maxBatchVal;
            if (msg) msg.textContent = translations[currentLang]?.toast_saved || "Pengaturan berhasil disimpan!";
            showToast(translations[currentLang]?.toast_saved || "Pengaturan aplikasi berhasil disimpan!", "success");
            setTimeout(() => { if (msg) msg.textContent = ""; }, 4000);
            loadSettings();
        } else {
            throw new Error("Gagal menyimpan pengaturan.");
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// SYSTEM TELEMETRY (IP, Device, Lokasi, Cuaca)
// ==========================================
let currentTelemetryData = null;

function detectClientDevice() {
    const ua = navigator.userAgent;
    let os = "PC";
    if (/Windows NT 10.0/i.test(ua)) os = "Windows 11/10";
    else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
    else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Browser";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome\//i.test(ua)) browser = "Chrome";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Safari\//i.test(ua)) browser = "Safari";

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    return {
        os: os,
        browser: browser,
        summary: `${os} • ${browser}`,
        screen: screenRes
    };
}

async function fetchSystemTelemetry(forceRefresh = false) {
    try {
        const clientDev = detectClientDevice();
        const url = forceRefresh ? "/api/telemetry?t=" + Date.now() : "/api/telemetry";
        const resp = await fetch(url);
        const data = await resp.json();
        currentTelemetryData = data;

        // 1. Update Top Navbar Telemetry Badges
        const navTemp = document.getElementById("nav-weather-temp");
        const navLoc = document.getElementById("nav-location");
        const navIp = document.getElementById("nav-ip");
        const navDevice = document.getElementById("nav-device");
        const navWeatherIcon = document.getElementById("nav-weather-icon");

        const tempDisplay = (data.weather && typeof data.weather.temp === 'number') 
            ? `${Math.round(data.weather.temp)}°C` 
            : (data.weather?.temp_str || "--°C");

        if (navTemp) navTemp.textContent = tempDisplay;
        if (navLoc) navLoc.textContent = data.location?.city || "Indonesia";
        if (navIp) navIp.textContent = data.ip?.local || "--";
        if (navDevice) navDevice.textContent = clientDev.summary;
        if (navWeatherIcon && data.weather?.icon) {
            navWeatherIcon.textContent = data.weather.icon;
        }

        // 2. Update Sidebar Widget Card
        const sideIp = document.getElementById("sidebar-ip");
        const sideDevice = document.getElementById("sidebar-device");
        const sideLoc = document.getElementById("sidebar-location");
        const sideWeather = document.getElementById("sidebar-weather");
        const sideWeatherIcon = document.getElementById("sidebar-weather-icon");

        if (sideIp) sideIp.textContent = data.ip?.local || "--";
        if (sideDevice) sideDevice.textContent = clientDev.os;
        if (sideLoc) sideLoc.textContent = data.location?.display || "Indonesia";
        if (sideWeather) sideWeather.textContent = `${tempDisplay} ${data.weather?.condition || ''}`.trim();
        if (sideWeatherIcon && data.weather?.icon) {
            sideWeatherIcon.textContent = data.weather.icon;
        }

        // 3. Update Modal Dialog Details if open
        updateTelemetryModalUI(data, clientDev);

        if (forceRefresh) {
            showToast(currentLang === "id" ? "Informasi sistem & cuaca berhasil diperbarui!" : "Telemetry & weather refreshed!", "success");
        }
    } catch (err) {
        console.error("Gagal memuat telemetri:", err);
    }
}

function updateTelemetryModalUI(data, clientDev) {
    if (!data) return;
    clientDev = clientDev || detectClientDevice();

    const elIpLocal = document.getElementById("tel-ip-local");
    const elIpPublic = document.getElementById("tel-ip-public");
    const elDevOs = document.getElementById("tel-device-os");
    const elDevHost = document.getElementById("tel-device-host");
    const elDevBrowser = document.getElementById("tel-device-browser");
    const elLocCity = document.getElementById("tel-location-city");
    const elLocCountry = document.getElementById("tel-location-country");
    const elWeatherTemp = document.getElementById("tel-weather-temp");
    const elWeatherCond = document.getElementById("tel-weather-condition");
    const elWeatherExtra = document.getElementById("tel-weather-extra");
    const elWeatherIcon = document.getElementById("tel-weather-icon");

    if (elIpLocal) elIpLocal.textContent = data.ip?.local || "--";
    if (elIpPublic) elIpPublic.textContent = data.ip?.public || "--";
    if (elDevOs) elDevOs.textContent = `${clientDev.os} (${data.device?.arch || 'x64'})`;
    if (elDevHost) elDevHost.textContent = data.device?.hostname || "localhost";
    if (elDevBrowser) elDevBrowser.textContent = `${clientDev.browser} (${clientDev.screen})`;
    if (elLocCity) elLocCity.textContent = data.location?.city || "Indonesia";
    const tempDisplay = (data.weather && typeof data.weather.temp === 'number') ? `${Math.round(data.weather.temp)}°C` : (data.weather?.temp_str || "--°C");
    if (elWeatherTemp) elWeatherTemp.textContent = tempDisplay;
    if (elWeatherCond) elWeatherCond.textContent = `${data.weather?.condition || ''} (${data.weather?.condition_en || ''})`;
    if (elWeatherExtra) elWeatherExtra.textContent = `Lembab: ${data.weather?.humidity || 0}% • Angin: ${data.weather?.wind_speed || 0} km/j`;
    if (elWeatherIcon && data.weather?.icon) {
        elWeatherIcon.textContent = data.weather.icon;
    }
}

function openTelemetryModal() {
    const modal = document.getElementById("telemetry-modal");
    if (modal) modal.classList.remove("hidden");
    if (currentTelemetryData) {
        updateTelemetryModalUI(currentTelemetryData);
    } else {
        fetchSystemTelemetry();
    }
    refreshIcons();
}

function closeTelemetryModal() {
    const modal = document.getElementById("telemetry-modal");
    if (modal) modal.classList.add("hidden");
}

// Global Escape and Backdrop Dismissal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeDeleteModal();
        closeMediaModal();
        closeQrModal();
        closeVaultShareModal();
        closeTelemetryModal();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const deleteModal = document.getElementById("delete-modal");
    if (deleteModal) {
        deleteModal.addEventListener("click", (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
    const mediaModal = document.getElementById("media-modal");
    if (mediaModal) {
        mediaModal.addEventListener("click", (e) => {
            if (e.target === mediaModal) closeMediaModal();
        });
    }
    const qrModal = document.getElementById("qr-modal");
    if (qrModal) {
        qrModal.addEventListener("click", (e) => {
            if (e.target === qrModal) closeQrModal();
        });
    }
    const vaultShareModal = document.getElementById("vault-share-modal");
    if (vaultShareModal) {
        vaultShareModal.addEventListener("click", (e) => {
            if (e.target === vaultShareModal) closeVaultShareModal();
        });
    }
    const telModal = document.getElementById("telemetry-modal");
    if (telModal) {
        telModal.addEventListener("click", (e) => {
            if (e.target === telModal) closeTelemetryModal();
        });
    }
});
