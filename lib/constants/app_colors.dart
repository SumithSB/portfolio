import 'package:flutter/material.dart';

class AppColors {
  // Dark Theme Colors - Professional dark theme for Backend/DevOps
  static const Color darkPrimaryBackground = Color(0xFF0D1117);
  static const Color darkSecondaryBackground = Color(0xFF161B22);
  static const Color darkCardBackground = Color(0xFF1C2128);
  static const Color darkTextPrimary = Color(0xFFC9D1D9);
  static const Color darkTextSecondary = Color(0xFF8B949E);
  static const Color darkTextTertiary = Color(0xFF6E7681);
  static const Color darkTextCode = Color(0xFF79C0FF);

  // Light Theme Colors - Professional light theme
  static const Color lightPrimaryBackground = Color(0xFFFFFFFF);
  static const Color lightSecondaryBackground = Color(0xFFF6F8FA);
  static const Color lightCardBackground = Color(0xFFFFFFFF);
  static const Color lightTextPrimary = Color(0xFF24292F);
  static const Color lightTextSecondary = Color(0xFF57606A);
  static const Color lightTextTertiary = Color(0xFF6E7781);
  static const Color lightTextCode = Color(0xFF0969DA);

  // Accent colors - Same for both themes
  static const Color primaryAccent = Color(0xFF58A6FF); // Professional blue
  static const Color secondaryAccent = Color(0xFF8B949E); // Muted gray-blue
  static const Color tertiaryAccent = Color(0xFF7EE787); // Success green
  static const Color accentOrange = Color(0xFFFF9C50); // Warning orange

  // Default to dark theme (backwards compatibility)
  static const Color primaryBackground = darkPrimaryBackground;
  static const Color secondaryBackground = darkSecondaryBackground;
  static const Color cardBackground = darkCardBackground;
  static const Color textPrimary = darkTextPrimary;
  static const Color textSecondary = darkTextSecondary;
  static const Color textTertiary = darkTextTertiary;
  static const Color textCode = darkTextCode;

  // Gradient colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryAccent, Color(0xFF79C0FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [cardBackground, Color(0xFF161B22)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient lightCardGradient = LinearGradient(
    colors: [lightCardBackground, Color(0xFFF6F8FA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Skill bar gradients
  static const LinearGradient aiSkillGradient = LinearGradient(
    colors: [Color(0xFF58A6FF), Color(0xFF79C0FF)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient securitySkillGradient = LinearGradient(
    colors: [accentOrange, Color(0xFFFFA657)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient fullStackSkillGradient = LinearGradient(
    colors: [tertiaryAccent, Color(0xFF56D364)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}
