import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/vault_provider.dart';
import '../theme/app_theme.dart';
import 'batch_downloader_screen.dart';
import 'settings_screen.dart';
import 'single_downloader_screen.dart';
import 'vault_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    SingleDownloaderScreen(),
    BatchDownloaderScreen(),
    VaultScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final vault = context.watch<VaultProvider>();
    final savedCount = vault.items.length;

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        indicatorColor: AppTheme.primaryBlue.withOpacity(0.2),
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.download_outlined),
            selectedIcon: Icon(Icons.download_rounded, color: AppTheme.primaryBlue),
            label: 'Unduh',
          ),
          const NavigationDestination(
            icon: Icon(Icons.playlist_play_outlined),
            selectedIcon: Icon(Icons.playlist_play_rounded, color: AppTheme.primaryBlue),
            label: 'Batch',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: savedCount > 0,
              label: Text('$savedCount'),
              child: const Icon(Icons.folder_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: savedCount > 0,
              label: Text('$savedCount'),
              child: const Icon(Icons.folder_rounded, color: AppTheme.primaryBlue),
            ),
            label: 'Vault',
          ),
          const NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings_rounded, color: AppTheme.primaryBlue),
            label: 'Pengaturan',
          ),
        ],
      ),
    );
  }
}
