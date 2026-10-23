import 'package:flutter/material.dart';

class PlatformBadge extends StatelessWidget {
  final String platform;
  final String platformName;

  const PlatformBadge({
    Key? key,
    required this.platform,
    required this.platformName,
  }) : super(key: key);

  Color get _badgeColor {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return const Color(0xFFE1306C);
      case 'youtube':
        return const Color(0xFFFF0000);
      case 'twitter':
      case 'x':
        return const Color(0xFF1DA1F2);
      case 'tiktok':
        return const Color(0xFF00F2FE);
      case 'pinterest':
        return const Color(0xFFE60023);
      case 'threads':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  IconData get _badgeIcon {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return Icons.camera_alt_outlined;
      case 'youtube':
        return Icons.play_arrow_rounded;
      case 'twitter':
      case 'x':
        return Icons.tag_rounded;
      case 'tiktok':
        return Icons.music_note_rounded;
      case 'pinterest':
        return Icons.push_pin_outlined;
      case 'threads':
        return Icons.alternate_email_rounded;
      default:
        return Icons.language_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _badgeColor.withOpacity(0.18),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _badgeColor.withOpacity(0.4), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_badgeIcon, size: 14, color: _badgeColor),
          const SizedBox(width: 4),
          Text(
            platformName,
            style: TextStyle(
              color: _badgeColor,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
