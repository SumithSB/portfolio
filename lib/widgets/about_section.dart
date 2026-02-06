import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

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
            '<ABOUT/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Who I Am',
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
            'Architecting production systems at scale—from cloud infrastructure to AI pipelines to security automation',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
          SizedBox(height: isMobile ? 32 : 48),
          isMobile
              ? _buildMobileLayout(isDark)
              : _buildDesktopLayout(isTablet, isDark),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout(bool isTablet, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 4,
          child: _buildLeftPanel(isTablet: isTablet, isDark: isDark),
        ),
        const SizedBox(width: 60),
        Expanded(
          flex: 6,
          child: _buildRightPanel(isTablet: isTablet, isDark: isDark),
        ),
      ],
    );
  }

  Widget _buildMobileLayout(bool isDark) {
    return Column(
      children: [
        _buildLeftPanel(isMobile: true, isDark: isDark),
        const SizedBox(height: 40),
        _buildRightPanel(isMobile: true, isDark: isDark),
      ],
    );
  }

  Widget _buildLeftPanel({
    bool isMobile = false,
    bool isTablet = false,
    required bool isDark,
  }) {
    return Column(
      children: [
        Container(
          width: isMobile ? 160 : 280,
          height: isMobile ? 160 : 280,
          decoration: BoxDecoration(
            color:
                isDark
                    ? AppColors.darkCardBackground
                    : AppColors.lightCardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primaryAccent.withValues(alpha: 0.2),
              width: 2,
            ),
          ),
          child: Center(
            child: Icon(
              FontAwesomeIcons.user,
              size: isMobile ? 80 : 120,
              color: AppColors.primaryAccent.withValues(alpha: 0.6),
            ),
          ),
        ),
        const SizedBox(height: 32),
        Container(
          width: isMobile ? double.infinity : 300,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient:
                isDark ? AppColors.cardGradient : AppColors.lightCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primaryAccent.withValues(alpha: 0.1),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sumith Sadanand Bhandari',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color:
                      isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Software Engineer · Cloud · AI · Security',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 12,
                  color:
                      isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
                ),
              ),
              const SizedBox(height: 24),
              _buildStatRow(
                FontAwesomeIcons.briefcase,
                'Experience',
                '4+ Years | 99.99% Uptime',
                isDark,
              ),
              const SizedBox(height: 12),
              _buildStatRow(
                FontAwesomeIcons.cloudArrowUp,
                'Cloud',
                'AWS, Docker, CI/CD',
                isDark,
              ),
              const SizedBox(height: 12),
              _buildStatRow(
                FontAwesomeIcons.diagramProject,
                'Projects',
                '20+ Shipped',
                isDark,
              ),
              const SizedBox(height: 12),
              _buildStatRow(
                FontAwesomeIcons.graduationCap,
                'Education',
                'MSc Leicester \'26',
                isDark,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatRow(IconData icon, String label, String value, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: AppColors.primaryAccent),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color:
                        isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color:
                  isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel({
    bool isMobile = false,
    bool isTablet = false,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildContentBlock(
          'Background',
          'Software engineer with 4+ years building scalable, production-grade systems across '
              'cloud infrastructure, AI-powered applications, and security automation. Currently '
              'pursuing MSc in Advanced Computer Science at University of Leicester (graduating '
              'July 2026). Co-founded a startup, shipped 20+ projects, and achieved 99.99% '
              'uptime for distributed systems through robust architecture and automated monitoring.',
          isMobile,
          isDark,
        ),

        const SizedBox(height: 32),

        _buildContentBlock(
          'Current Focus',
          'Part-time consulting at TechMachinery and Visiminds during university breaks.\n\n'
              '• TechMachinery: Agentic AI and LLM systems — RAG pipelines, vector databases, FastAPI/Flutter backends.\n'
              '• Visiminds IVY: Security automation platform — OWASP tools (Nmap, Nikto, Nuclei, TestSSL), Docker, Grafana.\n'
              '• Honeywell Forge: Polyglot GCP adapters for cloud migration (.NET, Java, Go, Node, Python).\n\n'
              'Learning: MSc dissertation (AI/LLMs & vector databases), polyglot service design, and security tooling in production.\n'
              'Working on: Agentic AI workflows, IVY automation pipelines, Forge adapters, and observability (Grafana, metrics).',
          isMobile,
          isDark,
        ),
        const SizedBox(height: 32),
        _buildContentBlock(
          'How I Work',
          'I ship fast in high-ambiguity environments and make technical decisions independently — from '
              'technology stack and database design to cloud architecture and deployment strategy. Whether '
              'it\'s a microservices backend, an AI pipeline, or a CI/CD workflow, I focus on reliability, '
              'observability, and clean architecture that scales from prototype to production.',
          isMobile,
          isDark,
        ),
        const SizedBox(height: 32),
        _buildContentBlock(
          'Entrepreneurial Journey',
          'Co-founded Drogher Technologies, a quick-commerce platform where I owned all technical '
              'decisions from architecture to deployment. Built scalable microservices with Node.js and '
              'PostgreSQL, set up CI/CD pipelines with Jenkins, and managed cross-functional teams. '
              'Secured incubation training at Great Lakes University, Chennai. This experience taught me '
              'to build MVPs fast, scale applications efficiently, and think about product-market fit '
              'alongside engineering.',
          isMobile,
          isDark,
        ),
      ],
    );
  }

  Widget _buildContentBlock(
    String title,
    String content,
    bool isMobile,
    bool isDark,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ShaderMask(
          shaderCallback:
              (bounds) => AppColors.primaryGradient.createShader(
                Rect.fromLTWH(0, 0, bounds.width, bounds.height),
              ),
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: isMobile ? 20 : 24,
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          content,
          style: GoogleFonts.inter(
            fontSize: isMobile ? 14 : 16,
            color:
                isDark
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary,
            height: 1.8,
          ),
        ),
      ],
    );
  }
}
