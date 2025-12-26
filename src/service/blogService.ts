import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";
import * as fs from 'fs';
import * as path from 'path';
import { Blog } from "../entity/Blog";

export class BlogService {
    private blogRepository: Repository<Blog>

    constructor() {
        this.blogRepository = AppDataSource.getRepository(Blog);
    }

    async createBlog(blogData: Partial<Blog>) {
        const blog = this.blogRepository.create(blogData);
        return this.blogRepository.save(blog);
    }

    async getAllBlogs() {
        return await this.blogRepository.find({
            where: { isPublished: true },
            relations: ["author"],
        });
    }
    async updateBlog(blogId: number, updateData: Partial<Blog>) {
        const blog = await this.blogRepository.findOne({
            where: { id: blogId }
        });
        if (!blog) {
            return null;
        }
        // copy từ updateData vào blog
        Object.assign(blog, updateData);
        return await this.blogRepository.save(blog);
    }

    async deleteBlog(id: number) {
        const result = await this.blogRepository.update(id, { isPublished: false });

        if (result.affected === 0) {
            return null; // Không có blog nào bị ảnh hưởng → ID không tồn tại
        }

        return true;
    }



}