import { Server as HTTPServer } from "http";
import * as jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { JwtPayload } from "../interface/jwtPayload.interface";
import { getCorsOrigin } from "../utils/httpConfig";
import { registerCommentSocket } from "./handlers/comment.handler";

let ioInstance: Server | null = null;

const getTokenFromSocket = (socket: Socket): string | undefined => {
    const authToken = socket.handshake.auth?.token;
    const authorization = socket.handshake.headers.authorization;
    const cookieHeader = socket.handshake.headers.cookie;

    if (typeof authToken === "string" && authToken) {
        return authToken.startsWith("Bearer ") ? authToken.split(" ")[1] : authToken;
    }

    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
        return authorization.split(" ")[1];
    }

    if (typeof cookieHeader === "string") {
        const jwtCookie = cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) => cookie.startsWith("jwt="));

        if (jwtCookie) {
            return decodeURIComponent(jwtCookie.split("=")[1]);
        }
    }

    return undefined;
};

const authenticateSocket = async (socket: Socket): Promise<User | null> => {
    const token = getTokenFromSocket(socket);

    if (!token) {
        return null;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT secret is not configured");
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    const user = await AppDataSource.getRepository(User).findOne({
        where: { id: decoded.id, isActive: true },
    });

    return user ?? null;
};

export const emitToUser = (
    userId: string,
    eventName: string,
    payload: Record<string, unknown>
): void => {
    ioInstance?.to(`user:${userId}`).emit(eventName, payload);
};

export const initSocket = (server: HTTPServer): void => {
    const io = new Server(server, {
        cors: {
            origin: getCorsOrigin(),
            credentials: true,
        },
    });
    ioInstance = io;

    io.use(async (socket, next) => {
        try {
            const user = await authenticateSocket(socket);

            if (user) {
                socket.data.user = user;
            }

            next();
        } catch {
            next(new Error("Unauthorized socket connection"));
        }
    });

    io.on("connection", (socket) => {
        console.log("a user connected:", socket.id);

        // Socket đã xác thực sẽ vào room riêng để nhận notification cá nhân.
        if (socket.data.user?.id) {
            socket.join(`user:${socket.data.user.id}`);
        }

        registerCommentSocket(io, socket);

        socket.on("disconnect", () => {
            console.log("user disconnected:", socket.id);
        });
    });
};
