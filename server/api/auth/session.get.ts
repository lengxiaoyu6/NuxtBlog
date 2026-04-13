import { authController } from '../../controllers/auth.controller';

export default defineEventHandler((event) => authController.session(event));
