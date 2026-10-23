import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class SettingsProvider with ChangeNotifier {
  final StorageService storageService;
  final ApiService apiService;

  late String _baseUrl;
  late bool _isDarkMode;
  bool _isTesting = false;
  bool? _connectionSuccess;

  SettingsProvider({
    required this.storageService,
    required this.apiService,
  }) {
    _baseUrl = storageService.getBaseUrl();
    _isDarkMode = storageService.isDarkMode();
    apiService.updateBaseUrl(_baseUrl);
  }

  String get baseUrl => _baseUrl;
  bool get isDarkMode => _isDarkMode;
  bool get isTesting => _isTesting;
  bool? get connectionSuccess => _connectionSuccess;

  Future<void> setBaseUrl(String newUrl) async {
    _baseUrl = newUrl.trim();
    await storageService.setBaseUrl(_baseUrl);
    apiService.updateBaseUrl(_baseUrl);
    _connectionSuccess = null;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    await storageService.setDarkMode(_isDarkMode);
    notifyListeners();
  }

  Future<bool> testConnection() async {
    _isTesting = true;
    _connectionSuccess = null;
    notifyListeners();

    final result = await apiService.testConnection();
    _isTesting = false;
    _connectionSuccess = result;
    notifyListeners();
    return result;
  }
}
