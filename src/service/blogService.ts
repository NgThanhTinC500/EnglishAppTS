import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Blog } from '../entity/Blog';
import { AppError } from '../utils/appError';

export class BlogService {
    private blogRepository: Repository<Blog>;

    constructor() {
        this.blogRepository = AppDataSource.getRepository(Blog);
    }

    async createBlog(blogData: Partial<Blog>): Promise<Blog> {
        const blog = this.blogRepository.create(blogData);
        return this.blogRepository.save(blog);
    }

    async getAllBlogs(): Promise<Blog[]> {
        return this.blogRepository.find({
            where: { isPublished: true },
            relations: ['author'],
        });
    }

    async getBlogById(blogId: number): Promise<Blog> {
        const blog = await this.blogRepository.findOne({
            where: { id: blogId },
            relations: ['author'],
        });
        if (!blog) {
            throw new AppError('Blog not found', 404);
        }
        return blog;
    }

    async updateBlog(blogId: number, updateData: Partial<Blog>): Promise<Blog> {
        const blog = await this.getBlogById(blogId); // ném AppError nếu không tìm thấy
        Object.assign(blog, updateData);
        return this.blogRepository.save(blog);
    }

    async deleteBlog(blogId: number): Promise<void> {
        const result = await this.blogRepository.update(blogId, { isPublished: false });
        if (result.affected === 0) {
            throw new AppError('Blog not found', 404);
        }
    }
}