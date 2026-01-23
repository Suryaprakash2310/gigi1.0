import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://172.17.17.98:5000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,  // Disable automatic connection, we will connect manually
  transports: ["websocket"],
});
