class MediaPreview {
  final bool success;
  final String platform;
  final String platformName;
  final String platformIcon;
  final String shortcode;
  final String url;
  final String author;
  final String title;
  final String caption;
  final String captionSummary;
  final String dateStr;
  final String contentType;
  final bool isVideo;
  final String durationStr;
  final String? thumbnail;
  final int totalItems;
  final List<AvailableFormat> availableFormats;
  final List<MediaItem> items;

  MediaPreview({
    required this.success,
    required this.platform,
    required this.platformName,
    required this.platformIcon,
    required this.shortcode,
    required this.url,
    required this.author,
    required this.title,
    required this.caption,
    required this.captionSummary,
    required this.dateStr,
    required this.contentType,
    required this.isVideo,
    required this.durationStr,
    this.thumbnail,
    required this.totalItems,
    required this.availableFormats,
    required this.items,
  });

  factory MediaPreview.fromJson(Map<String, dynamic> json) {
    return MediaPreview(
      success: json['success'] ?? false,
      platform: json['platform'] ?? 'other',
      platformName: json['platform_name'] ?? 'Media',
      platformIcon: json['platform_icon'] ?? 'play',
      shortcode: json['shortcode'] ?? 'media',
      url: json['url'] ?? '',
      author: json['author'] ?? 'Creator',
      title: json['title'] ?? '',
      caption: json['caption'] ?? '',
      captionSummary: json['caption_summary'] ?? '',
      dateStr: json['date_str'] ?? '',
      contentType: json['content_type'] ?? 'video',
      isVideo: json['is_video'] ?? true,
      durationStr: json['duration_str'] ?? '',
      thumbnail: json['thumbnail'],
      totalItems: json['total_items'] ?? 1,
      availableFormats: (json['available_formats'] as List<dynamic>? ?? [])
          .map((f) => AvailableFormat.fromJson(f as Map<String, dynamic>))
          .toList(),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((it) => MediaItem.fromJson(it as Map<String, dynamic>))
          .toList(),
    );
  }
}

class AvailableFormat {
  final String id;
  final String label;
  final String size;
  final String badge;

  AvailableFormat({
    required this.id,
    required this.label,
    required this.size,
    required this.badge,
  });

  factory AvailableFormat.fromJson(Map<String, dynamic> json) {
    return AvailableFormat(
      id: json['id'] ?? '1080p',
      label: json['label'] ?? '',
      size: json['size'] ?? '',
      badge: json['badge'] ?? '',
    );
  }
}

class MediaItem {
  final int index;
  final bool isVideo;
  final String? displayUrl;
  final String? videoUrl;
  final String? downloadUrl;

  MediaItem({
    required this.index,
    required this.isVideo,
    this.displayUrl,
    this.videoUrl,
    this.downloadUrl,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      index: json['index'] ?? 1,
      isVideo: json['is_video'] ?? false,
      displayUrl: json['display_url'],
      videoUrl: json['video_url'],
      downloadUrl: json['download_url'],
    );
  }
}
