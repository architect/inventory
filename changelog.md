# Architect Inventory changelog

---

## [6.1.0] 2026-01-08

### Added

- Added `batchSize`, `batchWindow` support to `@queues`
  - Ensure `fifo`, `batchSize`, `batchWindow` are top-level `@queues` semantics properties

---

## [6.0.0] 2026-01-08

### Changed

- Breaking change: dropped Node.js 20 support

---

## [5.0.0] 2025-09-24

### Changed

- Breaking change: dropped Node.js 16, 18 support
- Updated deps
- Moved to Node.js native test runner

---

## [4.0.9] 2025-04-26

### Fixed

- Error out if imported plugin has no discernable plugin API implementation; added in [#83](https://github.com/architect/inventory/pull/83) by @andybee, thanks!

---

## [4.0.8] 2025-04-05

### Fixed

- Fixes [architect/architect#1478](https://github.com/architect/architect/issues/1478): support for loading plugins implemented as `index.mjs` under a plugin folder name

---

## [4.0.7] 2025-03-21

### Fixed

- Fixed support for loading ESM plugins in node v20.19 (which now supports `require()` of ESM modules)

## [4.0.6] 2025-01-17

### Changed

- Add support for new ESM-only import error message when importing plugins in Node.js 22; thanks @lpsinger!

---

## [4.0.5] 2024-04-29

### Changed

- Updated dependencies
- Updated `package.json` `engines.node` property to reflect changes from v4

---

## [4.0.4] 2024-03-25

### Changed

- Updated dependencies

---

## [4.0.3] 2024-02-07

### Changed

- Updated `aws-lite`

---

## [4.0.1 - 4.0.2] 2024-02-03

### Fixed

- Fixed format of `@sandbox-start` pragma in preferences (which is preferred to `@sandbox-startup`)

---

## [4.0.0] 2024-01-08

### Changed

- Transitioned from `aws-sdk` to [`aws-lite`](https://aws-lite.org)
- Breaking change: `arm64` is now the default Lambda architecture
- Breaking change: `nodejs20.x` and `python3.12` are now the default Node.js and Python Lambda runtimes, respectively
- Breaking change: removed support for Node.js 14.x (now EOL, and no longer available to created in AWS Lambda)
- AWS Lambda no longer supports Go-specific runtimes; as such, `go` and `golang` runtime aliases are no longer available
- Added Node.js 20.x to test matrix

---

## [3.6.5] 2023-12-07

### Changed

- Internal updates and test suite fixes to enable Node.js 20.x testing

---

## [3.6.4] 2023-12-02

### Changed

- Updated dependencies


### Fixed

- Fix HTTP route sorting issue where trailing catchalls win over trailing params; fixes #1467

---

## [3.6.3] 2023-11-19

### Changed

- Updated dependencies

---

## [3.6.2] 2023-10-23

### Added

- Added ability for unknown function-level configuration settings to be arrays / vectors

---

## [3.6.1] 2023-08-15

### Fixed

- Fixed AWS Lambda handler configuration for Python, Ruby, and custom handlers

---

## [3.6.0] 2023-08-02

### Added

- Added support for additional Python + Ruby Lambda handler filenames, including:
  - Python: `lambda.py`, `handler.py` (and legacy `index.py`)
  - Ruby: `lambda.rb`, `handler.rb` (and legacy `index.rb`)

---

## [3.5.7] 2023-07-09

### Changed

- Allow lowcase `ttl` `@tables` property type

---

## [3.5.6] 2023-06-21

### Fixed

- Improved path validation for multi-tenant Lambdae

---

## [3.5.5] 2023-06-15

### Changed

- Updated dependencies

---

## [3.5.4] 2023-06-14

### Fixed

- Fixed subtle `@http` sorting issue where path params may be prioritized over paths with static URL parts in the same position

---

## [3.5.3] 2023-04-24

### Changed

- Compiled runtimes now default to `provided.al2`, and no longer require a `baseRuntime` specified by the Arc runtime plugin

---

## [3.5.0 - 3.5.2] 2023-03-27

### Added

- Added support for `create` plugin API
- Added support for `buildSubpath` property for `compiled` runtime plugins
- Added map of custom runtimes to plugin names in `inv._project.runtimePlugins.customRuntimes`


### Changed

- Unpinned `aws-sdk` from Lambda-specific version to enable SSO and resolve (unrelated) npm vulnerability warnings

---

## [3.4.3] 2023-04-07

### Changed

- Retired `nodejs12.x` related logic (deprecated in Lambda 2023-03-31)

---

## [3.4.2] 2023-02-02

### Fixed

- Fixed issue where an `index.mjs` handler in the project root would not be properly detected if a `package.json` file is present (which it almost certainly would be)

---

## [3.4.1] 2023-01-25

### Added

- Added plugin ES module support for ES2020+ syntax, `node:*` imports, etc.; fixes #1401
- Added support for loading ESM plugins via `package.json` `"type": "module"`, respecting `main`, etc.

---

## [3.4.0] 2023-01-18

### Added

- Added support for plugins authored as ES modules; retains support for plugins authored as CommonJS modules
- Added support for specifying DynamoDB index projection attributes; incremental support for [#1083](https://github.com/architect/architect/issues/1083)

---

## [3.3.5] 2023-01-05

### Added

- `set.static` plugins now merge `ignore` patterns with userland `ignore` settings (if present)

---

## [3.3.4] 2022-11-24

### Added

- Added Node.js 18.x to test matrix


### Changed

- Updated default runtime to `nodejs16.x`
- Updated dependencies

---

## [3.3.3] 2022-11-15

### Fixed

- Fixed issue where projects with plugins that define >1 transpiled Lambdas would all build to the same directory; thanks @Scorsi!
- Fixed issue where plugins may not be found if attempted to be loaded from a subfolder in a monorepo; thanks @Scorsi!

---

## [3.3.2] 2022-10-19

### Fixed

- Fixed issue where `@static spa true` setting wouldn't be respected when the root handler is not explicitly defined; thanks @oliverturner!

---

## [3.3.1] 2022-10-15

### Fixed

- Fixed issue where `set.http` plugins would not have `config.views` respected if set to `false`

---

## [3.3.0] 2022-09-06

### Changed

- Node 14+ Lambda handler selection now defaults to ESM (unless otherwise specified)

---

## [3.2.2] 2022-08-20

### Changed

- Enabled `hydrate` plugin API support

---

## [3.2.1] 2022-08-10

### Changed

- By default, when a `set.shared|views` plugin sets a `src` path, if it is not present on the filesystem, Inventory falls back to default paths (e.g. `src/shared|views`)
  - `set.shared|views` plugins now accept a `required` flag to enforce a validation error should a `src` path conflict with the project manifest (or not be found on the filesystem)


### Fixed

- Fixed an obscure internal reference passing bug in `set.proxy|shared|static|views` plugins

---

## [3.2.0] 2022-07-24

### Added

- Added support for new setter plugin APIs, specifically: `@proxy`, `@shared`, `@static`, `@tables`, `@tables-indexes`, `@views`
- Added new `@static` setting: `compression`


### Changed

- Lambdas defined in the userland Architect project manifest now override conflicting Lambdas returned by plugins (instead of throwing validation errors); fixes #1352
  - Plugin developers can now use a `required` flag to enforce a validation error should their plugin conflict with userland Lambdas
- `@tables` and `@tables-indexes` can now accept lower case key types (e.g. `*string` instead of `*String`)
- `@tables` and `@tables-indexes` can also accept `*` and `**` as a shortcut for string-type primary and sort keys
- Changed plugin function property tags from `plugin|type` to `_plugin|_type` to indicate internal property namespacing
- Added `@static` pragma validation
- Fixed obscure case where `@static` `ignore` setting might only use the first list item


### Fixed

- Fixed issue where Lambdas created by plugins that returned arrays did not have their `plugin` and `type` properties set
- Fixed issue where an absolute path in `@shared|views` `src` would incorrectly resolve
- Fixed issue where `@views` might incorrectly return a validation error when only HTTP setter plugins are used to define `@http` routes

---

## [3.1.1] 2022-05-09

### Changed

- Updated dependencies; `lambda-runtimes` enables `nodejs16.x`

---

## [3.1.0] 2022-03-24

### Added

- Added support for configuring Lambda's ephemeral storage feature

---

## [3.0.0] 2022-01-04

### Added

- Architect 10 plugin API support! Specifically:
  - `plugins.set.runtimes` - custom runtime support (still in beta)
  - `plugins.set.env` - add environment variables to all Lambdas
  - `plugins.set.events|http|scheduled|tables-streams|ws` - generate or drop in Lambdas in Architect pragmas
  - `plugins.set.customLambdas` - generate or drop in unique Lambdas with custom event sources
  - More below...
- Added `inv|get.plugins` tree + methods
  - What used to be `plugins` in the plugins beta is now `customLambdas` (see next item)
- Added `inv|get.customLambdas`
  - Formerly `inv|get.plugins`
- Added `inv._project.customRuntimes`
- Added low-level support for `build` destinations to runtime plugins that register type `transpiled` or `compiled`
- Added `handlerModuleSystem` property for `nodejs14.x` Lambdas, with a value of `cjs` or `esm` based on Lambda + Node.js conventions
- Added `handlerFile` detection for `nodejs14.x` + `deno` Lambdas
  - This will detect the correct handler file on the filesystem, and fall back to a default handler file if none are found (e.g. `index.js` in `nodejs14.x`)
- Added `inv._arc.deployStage` property, enabling Inventory to be aware of an intended deploy stage; (this property may change, consider it in beta!)
- Added built-in support for reading `.env` files when enumerating local env var preferences


### Changed

- Breaking change: changed `_project.src`, added `_project.cwd`, making both the pair significantly more literal and descriptive
  - `_project.src` is now the default source tree folder (eg `$cwd/src`)
  - `_project.cwd` refers to the current working directory of the project
- Breaking change: `_project.env` is now by default an object populated by three properties: `local`, `plugins`, and `aws`, reflecting the env vars found for each environment
- Breaking change: AWS region prioritizes a region passed via param over `AWS_REGION` env var; this should realistically have little or no effect in practice
- Breaking change: legacy `@tables-streams` folders (`src/tables/...` and `src/streams/...`) are now deprecated
  - Existing functions can be simply moved to `src/tables-streams/{name}` (or use a custom `src` property)
- Breaking change: renamed `lambda.handlerFunction` to `lambda.handlerMethod`
- Breaking change: prioritize `mod.ts|js` handlers in Deno Lambdas
- Breaking change: removed `toml` support
- Breaking change: removed `get.macros` method; as `@macros` are now automatically mapped to the Architect plugins, you can simply use `get.plugins` instead
- Performance improvements to building `inv.shared` + `inv.views`
- Improved memory footprint of Inventory object by preserving references in `lambdaSrcDirs`, `lambdasBySrcDir`
  - Added `pragma` property to all Lambdas to aid in reference preservation
- Tidy up order of enumerated properties in each Lambda
Update CI
- Stop publishing to the GitHub Package registry


### Fixed

- Added file path validation because `aws-sdk` blows up on !ascii paths; fixes #1292, thanks @GustMartins!
- Fixed env var validation from preference files
- Fixed error bubbling when reading a preferences file with issues

---

## [2.2.1] 2021-11-22

### Fixed

- Fixed HTTP route sorting; however you've organized your `@http` pragma, Sandbox should now behave much more like API Gateway; fixes #977
- Fixed overly strict path parameter validation; allow `_`, `.`, `-`; thanks @jkarsrud!

---

## [2.2.0] 2021-11-16

### Added

- Finally formalized `@tables-streams`, the fully customizable successor to `@tables` with `stream true`
- Added `@tables-indexes` pragma
  - `@tables-indexes` has identical semantics as (and will eventually supersede) `@indexes`
  - Until Arc 10.0 + Inventory 3.0, consumers should now check both `inv.indexes` AND `inv.tables-indexes`

---

## [2.1.3] 2021-11-04

### Fixed

- Hardened runtime validation by ensuring non-string values will fail gracefully

---

## [2.1.2] 2021-10-28

### Added

- Added memory / timeout configuration validation


### Changed

- Improved layer validation error formatting

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
