const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketIOServer } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store connected clients by userId
const connectedClients = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // Store io instance globally
  global.io = io;

  io.on("connection", (socket) => {
    console.log("[WebSocket] New connection:", socket.id);

    // Handle authentication
    socket.on("auth:connect", async (data) => {
      const { userId, installationId, accessToken } = data;

      if (!userId || !accessToken) {
        socket.emit("auth:error", { message: "Authentication required" });
        return;
      }

      // Store the socket connection
      socket.data.userId = userId;
      socket.data.installationId = installationId;
      socket.data.accessToken = accessToken;

      // Add to connected clients
      if (!connectedClients.has(userId)) {
        connectedClients.set(userId, new Set());
      }
      connectedClients.get(userId).add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join installation-specific room if provided
      if (installationId) {
        socket.join(`installation:${installationId}`);
      }

      console.log(`[WebSocket] User ${userId} authenticated`);

      // Send authentication success
      socket.emit("auth:connected", {
        userId,
        installationId,
        connected: true,
        timestamp: Date.now(),
      });

      // Notify other clients about the connection
      socket.to(`user:${userId}`).emit("auth:user-connected", {
        userId,
        installationId,
        timestamp: Date.now(),
      });
    });

    // Handle app installation
    socket.on("app:installed", (data) => {
      const { userId, installationId, appId } = data;

      // Broadcast to all user's connections
      io.to(`user:${userId}`).emit("auth:app-installed", {
        installationId,
        appId,
        timestamp: Date.now(),
      });
    });

    // Handle app uninstallation
    socket.on("app:uninstalled", (data) => {
      const { userId, installationId, appId } = data;

      // Broadcast to all user's connections
      io.to(`user:${userId}`).emit("auth:app-uninstalled", {
        installationId,
        appId,
        timestamp: Date.now(),
      });
    });

    // Handle logout
    socket.on("auth:logout", (data) => {
      const { userId } = data;

      // Broadcast logout to all user's connections
      io.to(`user:${userId}`).emit("auth:logout", {
        userId,
        timestamp: Date.now(),
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected:", socket.id);

      const userId = socket.data.userId;
      if (userId && connectedClients.has(userId)) {
        connectedClients.get(userId).delete(socket.id);
        if (connectedClients.get(userId).size === 0) {
          connectedClients.delete(userId);
        }

        // Notify other clients about the disconnection
        socket.to(`user:${userId}`).emit("auth:user-disconnected", {
          userId,
          timestamp: Date.now(),
        });
      }
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}`);
  });
});