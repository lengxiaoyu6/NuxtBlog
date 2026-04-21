import { readAdminModules } from '../../../services/module-center.service';
import { requireAdminSession } from '../../../utils/require-admin-session';

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);
  return await readAdminModules();
});
