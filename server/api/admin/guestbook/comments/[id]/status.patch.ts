import { guestbookController } from '../../../../../controllers/guestbook.controller';

export default defineEventHandler((event) => guestbookController.updateAdminGuestbookCommentStatus(event));
