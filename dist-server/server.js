"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/socket.ts
var setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("message", (msg) => {
      socket.emit("message", {
        text: `Echo: ${msg.text}`,
        senderId: "system",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
    socket.emit("message", {
      text: "Welcome to WebSocket Echo Server!",
      senderId: "system",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
};

// server.ts
var import_http = require("http");
var import_socket2 = require("socket.io");
var import_next = __toESM(require("next"));
var dev = false;
var currentPort = process.env.PORT ? parseInt(process.env.PORT) : 3002;
var hostname = "127.0.0.1";
async function createCustomServer() {
  try {
    const nextApp = (0, import_next.default)({
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? void 0 : { distDir: "./.next" }
    });
    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();
    const server = (0, import_http.createServer)((req, res) => {
      if (req.url?.startsWith("/api/socketio")) {
        return;
      }
      handle(req, res);
    });
    const io = new import_socket2.Server(server, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    setupSocket(io);
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
    });
    const shutdown = (signal) => {
      console.log(`
${signal} received. Closing server gracefully...`);
      io.close(() => {
        console.log("Socket.IO server closed");
      });
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("Forcing shutdown after timeout");
        process.exit(1);
      }, 5e3);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    if (process.platform === "win32") {
      process.on("SIGBREAK", () => shutdown("SIGBREAK"));
    }
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}
createCustomServer();
//# sourceMappingURL=server.js.map
