// Copyright (c) 2015, Scott Motte
// All rights reserved.

/* istanbul ignore file */
/* eslint-disable */
// node_modules/dotenv/lib/main.js
var fs = require("fs");
var path = require("path");
var os = require("os");
var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function parse(src) {
  const obj = {};
  let lines = src.toString();
  lines = lines.replace(/\r\n?/mg, "\n");
  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];
    let value = match[2] || "";
    value = value.trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }
    obj[key] = value;
  }
  return obj;
}
function _log(message) {
  console.log(`[dotenv][DEBUG] ${message}`);
}
function _resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function config(options) {
  let dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);
  if (options) {
    if (options.path != null) {
      dotenvPath = _resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }
  try {
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));
    Object.keys(parsed).forEach(function(key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key];
      } else {
        if (override === true) {
          process.env[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            _log(`"${key}" is already defined in \`process.env\` and WAS overwritten`);
          } else {
            _log(`"${key}" is already defined in \`process.env\` and was NOT overwritten`);
          }
        }
      }
    });
    return { parsed };
  } catch (e) {
    if (debug) {
      _log(`Failed to load ${dotenvPath} ${e.message}`);
    }
    return { error: e };
  }
}
var DotenvModule = {
  config,
  parse
};
module.exports.config = DotenvModule.config;
module.exports.parse = DotenvModule.parse;
module.exports = DotenvModule;
