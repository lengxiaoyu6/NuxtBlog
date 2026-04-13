import { friendLinkController } from '../../../controllers/friend-link.controller';

export default defineEventHandler((event) => friendLinkController.deleteAdminFriendLink(event));
