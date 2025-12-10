import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class ContactSection extends StatelessWidget {
  const ContactSection({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 100,
        vertical: isMobile ? 60 : 100,
      ),
      color: AppColors.secondaryBackground,
      child: Column(
        children: [
          Text(
            '<CONTACT/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: AppColors.textCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "Let's Connect",
            style: GoogleFonts.inter(
              fontSize: isMobile ? 36 : 48,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Open to opportunities in AI, security, and engineering',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 60),
          Text(
            'Contact section coming soon...',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
