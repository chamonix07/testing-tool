import 'dart:io';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:photo_view/photo_view.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import '../models/vault_item.dart';
import '../theme/app_theme.dart';

class MediaPlayerScreen extends StatefulWidget {
  final VaultItem item;

  const MediaPlayerScreen({Key? key, required this.item}) : super(key: key);

  @override
  State<MediaPlayerScreen> createState() => _MediaPlayerScreenState();
}

class _MediaPlayerScreenState extends State<MediaPlayerScreen> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoadingMedia = true;
  String? _errorLoading;

  @override
  void initState() {
    super.initState();
    _initMedia();
  }

  Future<void> _initMedia() async {
    final file = File(widget.item.localFilePath);
    if (!await file.exists()) {
      setState(() {
        _isLoadingMedia = false;
        _errorLoading = 'Berkas media tidak ditemukan di penyimpanan: ${widget.item.localFilePath}';
      });
      return;
    }

    if (widget.item.fileType == 'video' || widget.item.fileType == 'audio') {
      try {
        _videoPlayerController = VideoPlayerController.file(file);
        await _videoPlayerController!.initialize();

        _chewieController = ChewieController(
          videoPlayerController: _videoPlayerController!,
          autoPlay: true,
          looping: false,
          aspectRatio: _videoPlayerController!.value.aspectRatio > 0
              ? _videoPlayerController!.value.aspectRatio
              : 16 / 9,
          allowFullScreen: true,
          allowMuting: true,
          showControls: true,
          materialProgressColors: ChewieProgressColors(
            playedColor: AppTheme.primaryBlue,
            handleColor: AppTheme.primaryBlue,
            backgroundColor: Colors.grey,
            bufferedColor: Colors.white24,
          ),
        );
      } catch (e) {
        _errorLoading = 'Gagal memutar media: $e';
      }
    }

    if (mounted) {
      setState(() {
        _isLoadingMedia = false;
      });
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoPlayerController?.dispose();
    super.dispose();
  }

  void _shareMedia() {
    Share.shareXFiles(
      [XFile(widget.item.localFilePath)],
      text: widget.item.title,
    );
  }

  void _openInExternalApp() {
    OpenFilex.open(widget.item.localFilePath);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new_rounded),
            tooltip: 'Buka di Aplikasi Lain',
            onPressed: _openInExternalApp,
          ),
          IconButton(
            icon: const Icon(Icons.share_rounded),
            tooltip: 'Bagikan',
            onPressed: _shareMedia,
          ),
        ],
      ),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoadingMedia) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorLoading != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppTheme.errorRed, size: 48),
              const SizedBox(height: 12),
              Text(_errorLoading!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.folder_open_rounded),
                label: const Text('Buka via File Manager'),
                onPressed: _openInExternalApp,
              ),
            ],
          ),
        ),
      );
    }

    if (widget.item.fileType == 'image') {
      return PhotoView(
        imageProvider: FileImage(File(widget.item.localFilePath)),
        minScale: PhotoViewComputedScale.contained,
        maxScale: PhotoViewComputedScale.covered * 3,
      );
    }

    if (_chewieController != null && _videoPlayerController!.value.isInitialized) {
      return Center(
        child: AspectRatio(
          aspectRatio: _videoPlayerController!.value.aspectRatio > 0
              ? _videoPlayerController!.value.aspectRatio
              : 16 / 9,
          child: Chewie(controller: _chewieController!),
        ),
      );
    }

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.file_present_rounded, size: 64, color: AppTheme.primaryBlue),
          const SizedBox(height: 12),
          Text(widget.item.title, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(widget.item.formattedSize, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.open_in_new_rounded),
            label: const Text('Buka Berkas'),
            onPressed: _openInExternalApp,
          ),
        ],
      ),
    );
  }
}
