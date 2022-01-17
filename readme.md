[<img src="https://assets.arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/inventory)

## [`@architect/inventory`](https://www.npmjs.com/package/@architect/inventory)

> Architect project resource enumeration utility

[![GitHub CI status](https://github.com/architect/inventory/workflows/Node%20CI/badge.svg)](https://github.com/architect/inventory/actions?query=workflow%3A%22Node+CI%22)


Inventory is responsible for interpreting the configuration and shape of a given Architect project, validating its settings, and representing it in a consistent intermediate format.


## Install

```
npm i @architect/inventory
```


## Usage

### `inventory(options[, callback]) → [Promise]`

Runs an inventory against your project. Must be passed an options object that may containing the following parameters:

- `cwd` - **String** - Absolute file path of the project being inventoried
- `env` - **Boolean** - Queries AWS infra to acquire environment variables for `testing`, `staging`, and `production` environments
- `layerValidation` - **Boolean** (default `true`) - Opt into skipping Lambda layer validation
- `rawArc` - **String** - Raw Architect project manifest string, intended for testing; providing this will ignore your local manifest
- `region` - **String** - Sets default AWS region; overrides default, but is overridden by `AWS_REGION` env var

Returns results via `callback`, or returns a `promise` if `callback` is falsy, and resolves with results.


### Inventory object

Inventory returns an object containing two parameters: `inv` (the project inventory object) and `get` (a getter helper for querying resources).


#### `inv`

The inventory object contains the entirety of a project's data, including Architect defaults, project defaults, inferred resources, userland settings layered from the project and function levels, local preferences, etc. **An inventory object should be considered the source of truth about the state of your project, and should not be directly mutated.**

Top-level inventory parameters that start with an underscore (e.g. `_arc`, `_project`) denote project metadata or internal diagnostic data; all other parameters represent userland project resources.

In a project inventory, `null` values are used as placeholders for known values or options that were not user-defined. The existence of a non-`null` value can be inferred as a user having specifically defined a setting. For example: `arc.http: null` can be construed as the user having **not** defined an `@http` pragma. This rule has some exceptions:

- A handful of settings that must be backfilled if not supplied
  - Example: `inv.aws.region`, which is required by the `aws-sdk` to function, and will be backfilled if not defined
- Pragmas that infer other pragmas
  - Example: while `@static` can be defined on its own without any other pragmas, the existence of `@http` infers `@static`
  - Thus, the act of adding `@http` will necessarily make `inv.static` non-`null`
- Settings that generate related resources
  - Example: DynamoDB streams can be defined in `@tables` with `stream true`; Inventory would interpret a table with `stream true` as a new `inv['tables-streams']` resource and thus make `inv['tables-streams']` non-`null`
- Lambda `handlerFile` file path property is present even if the file is not
  - This differs from Lambda `configFile` file path properties, which will be `null` if no file is present
  - This exception is namely because some workflows may need the computed default handler path (example: when running `arc create`)


#### `get`

You do not need to use the `get` helper to use a project's inventory, but `get` does make it much easier to check for the existence of resources, or find specific resources.

The `get` helper works as such: `get.{pragma or property}('parameter or name of resource')`. (Not including a parameter or resource name will fail in most cases.)

Examples:

```arc
@app
my-app

@http
get /

@events
event
```

```js
get.app()             // Returns my-app; same as accessing `inv.app`

get.http('get /')     // Returns `get /` resource data
get.http('get /foo')  // Returns undefined
get.http()            // Returns undefined

get.static('folder')  // Returns 'public' (default inferred by existence of @http); same as accessing `inv.app.static`

get.events('event')   // Returns `event` resource data

get.tables('data')    // Returns undefined
```


### `aws-sdk` caveat

Inventory conditionally requires `aws-sdk` if being used with the `env` param (e.g. `await inventory({ env: true })`). Early versions of Inventory included `aws-sdk` in `peerDependencies`, which prior to npm 7 would not automatically install `aws-sdk`. This is because Architect assumes you already have `aws-sdk` installed via Architect, or that it's available at runtime if you're using Inventory in a Lambda.

However, npm 7 (once again) changed the behavior of `peerDependencies`, now automatically installing all `peerDependencies` (instead of merely printing a reminder). This means any Lambdas that use Inventory would get a >50MB dependency payload if deployed on a machine with npm 7.

As such, Inventory now errors if the `env` param is set, and  `aws-sdk` is not installed. We are sorry to make this a userland issue, but we feel this is preferable to unnecessarily and invisibly causing `aws-sdk` to be installed in Lambdas.
