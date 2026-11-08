# Changelog

All notable changes to Weeks are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-11-08

First public release.

### Added
- New tab page that shows your life as a grid of weeks: one row per year of age, 52 squares per row.
- Squares fill when a new week starts (Sunday or Monday, your choice). The square that just filled blinks slowly for the first two days of the week, with a "One week older" note.
- Stats: weeks left, weeks lived, age, week of the year, percent of life lived.
- Rules view: up to 12 short personal rules, saved as you type. One rule shows on every new tab.
- Hover any square to see the dates it covers.
- Settings: date of birth, life expectancy (1 to 120 years), week start day, and "Delete all my data".
- Data saved in `chrome.storage.sync`, so it follows your Chrome profile. Open tabs update live.
- Bundled IBM Plex fonts. No network requests.

[Unreleased]: https://github.com/authenticryan/weeks/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/authenticryan/weeks/releases/tag/v1.0.0
