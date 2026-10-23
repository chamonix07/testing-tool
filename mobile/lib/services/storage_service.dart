import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/vault_item.dart';

class StorageService {
  static const String _keyBaseUrl = 'in_donlotin_base_url';
  static const String _keyDarkMode = 'in_donlotin_dark_mode';
  static const String _keyVault = 'in_donlotin_vault_items';
  static const String defaultUrl = 'https://testing-tool-two.vercel.app';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  // --- Base URL ---
  String getBaseUrl() {
    return _prefs.getString(_keyBaseUrl) ?? defaultUrl;
  }

  Future<void> setBaseUrl(String url) async {
    await _prefs.setString(_keyBaseUrl, url.trim());
  }

  // --- Dark Mode ---
  bool isDarkMode() {
    return _prefs.getBool(_keyDarkMode) ?? true;
  }

  Future<void> setDarkMode(bool isDark) async {
    await _prefs.setBool(_keyDarkMode, isDark);
  }

  // --- Vault Items ---
  List<VaultItem> getVaultItems() {
    final raw = _prefs.getString(_keyVault);
    if (raw == null || raw.isEmpty) return [];
    try {
      return VaultItem.decodeList(raw);
    } catch (_) {
      return [];
    }
  }

  Future<void> saveVaultItem(VaultItem item) async {
    final items = getVaultItems();
    items.removeWhere((x) => x.id == item.id || x.localFilePath == item.localFilePath);
    items.insert(0, item);
    await _prefs.setString(_keyVault, VaultItem.encodeList(items));
  }

  Future<void> deleteVaultItem(String id) async {
    final items = getVaultItems();
    final target = items.firstWhere((x) => x.id == id, orElse: () => items.first);
    if (target.id == id) {
      try {
        final f = File(target.localFilePath);
        if (await f.exists()) {
          await f.delete();
        }
      } catch (_) {}
      items.removeWhere((x) => x.id == id);
      await _prefs.setString(_keyVault, VaultItem.encodeList(items));
    }
  }

  Future<void> clearVault() async {
    final items = getVaultItems();
    for (final item in items) {
      try {
        final f = File(item.localFilePath);
        if (await f.exists()) {
          await f.delete();
        }
      } catch (_) {}
    }
    await _prefs.remove(_keyVault);
  }
}
