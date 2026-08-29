import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog')).map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    link: `/blog/${post.id}/`,
    categories: [...post.data.tags, 'post'],
  }));

  const decks = (await getCollection('slides')).map((deck) => ({
    title: deck.data.title,
    description: deck.data.description,
    pubDate: deck.data.pubDate,
    link: `/slides/${deck.id}/`,
    categories: [...deck.data.tags, 'deck'],
  }));

  const items = [...posts, ...decks].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: "Chiff's Nook",
    description: 'Blog posts and slide decks from Chiff\'s Nook',
    site: context.site,
    items,
  });
}
