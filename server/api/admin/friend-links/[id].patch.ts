import { friendLinkController } from '../../../controllers/friend-link.controller';

export default defineEventHandler((event) => friendLinkController.updateAdminFriendLink(event));
