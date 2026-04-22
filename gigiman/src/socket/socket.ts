import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://10.242.126.29:4000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,  // Disable automatic connection, we will connect manually
  transports: ["websocket"],
});
