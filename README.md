# Sumith Bhandari — Portfolio

Personal portfolio built with Flutter web.

- Live: https://sumithsb.github.io/portfolio/
- Content lives in `lib/widgets/*_section.dart`
- CVs are bundled from the repo root (see `pubspec.yaml` assets)

## Run locally

```sh
flutter pub get
flutter run -d chrome
```

## Checks

```sh
flutter analyze
flutter test
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy-pages.yml`, which analyzes, tests,
builds with `--base-href /portfolio/` and publishes to the `pages` branch.
