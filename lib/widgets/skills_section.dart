import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class SkillsSection extends StatefulWidget {
  const SkillsSection({super.key});

  @override
  State<SkillsSection> createState() => _SkillsSectionState();
}

class _SkillsSectionState extends State<SkillsSection>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  static const int _categoryCount = 4;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      _categoryCount,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 600),
        vsync: this,
      ),
    );

    _fadeAnimations = _controllers
        .map((controller) => Tween<double>(begin: 0.0, end: 1.0).animate(
              CurvedAnimation(parent: controller, curve: Curves.easeOut),
            ))
        .toList();

    _slideAnimations = _controllers
        .map((controller) => Tween<Offset>(
              begin: const Offset(0, 0.3),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: controller, curve: Curves.easeOutCubic),
            ))
        .toList();

    // Stagger the animations
    for (int i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: 150 * i), () {
        if (mounted) _controllers[i].forward();
      });
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
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
        children: [
          Text(
            '<SKILLS/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Skills & Capabilities',
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
            'Backend, platform, AI systems, and security automation',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          SizedBox(height: isMobile ? 32 : 48),
          _buildSkillsGrid(isMobile, isTablet, isDark),
        ],
      ),
    );
  }

  Widget _buildSkillsGrid(bool isMobile, bool isTablet, bool isDark) {
    final categories = _getCategories(isDark);

    if (isMobile) {
      return Column(
        children: [
          for (int i = 0; i < categories.length; i++) ...[
            if (i > 0) const SizedBox(height: 24),
            _buildSkillCategory(
              categories[i].title,
              categories[i].icon,
              categories[i].color,
              categories[i].skills,
              isDark,
              true,
            ),
          ],
        ],
      );
    }

    if (isTablet) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 24,
            crossAxisSpacing: 24,
            childAspectRatio: 1.4,
            children: [
              for (final cat in categories)
                _buildSkillCategory(
                  cat.title,
                  cat.icon,
                  cat.color,
                  cat.skills,
                  isDark,
                  false,
                ),
            ],
          );
        },
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (int i = 0; i < categories.length; i++) ...[
          if (i > 0) const SizedBox(width: 20),
          Expanded(
            child: FadeTransition(
              opacity: _fadeAnimations[i],
              child: SlideTransition(
                position: _slideAnimations[i],
                child: _buildSkillCategory(
                  categories[i].title,
                  categories[i].icon,
                  categories[i].color,
                  categories[i].skills,
                  isDark,
                  false,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  List<_SkillCategory> _getCategories(bool isDark) {
    return [
      _SkillCategory(
        title: 'Backend & APIs',
        icon: FontAwesomeIcons.server,
        color: AppColors.primaryAccent,
        skills: const [
          ('Python', FontAwesomeIcons.python),
          ('Node.js / TypeScript', FontAwesomeIcons.nodeJs),
          ('FastAPI / Flask', FontAwesomeIcons.flask),
          ('REST APIs / GraphQL', FontAwesomeIcons.code),
          ('Microservices / System Design', FontAwesomeIcons.cubes),
          ('API Documentation (OpenAPI)', FontAwesomeIcons.fileCode),
        ],
      ),
      _SkillCategory(
        title: 'Cloud & DevOps',
        icon: FontAwesomeIcons.cloud,
        color: AppColors.tertiaryAccent,
        skills: const [
          ('AWS (EC2, S3, Lambda, IAM)', FontAwesomeIcons.aws),
          ('Docker / Containerization', FontAwesomeIcons.docker),
          ('CI/CD (Jenkins)', FontAwesomeIcons.gears),
          ('Infrastructure Automation', FontAwesomeIcons.screwdriverWrench),
          ('Kubernetes (Familiar)', FontAwesomeIcons.cubes),
        ],
      ),
      _SkillCategory(
        title: 'AI & Data',
        icon: FontAwesomeIcons.brain,
        color: AppColors.secondaryAccent,
        skills: const [
          ('LLM Integration', FontAwesomeIcons.robot),
          ('RAG & Vector DBs', FontAwesomeIcons.database),
          ('LangChain', FontAwesomeIcons.wandMagicSparkles),
          ('Agentic AI', FontAwesomeIcons.diagramProject),
        ],
      ),
      _SkillCategory(
        title: 'Security, Testing & Monitoring',
        icon: FontAwesomeIcons.shieldHalved,
        color: AppColors.accentOrange,
        skills: const [
          ('OWASP Top 10 / Security', FontAwesomeIcons.triangleExclamation),
          ('PostgreSQL / MongoDB / Redis', FontAwesomeIcons.database),
          ('pytest / Jest / Load Testing', FontAwesomeIcons.vial),
          ('Grafana / Prometheus', FontAwesomeIcons.chartLine),
          ('RBAC & Linux Systems', FontAwesomeIcons.lock),
        ],
      ),
    ];
  }

  Widget _buildSkillCategory(
    String title,
    IconData icon,
    Color color,
    List<(String, IconData)> skills,
    bool isDark,
    bool isMobile,
  ) {
    return _HoverSkillCard(
      color: color,
      isDark: isDark,
      child: Container(
        padding: EdgeInsets.all(isMobile ? 20 : 24),
        decoration: BoxDecoration(
          color:
              isDark
                  ? AppColors.darkCardBackground
                  : AppColors.lightCardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: isMobile ? 18 : 20,
                      fontWeight: FontWeight.bold,
                      color:
                          isDark
                              ? AppColors.darkTextPrimary
                              : AppColors.lightTextPrimary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ...skills.map(
              (s) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Icon(s.$2, size: 14, color: color),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        s.$1,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color:
                              isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HoverSkillCard extends StatefulWidget {
  final Widget child;
  final Color color;
  final bool isDark;

  const _HoverSkillCard({
    required this.child,
    required this.color,
    required this.isDark,
  });

  @override
  State<_HoverSkillCard> createState() => _HoverSkillCardState();
}

class _HoverSkillCardState extends State<_HoverSkillCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        transform: Matrix4.identity()..scale(_hovered ? 1.02 : 1.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              _hovered
                  ? [
                    BoxShadow(
                      color: widget.color.withValues(alpha: 0.12),
                      blurRadius: 20,
                      spreadRadius: 0,
                      offset: const Offset(0, 6),
                    ),
                  ]
                  : null,
        ),
        child: widget.child,
      ),
    );
  }
}

class _SkillCategory {
  final String title;
  final IconData icon;
  final Color color;
  final List<(String, IconData)> skills;

  const _SkillCategory({
    required this.title,
    required this.icon,
    required this.color,
    required this.skills,
  });
}
