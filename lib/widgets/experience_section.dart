import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class ExperienceSection extends StatelessWidget {
  const ExperienceSection({super.key});

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
            '<EXPERIENCE/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Professional Journey',
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
            'Building expertise across AI, security, and product engineering',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          SizedBox(height: isMobile ? 40 : 64),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: isMobile ? double.infinity : 1100,
            ),
            child: Column(
              children:
                  _getExperiences()
                      .map(
                        (exp) => _ExperienceItem(
                          experience: exp,
                          isLast: exp == _getExperiences().last,
                          isMobile: isMobile,
                          isDark: isDark,
                        ),
                      )
                      .toList(),
            ),
          ),
        ],
      ),
    );
  }

  List<Experience> _getExperiences() {
    return [
      Experience(
        company: 'TechMachinery Labs & Visiminds Technologies',
        role: 'Software Engineering Consultant',
        period: 'Oct 2023 – Present · Part-time during university breaks',
        location: 'Remote, India',
        description:
            'Technical consulting on project basis during university breaks, maintaining hands-on development while pursuing MSc. Delivered 3 successful enterprise engagements.',
        responsibilities: [
          'TechMachinery: End-to-end backend and full-stack development for agentic AI and LLM-driven projects with FastAPI, Flask, Flutter, vector databases, and RAG pipelines.',
          'Visiminds: Backend development for IVY security automation platform — integrated 4+ OWASP tools (Nmap, Nikto, Nuclei, TestSSL). Docker infrastructure, Grafana monitoring, automated PDF reporting.',
          'Honeywell Forge (via Quantiphi): Multi-cloud migration (Azure to GCP/Alibaba Cloud), building polyglot service adapters in 5 languages (.NET, Java, Golang, Node.js, Python). Led team of 3 interns.',
        ],
        icon: FontAwesomeIcons.briefcase,
      ),
      Experience(
        company: 'TechMachinery Labs',
        role: 'Software Development Engineer',
        period: 'Aug 2021 – Sep 2023 · Full-time',
        location: 'Bengaluru, India',
        description:
            'Full-time role across cloud infrastructure, AI/LLM systems, and backend microservices. Achieved 99.99% uptime maintaining 10+ production microservices.',
        responsibilities: [
          'Architected and maintained cloud infrastructure on AWS serving 5000+ requests/sec — monitoring, auto-scaling, automated failover, and disaster recovery.',
          'Built agentic AI systems with LLM integration from scratch; FastAPI/Flask backends, PostgreSQL, MongoDB, Docker containers for production workloads.',
          'Built automated data synchronization system for geographically distributed cloud environments reducing sync errors by 95%.',
          'Implemented infrastructure monitoring using Grafana — dashboards tracking API performance, database metrics, reduced incident response time by 70%.',
          'Collaborated directly with CTO to architect technical solutions; made independent decisions on tech stack, database design, and deployment strategies.',
        ],
        icon: FontAwesomeIcons.robot,
      ),
      Experience(
        company: 'Drogher Technologies Pvt Ltd',
        role: 'Co-Founder & Engineering Lead',
        period: 'Nov 2020 – Mar 2023',
        location: 'Bengaluru, India',
        description:
            'Co-founded hyperlocal quick-commerce startup. Owned all technical decisions from architecture to deployment. Grew to 5-person team managing 10+ delivery partners.',
        responsibilities: [
          'Architected scalable microservices backend with Node.js, PostgreSQL, Docker, and RBAC-based authentication from zero to production.',
          'Built CI/CD pipelines with Jenkins reducing deployment time by 60%; set up monitoring, logging, alerting, and SLOs.',
          'Led cross-functional teams across tech, marketing, and operations. Secured incubation training at Great Lakes University, Chennai.',
        ],
        icon: FontAwesomeIcons.truckFast,
      ),
      Experience(
        company: 'DocTrue',
        role: 'Back End Developer',
        period: 'Nov 2023 – Feb 2024',
        location: 'Bangalore, India',
        description:
            'Backend development for document verification products.',
        responsibilities: [
          'Backend services, API design, and integration for document processing workflows.',
        ],
        icon: FontAwesomeIcons.code,
      ),
      Experience(
        company: 'M.S. Ramaiah Medical College',
        role: 'Software Developer',
        period: 'Jan 2022 – Jun 2022',
        location: 'Bengaluru, India',
        description:
            'Uveitis patient management product — ideation, schema design, and full-stack development.',
        responsibilities: [
          'Backend services with Node.js and MongoDB. Appointment scheduling, medication reminders, and patient health records management system.',
        ],
        icon: FontAwesomeIcons.hospital,
      ),
      Experience(
        company: 'code mangrove',
        role: 'Mobile Application Developer',
        period: 'Apr 2021 – Jul 2021',
        location: 'Bangalore, India',
        description:
            'Collaboration within shipbuilding unit to design and deploy application systems.',
        responsibilities: [
          'Cross-platform Flutter apps; Node.js backend services; cloud server management. Deployed Flutter app on Apple App Store.',
        ],
        icon: FontAwesomeIcons.mobileScreen,
      ),
      Experience(
        company: 'Chetana Financial Services',
        role: 'Mobile Application Developer',
        period: 'Nov 2020 – Sep 2021',
        location: 'Bangalore, India',
        description:
            'Digitizing manual processes including employee attendance and activity tracking.',
        responsibilities: [
          'Backend services with Node.js and MySQL. Deployed and maintained backend on AWS EC2.',
        ],
        icon: FontAwesomeIcons.mobileScreen,
      ),
      Experience(
        company: 'Ramaiah Memorial Hospital',
        role: 'Mobile Application Developer',
        period: 'Oct 2020 – Dec 2020',
        location: 'Bangalore, India',
        description: 'Digitizing patient monitoring and registration systems.',
        responsibilities: [
          'Flutter app development; Google Sheets integration as dynamic database solution.',
        ],
        icon: FontAwesomeIcons.hospital,
      ),
      Experience(
        company: 'Hublyn Digital Services',
        role: 'Mobile Application Developer',
        period: 'May 2020',
        location: 'Bengaluru, India',
        description: 'Cross-platform hybrid mobile app development.',
        responsibilities: [
          'Cross-platform mobile apps for diverse applications. Managed Firebase cloud infrastructure.',
        ],
        icon: FontAwesomeIcons.mobileScreen,
      ),
    ];
  }
}

class Experience {
  final String company;
  final String role;
  final String period;
  final String location;
  final String description;
  final List<String> responsibilities;
  final IconData icon;

  Experience({
    required this.company,
    required this.role,
    required this.period,
    required this.location,
    required this.description,
    required this.responsibilities,
    required this.icon,
  });
}

class _ExperienceItem extends StatefulWidget {
  final Experience experience;
  final bool isLast;
  final bool isMobile;
  final bool isDark;

  const _ExperienceItem({
    required this.experience,
    required this.isLast,
    required this.isMobile,
    required this.isDark,
  });

  @override
  State<_ExperienceItem> createState() => _ExperienceItemState();
}

class _ExperienceItemState extends State<_ExperienceItem> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final showSidePeriod = screenWidth >= 1100;
    final dotSize = widget.isMobile ? 32.0 : 40.0;
    final dotTopPad = widget.isMobile ? 12.0 : 24.0;
    final gapBefore = widget.isMobile ? 12.0 : (showSidePeriod ? 24.0 : 16.0);
    final gapAfter = widget.isMobile ? 12.0 : (showSidePeriod ? 24.0 : 16.0);
    // Left offset for the timeline line = period width + gap + half dot
    final periodWidth = showSidePeriod ? 170.0 : 0.0;
    final lineLeft = periodWidth + gapBefore + dotSize / 2 - 1;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: Stack(
        children: [
          // Timeline vertical line — drawn behind the content
          if (!widget.isLast)
            Positioned(
              left: lineLeft,
              top: dotTopPad + dotSize,
              bottom: 0,
              child: Container(
                width: 2,
                color: AppColors.primaryAccent.withValues(alpha: 0.1),
              ),
            ),
          // Main row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Period column — only on wide screens
              if (showSidePeriod)
                SizedBox(
                  width: 170,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: Text(
                      widget.experience.period,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11,
                        color:
                            widget.isDark
                                ? AppColors.darkTextTertiary
                                : AppColors.lightTextTertiary,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ),
              SizedBox(width: gapBefore),
              // Timeline dot only (line is handled by Stack)
              Padding(
                padding: EdgeInsets.only(top: dotTopPad),
                child: Container(
                  width: dotSize,
                  height: dotSize,
                  decoration: BoxDecoration(
                    color:
                        widget.isDark
                            ? AppColors.darkCardBackground
                            : AppColors.lightCardBackground,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.primaryAccent.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      widget.experience.icon,
                      size: widget.isMobile ? 13 : 16,
                      color: AppColors.primaryAccent,
                    ),
                  ),
                ),
              ),
              SizedBox(width: gapAfter),
              // Content — uses Expanded so it takes remaining width
              Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 220),
                  curve: Curves.easeOutCubic,
                  padding: EdgeInsets.only(
                    bottom: widget.isMobile ? 32 : 48,
                    top: widget.isMobile ? 10 : 18,
                    left: 12,
                    right: 4,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border:
                        _hovered
                            ? Border(
                              left: BorderSide(
                                color: AppColors.primaryAccent.withValues(
                                  alpha: 0.6,
                                ),
                                width: 3,
                              ),
                            )
                            : null,
                    color:
                        _hovered
                            ? (widget.isDark
                                ? AppColors.darkCardBackground.withValues(
                                  alpha: 0.4,
                                )
                                : AppColors.lightCardBackground.withValues(
                                  alpha: 0.6,
                                ))
                            : null,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Period inline — on mobile and tablet
                      if (!showSidePeriod)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            widget.experience.period,
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 11,
                              color: AppColors.primaryAccent,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      Text(
                        widget.experience.role,
                        style: GoogleFonts.inter(
                          fontSize: widget.isMobile ? 16 : 20,
                          fontWeight: FontWeight.bold,
                          color:
                              widget.isDark
                                  ? AppColors.darkTextPrimary
                                  : AppColors.lightTextPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.experience.company,
                        style: GoogleFonts.inter(
                          fontSize: widget.isMobile ? 14 : 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primaryAccent,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.experience.location,
                        style: GoogleFonts.inter(
                          fontSize: widget.isMobile ? 12 : 13,
                          color:
                              widget.isDark
                                  ? AppColors.darkTextTertiary
                                  : AppColors.lightTextTertiary,
                        ),
                      ),
                      SizedBox(height: widget.isMobile ? 8 : 12),
                      Text(
                        widget.experience.description,
                        style: GoogleFonts.inter(
                          fontSize: widget.isMobile ? 13 : 14,
                          color:
                              widget.isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                          fontStyle: FontStyle.italic,
                          height: 1.5,
                        ),
                      ),
                      SizedBox(height: widget.isMobile ? 10 : 16),
                      ...widget.experience.responsibilities.map(
                        (res) => Padding(
                          padding: EdgeInsets.only(
                            bottom: widget.isMobile ? 6 : 10,
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: EdgeInsets.only(
                                  top: widget.isMobile ? 3 : 5,
                                ),
                                child: Container(
                                  width: 5,
                                  height: 5,
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryAccent.withValues(
                                      alpha: 0.6,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  res,
                                  style: GoogleFonts.inter(
                                    fontSize: widget.isMobile ? 12 : 14,
                                    color:
                                        widget.isDark
                                            ? AppColors.darkTextSecondary
                                            : AppColors.lightTextSecondary,
                                    height: 1.6,
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
              ),
            ],
          ),
        ],
      ),
    );
  }
}
