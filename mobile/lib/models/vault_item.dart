import 'dart:convert';

class VaultItem {
  final String id;
  final String title;
  final String author;
  final String platform;
  final DateTime createdAt;
  final String? thumbnailPath;
  final String localFilePath;
  final String fileType; // 'video', 'audio', 'image', 'zip'
  final int fileSizeBytes;
  final String formatBadge;

  VaultItem({
    required this.id,
    required this.title,
    required this.author,
    required this.platform,
    required this.createdAt,
    this.thumbnailPath,
    required this.localFilePath,
    required this.fileType,
    required this.fileSizeBytes,
    required this.formatBadge,
  });

  String get formattedSize {
    if (fileSizeBytes < 1024 * 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'platform': platform,
      'created_at': createdAt.toIso8601String(),
      'thumbnail_path': thumbnailPath,
      'local_file_path': localFilePath,
      'file_type': fileType,
      'file_size_bytes': fileSizeBytes,
      'format_badge': formatBadge,
    };
  }

  factory VaultItem.fromJson(Map<String, dynamic> map) {
    return VaultItem(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      author: map['author'] ?? '',
      platform: map['platform'] ?? '',
      createdAt: DateTime.tryParse(map['created_at'] ?? '') ?? DateTime.now(),
      thumbnailPath: map['thumbnail_path'],
      localFilePath: map['local_file_path'] ?? '',
      fileType: map['file_type'] ?? 'video',
      fileSizeBytes: map['file_size_bytes'] ?? 0,
      formatBadge: map['format_badge'] ?? '',
    );
  }

  static String encodeList(List<VaultItem> items) =>
      json.encode(items.map((i) => i.toJson()).toList());

  static List<VaultItem> decodeList(String jsonStr) =>
      (json.decode(jsonStr) as List<dynamic>)
          .map((item) => VaultItem.fromJson(item as Map<String, dynamic>))
          .toList();
}
