import { describe, it, expect } from 'vitest';
import { tick } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import SearchableList from './SearchableList.svelte';

const items = [
  {
    id: 'welcome',
    title: 'Welcome to My Blog',
    description: 'First post on my personal website',
    pubDateIso: '2026-02-03T00:00:00.000Z',
    tags: ['welcome', 'first-post'],
  },
  {
    id: 'kubernetes-tips',
    title: 'Kubernetes Tips',
    description: 'A few things I learned running clusters',
    pubDateIso: '2026-03-01T00:00:00.000Z',
    tags: ['kubernetes', 'devops'],
  },
  {
    id: 'astro-notes',
    title: 'Notes on Astro',
    description: 'Why I picked Astro for this site',
    pubDateIso: '2026-04-01T00:00:00.000Z',
    tags: ['astro', 'devops'],
  },
];

const baseProps = { items, basePath: '/blog', emptyLabel: 'posts' };

describe('SearchableList', () => {
  it('renders every item by default', () => {
    render(SearchableList, { props: baseProps });
    expect(screen.getByText('Welcome to My Blog')).toBeTruthy();
    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.getByText('Notes on Astro')).toBeTruthy();
  });

  it('filters by title text, case-insensitively', async () => {
    render(SearchableList, { props: baseProps });
    const input = screen.getByRole('searchbox');
    (input as HTMLInputElement).value = 'KUBERNETES';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.queryByText('Welcome to My Blog')).toBeNull();
    expect(screen.queryByText('Notes on Astro')).toBeNull();
  });

  it('filters by description text', async () => {
    render(SearchableList, { props: baseProps });
    const input = screen.getByRole('searchbox');
    (input as HTMLInputElement).value = 'clusters';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.queryByText('Welcome to My Blog')).toBeNull();
  });

  it('filters by clicking a tag', async () => {
    render(SearchableList, { props: baseProps });
    const tagButton = screen.getByRole('button', { name: 'devops' });
    tagButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.getByText('Notes on Astro')).toBeTruthy();
    expect(screen.queryByText('Welcome to My Blog')).toBeNull();
  });

  it('combines text search and tag filter', async () => {
    render(SearchableList, { props: baseProps });
    const tagButton = screen.getByRole('button', { name: 'devops' });
    tagButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    const input = screen.getByRole('searchbox');
    (input as HTMLInputElement).value = 'astro';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    expect(screen.getByText('Notes on Astro')).toBeTruthy();
    expect(screen.queryByText('Kubernetes Tips')).toBeNull();
  });

  it('selecting a second tag broadens results (OR across tags)', async () => {
    render(SearchableList, { props: baseProps });
    screen.getByRole('button', { name: 'devops' }).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();
    screen.getByRole('button', { name: 'welcome' }).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(screen.getByText('Welcome to My Blog')).toBeTruthy();
    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.getByText('Notes on Astro')).toBeTruthy();
  });

  it('shows an empty state when nothing matches', async () => {
    render(SearchableList, { props: baseProps });
    const input = screen.getByRole('searchbox');
    (input as HTMLInputElement).value = 'nonexistent-topic';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();

    expect(screen.queryByText('Welcome to My Blog')).toBeNull();
    expect(screen.getByText(/no posts match/i)).toBeTruthy();
  });

  it('clicking an active tag again deselects it', async () => {
    render(SearchableList, { props: baseProps });
    const tagButton = screen.getByRole('button', { name: 'devops' });
    tagButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();
    tagButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await tick();

    expect(screen.getByText('Welcome to My Blog')).toBeTruthy();
    expect(screen.getByText('Kubernetes Tips')).toBeTruthy();
    expect(screen.getByText('Notes on Astro')).toBeTruthy();
  });
});
