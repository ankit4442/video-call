import { io } from "socket.io-client";

const socket = io("https://video-call-server-h95a.onrender.com", {
  transports: ["websocket"],
});

export default socket;