import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';

/// Wraps content and runs a fade + slide-up animation when it enters the viewport.
class AnimatedSection extends StatefulWidget {
  final Widget child;
  final int delayMilliseconds;
  final double slideOffset;
  final String sectionKey;

  const AnimatedSection({
    super.key,
    required this.child,
    this.delayMilliseconds = 0,
    this.slideOffset = 0.08,
    this.sectionKey = 'section',
  });

  @override
  State<AnimatedSection> createState() => _AnimatedSectionState();
}

class _AnimatedSectionState extends State<AnimatedSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;
  bool _hasAnimated = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 700),
      vsync: this,
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(
      begin: Offset(0, widget.slideOffset),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _runAnimation() {
    if (_hasAnimated || !mounted) return;
    _hasAnimated = true;
    if (widget.delayMilliseconds > 0) {
      Future.delayed(Duration(milliseconds: widget.delayMilliseconds), () {
        if (mounted) _controller.forward();
      });
    } else {
      _controller.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: Key('animated_${widget.sectionKey}'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction > 0.15) _runAnimation();
      },
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return FadeTransition(
            opacity: _fade,
            child: SlideTransition(position: _slide, child: widget.child),
          );
        },
      ),
    );
  }
}

/// Wraps a single child (e.g. grid item) and animates it in with stagger delay when visible.
class StaggeredRevealCard extends StatefulWidget {
  final Widget child;
  final int index;
  final int staggerDelayMs;

  const StaggeredRevealCard({
    super.key,
    required this.child,
    required this.index,
    this.staggerDelayMs = 100,
  });

  @override
  State<StaggeredRevealCard> createState() => _StaggeredRevealCardState();
}

class _StaggeredRevealCardState extends State<StaggeredRevealCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;
  late Animation<double> _scale;
  bool _hasAnimated = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.12),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _scale = Tween<double>(begin: 0.94, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _runAnimation() {
    if (_hasAnimated || !mounted) return;
    _hasAnimated = true;
    final delay = widget.index * widget.staggerDelayMs;
    Future.delayed(Duration(milliseconds: delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: Key('stagger_${widget.index}'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction > 0.2) _runAnimation();
      },
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return FadeTransition(
            opacity: _fade,
            child: SlideTransition(
              position: _slide,
              child: ScaleTransition(
                scale: _scale,
                child: widget.child,
              ),
            ),
          );
        },
      ),
    );
  }
}
