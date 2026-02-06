import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';
import '../widgets/hero_section.dart';
import '../widgets/about_section.dart';
import '../widgets/skills_section.dart';
import '../widgets/projects_section.dart';
import '../widgets/experience_section.dart';
import '../widgets/education_section.dart';
import '../widgets/blog_section.dart';
import '../widgets/contact_section.dart';
import '../widgets/footer_section.dart';
import '../widgets/custom_app_bar.dart';
import '../widgets/animated_section.dart';

class PortfolioScreen extends StatefulWidget {
  const PortfolioScreen({super.key});

  @override
  State<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends State<PortfolioScreen> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey heroKey = GlobalKey();
  final GlobalKey aboutKey = GlobalKey();
  final GlobalKey skillsKey = GlobalKey();
  final GlobalKey projectsKey = GlobalKey();
  final GlobalKey experienceKey = GlobalKey();
  final GlobalKey educationKey = GlobalKey();
  final GlobalKey blogKey = GlobalKey();
  final GlobalKey contactKey = GlobalKey();
  bool _showBackToTop = false;
  double _scrollProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_scrollListener);
  }

  void _scrollListener() {
    final pos = _scrollController.position;
    final maxExtent = pos.maxScrollExtent;
    final viewportHeight = pos.viewportDimension;
    final totalHeight = maxExtent + viewportHeight;
    final progress =
        totalHeight > 0
            ? (_scrollController.offset / totalHeight).clamp(0.0, 1.0)
            : 0.0;
    final showButton = _scrollController.offset > 400;
    if (progress != _scrollProgress || showButton != _showBackToTop) {
      setState(() {
        _scrollProgress = progress;
        _showBackToTop = showButton;
      });
    }
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _scrollController.removeListener(_scrollListener);
    _scrollController.dispose();
    super.dispose();
  }

  void scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _openCV() async {
    if (!kIsWeb) return;
    final base = Uri.base;
    final uri = Uri.parse('${base.origin}${base.path}assets/Sumith_Bhandari_Resume_Backend_Engineer.pdf');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final w = MediaQuery.sizeOf(context).width;
    final edgePadding = LayoutConstants.horizontalPadding(w);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Semantics(
              label: 'Main content',
              container: true,
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                  children: [
                  ListenableBuilder(
                    listenable: _scrollController,
                    builder:
                        (context, _) => HeroSection(
                          key: heroKey,
                          scrollOffset: _scrollController.offset,
                          onViewProjects: () => scrollToSection(projectsKey),
                          onDownloadCV: _openCV,
                        ),
                  ),
                  AnimatedSection(
                    sectionKey: 'about',
                    child: AboutSection(key: aboutKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'skills',
                    delayMilliseconds: 80,
                    child: SkillsSection(key: skillsKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'projects',
                    delayMilliseconds: 120,
                    child: ProjectsSection(
                      key: projectsKey,
                      onViewAllProjects: () => scrollToSection(projectsKey),
                    ),
                  ),
                  AnimatedSection(
                    sectionKey: 'experience',
                    delayMilliseconds: 80,
                    child: ExperienceSection(key: experienceKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'education',
                    delayMilliseconds: 100,
                    child: EducationSection(key: educationKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'blog',
                    delayMilliseconds: 80,
                    child: BlogSection(key: blogKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'contact',
                    delayMilliseconds: 80,
                    child: ContactSection(key: contactKey),
                  ),
                  AnimatedSection(
                    sectionKey: 'footer',
                    delayMilliseconds: 60,
                    child: FooterSection(
                      onNavigate: (section) {
                      switch (section) {
                        case 'About':
                          scrollToSection(aboutKey);
                          break;
                        case 'Skills':
                          scrollToSection(skillsKey);
                          break;
                        case 'Projects':
                          scrollToSection(projectsKey);
                          break;
                        case 'Experience':
                          scrollToSection(experienceKey);
                          break;
                        case 'Education':
                          scrollToSection(educationKey);
                          break;
                        case 'Blog':
                          scrollToSection(blogKey);
                          break;
                        case 'Contact':
                          scrollToSection(contactKey);
                          break;
                      }
                    },
                  ),
                ),
                  ],
                ),
              ),
            ),
            // Skip to main content (keyboard / a11y)
            Positioned(
              top: 0,
              left: 0,
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    scrollToSection(aboutKey);
                  },
                  child: Semantics(
                    label: 'Skip to main content',
                    button: true,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'Skip to main content',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary).withValues(alpha: 0.8),
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Gradient scroll progress bar at top
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: IgnorePointer(
                child: ListenableBuilder(
                  listenable: _scrollController,
                  builder: (context, _) {
                    return Container(
                      height: 4,
                      decoration: BoxDecoration(
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryAccent.withValues(alpha: 0.35),
                            blurRadius: 12,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final w = constraints.maxWidth * _scrollProgress.clamp(0.0, 1.0);
                          return Stack(
                            children: [
                              Container(
                                height: 4,
                                width: double.infinity,
                                color: (isDark ? AppColors.darkCardBackground : AppColors.lightCardBackground)
                                    .withValues(alpha: 0.5),
                              ),
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                curve: Curves.easeOutCubic,
                                height: 4,
                                width: w,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.primaryAccent,
                                      AppColors.primaryAccent.withValues(alpha: 0.85),
                                      const Color(0xFF79C0FF),
                                    ],
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primaryAccent.withValues(alpha: 0.4),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
            CustomAppBar(
              onNavigate: (section) {
                switch (section) {
                  case 'About':
                    scrollToSection(aboutKey);
                    break;
                  case 'Skills':
                    scrollToSection(skillsKey);
                    break;
                  case 'Projects':
                    scrollToSection(projectsKey);
                    break;
                  case 'Experience':
                    scrollToSection(experienceKey);
                    break;
                  case 'Education':
                    scrollToSection(educationKey);
                    break;
                  case 'Blog':
                    scrollToSection(blogKey);
                    break;
                  case 'Contact':
                    scrollToSection(contactKey);
                    break;
                }
              },
            ),
            Positioned(
              right: edgePadding,
              bottom: edgePadding,
              child: AnimatedSlide(
                offset: _showBackToTop ? Offset.zero : const Offset(0, 2),
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOutCubic,
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 350),
                  opacity: _showBackToTop ? 1 : 0,
                  child: _BackToTopButton(onTap: _scrollToTop, isDark: isDark),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BackToTopButton extends StatefulWidget {
  final VoidCallback onTap;
  final bool isDark;

  const _BackToTopButton({required this.onTap, required this.isDark});

  @override
  State<_BackToTopButton> createState() => _BackToTopButtonState();
}

class _BackToTopButtonState extends State<_BackToTopButton>
    with TickerProviderStateMixin {
  bool _hovered = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _floatController;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _floatController = AnimationController(
      duration: const Duration(milliseconds: 2200),
      vsync: this,
    )..repeat(reverse: true);
    _floatAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _floatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: Listenable.merge([_pulseAnimation, _floatAnimation]),
          builder: (context, child) {
            final scale = _hovered ? 1.12 : _pulseAnimation.value;
            final floatY = _hovered ? 0.0 : (0.5 - (0.5 - _floatAnimation.value).abs()) * 4;
            return Transform.translate(
              offset: Offset(0, -floatY),
              child: Transform.scale(
                scale: scale,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF58A6FF), Color(0xFF79C0FF)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF58A6FF).withValues(alpha: _hovered ? 0.5 : 0.35),
                        blurRadius: _hovered ? 16 : 10,
                        spreadRadius: _hovered ? 2 : 0,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.keyboard_arrow_up_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
