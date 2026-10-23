import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/media_preview.dart';
import '../models/vault_item.dart';
import '../services/api_service.dart';
import '../services/download_service.dart';

class PreviewProvider with ChangeNotifier {
  final ApiService apiService;

  MediaPreview? _preview;
  bool _isLoading = false;
  String? _errorMessage;

  // Format & Carousel State
  String _selectedFormatId = '1080p';
  final Set<int> _selectedIndices = {};

  // Download Progress State
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  String _downloadStatusText = '';
  CancelToken? _cancelToken;

  PreviewProvider({required this.apiService});

  MediaPreview? get preview => _preview;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get selectedFormatId => _selectedFormatId;
  Set<int> get selectedIndices => _selectedIndices;

  bool get isDownloading => _isDownloading;
  double get downloadProgress => _downloadProgress;
  String get downloadStatusText => _downloadStatusText;

  void setSelectedFormat(String formatId) {
    _selectedFormatId = formatId;
    notifyListeners();
  }

  void toggleIndex(int index) {
    if (_selectedIndices.contains(index)) {
      if (_selectedIndices.length > 1) {
        _selectedIndices.remove(index);
      }
    } else {
      _selectedIndices.add(index);
    }
    notifyListeners();
  }

  void selectAllIndices() {
    if (_preview == null) return;
    _selectedIndices.clear();
    for (var it in _preview!.items) {
      _selectedIndices.add(it.index);
    }
    notifyListeners();
  }

  Future<void> fetchPreview(String rawUrl) async {
    final url = rawUrl.trim();
    if (url.isEmpty) return;

    _isLoading = true;
    _errorMessage = null;
    _preview = null;
    _selectedIndices.clear();
    notifyListeners();

    try {
      final res = await apiService.getPreview(url);
      _preview = res;
      if (res.availableFormats.isNotEmpty) {
        // Default to 1080p or 720p or first format
        final has1080 = res.availableFormats.any((f) => f.id == '1080p');
        final has720 = res.availableFormats.any((f) => f.id == '720p');
        _selectedFormatId = has1080 ? '1080p' : (has720 ? '720p' : res.availableFormats.first.id);
      } else {
        _selectedFormatId = '1080p';
      }

      // Initialize all carousel slides as selected
      for (var it in res.items) {
        _selectedIndices.add(it.index);
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<VaultItem?> startDownload({
    required DownloadService downloadService,
    String? overrideFormatId,
    bool forceZip = false,
  }) async {
    if (_preview == null) return null;

    final format = overrideFormatId ?? _selectedFormatId;
    _isDownloading = true;
    _downloadProgress = 0.0;
    _downloadStatusText = 'Menyiapkan unduhan...';
    _cancelToken = CancelToken();
    notifyListeners();

    try {
      final isCarousel = _preview!.contentType == 'carousel' && _selectedIndices.length > 1;
      final targetIndices = (forceZip || isCarousel) ? _selectedIndices.toList() : null;

      final result = await downloadService.downloadMedia(
        preview: _preview!,
        formatId: format,
        selectedIndices: targetIndices,
        cancelToken: _cancelToken,
        onProgress: (progress, received, total) {
          _downloadProgress = progress;
          if (total > 0) {
            final mbReceived = (received / (1024 * 1024)).toStringAsFixed(1);
            final mbTotal = (total / (1024 * 1024)).toStringAsFixed(1);
            _downloadStatusText = '$mbReceived MB / $mbTotal MB (${(progress * 100).toInt()}%)';
          } else {
            _downloadStatusText = '${(received / (1024 * 1024)).toStringAsFixed(1)} MB diunduh...';
          }
          notifyListeners();
        },
      );

      _downloadStatusText = 'Unduhan Selesai 100%!';
      _downloadProgress = 1.0;
      notifyListeners();
      return result;
    } catch (e) {
      _downloadStatusText = 'Gagal: ${e.toString().replaceAll('Exception: ', '')}';
      rethrow;
    } finally {
      Future.delayed(const Duration(seconds: 1), () {
        _isDownloading = false;
        notifyListeners();
      });
    }
  }

  void cancelDownload() {
    _cancelToken?.cancel('Dibatalkan oleh pengguna.');
    _isDownloading = false;
    _downloadStatusText = 'Unduhan dibatalkan.';
    notifyListeners();
  }

  void clear() {
    _preview = null;
    _errorMessage = null;
    _isLoading = false;
    _selectedIndices.clear();
    notifyListeners();
  }
}
