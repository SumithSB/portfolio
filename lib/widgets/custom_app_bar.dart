import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class CustomAppBar extends StatefulWidget {
  final Function(String) onNavigate;

  const CustomAppBar({super.key, required this.onNavigate});

  @override
  State<CustomAppBar> createState() => _CustomAppBarState();
}

class _CustomAppBarState extends State<CustomAppBar>
    with SingleTickerProviderStateMixin {
  bool _isMenuOpen = false;
  late AnimationController _menuController;
  late Animation<double> _menuAnimation;

  @override
  void initState() {
    super.initState();
    _menuController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _menuAnimation = CurvedAnimation(
      parent: _menuController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _menuController.dispose();
    super.dispose();
  }

  void _toggleMenu() {
    setState(() {
      _isMenuOpen = !_isMenuOpen;
      if (_isMenuOpen) {
        _menuController.forward();
      } else {
        _menuController.reverse();
      }
    });
  }

  void _closeMenu() {
    if (_isMenuOpen) {
      setState(() => _isMenuOpen = false);
      _menuController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final horizontalPadding = LayoutConstants.horizontalPadding(screenWidth);

    return Stack(
      children: [
        // Fill stack so overlay/drawer are visible below app bar
        SizedBox.expand(),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 80,
            padding: EdgeInsets.symmetric(
              horizontal: horizontalPadding,
              vertical: 16,
            ),
            decoration: BoxDecoration(
              color:
                  isDark
                      ? AppColors.darkPrimaryBackground.withValues(alpha: 0.98)
                      : AppColors.lightPrimaryBackground.withValues(
                        alpha: 0.98,
                      ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          'S',
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    if (!isMobile) ...[
                      const SizedBox(width: 12),
                      Text(
                        'Sumith Bhandari',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color:
                              isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary,
                        ),
                      ),
                    ],
                  ],
                ),
                if (!isMobile)
                  Row(
                    children: [
                      _NavItem(
                        label: 'About',
                        onTap: () => widget.onNavigate('About'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Skills',
                        onTap: () => widget.onNavigate('Skills'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Projects',
                        onTap: () => widget.onNavigate('Projects'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Experience',
                        onTap: () => widget.onNavigate('Experience'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Education',
                        onTap: () => widget.onNavigate('Education'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Blog',
                        onTap: () => widget.onNavigate('Blog'),
                        isDark: isDark,
                      ),
                      _NavItem(
                        label: 'Contact',
                        onTap: () => widget.onNavigate('Contact'),
                        isDark: isDark,
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () => widget.onNavigate('Contact'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryAccent,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                        child: Text(
                          "Let's Talk",
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  )
                else
                  IconButton(
                    icon: Icon(
                      _isMenuOpen ? Icons.close : Icons.menu,
                      color:
                          isDark
                              ? AppColors.darkTextPrimary
                              : AppColors.lightTextPrimary,
                    ),
                    onPressed: _toggleMenu,
                  ),
              ],
            ),
          ),
        ),
        if (isMobile)
          AnimatedBuilder(
            animation: _menuAnimation,
            builder: (context, child) {
              return _menuAnimation.value > 0
                  ? Positioned(
                    top: 80,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: GestureDetector(
                      onTap: _closeMenu,
                      child: Container(
                        color: Colors.black.withValues(
                          alpha: 0.5 * _menuAnimation.value,
                        ),
                      ),
                    ),
                  )
                  : const SizedBox.shrink();
            },
          ),
        if (isMobile)
          AnimatedBuilder(
            animation: _menuAnimation,
            builder: (context, child) {
              return Positioned(
                top: 80,
                right: 0,
                child: Transform.translate(
                  offset: Offset(300 * (1 - _menuAnimation.value), 0),
                  child: Opacity(
                    opacity: _menuAnimation.value,
                    child: _MobileDrawer(
                      isDark: isDark,
                      onNavigate: (section) {
                        _closeMenu();
                        widget.onNavigate(section);
                      },
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _NavItem extends StatefulWidget {
  final String label;
  final VoidCallback onTap;
  final bool isDark;

  const _NavItem({
    required this.label,
    required this.onTap,
    required this.isDark,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem>
    with SingleTickerProviderStateMixin {
  bool isHovered = false;
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 180),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.08,
    ).animate(CurvedAnimation(parent: _scaleController, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) {
        setState(() => isHovered = true);
        _scaleController.forward();
      },
      onExit: (_) {
        setState(() => isHovered = false);
        _scaleController.reverse();
      },
      child: GestureDetector(
        onTap: widget.onTap,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color:
                        isHovered
                            ? AppColors.primaryAccent
                            : (widget.isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary),
                  ),
                ),
                const SizedBox(height: 4),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 2,
                  width: isHovered ? 20 : 0,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MobileDrawer extends StatelessWidget {
  final bool isDark;
  final Function(String) onNavigate;

  const _MobileDrawer({required this.isDark, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final navItems = [
      'About',
      'Skills',
      'Projects',
      'Experience',
      'Education',
      'Blog',
      'Contact',
    ];

    return Container(
      width: 280,
      height: MediaQuery.of(context).size.height - 80,
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(-5, 0),
          ),
        ],
      ),
      child: Column(
        children: [
          const SizedBox(height: 24),
          ...navItems.map(
            (item) => _MobileNavItem(
              label: item,
              onTap: () => onNavigate(item),
              isDark: isDark,
            ),
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Text(
                  'Connect',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color:
                        isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _SocialIconButton(
                      icon: FontAwesomeIcons.linkedin,
                      url:
                          'https://www.linkedin.com/in/sumith-sadanand-bhandari-006224194/',
                      isDark: isDark,
                    ),
                    const SizedBox(width: 16),
                    _SocialIconButton(
                      icon: FontAwesomeIcons.github,
                      url: 'https://github.com/SumithSB',
                      isDark: isDark,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => onNavigate('Contact'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryAccent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      "Let's Talk",
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MobileNavItem extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool isDark;

  const _MobileNavItem({
    required this.label,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color:
                    isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.lightTextPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SocialIconButton extends StatelessWidget {
  final IconData icon;
  final String url;
  final bool isDark;

  const _SocialIconButton({
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
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Icon(
          icon,
          size: 18,
          color:
              isDark
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
        ),
      ),
    );
  }
}
