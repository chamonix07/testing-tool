import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/preview_provider.dart';
import '../providers/vault_provider.dart';
import '../services/api_service.dart';
import '../services/download_service.dart';
import '../theme/app_theme.dart';
import '../widgets/platform_badge.dart';

class BatchDownloaderScreen extends StatefulWidget {
  const BatchDownloaderScreen({Key? key}) : super(key: key);

  @override
  State<BatchDownloaderScreen> createState() => _BatchDownloaderScreenState();
}

class _BatchDownloaderScreenState extends State<BatchDownloaderScreen> {
  final TextEditingController _urlsController = TextEditingController();
  List<Map<String, dynamic>> _batchItems = [];
  bool _isLoading = false;
  bool _isDownloading = false;
  int _completedCount = 0;

  @override
  void dispose() {
    _urlsController.dispose();
    super.dispose();
  }

  List<String> get _parsedUrls {
    return _urlsController.text
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.isNotEmpty)
        .toList();
  }

  Future<void> _loadBatchMeta() async {
    final urls = _parsedUrls;
    if (urls.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan masukkan minimal 1 link URL.')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _batchItems.clear();
      _completedCount = 0;
    });

    try {
      final api = context.read<ApiService>();
      final items = await api.getBatchPreview(urls);
      setState(() {
        _batchItems = items;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal: $e'), backgroundColor: AppTheme.errorRed),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _startBatchDownload() async {
    final urls = _parsedUrls;
    if (urls.isEmpty) return;

    setState(() {
      _isDownloading = true;
      _completedCount = 0;
    });

    final dlService = context.read<DownloadService>();
    final api = context.read<ApiService>();
    final vault = context.read<VaultProvider>();

    for (int i = 0; i < urls.length; i++) {
      final url = urls[i];
      try {
        final preview = await api.getPreview(url);
        await dlService.downloadMedia(
          preview: preview,
          formatId: '1080p',
          onProgress: (_, __, ___) {},
        );
        setState(() {
          _completedCount++;
        });
      } catch (_) {}
    }

    vault.loadItems();
    setState(() {
      _isDownloading = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Selesai mengunduh $_completedCount dari ${urls.length} media!'),
          backgroundColor: AppTheme.successGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final urlsCount = _parsedUrls.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Batch Downloader'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Daftar Link Media (Satu per baris):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('$urlsCount link', style: const TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _urlsController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText: 'https://instagram.com/reel/...\nhttps://youtube.com/watch?v=...\nhttps://tiktok.com/@...',
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.playlist_add_check_rounded, size: 18),
                            label: const Text('Muat Info'),
                            onPressed: _isLoading ? null : _loadBatchMeta,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryBlue,
                              foregroundColor: Colors.white,
                            ),
                            icon: const Icon(Icons.download_rounded, size: 18),
                            label: Text(_isDownloading ? 'Unduh ($_completedCount/$urlsCount)' : 'Unduh Semua'),
                            onPressed: (_isDownloading || urlsCount == 0) ? null : _startBatchDownload,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            if (_batchItems.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text('Pratinjau Antrean Unduhan:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _batchItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, idx) {
                  final it = _batchItems[idx];
                  final isSuccess = it['success'] == true;
                  final thumb = it['thumbnail'] as String?;

                  return Card(
                    child: ListTile(
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 50,
                          height: 50,
                          color: Colors.black12,
                          child: (thumb != null && thumb.isNotEmpty)
                              ? CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover)
                              : const Icon(Icons.movie_rounded),
                        ),
                      ),
                      title: Text(
                        it['title'] ?? it['url'],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        it['platform'] ?? 'Media',
                        style: const TextStyle(fontSize: 11),
                      ),
                      trailing: isSuccess
                          ? const Icon(Icons.check_circle_rounded, color: AppTheme.successGreen, size: 20)
                          : const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed, size: 20),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

extension IterableExt<T> on Iterable<T> {
  Iterable<T> filter(bool Function(T) test) => where(test);
}
