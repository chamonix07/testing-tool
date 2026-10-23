import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/media_preview.dart';
import '../providers/preview_provider.dart';
import '../providers/vault_provider.dart';
import '../services/download_service.dart';
import '../theme/app_theme.dart';
import '../widgets/platform_badge.dart';
import 'media_player_screen.dart';

class SingleDownloaderScreen extends StatefulWidget {
  const SingleDownloaderScreen({Key? key}) : super(key: key);

  @override
  State<SingleDownloaderScreen> createState() => _SingleDownloaderScreenState();
}

class _SingleDownloaderScreenState extends State<SingleDownloaderScreen> {
  final TextEditingController _urlController = TextEditingController();

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _pasteClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data != null && data.text != null && data.text!.isNotEmpty) {
      _urlController.text = data.text!.trim();
      if (mounted) {
        context.read<PreviewProvider>().fetchPreview(_urlController.text);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PreviewProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.download_rounded, color: AppTheme.primaryBlue, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('IN DONLOTiN'),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // URL Input Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TextField(
                      controller: _urlController,
                      decoration: InputDecoration(
                        hintText: 'Tempel link Instagram, YouTube, TikTok, dll...',
                        prefixIcon: const Icon(Icons.link_rounded),
                        suffixIcon: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_urlController.text.isNotEmpty)
                              IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                onPressed: () {
                                  _urlController.clear();
                                  provider.clear();
                                  setState(() {});
                                },
                              ),
                            IconButton(
                              icon: const Icon(Icons.content_paste_rounded, color: AppTheme.primaryBlue),
                              tooltip: 'Tempel dari Clipboard',
                              onPressed: _pasteClipboard,
                            ),
                          ],
                        ),
                      ),
                      onSubmitted: (val) => provider.fetchPreview(val),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryBlue,
                        foregroundColor: Colors.white,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: provider.isLoading
                          ? null
                          : () {
                              FocusScope.of(context).unfocus();
                              provider.fetchPreview(_urlController.text);
                            },
                      child: provider.isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search_rounded, size: 18),
                                SizedBox(width: 8),
                                Text('Periksa Konten Media', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                    ),
                  ],
                ),
              ),
            ),

            if (provider.errorMessage != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.errorRed.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.errorRed.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        provider.errorMessage!,
                        style: const TextStyle(color: AppTheme.errorRed, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (provider.preview != null) ...[
              const SizedBox(height: 16),
              _buildPreviewCard(context, provider),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewCard(BuildContext context, PreviewProvider provider) {
    final preview = provider.preview!;
    final proxyThumbUrl = provider.apiService.getProxyMediaUrl(preview.thumbnail);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Media Header Info
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 100,
                    height: 100,
                    color: Colors.black12,
                    child: proxyThumbUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: proxyThumbUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                            errorWidget: (_, __, ___) => const Icon(Icons.broken_image_rounded, color: Colors.grey),
                          )
                        : const Icon(Icons.image_rounded, color: Colors.grey),
                  ),
                ),
                const SizedBox(width: 14),
                // Metadata
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          PlatformBadge(
                            platform: preview.platform,
                            platformName: preview.platformName,
                          ),
                          const Spacer(),
                          if (preview.durationStr.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                preview.durationStr,
                                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        preview.title.isNotEmpty ? preview.title : preview.shortcode,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '@${preview.author}',
                        style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Carousel Slide Picker
            if (preview.contentType == 'carousel' && preview.items.length > 1) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Pilih Slide Foto/Video (${provider.selectedIndices.length}/${preview.items.length}):',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  TextButton(
                    onPressed: () => provider.selectAllIndices(),
                    child: const Text('Pilih Semua', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              SizedBox(
                height: 70,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: preview.items.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (ctx, idx) {
                    final item = preview.items[idx];
                    final isSelected = provider.selectedIndices.contains(item.index);
                    final slideThumb = provider.apiService.getProxyMediaUrl(item.displayUrl);

                    return GestureDetector(
                      onTap: () => provider.toggleIndex(item.index),
                      child: Stack(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? AppTheme.primaryBlue : Colors.transparent,
                                width: 2.5,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: CachedNetworkImage(
                                imageUrl: slideThumb,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: isSelected ? AppTheme.primaryBlue : Colors.black45,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check, size: 12, color: Colors.white),
                            ),
                          ),
                          if (item.isVideo)
                            const Positioned(
                              bottom: 4,
                              left: 4,
                              child: Icon(Icons.videocam_rounded, size: 14, color: Colors.white),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],

            // Video / Audio Format Selector Chips
            if (preview.availableFormats.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text(
                'Pilih Kualitas Video / Audio:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: preview.availableFormats.map((fmt) {
                  final isSelected = (provider.selectedFormatId == fmt.id);
                  final isAudio = fmt.id == 'audio_mp3';

                  return ChoiceChip(
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isAudio) ...[
                          const Icon(Icons.music_note_rounded, size: 14, color: AppTheme.accentAmber),
                          const SizedBox(width: 4),
                        ],
                        Text(fmt.badge.isNotEmpty ? fmt.badge : fmt.label),
                      ],
                    ),
                    selected: isSelected,
                    selectedColor: isAudio ? AppTheme.accentAmber.withOpacity(0.2) : AppTheme.primaryBlue.withOpacity(0.2),
                    side: BorderSide(
                      color: isSelected
                          ? (isAudio ? AppTheme.accentAmber : AppTheme.primaryBlue)
                          : Colors.grey.withOpacity(0.3),
                      width: isSelected ? 1.5 : 1,
                    ),
                    onSelected: (selected) {
                      if (selected) provider.setSelectedFormat(fmt.id);
                    },
                  );
                }).toList(),
              ),
            ],

            // Active Download Progress Indicator
            if (provider.isDownloading) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primaryBlue.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          provider.downloadStatusText,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        IconButton(
                          icon: const Icon(Icons.cancel_rounded, size: 18, color: AppTheme.errorRed),
                          onPressed: () => provider.cancelDownload(),
                          tooltip: 'Batalkan',
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: provider.downloadProgress > 0 ? provider.downloadProgress : null,
                      backgroundColor: Colors.grey.withOpacity(0.2),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                      borderRadius: BorderRadius.circular(4),
                      minHeight: 6,
                    ),
                  ],
                ),
              ),
            ],

            // Action Buttons
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: provider.isDownloading
                        ? null
                        : () async {
                            try {
                              final dlService = context.read<DownloadService>();
                              final item = await provider.startDownload(downloadService: dlService);
                              if (item != null && mounted) {
                                context.read<VaultProvider>().loadItems();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Berhasil diunduh: ${item.title}'),
                                    backgroundColor: AppTheme.successGreen,
                                    action: SnackBarAction(
                                      label: 'Buka',
                                      textColor: Colors.white,
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (_) => MediaPlayerScreen(item: item)),
                                        );
                                      },
                                    ),
                                  ),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(e.toString().replaceAll('Exception: ', '')),
                                    backgroundColor: AppTheme.errorRed,
                                  ),
                                );
                              }
                            }
                          },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.phone_android_rounded, size: 18),
                        SizedBox(width: 8),
                        Text('Unduh ke HP', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.accentAmber,
                      side: const BorderSide(color: AppTheme.accentAmber),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: provider.isDownloading
                        ? null
                        : () async {
                            try {
                              final dlService = context.read<DownloadService>();
                              final item = await provider.startDownload(
                                downloadService: dlService,
                                overrideFormatId: 'audio_mp3',
                              );
                              if (item != null && mounted) {
                                context.read<VaultProvider>().loadItems();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Audio MP3 tersimpan: ${item.title}'),
                                    backgroundColor: AppTheme.successGreen,
                                  ),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(e.toString().replaceAll('Exception: ', '')),
                                    backgroundColor: AppTheme.errorRed,
                                  ),
                                );
                              }
                            }
                          },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.music_note_rounded, size: 18),
                        SizedBox(width: 4),
                        Text('Unduh MP3', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
