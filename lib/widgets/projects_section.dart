import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';
import 'animated_section.dart';

class _CloseCaseStudyIntent extends Intent {
  const _CloseCaseStudyIntent();
}

const List<String> _filterLabels = ['All', 'Cloud & Infra', 'Security', 'Full-Stack'];

class ProjectsSection extends StatefulWidget {
  const ProjectsSection({super.key, this.onViewAllProjects});

  final VoidCallback? onViewAllProjects;

  @override
  State<ProjectsSection> createState() => _ProjectsSectionState();
}

class _ProjectsSectionState extends State<ProjectsSection> {
  String _selectedFilter = 'All';

  List<Project> _getFilteredProjects() {
    final all = _getProjects();
    if (_selectedFilter == 'All') return all;
    return all
        .where(
          (p) => p.category == _selectedFilter,
        )
        .toList();
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
              ? AppColors.darkSecondaryBackground
              : AppColors.lightSecondaryBackground,
      child: Column(
        children: [
          Text(
            '<PROJECTS/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Featured Works',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 28 : (isTablet ? 36 : 44),
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Selected projects in cloud, security, and scalable systems',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),

          SizedBox(height: isMobile ? 40 : 56),

          isMobile ? _buildMobileFilters(isDark) : _buildFilters(isDark),
          const SizedBox(height: 32),

          LayoutBuilder(
            builder: (context, constraints) {
              final projects = _getFilteredProjects();
              final crossAxisCount = isMobile ? 1 : (isTablet ? 2 : 3);
              final spacing = LayoutConstants.gridSpacing(screenWidth);
              final cardHeight = LayoutConstants.projectCardHeight(screenWidth);
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: spacing,
                  mainAxisSpacing: spacing,
                  mainAxisExtent: cardHeight,
                ),
                itemCount: projects.length,
                itemBuilder: (context, index) {
                  return StaggeredRevealCard(
                    index: index,
                    staggerDelayMs: 80,
                    child: _ProjectCard(
                      project: projects[index],
                      isDark: isDark,
                      isCompact: isMobile,
                    ),
                  );
                },
              );
            },
          ),

          SizedBox(height: isMobile ? 40 : 56),

          OutlinedButton(
            onPressed: widget.onViewAllProjects ?? () {},
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primaryAccent,
              side: const BorderSide(color: AppColors.primaryAccent),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
            ),
            child: Text(
              'View All Projects',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(bool isDark) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: _filterLabels
              .map(
                (label) => _buildFilterItem(
                  label,
                  isActive: _selectedFilter == label,
                  isDark: isDark,
                  onTap: () => setState(() => _selectedFilter = label),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 10),
        // Animated sliding underline under active filter
        SizedBox(
          height: 2,
          child: Center(
            child: AnimatedAlign(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              alignment: _filterAlignment(),
              child: Container(
                width: 32,
                height: 2,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryAccent.withValues(alpha: 0.4),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileFilters(bool isDark) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: _filterLabels
                .map(
                  (label) => _buildFilterItem(
                    label,
                    isActive: _selectedFilter == label,
                    isDark: isDark,
                    onTap: () => setState(() => _selectedFilter = label),
                  ),
                )
                .toList(),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 2,
          child: Center(
            child: AnimatedAlign(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              alignment: _filterAlignment(),
              child: Container(
                width: 32,
                height: 2,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryAccent.withValues(alpha: 0.4),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Alignment _filterAlignment() {
    final i = _filterLabels.indexOf(_selectedFilter);
    if (i < 0) return Alignment.center;
    // Map index to x position: -1, -0.33, 0.33, 1 for 4 items
    final t = i / (_filterLabels.length - 1);
    final x = (t * 2) - 1;
    return Alignment(x.clamp(-1.0, 1.0), 0);
  }

  Widget _buildFilterItem(
    String label, {
    required bool isActive,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return _FilterChip(
      label: label,
      isActive: isActive,
      isDark: isDark,
      onTap: onTap,
    );
  }

  List<Project> _getProjects() {
    return [
      Project(
        title: 'Honeywell Forge - Cloud Migration',
        description:
            'Multi-cloud migration of Honeywell Forge platform from Azure to GCP (Kingdom of Saudi Arabia) '
            'and Alibaba Cloud. Built polyglot service adapters as plug-ins to existing Azure implementation '
            'in .NET, Java, Golang, Node.js, and Python. POCs around RabbitMQ and Kafka for messaging. '
            'Through Visiminds via Quantiphi; started with security scope, expanded into development.',
        tags: ['GCP', 'Azure', 'Alibaba', 'Polyglot', 'Kafka'],
        icon: FontAwesomeIcons.cloud,
        color: AppColors.primaryAccent,
        category: 'Cloud & Infra',
        metric: 'Multi-region deployment | 5+ languages',
      ),
      Project(
        title: 'IVY - Security Automation Platform',
        description:
            'End-to-end security automation platform integrating multiple vulnerability scanning tools '
            '(Nmap, Nikto, Nuclei, TestSSL) with OWASP Top 10 compliance mapping. Architected backend '
            'API services with FastAPI, data processing pipelines, automated PDF reporting, and Grafana '
            'monitoring. Deployed with Docker on AWS.',
        tags: ['Security', 'Python', 'FastAPI', 'Docker', 'OWASP'],
        icon: FontAwesomeIcons.shieldHalved,
        color: AppColors.accentOrange,
        category: 'Security',
        metric: '99.99% uptime | 4+ tools integrated',
      ),
      Project(
        title: 'CornerCart (Drogher)',
        description:
            'CornerCart — quick-commerce product by Drogher Technologies. Built scalable microservices backend '
            'from zero to production with Node.js, PostgreSQL, RBAC-based authentication, and Docker. '
            'CI/CD with Jenkins. Flutter mobile app and web dashboard. Incubated at Great Lakes University, Chennai.',
        tags: ['Startup', 'Node.js', 'PostgreSQL', 'Flutter', 'Docker'],
        icon: FontAwesomeIcons.truckFast,
        color: AppColors.tertiaryAccent,
        category: 'Full-Stack',
        metric: '10+ delivery partners | Full-stack',
      ),
      Project(
        title: 'GAU - Circular Economy Platform',
        description:
            'Scalable backend for a circular economy platform. Node.js and TypeScript with MongoDB, '
            'AWS S3 integration, PayU payment gateway, RBAC security model, and Jenkins CI/CD automation.',
        tags: ['Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Jenkins'],
        icon: FontAwesomeIcons.recycle,
        color: AppColors.secondaryAccent,
        category: 'Full-Stack',
        metric: 'Payment gateway integrated | AWS S3',
      ),
    ];
  }
}

class _FilterChip extends StatefulWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isActive,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_FilterChip> createState() => _FilterChipState();
}

class _FilterChipState extends State<_FilterChip>
    with SingleTickerProviderStateMixin {
  bool _hovered = false;
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 180),
      vsync: this,
    );
    _scale = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) {
        setState(() => _hovered = true);
        _controller.forward();
      },
      onExit: (_) {
        setState(() => _hovered = false);
        _controller.reverse();
      },
      child: GestureDetector(
        onTap: widget.onTap,
        child: ScaleTransition(
          scale: _scale,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: widget.isActive ? FontWeight.bold : FontWeight.w500,
                color: widget.isActive
                    ? AppColors.primaryAccent
                    : (_hovered
                        ? (widget.isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)
                        : (widget.isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary)),
              ),
              child: Text(widget.label),
            ),
          ),
        ),
      ),
    );
  }
}

class Project {
  final String title;
  final String description;
  final List<String> tags;
  final IconData icon;
  final Color color;
  /// Filter category: one of 'All', 'Cloud & Infra', 'Security', 'Full-Stack'
  final String category;
  final String? metric; // Quantifiable impact metric

  Project({
    required this.title,
    required this.description,
    required this.tags,
    required this.icon,
    required this.color,
    required this.category,
    this.metric,
  });
}

class _ProjectCard extends StatefulWidget {
  final Project project;
  final bool isDark;
  final bool isCompact;

  const _ProjectCard({
    required this.project,
    required this.isDark,
    this.isCompact = false,
  });

  @override
  State<_ProjectCard> createState() => _ProjectCardState();
}

class _ProjectCardState extends State<_ProjectCard> {
  bool isHovered = false;
  double? _localX;
  double? _localY;

  void _showCaseStudyModal(BuildContext context) {
    final project = widget.project;
    final isDark = widget.isDark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => Shortcuts(
        shortcuts: const {
          SingleActivator(LogicalKeyboardKey.escape): _CloseCaseStudyIntent(),
        },
        child: Actions(
          actions: {
            _CloseCaseStudyIntent: CallbackAction<_CloseCaseStudyIntent>(
              onInvoke: (_) {
                Navigator.of(sheetContext).pop();
                return null;
              },
            ),
          },
          child: Focus(
            autofocus: true,
            child: DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.darkCardBackground
                : AppColors.lightCardBackground,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(
              color: project.color.withValues(alpha: 0.3),
              width: 1,
            ),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: (isDark
                          ? AppColors.darkTextTertiary
                          : AppColors.lightTextTertiary)
                      .withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: project.color.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            project.icon,
                            size: 28,
                            color: project.color,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                project.title,
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? AppColors.darkTextPrimary
                                      : AppColors.lightTextPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: project.color.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  project.category,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: project.color,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Overview',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: project.color,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      project.description,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        height: 1.7,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Tech & tools',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: project.color,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: project.tags
                          .map(
                            (tag) => Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkPrimaryBackground
                                    : AppColors.lightPrimaryBackground,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: (isDark
                                          ? AppColors.darkTextTertiary
                                          : AppColors.lightTextTertiary)
                                      .withValues(alpha: 0.3),
                                ),
                              ),
                              child: Text(
                                tag,
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 13,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () => Navigator.of(sheetContext).pop(),
                        icon: const Icon(Icons.close),
                        label: Text(
                          'Close',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                        ),
                        style: TextButton.styleFrom(
                          foregroundColor: isDark
                              ? AppColors.darkTextPrimary
                              : AppColors.lightTextPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        ),
        ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => isHovered = true),
      onExit:
          (_) => setState(() {
            isHovered = false;
            _localX = null;
            _localY = null;
          }),
      child: Listener(
        onPointerMove:
            (e) => setState(() {
              _localX = e.localPosition.dx;
              _localY = e.localPosition.dy;
            }),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final w = constraints.maxWidth;
            final h = constraints.maxHeight;
            final cx = _localX ?? w / 2;
            final cy = _localY ?? h / 2;
            final rotateY =
                isHovered ? ((cx - w / 2) / w * 0.1).clamp(-0.1, 0.1) : 0.0;
            final rotateX =
                isHovered ? ((h / 2 - cy) / h * 0.1).clamp(-0.1, 0.1) : 0.0;
            final tilt =
                Matrix4.identity()
                  ..setEntry(3, 2, 0.001)
                  ..rotateX(rotateX)
                  ..rotateY(rotateY);
            return AnimatedContainer(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              transform:
                  Matrix4.identity()
                    ..translate(0, isHovered ? -14 : 0)
                    ..scale(isHovered ? 1.02 : 1.0),
              decoration: BoxDecoration(
                color:
                    widget.isDark
                        ? AppColors.darkCardBackground
                        : AppColors.lightCardBackground,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color:
                      isHovered
                          ? widget.project.color.withValues(alpha: 0.5)
                          : AppColors.primaryAccent.withValues(alpha: 0.1),
                  width: isHovered ? 1.5 : 1,
                ),
                boxShadow: [
                  if (isHovered) ...[
                    BoxShadow(
                      color: widget.project.color.withValues(alpha: 0.15),
                      blurRadius: 28,
                      spreadRadius: 2,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ],
              ),
              child: Transform(
                transform: tilt,
                alignment: Alignment.center,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Project Icon/Image Header
                      Container(
                        height: widget.isCompact ? 100 : 140,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              widget.project.color.withValues(alpha: 0.2),
                              widget.project.color.withValues(alpha: 0.05),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                        child: Center(
                          child: Icon(
                            widget.project.icon,
                            size: widget.isCompact ? 40 : 56,
                            color: widget.project.color,
                          ),
                        ),
                      ),

                      // Content — Expanded so Spacer gets bounded height
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.project.title,
                                style: GoogleFonts.inter(
                                  fontSize: widget.isCompact ? 18 : 22,
                                  fontWeight: FontWeight.bold,
                                  color:
                                      widget.isDark
                                          ? AppColors.darkTextPrimary
                                          : AppColors.lightTextPrimary,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                widget.project.description,
                                maxLines: widget.isCompact ? 3 : 4,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: widget.isCompact ? 12 : 14,
                                  color:
                                      widget.isDark
                                          ? AppColors.darkTextSecondary
                                          : AppColors.lightTextSecondary,
                                  height: 1.6,
                                ),
                              ),
                              if (widget.project.metric != null) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        widget.project.color.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: widget.project.color
                                          .withValues(alpha: 0.3),
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        FontAwesomeIcons.chartLine,
                                        size: 12,
                                        color: widget.project.color,
                                      ),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          widget.project.metric!,
                                          style: GoogleFonts.jetBrainsMono(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: widget.project.color,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children:
                                    widget.project.tags
                                        .map(
                                          (tag) => Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color:
                                                  widget.isDark
                                                      ? AppColors
                                                          .darkPrimaryBackground
                                                      : AppColors
                                                          .lightPrimaryBackground,
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                              border: Border.all(
                                                color: (widget.isDark
                                                        ? AppColors
                                                            .darkTextTertiary
                                                        : AppColors
                                                            .lightTextTertiary)
                                                    .withValues(alpha: 0.3),
                                              ),
                                            ),
                                            child: Text(
                                              tag,
                                              style: GoogleFonts.jetBrainsMono(
                                                fontSize: 10,
                                                color:
                                                    widget.isDark
                                                        ? AppColors
                                                            .darkTextSecondary
                                                        : AppColors
                                                            .lightTextSecondary,
                                              ),
                                            ),
                                          ),
                                        )
                                        .toList(),
                              ),
                              const Spacer(),
                              GestureDetector(
                                onTap: () => _showCaseStudyModal(context),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'View Case Study',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: widget.project.color,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Icon(
                                      Icons.arrow_forward,
                                      size: 16,
                                      color: widget.project.color,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
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
