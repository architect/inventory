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
var RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*("[^"]*"|'[^']*'|.*?)(\s+#.*)?$/;
var RE_NEWLINES = /\\n/g;
var NEWLINES_MATCH = /\r\n|\n|\r/;
function parse(src, options) {
  const debug = Boolean(options && options.debug);
  const multiline = Boolean(options && options.multiline);
  const obj = {};
  const lines = src.toString().split(NEWLINES_MATCH);
  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx];
    const keyValueArr = line.match(RE_INI_KEY_VAL);
    if (keyValueArr != null) {
      const key = keyValueArr[1];
      let val = keyValueArr[2] || "";
      let end = val.length - 1;
      const isDoubleQuoted = val[0] === '"' && val[end] === '"';
      const isSingleQuoted = val[0] === "'" && val[end] === "'";
      const isMultilineDoubleQuoted = val[0] === '"' && val[end] !== '"';
      const isMultilineSingleQuoted = val[0] === "'" && val[end] !== "'";
      if (multiline && (isMultilineDoubleQuoted || isMultilineSingleQuoted)) {
        const quoteChar = isMultilineDoubleQuoted ? '"' : "'";
        val = val.substring(1);
        while (idx++ < lines.length - 1) {
          line = lines[idx];
          end = line.length - 1;
          if (line[end] === quoteChar) {
            val += NEWLINE + line.substring(0, end);
            break;
          }
          val += NEWLINE + line;
        }
      } else if (isSingleQuoted || isDoubleQuoted) {
        val = val.substring(1, end);
        if (isDoubleQuoted) {
          val = val.replace(RE_NEWLINES, NEWLINE);
        }
      } else {
        val = val.trim();
      }
      obj[key] = val;
    } else if (debug) {
      const trimmedLine = line.trim();
      if (trimmedLine.length && trimmedLine[0] !== "#") {
        log(`Failed to match key and value when parsing line ${idx + 1}: ${line}`);
      }
    }
  }
  return obj;
}
function resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function config(options) {
  let dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);
  const multiline = Boolean(options && options.multiline);
  if (options) {
    if (options.path != null) {
      dotenvPath = resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }
  try {
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }), { debug, multiline });
    Object.keys(parsed).forEach(function(key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key];
      } else {
        if (override === true) {
          process.env[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            log(`"${key}" is already defined in \`process.env\` and WAS overwritten`);
          } else {
            log(`"${key}" is already defined in \`process.env\` and was NOT overwritten`);
          }
        }
      }
    });
    return { parsed };
  } catch (e) {
    if (debug) {
      log(`Failed to load ${dotenvPath} ${e.message}`);
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
