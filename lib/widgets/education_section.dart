import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class EducationSection extends StatelessWidget {
  const EducationSection({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
    final isTablet = LayoutConstants.isTablet(screenWidth);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final horizontalPadding = LayoutConstants.horizontalPadding(screenWidth);
    final verticalPadding = LayoutConstants.verticalPadding(screenWidth);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      color:
          isDark
              ? AppColors.darkPrimaryBackground
              : AppColors.lightPrimaryBackground,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '<EDUCATION/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Education & Achievements',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 26 : (isTablet ? 36 : 44),
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Academic background and recognition',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          SizedBox(height: isMobile ? 40 : 56),

          // Education — two main cards
          Text(
            'Education',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
            ),
          ),
          SizedBox(height: isMobile ? 16 : 20),
          isMobile
              ? Column(
                children: [
                  _EducationCard(
                    institution: 'University of Leicester',
                    degree: 'MSc Advanced Computer Science',
                    detail: 'Dissertation: AI-Powered Fashion Recommendation System using LLMs & Vector Databases',
                    period: 'Jan 2025 – Jul 2026',
                    isDark: isDark,
                    icon: FontAwesomeIcons.buildingColumns,
                    accentColor: AppColors.primaryAccent,
                  ),
                  SizedBox(height: LayoutConstants.gridSpacing(screenWidth)),
                  _EducationCard(
                    institution: 'Ramaiah Institute of Technology',
                    degree: 'B.E. Information Science & Engineering',
                    detail: 'CGPA 8.49/10',
                    period: 'Aug 2018 – Jul 2022',
                    isDark: isDark,
                    icon: FontAwesomeIcons.graduationCap,
                    accentColor: AppColors.tertiaryAccent,
                  ),
                ],
              )
              : IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: _EducationCard(
                        institution: 'University of Leicester',
                        degree: 'MSc Advanced Computer Science',
                        detail: 'Dissertation: AI-Powered Fashion Recommendation System using LLMs & Vector Databases',
                        period: 'Jan 2025 – Jul 2026',
                        isDark: isDark,
                        icon: FontAwesomeIcons.buildingColumns,
                        accentColor: AppColors.primaryAccent,
                      ),
                    ),
                    SizedBox(width: LayoutConstants.gridSpacing(screenWidth)),
                    Expanded(
                      child: _EducationCard(
                        institution: 'Ramaiah Institute of Technology',
                        degree: 'B.E. Information Science & Engineering',
                        detail: 'CGPA 8.49/10',
                        period: 'Aug 2018 – Jul 2022',
                        isDark: isDark,
                        icon: FontAwesomeIcons.graduationCap,
                        accentColor: AppColors.tertiaryAccent,
                      ),
                    ),
                  ],
                ),
              ),

          SizedBox(height: isMobile ? 48 : 56),

          // Achievements — horizontal row of compact cards
          Text(
            'Achievements',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
            ),
          ),
          SizedBox(height: isMobile ? 16 : 20),
          isMobile
              ? Column(
                children: [
                  _AchievementCard(
                    title: 'hackCOVID by HackerEarth',
                    subtitle: 'First place among 4,500+ teams',
                    isDark: isDark,
                    icon: FontAwesomeIcons.trophy,
                    year: '2020',
                  ),
                  const SizedBox(height: 12),
                  _AchievementCard(
                    title: 'OneHack 2020',
                    subtitle: 'Team India international representation',
                    isDark: isDark,
                    icon: FontAwesomeIcons.medal,
                    year: '2020',
                  ),
                  const SizedBox(height: 12),
                  _AchievementCard(
                    title: 'Student Advisory Board',
                    subtitle: 'Ramaiah Institute of Technology',
                    isDark: isDark,
                    icon: FontAwesomeIcons.userTie,
                    year: null,
                  ),
                ],
              )
              : IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: _AchievementCard(
                        title: 'hackCOVID by HackerEarth',
                        subtitle: 'First place among 4,500+ teams',
                        isDark: isDark,
                        icon: FontAwesomeIcons.trophy,
                        year: '2020',
                      ),
                    ),
                    SizedBox(width: LayoutConstants.gridSpacing(screenWidth)),
                    Expanded(
                      child: _AchievementCard(
                        title: 'OneHack 2020',
                        subtitle: 'Team India international representation',
                        isDark: isDark,
                        icon: FontAwesomeIcons.medal,
                        year: '2020',
                      ),
                    ),
                    SizedBox(width: LayoutConstants.gridSpacing(screenWidth)),
                    Expanded(
                      child: _AchievementCard(
                        title: 'Student Advisory Board',
                        subtitle: 'Ramaiah Institute of Technology',
                        isDark: isDark,
                        icon: FontAwesomeIcons.userTie,
                        year: null,
                      ),
                    ),
                  ],
                ),
              ),

          SizedBox(height: isMobile ? 40 : 48),

          // Certifications — subtle divider and pills
          Divider(
            height: 1,
            color: (isDark
                    ? AppColors.darkTextTertiary
                    : AppColors.lightTextTertiary)
                .withValues(alpha: 0.3),
          ),
          SizedBox(height: isMobile ? 24 : 32),
          Text(
            'Certifications',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _CertChip(
                label: 'Mobile app development internship',
                isDark: isDark,
              ),
              _CertChip(label: 'Python (Basics)', isDark: isDark),
            ],
          ),
        ],
      ),
    );
  }
}

class _EducationCard extends StatelessWidget {
  final String institution;
  final String degree;
  final String detail;
  final String period;
  final bool isDark;
  final IconData icon;
  final Color accentColor;

  const _EducationCard({
    required this.institution,
    required this.degree,
    required this.detail,
    required this.period,
    required this.isDark,
    required this.icon,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: accentColor.withValues(alpha: 0.25),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: accentColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  period,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    color:
                        isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            institution,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            degree,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            detail,
            style: GoogleFonts.inter(
              fontSize: 13,
              color:
                  isDark
                      ? AppColors.darkTextTertiary
                      : AppColors.lightTextTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

class _AchievementCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isDark;
  final IconData icon;
  final String? year;

  const _AchievementCard({
    required this.title,
    required this.subtitle,
    required this.isDark,
    required this.icon,
    this.year,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.accentOrange.withValues(alpha: 0.2),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.accentOrange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.accentOrange, size: 20),
              ),
              if (year != null) ...[
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color:
                        (isDark
                            ? AppColors.darkSecondaryBackground
                            : AppColors.lightSecondaryBackground),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    year!,
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 11,
                      color:
                          isDark
                              ? AppColors.darkTextTertiary
                              : AppColors.lightTextTertiary,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 13,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _CertChip extends StatelessWidget {
  final String label;
  final bool isDark;

  const _CertChip({required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primaryAccent.withValues(alpha: 0.25),
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 14,
          color:
              isDark
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
        ),
      ),
    );
  }
}
