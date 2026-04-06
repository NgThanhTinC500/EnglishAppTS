import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { registerCommentSocket } from "./handlers/comment.handler";

export const initSocket = (server: HTTPServer): void => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        // tách logic ra module
        registerCommentSocket(io, socket);

        socket.on("disconnect", () => {
            console.log("user disconnected:", socket.id);
        });
    });
};