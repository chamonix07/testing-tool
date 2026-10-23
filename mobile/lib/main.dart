import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/preview_provider.dart';
import 'providers/settings_provider.dart';
import 'providers/vault_provider.dart';
import 'screens/main_screen.dart';
import 'services/api_service.dart';
import 'services/download_service.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize persistent storage
  final storageService = await StorageService.init();
  final apiService = ApiService(baseUrl: storageService.getBaseUrl());
  final downloadService = DownloadService(
    apiService: apiService,
    storageService: storageService,
  );

  runApp(
    MultiProvider(
      providers: [
        Provider<StorageService>.value(value: storageService),
        Provider<ApiService>.value(value: apiService),
        Provider<DownloadService>.value(value: downloadService),
        ChangeNotifierProvider<SettingsProvider>(
          create: (_) => SettingsProvider(
            storageService: storageService,
            apiService: apiService,
          ),
        ),
        ChangeNotifierProvider<VaultProvider>(
          create: (_) => VaultProvider(storageService: storageService),
        ),
        ChangeNotifierProvider<PreviewProvider>(
          create: (_) => PreviewProvider(apiService: apiService),
        ),
      ],
      child: const InDonlotinApp(),
    ),
  );
}

class InDonlotinApp extends StatelessWidget {
  const InDonlotinApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();

    return MaterialApp(
      title: 'IN DONLOTiN',
      debugShowCheckedModeBanner: false,
      themeMode: settings.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      home: const MainScreen(),
    );
  }
}
