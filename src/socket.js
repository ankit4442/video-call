// import { io } from "socket.io-client";

// const socket = io("https://video-call-server-h95a.onrender.com", {
//   transports: ["websocket"],
// });

// export default socket;



import { io } from "socket.io-client";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL ||
  "https://video-call-server-h95a.onrender.com";

const socket = io(SOCKET_SERVER_URL, {
  /*
   * WebSocket fail hone par polling fallback available rahega.
   */
  transports: ["websocket", "polling"],

  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  timeout: 20000,

  /*
   * Socket import hote hi connect ho jayega.
   */
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("Socket reconnect attempt:", attempt);
});

socket.io.on("reconnect", (attempt) => {
  console.log(
    "Socket reconnected successfully. Attempt:",
    attempt,
  );
});

socket.io.on("reconnect_error", (error) => {
  console.error("Socket reconnect error:", error);
});

socket.io.on("reconnect_failed", () => {
  console.error("Socket reconnection failed");
});

export default socket;
 
