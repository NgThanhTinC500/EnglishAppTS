    import { CommentService } from "../../service/commentService";

    export function registerCommentSocket(io, socket) {
        const commentService = new CommentService();
        // JOIN ROOM
        socket.on("comment:join", (lectureId: number) => {
            // TẠO ROOM
            socket.join(`lecture:${lectureId}`);
        });
        socket.on("comment:send", async (data: {
            lectureId: number;
            userId: string;
            content: string;
            parentCommentId?: number | null;
        }) => {
            try {
                const comment = await commentService.createComment(
                    data.lectureId,
                    data.userId,
                    data.content,
                    data.parentCommentId ?? undefined
                );
                // Broadcast cho tất cả user trong room
                io.to(`lecture:${data.lectureId}`).emit("comment:new", comment);
            } catch (error) {
                socket.emit("comment:error", { message: "Gửi comment thất bại" + error });
            }
        });


        // LEAVE ROOM
        socket.on("comment:leave", (lectureId: number) => {
            socket.leave(`lecture:${lectureId}`);
        });
    }
