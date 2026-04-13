import { guestbookController } from '../../controllers/guestbook.controller';

export default defineEventHandler((event) => guestbookController.createPublicGuestbookEntry(event));
