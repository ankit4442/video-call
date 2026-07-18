import { io } from "socket.io-client";
 
const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL ||
  "https://video-call-server-h95a.onrender.com";
 
const socket = io(SOCKET_SERVER_URL, {
  transports: ["polling", "websocket"],
  upgrade: true,
  rememberUpgrade: false,
 
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
 
  timeout: 30000,
  autoConnect: true,
  withCredentials: true,
});
 
socket.on("connect", () => {
  console.log(
    "Socket connected successfully:",
    socket.id,
  );
 
  console.log(
    "Current transport:",
    socket.io.engine.transport.name,
  );
 
  socket.io.engine.on(
    "upgrade",
    (transport) => {
      console.log(
        "Transport upgraded to:",
        transport.name,
      );
    },
  );
});
 
socket.on("connect_error", (error) => {
  console.error(
    "Socket connection error:",
    error.message,
  );
});
 
socket.on("disconnect", (reason) => {
  console.log(
    "Socket disconnected:",
    reason,
  );
 
  if (
    reason === "io server disconnect"
  ) {
    socket.connect();
  }
});
 
socket.io.on(
  "reconnect_attempt",
  (attempt) => {
    console.log(
      "Socket reconnect attempt:",
      attempt,
    );
  },
);
 
socket.io.on(
  "reconnect",
  (attempt) => {
    console.log(
      "Socket reconnected:",
      attempt,
    );
  },
);
 
socket.io.on(
  "reconnect_error",
  (error) => {
    console.error(
      "Socket reconnect error:",
      error.message,
    );
  },
);
 
export default socket;
 
