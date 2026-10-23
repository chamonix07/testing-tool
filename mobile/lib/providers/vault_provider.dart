import 'package:flutter/material.dart';
import '../models/vault_item.dart';
import '../services/storage_service.dart';

class VaultProvider with ChangeNotifier {
  final StorageService storageService;

  List<VaultItem> _items = [];
  String _searchQuery = '';
  String _selectedFilter = 'all'; // 'all', 'video', 'audio', 'image'

  VaultProvider({required this.storageService}) {
    loadItems();
  }

  List<VaultItem> get items => _items;
  String get searchQuery => _searchQuery;
  String get selectedFilter => _selectedFilter;

  List<VaultItem> get filteredItems {
    return _items.where((item) {
      final matchesSearch = _searchQuery.isEmpty ||
          item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.author.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.platform.toLowerCase().contains(_searchQuery.toLowerCase());

      final matchesFilter = _selectedFilter == 'all' || item.fileType == _selectedFilter;
      return matchesSearch && matchesFilter;
    }).toList();
  }

  void loadItems() {
    _items = storageService.getVaultItems();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setFilter(String filter) {
    _selectedFilter = filter;
    notifyListeners();
  }

  Future<void> deleteItem(String id) async {
    await storageService.deleteVaultItem(id);
    loadItems();
  }

  Future<void> clearAll() async {
    await storageService.clearVault();
    loadItems();
  }
}
