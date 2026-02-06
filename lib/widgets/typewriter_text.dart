import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Reveals text character by character with a blinking cursor for a hooked effect.
class TypewriterText extends StatefulWidget {
  final String text;
  final List<String>? texts; // For cycling through multiple texts
  final TextStyle? style;
  final Duration characterDelay;
  final Duration startDelay;
  final Duration pauseDuration; // Pause before cycling to next text
  final bool showCursor;
  final bool cycle; // Whether to cycle through texts
  final VoidCallback? onComplete;

  const TypewriterText({
    super.key,
    this.text = '',
    this.texts,
    this.style,
    this.characterDelay = const Duration(milliseconds: 60),
    this.startDelay = Duration.zero,
    this.pauseDuration = const Duration(milliseconds: 2000),
    this.showCursor = true,
    this.cycle = false,
    this.onComplete,
  });

  @override
  State<TypewriterText> createState() => _TypewriterTextState();
}

class _TypewriterTextState extends State<TypewriterText>
    with SingleTickerProviderStateMixin {
  int _visibleLength = 0;
  int _currentIndex = 0;
  bool _isDeleting = false;
  late AnimationController _cursorController;
  late Animation<double> _cursorOpacity;

  String get _currentText {
    if (widget.texts != null && widget.texts!.isNotEmpty) {
      return widget.texts![_currentIndex % widget.texts!.length];
    }
    return widget.text;
  }

  @override
  void initState() {
    super.initState();
    _cursorController = AnimationController(
      duration: const Duration(milliseconds: 530),
      vsync: this,
    )..repeat(reverse: true);
    _cursorOpacity = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _cursorController, curve: Curves.easeInOut),
    );
    Future.delayed(widget.startDelay, _tick);
  }

  void _tick() {
    if (!mounted) return;

    if (!_isDeleting) {
      // Typing forward
      if (_visibleLength >= _currentText.length) {
        if (widget.cycle && widget.texts != null && widget.texts!.length > 1) {
          // Pause, then start deleting
          Future.delayed(widget.pauseDuration, () {
            if (mounted) {
              setState(() => _isDeleting = true);
              _tick();
            }
          });
        } else {
          widget.onComplete?.call();
        }
        return;
      }
      setState(() => _visibleLength++);
      Future.delayed(widget.characterDelay, _tick);
    } else {
      // Deleting backward
      if (_visibleLength <= 0) {
        setState(() {
          _isDeleting = false;
          _currentIndex++;
        });
        Future.delayed(const Duration(milliseconds: 300), _tick);
        return;
      }
      setState(() => _visibleLength--);
      Future.delayed(
        Duration(milliseconds: widget.characterDelay.inMilliseconds ~/ 2),
        _tick,
      );
    }
  }

  @override
  void dispose() {
    _cursorController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final displayText = _currentText.substring(
      0,
      _visibleLength.clamp(0, _currentText.length),
    );
    final style =
        widget.style ?? GoogleFonts.inter(fontSize: 16, color: Colors.white);
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(displayText, style: style),
        if (widget.showCursor)
          AnimatedBuilder(
            animation: _cursorOpacity,
            builder:
                (context, child) => Opacity(
                  opacity: _cursorOpacity.value,
                  child: Container(
                    width: 2,
                    height: (style.fontSize ?? 16) * 1.2,
                    margin: const EdgeInsets.only(left: 2),
                    decoration: BoxDecoration(
                      color: style.color ?? Colors.white,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                ),
          ),
      ],
    );
  }
}
