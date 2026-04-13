import { searchPublishedPosts } from '../../services/post.service';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const keyword = typeof query.keyword === 'string' ? query.keyword : '';

  return searchPublishedPosts(keyword);
});
