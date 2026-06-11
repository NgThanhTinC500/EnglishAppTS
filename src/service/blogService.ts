import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Blog } from "../entity/Blog";
import { AppError } from "../utils/appError";

export class BlogService {
    private blogRepository: Repository<Blog>;

    constructor() {
        this.blogRepository = AppDataSource.getRepository(Blog);
    }

    async createBlog(blogData: Partial<Blog>): Promise<Blog> {
        const blog = this.blogRepository.create(blogData);
        return this.blogRepository.save(blog);
    }

    async getAllBlogs(includeUnpublished = false): Promise<Blog[]> {
        return this.blogRepository.find({
            where: includeUnpublished ? {} : { isPublished: true },
            relations: ["author"],
            order: { createdAt: "DESC" },
        });
    }

    async getBlogById(blogId: number, includeUnpublished = false): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: includeUnpublished
                ? { id: blogId }
                : { id: blogId, isPublished: true },
            relations: ["author"],
        });

        if (!blog) {
            throw new AppError("Blog không tồn tại", 404);
        }

        return blog;
    }

    async updateBlog(blogId: number, updateData: Partial<Blog>): Promise<Blog> {
        const blog = await this.getBlogById(blogId, true);
        Object.assign(blog, updateData);
        return this.blogRepository.save(blog);
    }

    async deleteBlog(blogId: number): Promise<void> {
        const result = await this.blogRepository.update(blogId, { isPublished: false });
        if (result.affected === 0) {
            throw new AppError("Blog không tồn tại", 404);
        }
    }
}
