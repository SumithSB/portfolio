import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';

class SkillsSection extends StatelessWidget {
  const SkillsSection({super.key});

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
      color: AppColors.primaryBackground,
      child: Column(
        children: [
          // Section header
          Text(
            '<SKILLS/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: AppColors.textCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Skills & Capabilities',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 36 : 48,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Core pillars of AI engineering, full-stack development, and security',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color: AppColors.textSecondary,
            ),
          ),

          const SizedBox(height: 60),

          // Skills grid
          _buildSkillsGrid(isMobile, isTablet),
        ],
      ),
    );
  }

  Widget _buildSkillsGrid(bool isMobile, bool isTablet) {
    if (isMobile) {
      return Column(
        children: [
          _buildSkillCategory(
            'Agentic AI',
            FontAwesomeIcons.brain,
            AppColors.secondaryAccent,
            _getAISkills(),
            isMobile,
          ),
          const SizedBox(height: 40),
          _buildSkillCategory(
            'Full-Stack',
            FontAwesomeIcons.code,
            AppColors.tertiaryAccent,
            _getFullStackSkills(),
            isMobile,
          ),
          const SizedBox(height: 40),
          _buildSkillCategory(
            'Cybersecurity',
            FontAwesomeIcons.shield,
            AppColors.accentOrange,
            _getSecuritySkills(),
            isMobile,
          ),
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _buildSkillCategory(
            'Agentic AI',
            FontAwesomeIcons.brain,
            AppColors.secondaryAccent,
            _getAISkills(),
            isMobile,
          ),
        ),
        const SizedBox(width: 32),
        Expanded(
          child: _buildSkillCategory(
            'Full-Stack',
            FontAwesomeIcons.code,
            AppColors.tertiaryAccent,
            _getFullStackSkills(),
            isMobile,
          ),
        ),
        const SizedBox(width: 32),
        Expanded(
          child: _buildSkillCategory(
            'Cybersecurity',
            FontAwesomeIcons.shield,
            AppColors.accentOrange,
            _getSecuritySkills(),
            isMobile,
          ),
        ),
      ],
    );
  }

  Widget _buildSkillCategory(
    String title,
    IconData icon,
    Color color,
    List<SkillItem> skills,
    bool isMobile,
  ) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Category header
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 32),

          // Skills list
          ...skills.map((skill) => Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: _buildSkillBar(skill, color),
              )),
        ],
      ),
    );
  }

  Widget _buildSkillBar(SkillItem skill, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(skill.icon, size: 16, color: color),
                const SizedBox(width: 8),
                Text(
                  skill.name,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            Text(
              '${skill.percentage}%',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: skill.percentage / 100,
            backgroundColor: AppColors.cardBackground,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  List<SkillItem> _getAISkills() {
    return [
      SkillItem('Multi-Agent Systems', 92, FontAwesomeIcons.diagramProject),
      SkillItem('RAG Architectures', 90, FontAwesomeIcons.database),
      SkillItem('LLM Integration', 88, FontAwesomeIcons.robot),
      SkillItem('Prompt Engineering', 94, FontAwesomeIcons.wandMagicSparkles),
    ];
  }

  List<SkillItem> _getFullStackSkills() {
    return [
      SkillItem('Flutter (Mobile/Web)', 93, FontAwesomeIcons.mobile),
      SkillItem('Node.js/Python', 91, FontAwesomeIcons.server),
      SkillItem('Docker/Kubernetes', 87, FontAwesomeIcons.docker),
      SkillItem('Microservices', 89, FontAwesomeIcons.cubes),
    ];
  }

  List<SkillItem> _getSecuritySkills() {
    return [
      SkillItem('OWASP Top 10', 95, FontAwesomeIcons.triangleExclamation),
      SkillItem('Threat Modeling', 90, FontAwesomeIcons.shieldHalved),
      SkillItem('Cloud Security', 88, FontAwesomeIcons.cloud),
      SkillItem('Zero Trust Architecture', 85, FontAwesomeIcons.lock),
    ];
  }
}

class SkillItem {
  final String name;
  final int percentage;
  final IconData icon;

  SkillItem(this.name, this.percentage, this.icon);
}
