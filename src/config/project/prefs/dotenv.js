// Copyright (c) 2015, Scott Motte
// All rights reserved.

/* istanbul ignore file */
/* eslint-disable */
// node_modules/dotenv/lib/main.js
var fs = require("fs");
var path = require("path");
var os = require("os");
function log(message) {
  console.log(`[dotenv][DEBUG] ${message}`);
}
var NEWLINE = "\n";
var RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;
var RE_NEWLINES = /\\n/g;
var NEWLINES_MATCH = /\r\n|\n|\r/;
function parse(src, options) {
  const debug = Boolean(options && options.debug);
  const obj = {};
  src.toString().split(NEWLINES_MATCH).forEach(function(line, idx) {
    const keyValueArr = line.match(RE_INI_KEY_VAL);
    if (keyValueArr != null) {
      const key = keyValueArr[1];
      let val = keyValueArr[2] || "";
      const end = val.length - 1;
      const isDoubleQuoted = val[0] === '"' && val[end] === '"';
      const isSingleQuoted = val[0] === "'" && val[end] === "'";
      if (isSingleQuoted || isDoubleQuoted) {
        val = val.substring(1, end);
        if (isDoubleQuoted) {
          val = val.replace(RE_NEWLINES, NEWLINE);
        }
      } else {
        val = val.trim();
      }
      obj[key] = val;
    } else if (debug) {
      log(`did not match key and value when parsing line ${idx + 1}: ${line}`);
    }
  });
  return obj;
}
function resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function config(options) {
  let dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  const debug = Boolean(options && options.debug);
  if (options) {
    if (options.path != null) {
      dotenvPath = resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }
  try {
    const parsed = parse(fs.readFileSync(dotenvPath, { encoding }), { debug });
    Object.keys(parsed).forEach(function(key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key];
      } else if (debug) {
        log(`"${key}" is already defined in \`process.env\` and will not be overwritten`);
      }
    });
    return { parsed };
  } catch (e) {
    return { error: e };
  }
}
module.exports.config = config;
module.exports.parse = parse;
