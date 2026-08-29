import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortByDate } from '../../utils/formatDate';

export async function GET(context) {
  const decks = sortByDate(await getCollection('slides'));

  return rss({
    title: "Chiff's Nook — Decks",
    description: 'Slide decks from Chiff\'s Nook',
    site: context.site,
    items: decks.map((deck) => ({
      title: deck.data.title,
      description: deck.data.description,
      pubDate: deck.data.pubDate,
      link: `/slides/${deck.id}/`,
      categories: deck.data.tags,
    })),
  });
}
