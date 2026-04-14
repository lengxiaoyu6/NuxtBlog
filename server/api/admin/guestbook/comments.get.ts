import { guestbookController } from '../../../controllers/guestbook.controller';

export default defineEventHandler((event) => guestbookController.getAdminGuestbookComments(event));
