import 'package:flutter/material.dart';
import '../widgets/hero_section.dart';
import '../widgets/about_section.dart';
import '../widgets/skills_section.dart';
import '../widgets/projects_section.dart';
import '../widgets/experience_section.dart';
import '../widgets/contact_section.dart';
import '../widgets/custom_app_bar.dart';

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
  final GlobalKey contactKey = GlobalKey();

  @override
  void dispose() {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Main scrollable content
          SingleChildScrollView(
            controller: _scrollController,
            child: Column(
              children: [
                HeroSection(key: heroKey),
                AboutSection(key: aboutKey),
                SkillsSection(key: skillsKey),
                ProjectsSection(key: projectsKey),
                ExperienceSection(key: experienceKey),
                ContactSection(key: contactKey),
              ],
            ),
          ),

          // Fixed app bar
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
                case 'Contact':
                  scrollToSection(contactKey);
                  break;
              }
            },
          ),
        ],
      ),
    );
  }
}
