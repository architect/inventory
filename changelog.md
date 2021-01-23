# Architect Inventory changelog

---

## [1.2.3] 2021-01-22

### Added

- Added `name` param for `@indexes` pragma to allow explict naming of GSIs; thanks @anatomic!

---

## [1.2.2] 2021-01-04

### Added

- Added `@sandbox-startup` to preferences to replace the sometimes-wonky `@sandbox startup` setting, fixes #1032
- Added ability for `@static` buckets – otherwise enabled by default – to be disabled with `@static false`

---

## [1.2.1] 2020-12-05

### Added

- Adds `lambdasBySrcDir` param for looking up a Lambda by its source dir dir
  - Useful for when the only thing known about a Lambda is its source directory (see: hydration, direct deploys, etc.)
- Adds `inv._project.asapSrc` shortcut for getting the configured ASAP dist path

---

## [1.2.0] 2020-12-02

### Added

- Added new `@shared` pragma
- Customizable shared + views folders
- Added global preferences lookup (`~/.preferences.arc` + `~/.prefs.arc`, etc.) and global / local preference merging


### Changed

- Breaking change: `inv.views` shape has now changed
- Breaking change: `inv._project.preferencesFile` has been deprecated in favor of `inv._project.globalPreferencesFile` + `inv._project.localPreferencesFile`
- Deprecates legacy `localPaths` array (which has since been moved over to `lambdaSrcDirs`)

---

## [1.1.1] 2020-11-25

### Added

- Moved `@architect/asap` from Package into Inventory
- Added test case


### Fixed

- Fixed side effect of ASAP mutating default function configurations project-wide

---

## [1.1.0] 2020-11-23

### Added

- Added `@proxy` support
- Added `@views` support
- Added `@cdn` support
- Added `@http` `any`, `head`, and `options` method support
- Added `@http` `*` (catchall) syntax support
- Added async/await interface
- Added `config.arc` (formerly `.arc-config`) support for `@arc` settings
- Added `inventory._project.rootHandler` property for determining whether a user explicitly configured a root handler
- Added local preferences via `preferences.arc` or `prefs.arc`
- Added additional params to tables (`ttl`, `encrypt`, `PointInTimeRecovery`, `legacy`)
- Added ability to pass raw Architect manifest string (`rawArc`) for stateless Inventory runs
- Added ability to define JSON-formatted Architect manifest in `package.json` (via `arc` or `architect` param)


### Changed

- Moved `inventory.arc` metadata to `inventory._arc` (should we need to use an Architect-specific `@arc` pragma)
- Moved `inventory.project` metadata to `inventory._project` to better denote that it is indeed project metadata
- Renamed primary inventory output to `inv`
- Updated AWS SDK
- Getter returns arrays for certain pragmas that may have duplicative names (e.g. `@indexes`)


### Fixed

- Fixed issue with overwriting a Lambda's base config if Arc config is present
- Fixed missing `handlerFile` extension for deno functions
- Fixed legacy `@ws` folder pathing issue
- Fixed ASAP behavior to only be defined when `@http` is present, not `@static`
- Disabled shared files in ASAP
- Fixed issue where ASAP was overtaking `@proxy`
- Fixed manual override of queue fifo config
- Added graceful failure when attempting to read an empty manifest or config file

---

## [1.0.1 - 1.0.3] 2020-09-08

### Fixed

- Fixed issue where projects without `get /` would return an error during Lambda source dir population
- Fixed inventory rules around @http + @static inferring each other
- Fixed getter when accessing pragmas with null values

---

## [1.0.0] 2020-08-26

### Added

Here we go!

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
