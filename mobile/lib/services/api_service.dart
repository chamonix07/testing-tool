import 'dart:io';
import 'package:dio/dio.dart';
import '../models/media_preview.dart';

class ApiService {
  final Dio _dio;
  String baseUrl;

  ApiService({required this.baseUrl})
      : _dio = Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(minutes: 5),
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'IN-DONLOTiN-Flutter-Mobile/1.0',
            },
          ),
        );

  void updateBaseUrl(String newBaseUrl) {
    baseUrl = newBaseUrl.endsWith('/') ? newBaseUrl.substring(0, newBaseUrl.length - 1) : newBaseUrl;
  }

  String getProxyMediaUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.isEmpty) return '';
    return '$baseUrl/api/proxy-media?url=${Uri.encodeComponent(rawUrl)}';
  }

  String getDownloadSingleUrl(String url, String formatId) {
    return '$baseUrl/api/download-single?url=${Uri.encodeComponent(url)}&format_id=${Uri.encodeComponent(formatId)}';
  }

  Future<MediaPreview> getPreview(String url) async {
    try {
      final response = await _dio.post(
        '$baseUrl/api/preview',
        data: {'url': url.trim()},
      );

      if (response.statusCode == 200 && response.data != null) {
        return MediaPreview.fromJson(response.data as Map<String, dynamic>);
      } else {
        throw Exception(response.data?['detail'] ?? 'Gagal mengambil metadata media.');
      }
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map && data.containsKey('detail')) {
          throw Exception(data['detail']);
        }
      }
      throw Exception('Koneksi ke server gagal: ${e.message}');
    }
  }

  Future<void> downloadSingleToFile({
    required String mediaUrl,
    required String formatId,
    required String savePath,
    required void Function(int received, int total) onProgress,
    CancelToken? cancelToken,
  }) async {
    final targetUrl = getDownloadSingleUrl(mediaUrl, formatId);
    try {
      await _dio.download(
        targetUrl,
        savePath,
        onReceiveProgress: onProgress,
        cancelToken: cancelToken,
        options: Options(
          responseType: ResponseType.bytes,
          followRedirects: true,
        ),
      );
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map && data.containsKey('detail')) {
          throw Exception(data['detail']);
        }
      }
      throw Exception('Gagal mengunduh berkas: ${e.message}');
    }
  }

  Future<void> downloadZipToFile({
    required String mediaUrl,
    required List<int> selectedIndices,
    required String formatId,
    required String savePath,
    required void Function(int received, int total) onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      await _dio.download(
        '$baseUrl/api/download-zip',
        savePath,
        data: {
          'url': mediaUrl.trim(),
          'selected_indices': selectedIndices,
          'format_id': formatId,
          'naming_format': 'content_name',
          'save_caption': true,
        },
        onReceiveProgress: onProgress,
        cancelToken: cancelToken,
        options: Options(
          method: 'POST',
          responseType: ResponseType.bytes,
        ),
      );
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response?.data;
        if (data is Map && data.containsKey('detail')) {
          throw Exception(data['detail']);
        }
      }
      throw Exception('Gagal membuat dan mengunduh ZIP: ${e.message}');
    }
  }

  Future<List<Map<String, dynamic>>> getBatchPreview(List<String> urls) async {
    try {
      final response = await _dio.post(
        '$baseUrl/api/batch-preview',
        data: {'urls': urls},
      );
      if (response.statusCode == 200 && response.data != null) {
        final items = response.data['items'] as List<dynamic>? ?? [];
        return items.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      throw Exception('Gagal memuat batch preview: $e');
    }
  }

  Future<bool> testConnection() async {
    try {
      final response = await _dio.get(
        '$baseUrl/api/network-info',
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
      return response.statusCode == 200;
    } catch (_) {
      try {
        final respRoot = await _dio.get(
          baseUrl,
          options: Options(
            sendTimeout: const Duration(seconds: 5),
            receiveTimeout: const Duration(seconds: 5),
          ),
        );
        return respRoot.statusCode == 200;
      } catch (_) {
        return false;
      }
    }
  }
}
