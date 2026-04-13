import { readRssFeed } from '../../services/post.service';

export default defineEventHandler(async (event) => {
  const category = decodeURIComponent(getRouterParam(event, 'category') || '');

  event.node.res.setHeader('content-type', 'application/rss+xml; charset=utf-8');
  return await readRssFeed(category);
});
