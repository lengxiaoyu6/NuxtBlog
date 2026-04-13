import { ensureSeedAdminUser } from '../services/auth.service';
import { ensureSeedMediaLibrary } from '../services/media.service';
import { ensureSeedBlogPostCategories } from '../services/post-category.service';
import { ensureSeedSiteConfiguration } from '../services/site-settings.service';

export default defineNitroPlugin(async () => {
  await ensureSeedAdminUser();
  await ensureSeedSiteConfiguration();
  await ensureSeedBlogPostCategories();
  await ensureSeedMediaLibrary();
});
