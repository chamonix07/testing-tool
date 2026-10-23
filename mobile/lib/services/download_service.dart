import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/media_preview.dart';
import '../models/vault_item.dart';
import 'api_service.dart';
import 'storage_service.dart';

class DownloadService {
  final ApiService apiService;
  final StorageService storageService;

  DownloadService({required this.apiService, required this.storageService});

  Future<String> getDownloadDirectory() async {
    Directory? dir;
    if (Platform.isAndroid) {
      // Primary public download directory
      final publicDownload = Directory('/storage/emulated/0/Download/IN_DONLOTiN');
      if (!await publicDownload.exists()) {
        try {
          await publicDownload.create(recursive: true);
          return publicDownload.path;
        } catch (_) {}
      } else {
        return publicDownload.path;
      }

      final extDir = await getExternalStorageDirectory();
      if (extDir != null) {
        dir = Directory('${extDir.path}/IN_DONLOTiN');
      }
    }

    dir ??= await getApplicationDocumentsDirectory();
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return dir.path;
  }

  Future<bool> requestStoragePermission() async {
    if (Platform.isAndroid) {
      if (await Permission.storage.isGranted) return true;
      final status = await Permission.storage.request();
      if (status.isGranted) return true;
      
      // On Android 13+ (API 33+)
      if (await Permission.videos.request().isGranted && await Permission.photos.request().isGranted) {
        return true;
      }
    }
    return true; // Proceed with app storage if public is denied
  }

  String _sanitizeFileName(String name) {
    return name
        .replaceAll(RegExp(r'[\\/*?:"<>|]'), '')
        .replaceAll(RegExp(r'\s+'), '_')
        .trim();
  }

  Future<VaultItem> downloadMedia({
    required MediaPreview preview,
    required String formatId,
    List<int>? selectedIndices,
    required void Function(double progress, int received, int total) onProgress,
    CancelToken? cancelToken,
  }) async {
    await requestStoragePermission();
    final downloadDir = await getDownloadDirectory();

    final isAudio = (formatId == 'audio_mp3');
    final isZip = (selectedIndices != null && selectedIndices.length > 1);
    
    String ext = 'mp4';
    String fileType = 'video';

    if (isZip) {
      ext = 'zip';
      fileType = 'zip';
    } else if (isAudio) {
      ext = 'mp3';
      fileType = 'audio';
    } else if (!preview.isVideo) {
      ext = 'jpg';
      fileType = 'image';
    }

    final safeTitle = _sanitizeFileName(preview.title.isNotEmpty ? preview.title : preview.shortcode);
    final fileName = '${preview.platform}_${safeTitle.length > 30 ? safeTitle.substring(0, 30) : safeTitle}.$ext';
    final targetFilePath = '$downloadDir/$fileName';

    int startTime = DateTime.now().millisecondsSinceEpoch;

    void handleProgress(int received, int total) {
      double p = 0.0;
      if (total > 0) {
        p = received / total;
      }
      onProgress(p, received, total);
    }

    if (isZip) {
      await apiService.downloadZipToFile(
        mediaUrl: preview.url,
        selectedIndices: selectedIndices,
        formatId: formatId,
        savePath: targetFilePath,
        onProgress: handleProgress,
        cancelToken: cancelToken,
      );
    } else {
      await apiService.downloadSingleToFile(
        mediaUrl: preview.url,
        formatId: formatId,
        savePath: targetFilePath,
        onProgress: handleProgress,
        cancelToken: cancelToken,
      );
    }

    final savedFile = File(targetFilePath);
    final fileSizeBytes = await savedFile.exists() ? await savedFile.length() : 0;

    // Cache thumbnail locally if available
    String? localThumbPath;
    if (preview.thumbnail != null && preview.thumbnail!.isNotEmpty) {
      try {
        final cacheDir = await getTemporaryDirectory();
        final thumbFile = File('${cacheDir.path}/thumb_${preview.shortcode}.jpg');
        final thumbUrl = apiService.getProxyMediaUrl(preview.thumbnail);
        await Dio().download(thumbUrl, thumbFile.path);
        if (await thumbFile.exists()) {
          localThumbPath = thumbFile.path;
        }
      } catch (_) {}
    }

    final vaultItem = VaultItem(
      id: 'vault_${DateTime.now().millisecondsSinceEpoch}',
      title: preview.title.isNotEmpty ? preview.title : '${preview.platformName} Media',
      author: preview.author,
      platform: preview.platform,
      createdAt: DateTime.now(),
      thumbnailPath: localThumbPath ?? preview.thumbnail,
      localFilePath: targetFilePath,
      fileType: fileType,
      fileSizeBytes: fileSizeBytes,
      formatBadge: isAudio ? 'MP3 Audio' : (isZip ? 'ZIP Archive' : formatId.toUpperCase()),
    );

    await storageService.saveVaultItem(vaultItem);
    return vaultItem;
  }
}
