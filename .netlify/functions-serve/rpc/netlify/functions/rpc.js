"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/rpc.js
var rpc_exports = {};
__export(rpc_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(rpc_exports);
var RPC_URLS = [
  "https://rpc.mainnet.arc.io/",
  "https://rpc.blockdaemon.mainnet.arc.io/",
  "https://rpc.drpc.mainnet.arc.io/",
  "https://rpc.quicknode.mainnet.arc.io/"
];
async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: 405, message: "Method not allowed" } })
    };
  }
  let body;
  try {
    body = JSON.parse(event.body || "null");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: 400, message: "Invalid JSON body" } })
    };
  }
  for (const url of RPC_URLS) {
    try {
      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (upstream.ok) {
        const data = await upstream.json();
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        };
      }
    } catch {
    }
  }
  return {
    statusCode: 502,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: 502, message: "All Arc RPC endpoints unavailable" } })
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=rpc.js.map
