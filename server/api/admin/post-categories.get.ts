import { postCategoryController } from '../../controllers/post-category.controller';

export default defineEventHandler((event) => postCategoryController.getAdminPostCategories(event));
