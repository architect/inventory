# Architect Inventory changelog

---

## [-] 2020-10-11

### Added

- Added `@proxy` support
- Added `@views` support
- Added `@cdn` support
- Added `@http` `any`, `head`, and `options` method support
- Added `@http` `*` (catchall) syntax support
- Added async/await interface
- Added `config.arc` (formerly `.arc-config`) support for `@arc` settings


### Changed

- Moved `inventory.arc` metadata to `inventory._arc` (should we need to use an Architect-specific `@arc` pragma)
- Moved `inventory.project` metadata to `inventory._project` to better denote that it is indeed project metadata


### Fixed

- Fixed issue with overwriting a Lambda's base config if Arc config is present
- Fixed missing `handlerFile` extension for deno functions
- Fixed legacy `@ws` folder pathing issue

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
