import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../constants/app_colors.dart';
import '../constants/layout_constants.dart';

class BlogSection extends StatelessWidget {
  const BlogSection({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = LayoutConstants.isMobile(screenWidth);
    final isTablet = LayoutConstants.isTablet(screenWidth);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final horizontalPadding = LayoutConstants.horizontalPadding(screenWidth);
    final verticalPadding = LayoutConstants.verticalPadding(screenWidth);

    final posts = _getPosts();

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
            '<BLOG/>',
            style: GoogleFonts.jetBrainsMono(
              fontSize: isMobile ? 12 : 14,
              color: isDark ? AppColors.darkTextCode : AppColors.lightTextCode,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Blog',
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
          SizedBox(
            width: isMobile ? double.infinity : 600,
            child: Text(
              'Experiences, journeys, learning, and thoughts on career, tech, and interests.',
              textAlign: isMobile ? TextAlign.start : TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: isMobile ? 14 : 16,
                color:
                    isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
              ),
            ),
          ),
          SizedBox(height: isMobile ? 32 : 48),
          if (posts.isEmpty)
            _buildComingSoon(isMobile, isDark)
          else
            _buildPostList(context, posts, isMobile, isTablet, isDark),
        ],
      ),
    );
  }

  Widget _buildComingSoon(bool isMobile, bool isDark) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 24 : 48,
        vertical: isMobile ? 48 : 72,
      ),
      decoration: BoxDecoration(
        color:
            isDark
                ? AppColors.darkCardBackground.withValues(alpha: 0.5)
                : AppColors.lightCardBackground.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.primaryAccent.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(
            FontAwesomeIcons.penToSquare,
            size: isMobile ? 48 : 64,
            color: AppColors.primaryAccent.withValues(alpha: 0.7),
          ),
          SizedBox(height: isMobile ? 20 : 28),
          Text(
            'Coming soon',
            style: GoogleFonts.inter(
              fontSize: isMobile ? 22 : 28,
              fontWeight: FontWeight.bold,
              color:
                  isDark
                      ? AppColors.darkTextPrimary
                      : AppColors.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'I\'m setting up this space to share experiences, career lessons, learning notes, and interests. Check back later.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: isMobile ? 14 : 16,
              height: 1.6,
              color:
                  isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostList(
    BuildContext context,
    List<BlogPost> posts,
    bool isMobile,
    bool isTablet,
    bool isDark,
  ) {
    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = isMobile ? 1 : (isTablet ? 2 : 3);
    final spacing = LayoutConstants.gridSpacing(screenWidth);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: spacing,
        mainAxisSpacing: spacing,
        childAspectRatio: isMobile ? 1.1 : 0.95,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        return _BlogPostCard(
          post: posts[index],
          isDark: isDark,
          isCompact: isMobile,
        );
      },
    );
  }

  List<BlogPost> _getPosts() {
    return [];
  }
}

class BlogPost {
  final String title;
  final String excerpt;
  final String date;
  final String category;
  final String? url;

  BlogPost({
    required this.title,
    required this.excerpt,
    required this.date,
    required this.category,
    this.url,
  });
}

class _BlogPostCard extends StatefulWidget {
  final BlogPost post;
  final bool isDark;
  final bool isCompact;

  const _BlogPostCard({
    required this.post,
    required this.isDark,
    this.isCompact = false,
  });

  @override
  State<_BlogPostCard> createState() => _BlogPostCardState();
}

class _BlogPostCardState extends State<_BlogPostCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final post = widget.post;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color:
              widget.isDark
                  ? AppColors.darkCardBackground
                  : AppColors.lightCardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                _hovered
                    ? AppColors.primaryAccent.withValues(alpha: 0.5)
                    : AppColors.primaryAccent.withValues(alpha: 0.1),
            width: _hovered ? 1.5 : 1,
          ),
          boxShadow: [
            if (_hovered)
              BoxShadow(
                color: AppColors.primaryAccent.withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
          ],
        ),
        child: InkWell(
          onTap: post.url != null
              ? () {}
              : null,
          borderRadius: BorderRadius.circular(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  post.category,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryAccent,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                post.date,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color:
                      widget.isDark
                          ? AppColors.darkTextTertiary
                          : AppColors.lightTextTertiary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                post.title,
                style: GoogleFonts.inter(
                  fontSize: widget.isCompact ? 18 : 20,
                  fontWeight: FontWeight.bold,
                  color:
                      widget.isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.lightTextPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              Expanded(
                child: Text(
                  post.excerpt,
                  style: GoogleFonts.inter(
                    fontSize: widget.isCompact ? 13 : 14,
                    height: 1.5,
                    color:
                        widget.isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (post.url != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text(
                      'Read more',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primaryAccent,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: AppColors.primaryAccent,
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
