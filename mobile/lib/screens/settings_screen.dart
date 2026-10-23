import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;

  @override
  void initState() {
    super.initState();
    final settings = context.read<SettingsProvider>();
    _urlController = TextEditingController(text: settings.baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengaturan'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Server Base URL Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.dns_rounded, color: AppTheme.primaryBlue, size: 20),
                      SizedBox(width: 8),
                      Text('Alamat Server Backend', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Pilih server cloud Vercel/Railway atau masukkan alamat IP komputer Anda jika menjalankan server secara lokal di jaringan Wi-Fi rumah.',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      labelText: 'Server Base URL',
                      hintText: 'https://your-domain.vercel.app',
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBlue,
                          foregroundColor: Colors.white,
                        ),
                        icon: const Icon(Icons.save_rounded, size: 16),
                        label: const Text('Simpan'),
                        onPressed: () {
                          settings.setBaseUrl(_urlController.text);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Alamat server berhasil disimpan.')),
                          );
                        },
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton.icon(
                        icon: settings.isTesting
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.network_check_rounded, size: 16),
                        label: const Text('Tes Koneksi'),
                        onPressed: settings.isTesting
                            ? null
                            : () async {
                                final ok = await settings.testConnection();
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(ok ? 'Koneksi ke server Berhasil!' : 'Gagal terhubung ke server.'),
                                      backgroundColor: ok ? AppTheme.successGreen : AppTheme.errorRed,
                                    ),
                                  );
                                }
                              },
                      ),
                    ],
                  ),
                  if (settings.connectionSuccess != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: (settings.connectionSuccess == true ? AppTheme.successGreen : AppTheme.errorRed).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            settings.connectionSuccess == true ? Icons.check_circle_rounded : Icons.error_rounded,
                            size: 16,
                            color: settings.connectionSuccess == true ? AppTheme.successGreen : AppTheme.errorRed,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            settings.connectionSuccess == true ? 'Server Terhubung Online' : 'Koneksi Server Gagal',
                            style: TextStyle(
                              color: settings.connectionSuccess == true ? AppTheme.successGreen : AppTheme.errorRed,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Presets Card
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.cloud_rounded, color: AppTheme.secondaryCyan),
                  title: const Text('Preset Cloud (Vercel)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('https://testing-tool-two.vercel.app', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: () {
                    _urlController.text = 'https://testing-tool-two.vercel.app';
                    settings.setBaseUrl(_urlController.text);
                    settings.testConnection();
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.wifi_rounded, color: AppTheme.accentAmber),
                  title: const Text('Preset Wi-Fi Lokal (Contoh)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  subtitle: const Text('http://192.168.1.15:8000', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: () {
                    _urlController.text = 'http://192.168.1.15:8000';
                    settings.setBaseUrl(_urlController.text);
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Appearance Card
          Card(
            child: SwitchListTile(
              secondary: const Icon(Icons.dark_mode_rounded, color: AppTheme.primaryIndigo),
              title: const Text('Mode Gelap (Dark Mode)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text('Tema gelap menghemat baterai & nyaman di mata', style: TextStyle(fontSize: 12)),
              value: settings.isDarkMode,
              onChanged: (_) => settings.toggleTheme(),
            ),
          ),

          const SizedBox(height: 24),
          const Center(
            child: Column(
              children: [
                Text('IN DONLOTiN Mobile v1.0.0', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey, fontSize: 12)),
                SizedBox(height: 4),
                Text('Universal Media Downloader Client', style: TextStyle(color: Colors.grey, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
