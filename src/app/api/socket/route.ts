import { NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { getSession } from "@/core/auth/session";

// Store the Socket.IO server instance
let io: SocketIOServer | null = null;

// Store connected clients by userId
const connectedClients = new Map<string, Set<string>>();

export async function GET(request: NextRequest) {
  // This is a WebSocket upgrade request
  if (request.headers.get("upgrade") !== "websocket") {
    return new NextResponse("Expected WebSocket upgrade", { status: 426 });
  }

  // Get the session to authenticate the connection
  const session = await getSession(request);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return new NextResponse("WebSocket server initialized", { status: 200 });
}

// Initialize Socket.IO server (called from instrumentation.ts or server setup)
export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    console.log("New WebSocket connection:", socket.id);

    // Handle authentication
    socket.on("authenticate", async (data) => {
      const { userId, installationId } = data;

      if (!userId) {
        socket.emit("error", { message: "Authentication required" });
        socket.disconnect();
        return;
      }

      // Store the socket connection
      socket.data.userId = userId;
      socket.data.installationId = installationId;

      // Add to connected clients
      if (!connectedClients.has(userId)) {
        connectedClients.set(userId, new Set());
      }
      connectedClients.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join installation-specific room if provided
      if (installationId) {
        socket.join(`installation:${installationId}`);
      }

      console.log(`User ${userId} authenticated with socket ${socket.id}`);

      // Send authentication success
      socket.emit("authenticated", {
        userId,
        installationId,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("WebSocket disconnected:", socket.id);

      const userId = socket.data.userId;
      if (userId && connectedClients.has(userId)) {
        connectedClients.get(userId)!.delete(socket.id);
        if (connectedClients.get(userId)!.size === 0) {
          connectedClients.delete(userId);
        }
      }
    });
  });

  return io;
}

// Broadcast auth events to connected clients
export function broadcastAuthEvent(
  event: "login" | "logout" | "install" | "uninstall",
  data: {
    userId: string;
    installationId?: string;
    appId?: string;
    timestamp?: number;
  }
) {
  if (!io) {
    console.warn("Socket.IO server not initialized");
    return;
  }

  const eventData = {
    ...data,
    timestamp: data.timestamp || Date.now(),
  };

  // Broadcast to user's rooms
  io.to(`user:${data.userId}`).emit(`auth:${event}`, eventData);

  // If installation-specific, also broadcast to installation room
  if (data.installationId) {
    io.to(`installation:${data.installationId}`).emit(`auth:${event}`, eventData);
  }

  console.log(`Broadcasted auth:${event} to user ${data.userId}`, eventData);
}

// Get Socket.IO server instance
export function getSocketServer(): SocketIOServer | null {
  return io;
}