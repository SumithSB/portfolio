/// Responsive breakpoints and layout helpers.
/// Use with MediaQuery.of(context).size.width.
class LayoutConstants {
  LayoutConstants._();

  /// Very small phones: extra compact padding.
  static const double smallMobileBreakpoint = 400;

  /// Mobile: single column, hamburger menu.
  static const double mobileBreakpoint = 768;

  /// Tablet: 2-column layouts where applicable.
  static const double tabletBreakpoint = 1024;

  /// Only constrain content width above this (so tablets use full width).
  static const double contentMaxWidthBreakpoint = 1280;

  /// Max content width when constrained (large desktops).
  static const double maxContentWidth = 1200;

  /// Horizontal padding by breakpoint (consistent across sections).
  static double horizontalPadding(double width) {
    if (width < smallMobileBreakpoint) return 16;
    if (width < mobileBreakpoint) return 20;
    if (width < tabletBreakpoint) return 32;
    return 48;
  }

  /// Section vertical padding (reduced on mobile for less scroll).
  static double verticalPadding(double width) {
    if (width < smallMobileBreakpoint) return 32;
    if (width < mobileBreakpoint) return 40;
    if (width < tabletBreakpoint) return 56;
    return 80;
  }

  /// Project card height in grid (responsive).
  static double projectCardHeight(double width) {
    if (width < mobileBreakpoint) return 420;
    if (width < tabletBreakpoint) return 460;
    return 500;
  }

  /// Grid/main spacing between items.
  static double gridSpacing(double width) {
    if (width < mobileBreakpoint) return 20;
    if (width < tabletBreakpoint) return 24;
    return 32;
  }

  static bool isSmallMobile(double width) => width < smallMobileBreakpoint;
  static bool isMobile(double width) => width < mobileBreakpoint;
  static bool isTablet(double width) =>
      width >= mobileBreakpoint && width < tabletBreakpoint;
  static bool isDesktop(double width) => width >= tabletBreakpoint;
  static bool shouldConstrainContent(double width) =>
      width > contentMaxWidthBreakpoint;
}
