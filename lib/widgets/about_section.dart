import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    final isTablet = screenWidth >= 768 && screenWidth < 1024;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : (isTablet ? 60 : 100),
        vertical: isMobile ? 60 : 100,
      ),
      color: AppColors.secondaryBackground,
      child: Column(
        children: [
          // Section header
          Text(
            '<ABOUT/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: AppColors.textCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Who I Am',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 36 : 48,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Bridging AI, engineering, and security to build the future',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color: AppColors.textSecondary,
            ),
          ),

          const SizedBox(height: 60),

          // Content
          isMobile ? _buildMobileLayout() : _buildDesktopLayout(isTablet),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout(bool isTablet) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left side - Avatar and stats
        Expanded(
          flex: 4,
          child: _buildLeftPanel(isTablet: isTablet),
        ),

        const SizedBox(width: 60),

        // Right side - Content
        Expanded(
          flex: 6,
          child: _buildRightPanel(isTablet: isTablet),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      children: [
        _buildLeftPanel(isMobile: true),
        const SizedBox(height: 40),
        _buildRightPanel(isMobile: true),
      ],
    );
  }

  Widget _buildLeftPanel({bool isMobile = false, bool isTablet = false}) {
    return Column(
      children: [
        // Avatar placeholder (using emoji for now)
        Container(
          width: isMobile ? 200 : 300,
          height: isMobile ? 200 : 300,
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primaryAccent.withOpacity(0.2),
              width: 2,
            ),
          ),
          child: Center(
            child: Text(
              '👨‍💻',
              style: TextStyle(fontSize: isMobile ? 80 : 120),
            ),
          ),
        ),

        const SizedBox(height: 32),

        // Name and details card
        Container(
          width: isMobile ? double.infinity : 300,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppColors.cardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primaryAccent.withOpacity(0.1),
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
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'AI • Full-Stack • Security',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 12,
                  color: AppColors.textCode,
                ),
              ),
              const SizedBox(height: 24),
              _buildStatRow('💼', 'Experience', '4+ Years'),
              const SizedBox(height: 12),
              _buildStatRow('🔐', 'Security', '15+ Tools'),
              const SizedBox(height: 12),
              _buildStatRow('🤖', 'AI Systems', '10+ Projects'),
              const SizedBox(height: 12),
              _buildStatRow('🎓', 'Certs', 'CEH, AWS, OWASP'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatRow(String emoji, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel({bool isMobile = false, bool isTablet = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Background section
        _buildContentBlock(
          'Background',
          'I architect secure, intelligent systems that bridge the worlds of cybersecurity, '
          'artificial intelligence, and modern software engineering. Currently pursuing MSc in '
          'Advanced Computer Science at University of Leicester, I\'ve spent 4+ years building '
          'production-grade applications—from Flutter mobile apps serving thousands of users '
          'to AI-powered security platforms processing real-time threat intelligence.',
          isMobile,
        ),

        const SizedBox(height: 32),

        // Current focus
        _buildContentBlock(
          'Current Focus',
          'Building production-grade Agentic AI and conversational AI systems at TechMachinery Labs (SDE-3). '
          'I lead end-to-end development of LLM-driven applications, integrating vector databases, '
          'multi-agent systems, and RAG architectures using Flutter, FastAPI, and modern cloud infrastructure. '
          '\n\nSimultaneously, as Cybersecurity Consultant at Visiminds Technologies, I\'m developing IVY—an '
          'end-to-end security platform with OWASP Top 10 integration and automated threat detection.',
          isMobile,
        ),

        const SizedBox(height: 32),

        // Philosophy
        _buildContentBlock(
          'Philosophy',
          'Every system I build starts with security by design. Whether it\'s a multi-agent AI '
          'orchestration platform or a distributed microservice architecture, zero-trust principles '
          'and defense-in-depth are non-negotiable.\n\n'
          'I believe the future belongs to systems that are not only intelligent but also '
          'inherently secure and self-healing—systems that scale seamlessly from prototype to '
          'production without compromising on safety or performance.',
          isMobile,
        ),

        const SizedBox(height: 32),

        // Entrepreneurial experience
        _buildContentBlock(
          'Entrepreneurial Journey',
          'Co-founded Drogher Technologies, a quick commerce platform where I led end-to-end product '
          'development, managed cross-functional teams, and secured startup incubation at Great Lakes '
          'University, Chennai. This experience taught me to build MVPs fast, scale applications efficiently, '
          'and optimize cloud infrastructure for high-traffic systems.',
          isMobile,
        ),
      ],
    );
  }

  Widget _buildContentBlock(String title, String content, bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ShaderMask(
          shaderCallback: (bounds) => AppColors.primaryGradient.createShader(
            Rect.fromLTWH(0, 0, bounds.width, bounds.height),
          ),
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: isMobile ? 20 : 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          content,
          style: GoogleFonts.inter(
            fontSize: isMobile ? 14 : 16,
            color: AppColors.textSecondary,
            height: 1.8,
          ),
        ),
      ],
    );
  }
}
