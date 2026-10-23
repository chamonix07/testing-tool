import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/vault_item.dart';
import '../providers/vault_provider.dart';
import '../theme/app_theme.dart';
import 'media_player_screen.dart';

class VaultScreen extends StatelessWidget {
  const VaultScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final vault = context.watch<VaultProvider>();
    final items = vault.filteredItems;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Media Vault (Tersimpan)'),
        actions: [
          if (vault.items.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded),
              tooltip: 'Kosongkan Riwayat',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Kosongkan Vault?'),
                    content: const Text('Apakah Anda yakin ingin menghapus semua berkas riwayat unduhan di HP?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Batal'),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed, foregroundColor: Colors.white),
                        onPressed: () {
                          Navigator.pop(ctx);
                          vault.clearAll();
                        },
                        child: const Text('Hapus Semua'),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                TextField(
                  decoration: const InputDecoration(
                    hintText: 'Cari berkas tersimpan...',
                    prefixIcon: Icon(Icons.search_rounded),
                    isDense: true,
                  ),
                  onChanged: (val) => vault.setSearchQuery(val),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(context, 'all', 'Semua (${vault.items.length})'),
                      const SizedBox(width: 6),
                      _buildFilterChip(context, 'video', 'Video'),
                      const SizedBox(width: 6),
                      _buildFilterChip(context, 'audio', 'Audio MP3'),
                      const SizedBox(width: 6),
                      _buildFilterChip(context, 'image', 'Foto'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content List
          Expanded(
            child: items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.folder_open_rounded, size: 64, color: Colors.grey.withOpacity(0.5)),
                        const SizedBox(height: 12),
                        const Text(
                          'Belum ada media tersimpan.',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, idx) {
                      final item = items[idx];
                      return _buildVaultTile(context, item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, String filterKey, String label) {
    final vault = context.watch<VaultProvider>();
    final isSelected = vault.selectedFilter == filterKey;

    return ChoiceChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      selected: isSelected,
      selectedColor: AppTheme.primaryBlue.withOpacity(0.2),
      onSelected: (selected) {
        if (selected) vault.setFilter(filterKey);
      },
    );
  }

  Widget _buildVaultTile(BuildContext context, VaultItem item) {
    final hasThumb = item.thumbnailPath != null && item.thumbnailPath!.isNotEmpty;
    final file = File(item.localFilePath);

    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 55,
            height: 55,
            color: Colors.black12,
            child: hasThumb && File(item.thumbnailPath!).existsSync()
                ? Image.file(File(item.thumbnailPath!), fit: BoxFit.cover)
                : Icon(
                    item.fileType == 'audio' ? Icons.music_note_rounded : Icons.play_arrow_rounded,
                    color: item.fileType == 'audio' ? AppTheme.accentAmber : AppTheme.primaryBlue,
                    size: 30,
                  ),
          ),
        ),
        title: Text(
          item.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        subtitle: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue.withOpacity(0.12),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                item.formatBadge,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
              ),
            ),
            const SizedBox(width: 8),
            Text(item.formattedSize, style: const TextStyle(fontSize: 11)),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.share_rounded, size: 20),
              tooltip: 'Bagikan',
              onPressed: () {
                Share.shareXFiles([XFile(item.localFilePath)], text: item.title);
              },
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 20, color: AppTheme.errorRed),
              tooltip: 'Hapus',
              onPressed: () {
                context.read<VaultProvider>().deleteItem(item.id);
              },
            ),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => MediaPlayerScreen(item: item)),
          );
        },
      ),
    );
  }
}
