import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortByDate } from '../../utils/formatDate';

export async function GET(context) {
  const posts = sortByDate(await getCollection('blog'));

  return rss({
    title: "Chiff's Nook — Blog",
    description: 'Blog posts from Chiff\'s Nook',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
  });
}
