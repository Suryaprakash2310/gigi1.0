import { io, Socket } from "socket.io-client";

const SOCKET_URL = "https://gigiman1.onrender.com";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,  // Disable automatic connection, we will connect manually
  transports: ["websocket"],
});
