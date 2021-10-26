# Architect Inventory changelog

---

## [2.1.1] 2021-10-13

### Added

- Added `config.runtimeAlias` property to Lambdas whose `config.runtime` is interpolated by way of latest-runtime aliasing (e.g. `node` or `py`)


### Changed

- Internal change: implement [Lambda runtimes module](https://www.npmjs.com/package/lambda-runtimes) instead of maintaining valid runtime list in Inventory


### Fixed

- Fixed `@scheduled` parsing in `app.json` + `package.json` > `arc.scheduled`

---

## [2.1.0] 2021-10-11

### Added

- Added latest-runtime version aliasing
  - Example: you want your app to always run the latest Lambda version of Python (instead of specifying `python3.9`(and changing it every time a new version of Python is released); now you can specify `python` or `py`
  - Valid shortcuts: Node.js: `node`, `nodejs`, `node.js`; Python: `python`, `py`; Ruby: `ruby`, `rb`; Java: `java`; Go: `go`, `golang`; .NET: `dotnet`, `.net`; and custom runtimes: `custom`
- Added runtime validation


### Changed

- Updated dependencies

---

## [2.0.7] 2021-09-30

### Added

- Added support for AWS's new Lambda `arm64` architecture via `@aws architecture` setting; default remains `x86_64`


### Changed

- Internal: removed unused `@tables` flag

---

## [2.0.6] 2021-09-14

### Changed

- Internal: Updated Architect Parser to v5

---

## [2.0.5] 2021-09-03

### Changed

- When a valid root handler is configured by the user, `inv._project.rootHandler` is no longer `configured`, and is instead the specific root handler's `name` property
  - Example: `@http get /` would result in `inventory._project.rootHandler` being `get /`


### Fixed

- Fix `@aws` `policies` + `layers` where multiple policies or layers listed in one line would ignore all but the first

---

## [2.0.0 - 2.0.4] 2021-07-22

### Changed

- Default runtime is now `nodejs14.x`, fixes #1164
- Breaking change: removed support for Node.js 10.x (now EOL, and no longer available to created in AWS Lambda) and Node.js 12.x
- Breaking change: removed support for Architect 5 WebSocket folder paths (prepended by `ws-`)
- Updated ASAP to v4
- Updated dependencies

---

## [1.4.2 - 1.4.4] 2021-06-20

### Added

- Include registry of all Architect pragmas + Lambda pragmas in `inventory.inv._arc.pragmas` metadata


### Changed

- Update deps


### Fixed

- Fixed error reporting for missing function dirs

---

## [1.4.1] 2021-06-20

### Fixed

- De-dupe `@shared` + `@views` items
- Fixed `@shared` + `@views` errors

---

## [1.4.0] 2021-06-03

### Added

- Adds comprehensive pragma-level validation
- Added structured `ARC_ERRORS` property to returned Inventory errors


### Changed

- Refactors error handling to support aggregation of multiple validation errors (instead of just one at a time, as before)
- 💯% unit test coverage
- Add support for @tables `pitr` option, start phasing out `PointInTimeRecovery` option (which is still supported for a while); fixes #1155
- Removes `aws-sdk` from `peerDependencies` to resolve large Lambda dependency payloads when Arc is run on machines using npm 7
  - See also: readme > `aws-sdk` caveat


### Fixed

- Fixed a bunch of smol bugs

---

## [1.3.3] 2021-05-24

### Added

- Plugins may implement either `pluginFunctions` or `functions` interface
    methods; both will be used.

---

## [1.3.2] 2021-04-21

### Fixed

- Fix weird behavior in `lambdasBySrcDir` when >2 functions are mapped to the same folder

---

## [1.3.1] 2021-03-22

### Changed

- Bumped utils dependency to 2.0.5.

---
## [1.3.0] 2021-02-08

### Added

- Added beta support for `plugins` pragma (see https://arc.codes/docs/en/guides/extend/architect-plugins)
  - `inventory.inv.plugins` houses all Lambdas created by plugins
  - `inventory._project.plugins` maps plugin names to plugin modules
- Wired up plugin modules into `lambdasBySrcDir` and `lambdaSrcDirs`
  - First steps towards allowing plugin authors to add their own Lambdas to arc projects

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
