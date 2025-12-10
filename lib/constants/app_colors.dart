import 'package:flutter/material.dart';

class AppColors {
  // Primary colors - Dark theme with AI aesthetic
  static const Color primaryBackground = Color(0xFF0A0E27);
  static const Color secondaryBackground = Color(0xFF131929);
  static const Color cardBackground = Color(0xFF1A1F3A);

  // Accent colors - AI theme
  static const Color primaryAccent = Color(0xFF00D9FF); // Cyan
  static const Color secondaryAccent = Color(0xFF9D4EDD); // Purple
  static const Color tertiaryAccent = Color(0xFF10F3C8); // Neon Green
  static const Color accentOrange = Color(0xFFFF6B35); // Security accent

  // Text colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB8C1EC);
  static const Color textTertiary = Color(0xFF6B7694);
  static const Color textCode = Color(0xFF00D9FF);

  // Gradient colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryAccent, secondaryAccent],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF1A1F3A), Color(0xFF0F1525)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Skill bar gradients
  static const LinearGradient aiSkillGradient = LinearGradient(
    colors: [secondaryAccent, primaryAccent],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient securitySkillGradient = LinearGradient(
    colors: [accentOrange, Color(0xFFFF8C42)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient fullStackSkillGradient = LinearGradient(
    colors: [tertiaryAccent, primaryAccent],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}
