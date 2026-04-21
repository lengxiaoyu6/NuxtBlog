import { enableModule } from '../../../../services/module-center.service';
import { requireAdminSession } from '../../../../utils/require-admin-session';

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);
  const moduleKey = getRouterParam(event, 'moduleKey') || '';
  return await enableModule(moduleKey);
});
