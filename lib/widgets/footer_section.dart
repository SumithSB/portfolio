import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class FooterSection extends StatelessWidget {
  final void Function(String section) onNavigate;

  const FooterSection({super.key, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final horizontalPadding = LayoutConstants.horizontalPadding(screenWidth);
    final verticalPadding = LayoutConstants.verticalPadding(screenWidth) * 0.6;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
        border: Border(
          top: BorderSide(
            color: AppColors.primaryAccent.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Column(
        children: [
          if (!isMobile)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _FooterLink(
                  label: 'About',
                  onTap: () => onNavigate('About'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Skills',
                  onTap: () => onNavigate('Skills'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Projects',
                  onTap: () => onNavigate('Projects'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Experience',
                  onTap: () => onNavigate('Experience'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Education',
                  onTap: () => onNavigate('Education'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Blog',
                  onTap: () => onNavigate('Blog'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Contact',
                  onTap: () => onNavigate('Contact'),
                  isDark: isDark,
                ),
              ],
            )
          else
            Wrap(
              alignment: WrapAlignment.center,
              spacing: 16,
              runSpacing: 8,
              children: [
                _FooterLink(
                  label: 'About',
                  onTap: () => onNavigate('About'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Skills',
                  onTap: () => onNavigate('Skills'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Projects',
                  onTap: () => onNavigate('Projects'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Experience',
                  onTap: () => onNavigate('Experience'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Education',
                  onTap: () => onNavigate('Education'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Blog',
                  onTap: () => onNavigate('Blog'),
                  isDark: isDark,
                ),
                _FooterLink(
                  label: 'Contact',
                  onTap: () => onNavigate('Contact'),
                  isDark: isDark,
                ),
              ],
            ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _SocialIcon(
                icon: FontAwesomeIcons.linkedin,
                url:
                    'https://www.linkedin.com/in/sumith-sadanand-bhandari-006224194/',
                isDark: isDark,
              ),
              const SizedBox(width: 16),
              _SocialIcon(
                icon: FontAwesomeIcons.github,
                url: 'https://github.com/SumithSB',
                isDark: isDark,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Built with Flutter · Crafted with Claude & Cursor',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontStyle: FontStyle.italic,
              color:
                  isDark
                      ? AppColors.darkTextTertiary
                      : AppColors.lightTextTertiary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '© ${DateTime.now().year} Sumith Bhandari. All rights reserved.',
            style: GoogleFonts.inter(
              fontSize: 12,
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

class _FooterLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool isDark;

  const _FooterLink({
    required this.label,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: GestureDetector(
        onTap: onTap,
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
      ),
    );
  }
}

class _SocialIcon extends StatelessWidget {
  final IconData icon;
  final String url;
  final bool isDark;

  const _SocialIcon({
    required this.icon,
    required this.url,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        try {
          final uri = Uri.parse(url);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        } catch (_) {}
      },
      child: Icon(
        icon,
        size: 20,
        color:
            isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
      ),
    );
  }
}
