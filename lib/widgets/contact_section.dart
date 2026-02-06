import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class ContactSection extends StatefulWidget {
  const ContactSection({super.key});

  @override
  State<ContactSection> createState() => _ContactSectionState();
}

class _ContactSectionState extends State<ContactSection> {
  bool _emailCopied = false;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
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
              ? AppColors.darkSecondaryBackground
              : AppColors.lightSecondaryBackground,
      child: Column(
        children: [
          Text(
            '<CONTACT/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Let's Connect",
            style: GoogleFonts.inter(
              fontSize: isMobile ? 26 : 44,
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: isMobile ? double.infinity : 700,
            child: Text(
              'Open to Backend Engineer, Platform Engineer, Security Automation, and AI Systems roles in the UK with visa sponsorship. '
              'Looking for opportunities where I can architect scalable systems and ship production-grade code.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: isMobile ? 14 : 16,
                color:
                    isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                height: 1.6,
              ),
            ),
          ),
          SizedBox(height: isMobile ? 32 : 48),
          _buildLetsTalkSection(isMobile, isDark),
          SizedBox(height: isMobile ? 32 : 48),
          _buildContactCards(isMobile, isDark),
        ],
      ),
    );
  }

  Widget _buildLetsTalkSection(bool isMobile, bool isDark) {
    return Container(
      width: isMobile ? double.infinity : 800,
      padding: EdgeInsets.all(isMobile ? 32 : 48),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryAccent.withValues(alpha: 0.05),
            AppColors.tertiaryAccent.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.primaryAccent.withValues(alpha: 0.2),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryAccent.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.chat_bubble_outline,
              size: 40,
              color: AppColors.primaryAccent,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            "Let's Talk",
            style: GoogleFonts.inter(
              fontSize: isMobile ? 28 : 36,
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: isMobile ? double.infinity : 600,
            child: Text(
              'Have an engineering challenge that requires scalable infrastructure, AI systems, or security automation? '
              'Let\'s discuss how I can add value to your team.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: isMobile ? 14 : 16,
                color:
                    isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                height: 1.6,
              ),
            ),
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.center,
            children: [
              Semantics(
                label: _emailCopied ? 'Email copied to clipboard' : 'Copy email address',
                button: true,
                child: _AnimatedContactButton(
                  icon: Icons.email_outlined,
                  label: _emailCopied ? 'Email Copied!' : 'Copy Email',
                  isPrimary: true,
                  onTap: () async {
                  await Clipboard.setData(
                    const ClipboardData(text: 'sumithsbhandari@gmail.com'),
                  );
                  setState(() => _emailCopied = true);
                  Future.delayed(const Duration(seconds: 2), () {
                    if (mounted) setState(() => _emailCopied = false);
                  });
                },
              ),
              ),
              _AnimatedContactButton(
                icon: FontAwesomeIcons.linkedin,
                label: 'LinkedIn',
                isPrimary: false,
                onTap:
                    () => _launchURL(
                      'https://www.linkedin.com/in/sumith-sadanand-bhandari-006224194/',
                    ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color:
                  isDark
                      ? AppColors.darkCardBackground
                      : AppColors.lightCardBackground,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.tertiaryAccent.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.email_outlined,
                  size: 16,
                  color:
                      isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  'sumithsbhandari@gmail.com',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: isMobile ? 12 : 14,
                    color:
                        isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCards(bool isMobile, bool isDark) {
    return Column(
      children: [
        Text(
          'Connect with me',
          style: GoogleFonts.inter(
            fontSize: isMobile ? 20 : 24,
            fontWeight: FontWeight.bold,
            color:
                isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
          ),
        ),
        const SizedBox(height: 32),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          alignment: WrapAlignment.center,
          children: [
            _SocialButton(
              icon: FontAwesomeIcons.linkedin,
              label: 'LinkedIn',
              url: 'https://www.linkedin.com/in/sumith-sadanand-bhandari-006224194/',
            ),
            _SocialButton(
              icon: FontAwesomeIcons.github,
              label: 'GitHub',
              url: 'https://github.com/SumithSB',
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _launchURL(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      // Ignore launch failures (e.g. unsupported context)
    }
  }
}

// Animated Contact Button Widget
class _AnimatedContactButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool isPrimary;
  final VoidCallback onTap;

  const _AnimatedContactButton({
    required this.icon,
    required this.label,
    required this.isPrimary,
    required this.onTap,
  });

  @override
  State<_AnimatedContactButton> createState() => _AnimatedContactButtonState();
}

class _AnimatedContactButtonState extends State<_AnimatedContactButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MouseRegion(
      onEnter: (_) {
        setState(() => _isHovered = true);
        _controller.forward();
      },
      onExit: (_) {
        setState(() => _isHovered = false);
        _controller.reverse();
      },
      child: ScaleTransition(
        scale: _scaleAnimation,
        child:
            widget.isPrimary
                ? ElevatedButton.icon(
                  onPressed: widget.onTap,
                  icon: Icon(widget.icon, size: 20),
                  label: Text(
                    widget.label,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _isHovered
                            ? AppColors.primaryAccent.withValues(alpha: 0.9)
                            : AppColors.primaryAccent,
                    foregroundColor:
                        isDark
                            ? AppColors.darkPrimaryBackground
                            : AppColors.lightPrimaryBackground,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 18,
                    ),
                    elevation: _isHovered ? 8 : 0,
                    shadowColor: AppColors.primaryAccent.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                )
                : OutlinedButton.icon(
                  onPressed: widget.onTap,
                  icon: Icon(widget.icon, size: 20),
                  label: Text(
                    widget.label,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor:
                        _isHovered
                            ? (isDark
                                ? AppColors.darkTextPrimary
                                : AppColors.lightTextPrimary)
                            : AppColors.primaryAccent,
                    side: BorderSide(
                      color:
                          _isHovered
                              ? (isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary)
                              : AppColors.primaryAccent,
                      width: 1.5,
                    ),
                    backgroundColor:
                        _isHovered
                            ? AppColors.primaryAccent.withValues(alpha: 0.1)
                            : Colors.transparent,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 18,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
      ),
    );
  }
}

// Social Button Widget
class _SocialButton extends StatefulWidget {
  final IconData icon;
  final String label;
  final String url;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.url,
  });

  @override
  State<_SocialButton> createState() => _SocialButtonState();
}

class _SocialButtonState extends State<_SocialButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: () => _launchURL(widget.url),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
            color:
                _isHovered
                    ? AppColors.primaryAccent.withValues(alpha: 0.15)
                    : (isDark
                        ? AppColors.darkCardBackground
                        : AppColors.lightCardBackground),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color:
                  _isHovered
                      ? AppColors.primaryAccent
                      : AppColors.primaryAccent.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                widget.icon,
                size: 16,
                color:
                    _isHovered
                        ? AppColors.primaryAccent
                        : (isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary),
              ),
              const SizedBox(width: 8),
              Text(
                widget.label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color:
                      _isHovered
                          ? AppColors.primaryAccent
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _launchURL(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      // Ignore launch failures
    }
  }
}
