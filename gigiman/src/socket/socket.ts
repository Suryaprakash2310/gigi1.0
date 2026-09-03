import { SOCKET_URL } from "@/utils/config/env";
import { io, Socket } from "socket.io-client";



export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,  // Disable automatic connection, we will connect manually
  transports: ["websocket"],
});
