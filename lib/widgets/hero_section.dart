import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';

class HeroSection extends StatelessWidget {
  const HeroSection({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    final isTablet = screenWidth >= 768 && screenWidth < 1024;

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 800),
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : (isTablet ? 60 : 100),
        vertical: isMobile ? 100 : 120,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primaryBackground,
            AppColors.secondaryBackground,
          ],
        ),
      ),
      child: isMobile ? _buildMobileLayout() : _buildDesktopLayout(isTablet),
    );
  }

  Widget _buildDesktopLayout(bool isTablet) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Left side - Text content
        Expanded(
          flex: 6,
          child: _buildHeroContent(isTablet: isTablet),
        ),

        // Right side - Stats and code
        Expanded(
          flex: 4,
          child: _buildRightPanel(),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeroContent(isMobile: true),
        const SizedBox(height: 40),
        _buildRightPanel(isMobile: true),
      ],
    );
  }

  Widget _buildHeroContent({bool isMobile = false, bool isTablet = false}) {
    return Column(
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
              'Available for opportunities',
              style: GoogleFonts.jetBrainsMono(
                fontSize: isMobile ? 12 : 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Code comment
        Text(
          'console.log("Hello, I\'m")',
          style: GoogleFonts.jetBrainsMono(
            fontSize: isMobile ? 12 : 14,
            color: AppColors.textTertiary,
          ),
        ),

        const SizedBox(height: 24),

        // Name - Large
        Text(
          'Sumith',
          style: GoogleFonts.inter(
            fontSize: isMobile ? 48 : (isTablet ? 56 : 72),
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
            height: 1.1,
          ),
        ),

        // Last name with gradient
        ShaderMask(
          shaderCallback: (bounds) => AppColors.primaryGradient.createShader(
            Rect.fromLTWH(0, 0, bounds.width, bounds.height),
          ),
          child: Text(
            'Bhandari',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 48 : (isTablet ? 56 : 72),
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
              height: 1.1,
            ),
          ),
        ),

        const SizedBox(height: 32),

        // Role titles with icons
        _buildRoleItem(
          FontAwesomeIcons.brain,
          'Agentic AI Engineer',
          isMobile,
        ),
        const SizedBox(height: 12),
        _buildRoleItem(
          FontAwesomeIcons.mobile,
          'Full-Stack Mobile Developer',
          isMobile,
        ),
        const SizedBox(height: 12),
        _buildRoleItem(
          FontAwesomeIcons.shield,
          'Cybersecurity Consultant',
          isMobile,
        ),

        const SizedBox(height: 32),

        // Description
        SizedBox(
          width: isTablet ? 500 : 600,
          child: Text(
            'Building intelligent, secure, scalable applications at the convergence of AI, mobile development, and cybersecurity.',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color: AppColors.textSecondary,
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
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.arrow_forward),
              label: Text(
                'Explore My Work',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryAccent,
                foregroundColor: AppColors.primaryBackground,
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 20 : 32,
                  vertical: isMobile ? 14 : 16,
                ),
              ),
            ),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.download),
              label: Text(
                'Resume',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: const BorderSide(color: AppColors.textSecondary),
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 20 : 32,
                  vertical: isMobile ? 14 : 16,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRoleItem(IconData icon, String role, bool isMobile) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 16, color: AppColors.primaryBackground),
        ),
        const SizedBox(width: 12),
        Text(
          role,
          style: GoogleFonts.inter(
            fontSize: isMobile ? 14 : 16,
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel({bool isMobile = false}) {
    return Column(
      crossAxisAlignment: isMobile ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Code snippet card
        Container(
          width: isMobile ? double.infinity : 350,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.primaryAccent.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'const skills = {',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '  AI: "Expert",',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textCode,
                ),
              ),
              Text(
                '  Flutter: "Advanced",',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textCode,
                ),
              ),
              Text(
                '  FullStack: "Proficient"',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textCode,
                ),
              ),
              Text(
                '}',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.tertiaryAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'System Ready',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 12,
                      color: AppColors.tertiaryAccent,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 32),

        // Stats
        Row(
          mainAxisAlignment: isMobile ? MainAxisAlignment.start : MainAxisAlignment.end,
          children: [
            _buildStatCard('4+', 'Years Exp', isMobile),
            const SizedBox(width: 24),
            _buildStatCard('20+', 'Projects', isMobile),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String value, String label, bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ShaderMask(
          shaderCallback: (bounds) => AppColors.primaryGradient.createShader(
            Rect.fromLTWH(0, 0, bounds.width, bounds.height),
          ),
          child: Text(
            value,
            style: GoogleFonts.inter(
              fontSize: isMobile ? 32 : 40,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
