import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';
import 'typewriter_text.dart';

class HeroSection extends StatefulWidget {
  const HeroSection({
    super.key,
    this.scrollOffset = 0,
    this.onViewProjects,
    this.onDownloadCV,
  });
  final double scrollOffset;
  final VoidCallback? onViewProjects;
  final VoidCallback? onDownloadCV;

  @override
  State<HeroSection> createState() => _HeroSectionState();
}

class _HeroSectionState extends State<HeroSection>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late AnimationController _roleStaggerController;
  late AnimationController _rightPanelController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Staggered role animations
  late List<Animation<double>> _roleFadeAnimations;
  late List<Animation<Offset>> _roleSlideAnimations;

  // Right panel animations
  late Animation<double> _rightFadeAnimation;
  late Animation<Offset> _rightSlideAnimation;

  // Subtle background gradient shift
  late AnimationController _gradientController;
  late Animation<double> _gradientAnimation;

  // Scroll indicator (mouse) bounce
  late AnimationController _scrollIndicatorController;
  late Animation<double> _scrollIndicatorBounce;

  @override
  void initState() {
    super.initState();
    _gradientController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat(reverse: true);
    _gradientAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _gradientController, curve: Curves.easeInOut),
    );

    _scrollIndicatorController = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    )..repeat(reverse: true);
    _scrollIndicatorBounce = Tween<double>(begin: 0, end: 10).animate(
      CurvedAnimation(parent: _scrollIndicatorController, curve: Curves.easeInOut),
    );

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _slideController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _roleStaggerController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _rightPanelController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
    );

    // Staggered role item animations (3 roles)
    _roleFadeAnimations = List.generate(3, (i) {
      final start = 0.2 + (i * 0.25);
      final end = (start + 0.3).clamp(0.0, 1.0);
      return CurvedAnimation(
        parent: _roleStaggerController,
        curve: Interval(start, end, curve: Curves.easeOut),
      );
    });

    _roleSlideAnimations = List.generate(3, (i) {
      final start = 0.2 + (i * 0.25);
      final end = (start + 0.3).clamp(0.0, 1.0);
      return Tween<Offset>(
        begin: const Offset(-0.3, 0),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: _roleStaggerController,
          curve: Interval(start, end, curve: Curves.easeOutCubic),
        ),
      );
    });

    // Right panel slide in from right
    _rightFadeAnimation = CurvedAnimation(
      parent: _rightPanelController,
      curve: Curves.easeOut,
    );
    _rightSlideAnimation = Tween<Offset>(
      begin: const Offset(0.4, 0),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _rightPanelController,
        curve: Curves.easeOutCubic,
      ),
    );

    // Sequence the animations
    _fadeController.forward();
    _slideController.forward();
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _roleStaggerController.forward();
    });
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) _rightPanelController.forward();
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _roleStaggerController.dispose();
    _rightPanelController.dispose();
    _gradientController.dispose();
    _scrollIndicatorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
    final isTablet = LayoutConstants.isTablet(screenWidth);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final horizontalPadding = LayoutConstants.horizontalPadding(screenWidth);
    final verticalPadding = LayoutConstants.verticalPadding(screenWidth);

    final minHeight = isMobile ? 660.0 : (isTablet ? 760.0 : 840.0);
    return SizedBox(
      width: double.infinity,
      height: minHeight,
      child: Stack(
        children: [
          // Full-width background (edge to edge)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    isDark
                        ? AppColors.darkPrimaryBackground
                        : AppColors.lightPrimaryBackground,
                    isDark
                        ? AppColors.darkSecondaryBackground
                        : AppColors.lightSecondaryBackground,
                  ],
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _gradientAnimation,
              builder: (context, child) {
                final t = _gradientAnimation.value;
                final dx = 0.3 + 0.4 * t;
                final dy = 0.2 + 0.3 * (1 - t);
                return Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment(-1 + dx, -1),
                      end: Alignment(dy, 1),
                      colors: [
                        AppColors.primaryAccent.withValues(alpha: 0.04),
                        Colors.transparent,
                        AppColors.primaryAccent.withValues(alpha: 0.03),
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                );
              },
            ),
          ),
          Positioned.fill(child: _FloatingGridBackground(isDark: isDark)),
          // Content with horizontal padding and parallax
          Positioned.fill(
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: horizontalPadding,
                vertical: isMobile ? 32 : (verticalPadding + 16),
              ),
              child: Transform.translate(
                offset: Offset(0, widget.scrollOffset * 0.12),
                child:
                    isMobile
                        ? _buildMobileLayout(isDark)
                        : _buildDesktopLayout(isTablet, isDark),
              ),
            ),
          ),
          // Small mouse scroll indicator (bottom center)
          Positioned(
            left: 0,
            right: 0,
            bottom: isMobile ? 16 : 24,
            child: Center(
              child: AnimatedBuilder(
                animation: _scrollIndicatorBounce,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(0, _scrollIndicatorBounce.value),
                    child: _buildScrollMouse(isDark, isMobile),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScrollMouse(bool isDark, bool isMobile) {
    final color = (isDark
            ? AppColors.darkTextTertiary
            : AppColors.lightTextTertiary)
        .withValues(alpha: 0.8);
    return SizedBox(
      width: 26,
      height: 38,
      child: CustomPaint(
        painter: _ScrollMousePainter(color: color),
      ),
    );
  }

  Widget _buildDesktopLayout(bool isTablet, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          flex: 6,
          child: _buildHeroContent(isTablet: isTablet, isDark: isDark),
        ),
        Expanded(
          flex: 4,
          child: FadeTransition(
            opacity: _rightFadeAnimation,
            child: SlideTransition(
              position: _rightSlideAnimation,
              child: _buildRightPanel(isDark: isDark),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileLayout(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeroContent(isMobile: true, isDark: isDark),
        const SizedBox(height: 40),
        FadeTransition(
          opacity: _rightFadeAnimation,
          child: SlideTransition(
            position: _rightSlideAnimation,
            child: _buildRightPanel(isMobile: true, isDark: isDark),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroContent({
    bool isMobile = false,
    bool isTablet = false,
    required bool isDark,
  }) {
    final roles = [
      (FontAwesomeIcons.code, 'Software Engineer'),
      (FontAwesomeIcons.cloudArrowUp, 'Cloud & Infrastructure'),
      (FontAwesomeIcons.brain, 'AI & Security Automation'),
    ];

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status indicator
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: AppColors.tertiaryAccent,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.tertiaryAccent,
                        blurRadius: 12,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Open to opportunities',
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

            const SizedBox(height: 16),

            // Code comment — cycling typewriter for dynamic hook
            TypewriterText(
              texts: const [
                '// Building scalable systems',
                '// Shipping production-grade code',
                '// Architecting for 99.99% uptime',
              ],
              cycle: true,
              style: GoogleFonts.jetBrainsMono(
                fontSize: isMobile ? 12 : 14,
                color:
                    isDark
                        ? AppColors.darkTextTertiary
                        : AppColors.lightTextTertiary,
              ),
              characterDelay: const Duration(milliseconds: 45),
              startDelay: const Duration(milliseconds: 500),
              pauseDuration: const Duration(milliseconds: 2500),
              showCursor: true,
            ),

            const SizedBox(height: 24),

            // Name
            Text(
              'Sumith',
              style: GoogleFonts.inter(
                fontSize: isMobile ? 48 : (isTablet ? 56 : 72),
                fontWeight: FontWeight.bold,
                color:
                    isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.lightTextPrimary,
                height: 1.1,
              ),
            ),

            ShaderMask(
              shaderCallback:
                  (bounds) => AppColors.primaryGradient.createShader(
                    Rect.fromLTWH(0, 0, bounds.width, bounds.height),
                  ),
              child: Text(
                'Bhandari',
                style: GoogleFonts.inter(
                  fontSize: isMobile ? 48 : (isTablet ? 56 : 72),
                  fontWeight: FontWeight.bold,
                  color:
                      isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary,
                  height: 1.1,
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Staggered role items
            ...List.generate(roles.length, (i) {
              return Padding(
                padding: EdgeInsets.only(bottom: i < roles.length - 1 ? 12 : 0),
                child: FadeTransition(
                  opacity: _roleFadeAnimations[i],
                  child: SlideTransition(
                    position: _roleSlideAnimations[i],
                    child: _buildRoleItem(
                      roles[i].$1,
                      roles[i].$2,
                      isMobile,
                      isDark,
                    ),
                  ),
                ),
              );
            }),

            const SizedBox(height: 32),

            // Description
            SizedBox(
              width: isTablet ? 500 : 600,
              child: Text(
                'Software engineer with 4+ years shipping production-grade systems. '
                'Specialized in cloud (AWS), infrastructure automation, and AI systems—99.99% uptime for distributed systems, 20+ shipped projects. '
                'Completing MSc Advanced Computer Science at Leicester (July 2026).',
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

            const SizedBox(height: 40),

            // CTA Buttons
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _AnimatedButton(
                  onPressed: widget.onViewProjects ?? () {},
                  icon: Icons.code_rounded,
                  label: 'View Projects',
                  isPrimary: true,
                  isMobile: isMobile,
                ),
                _AnimatedButton(
                  onPressed: widget.onDownloadCV ?? () {},
                  icon: Icons.file_download_outlined,
                  label: 'Download CV',
                  isPrimary: false,
                  isMobile: isMobile,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleItem(
    IconData icon,
    String role,
    bool isMobile,
    bool isDark,
  ) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            icon,
            size: 16,
            color:
                isDark
                    ? AppColors.darkPrimaryBackground
                    : AppColors.lightPrimaryBackground,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          role,
          style: GoogleFonts.inter(
            fontSize: isMobile ? 14 : 16,
            color:
                isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel({bool isMobile = false, required bool isDark}) {
    return Column(
      crossAxisAlignment:
          isMobile ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _FloatingCard(
          delay: 0,
          child: _TerminalCard(isMobile: isMobile, isDark: isDark),
        ),
        const SizedBox(height: 32),
        _FloatingCard(
          delay: 800,
          child: _AnimatedStatsCard(isMobile: isMobile, isDark: isDark),
        ),
      ],
    );
  }
}

class _ScrollMousePainter extends CustomPainter {
  final Color color;

  _ScrollMousePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    final body = RRect.fromRectAndRadius(
      Rect.fromLTWH(2, 0, size.width - 4, size.height - 6),
      const Radius.circular(12),
    );
    canvas.drawRRect(body, paint);

    final wheelRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(size.width / 2, size.height / 2 - 2),
        width: 4,
        height: 8,
      ),
      const Radius.circular(2),
    );
    canvas.drawRRect(wheelRect, paint);

    paint.style = PaintingStyle.fill;
    paint.color = color.withValues(alpha: 0.6);
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2 + 4),
      1.5,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScrollMousePainter old) => old.color != color;
}

// ─── Floating grid background ───────────────────────────────────────────────

class _FloatingGridBackground extends StatefulWidget {
  final bool isDark;

  const _FloatingGridBackground({required this.isDark});

  @override
  State<_FloatingGridBackground> createState() =>
      _FloatingGridBackgroundState();
}

class _FloatingGridBackgroundState extends State<_FloatingGridBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.linear));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          painter: _GridPainter(
            progress: _animation.value,
            isDark: widget.isDark,
          ),
        );
      },
    );
  }
}

class _GridPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _GridPainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final lineColor = (isDark
            ? AppColors.darkTextTertiary
            : AppColors.lightTextTertiary)
        .withValues(
          alpha: 0.06 + 0.02 * (0.5 + 0.5 * math.sin(progress * math.pi * 2)),
        );
    final dotColor = AppColors.primaryAccent.withValues(
      alpha: 0.04 + 0.03 * math.sin(progress * math.pi * 2 + 1),
    );

    const spacing = 48.0;
    final paint =
        Paint()
          ..color = lineColor
          ..strokeWidth = 1;
    for (double x = 0; x < size.width + spacing; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height + spacing; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    final dotPaint = Paint()..color = dotColor;
    const dotSpacing = 96.0;
    for (double x = dotSpacing * 0.5; x < size.width; x += dotSpacing) {
      for (double y = dotSpacing * 0.5; y < size.height; y += dotSpacing) {
        final drift =
            3.0 * math.sin(progress * math.pi * 2 + x * 0.01 + y * 0.01);
        canvas.drawCircle(Offset(x + drift, y + drift), 1.5, dotPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter old) => old.progress != progress;
}

// ─── Terminal Card with Typing Animation ───────────────────────────────────

class _TerminalCard extends StatefulWidget {
  final bool isMobile;
  final bool isDark;

  const _TerminalCard({required this.isMobile, required this.isDark});

  @override
  State<_TerminalCard> createState() => _TerminalCardState();
}

class _TerminalCardState extends State<_TerminalCard> {
  final List<_TerminalLine> _lines = [
    _TerminalLine(prompt: '\$ ', text: 'whoami', isCommand: true),
    _TerminalLine(
      prompt: '',
      text: 'sumith — software engineer',
      isCommand: false,
    ),
    _TerminalLine(prompt: '', text: '', isCommand: false),
    _TerminalLine(prompt: '\$ ', text: 'cat skills.yml', isCommand: true),
    _TerminalLine(
      prompt: '',
      text: 'backend:  Python, FastAPI, Node.js',
      isCommand: false,
    ),
    _TerminalLine(
      prompt: '',
      text: 'cloud:    AWS, Docker, CI/CD',
      isCommand: false,
    ),
    _TerminalLine(
      prompt: '',
      text: 'ai:       LLMs, RAG, Agentic AI',
      isCommand: false,
    ),
    _TerminalLine(
      prompt: '',
      text: 'monitor:  Grafana, 99.99% uptime',
      isCommand: false,
    ),
    _TerminalLine(prompt: '', text: '', isCommand: false),
    _TerminalLine(prompt: '\$ ', text: 'echo \$STATUS', isCommand: true),
    _TerminalLine(prompt: '', text: 'Open to opportunities', isCommand: false),
  ];

  int _visibleLines = 0;
  String _currentTypingText = '';
  int _currentLineCharIndex = 0;
  Timer? _typingTimer;
  bool _showCursor = true;
  Timer? _cursorTimer;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) _startTyping();
    });
    _cursorTimer = Timer.periodic(const Duration(milliseconds: 530), (_) {
      if (mounted) setState(() => _showCursor = !_showCursor);
    });
  }

  void _startTyping() {
    if (_visibleLines >= _lines.length) {
      _typingTimer?.cancel();
      return;
    }

    final currentLine = _lines[_visibleLines];

    if (currentLine.text.isEmpty) {
      setState(() {
        _visibleLines++;
        _currentTypingText = '';
        _currentLineCharIndex = 0;
      });
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted) _startTyping();
      });
      return;
    }

    final typingSpeed =
        currentLine.isCommand
            ? const Duration(milliseconds: 45)
            : const Duration(milliseconds: 12);

    _typingTimer = Timer.periodic(typingSpeed, (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_currentLineCharIndex < currentLine.text.length) {
        setState(() {
          _currentLineCharIndex++;
          _currentTypingText = currentLine.text.substring(
            0,
            _currentLineCharIndex,
          );
        });
      } else {
        timer.cancel();
        setState(() {
          _visibleLines++;
          _currentTypingText = '';
          _currentLineCharIndex = 0;
        });
        final delay =
            currentLine.isCommand
                ? const Duration(milliseconds: 400)
                : const Duration(milliseconds: 100);
        Future.delayed(delay, () {
          if (mounted) _startTyping();
        });
      }
    });
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _cursorTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: widget.isMobile ? double.infinity : 380,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color:
              isDark
                  ? AppColors.darkCardBackground
                  : AppColors.lightCardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                _isHovered
                    ? AppColors.primaryAccent.withValues(alpha: 0.4)
                    : AppColors.primaryAccent.withValues(alpha: 0.15),
            width: _isHovered ? 1.5 : 1,
          ),
          boxShadow:
              _isHovered
                  ? [
                    BoxShadow(
                      color: AppColors.primaryAccent.withValues(alpha: 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ]
                  : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Terminal header dots
            Row(
              children: [
                _dot(const Color(0xFFFF5F57)),
                const SizedBox(width: 6),
                _dot(const Color(0xFFFFBD2E)),
                const SizedBox(width: 6),
                _dot(const Color(0xFF28CA41)),
                const SizedBox(width: 12),
                Text(
                  'terminal',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    color:
                        isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Completed lines
            ...List.generate(_visibleLines.clamp(0, _lines.length), (i) {
              final line = _lines[i];
              if (line.text.isEmpty) return const SizedBox(height: 8);
              return Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: _buildTerminalLine(line, isDark),
              );
            }),
            // Currently typing line
            if (_visibleLines < _lines.length)
              _buildCurrentlyTypingLine(isDark),
          ],
        ),
      ),
    );
  }

  Widget _dot(Color color) {
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _buildTerminalLine(_TerminalLine line, bool isDark) {
    return RichText(
      text: TextSpan(
        style: GoogleFonts.jetBrainsMono(fontSize: 12, height: 1.5),
        children: [
          if (line.prompt.isNotEmpty)
            TextSpan(
              text: line.prompt,
              style: const TextStyle(color: AppColors.tertiaryAccent),
            ),
          TextSpan(
            text: line.text,
            style: TextStyle(
              color:
                  line.isCommand
                      ? (isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary)
                      : (isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary),
              fontWeight: line.isCommand ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentlyTypingLine(bool isDark) {
    final line = _lines[_visibleLines];
    return RichText(
      text: TextSpan(
        style: GoogleFonts.jetBrainsMono(fontSize: 12, height: 1.5),
        children: [
          if (line.prompt.isNotEmpty)
            TextSpan(
              text: line.prompt,
              style: const TextStyle(color: AppColors.tertiaryAccent),
            ),
          TextSpan(
            text: _currentTypingText,
            style: TextStyle(
              color:
                  line.isCommand
                      ? (isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary)
                      : (isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary),
              fontWeight: line.isCommand ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          TextSpan(
            text: _showCursor ? '▊' : ' ',
            style: const TextStyle(
              color: AppColors.primaryAccent,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _TerminalLine {
  final String prompt;
  final String text;
  final bool isCommand;

  _TerminalLine({
    required this.prompt,
    required this.text,
    required this.isCommand,
  });
}

// ─── Animated Stats Card with Count-Up ─────────────────────────────────────

class _AnimatedStatsCard extends StatefulWidget {
  final bool isMobile;
  final bool isDark;

  const _AnimatedStatsCard({required this.isMobile, required this.isDark});

  @override
  State<_AnimatedStatsCard> createState() => _AnimatedStatsCardState();
}

class _AnimatedStatsCardState extends State<_AnimatedStatsCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _yearsAnim;
  late Animation<double> _uptimeAnim;
  late Animation<double> _projectsAnim;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    );

    _yearsAnim = Tween<double>(begin: 0, end: 4).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.7, curve: Curves.easeOutCubic),
      ),
    );
    _uptimeAnim = Tween<double>(begin: 0, end: 99.99).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.15, 0.85, curve: Curves.easeOutCubic),
      ),
    );
    _projectsAnim = Tween<double>(begin: 0, end: 20).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: widget.isMobile ? double.infinity : 380,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color:
              isDark
                  ? AppColors.darkCardBackground
                  : AppColors.lightCardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color:
                _isHovered
                    ? AppColors.primaryAccent.withValues(alpha: 0.3)
                    : (isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary)
                        .withValues(alpha: 0.2),
            width: 1,
          ),
          boxShadow:
              _isHovered
                  ? [
                    BoxShadow(
                      color: AppColors.primaryAccent.withValues(alpha: 0.06),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ]
                  : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Experience Stats',
              style: GoogleFonts.inter(
                fontSize: 12,
                color:
                    isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      '${_yearsAnim.value.toInt()}+',
                      'Years',
                      isDark,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: (isDark
                              ? AppColors.darkTextTertiary
                              : AppColors.lightTextTertiary)
                          .withValues(alpha: 0.2),
                    ),
                    _buildStatItem(
                      '${_uptimeAnim.value.toStringAsFixed(_uptimeAnim.value >= 99 ? 2 : 0)}%',
                      'Uptime',
                      isDark,
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: (isDark
                              ? AppColors.darkTextTertiary
                              : AppColors.lightTextTertiary)
                          .withValues(alpha: 0.2),
                    ),
                    _buildStatItem(
                      '${_projectsAnim.value.toInt()}+',
                      'Projects',
                      isDark,
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label, bool isDark) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: widget.isMobile ? 24 : 28,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryAccent,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color:
                isDark
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary,
          ),
        ),
      ],
    );
  }
}

// ─── Animated Button Widget ────────────────────────────────────────────────

class _AnimatedButton extends StatefulWidget {
  final VoidCallback onPressed;
  final IconData icon;
  final String label;
  final bool isPrimary;
  final bool isMobile;

  const _AnimatedButton({
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.isPrimary,
    required this.isMobile,
  });

  @override
  State<_AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<_AnimatedButton>
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
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          child:
              widget.isPrimary
                  ? ElevatedButton.icon(
                    onPressed: widget.onPressed,
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
                      padding: EdgeInsets.symmetric(
                        horizontal: widget.isMobile ? 24 : 32,
                        vertical: widget.isMobile ? 14 : 18,
                      ),
                      elevation: _isHovered ? 8 : 0,
                      shadowColor: AppColors.primaryAccent.withValues(
                        alpha: 0.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  )
                  : OutlinedButton.icon(
                    onPressed: widget.onPressed,
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
                      padding: EdgeInsets.symmetric(
                        horizontal: widget.isMobile ? 24 : 32,
                        vertical: widget.isMobile ? 14 : 18,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
        ),
      ),
    );
  }
}

// ─── Floating Card Animation ────────────────────────────────────────────────

class _FloatingCard extends StatefulWidget {
  final Widget child;
  final int delay;

  const _FloatingCard({required this.child, this.delay = 0});

  @override
  State<_FloatingCard> createState() => _FloatingCardState();
}

class _FloatingCardState extends State<_FloatingCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    _animation = Tween<double>(
      begin: 0,
      end: 12,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _animation.value),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
