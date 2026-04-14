import { guestbookController } from '../../controllers/guestbook.controller';

export default defineEventHandler(() => guestbookController.getPublicGuestbookEntries());
