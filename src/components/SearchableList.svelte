<script lang="ts">
  import { formatDate } from '../utils/formatDate';

  interface Item {
    id: string;
    title: string;
    description: string;
    pubDateIso: string;
    tags: string[];
  }

  interface Props {
    items: Item[];
    basePath: string;
    emptyLabel: string;
  }

  let { items, basePath, emptyLabel }: Props = $props();

  let query = $state('');
  let selectedTags = $state<string[]>([]);

  const allTags = $derived([...new Set(items.flatMap((item) => item.tags))].sort());

  function toggleTag(tag: string) {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
  }

  const filtered = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        needle === '' ||
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle);
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => item.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  });
</script>

<div class="space-y-4">
  <div class="flex flex-col sm:flex-row gap-3">
    <input
      type="search"
      bind:value={query}
      placeholder={`Search ${emptyLabel}...`}
      aria-label={`Search ${emptyLabel}`}
      class="input input-bordered w-full sm:max-w-xs"
    />
    {#if allTags.length > 0}
      <div class="flex flex-wrap gap-2 items-center">
        {#each allTags as tag (tag)}
          <button
            type="button"
            class="badge badge-lg cursor-pointer {selectedTags.includes(tag) ? 'badge-primary' : 'badge-outline'}"
            aria-pressed={selectedTags.includes(tag)}
            onclick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if filtered.length === 0}
    <p class="text-base-content/60">No {emptyLabel} match your search.</p>
  {:else}
    <div class="space-y-6">
      {#each filtered as item (item.id)}
        <article class="card bg-base-200 shadow-xl relative">
          <div class="card-body">
            <h2 class="card-title text-2xl">
              <a href={`${basePath}/${item.id}`} class="hover:text-primary after:absolute after:inset-0">
                {item.title}
              </a>
            </h2>
            <p class="text-base-content/70">
              {item.description}
            </p>
            <div class="flex items-center gap-4 text-sm text-base-content/60">
              <time datetime={item.pubDateIso}>
                {formatDate(item.pubDateIso)}
              </time>
              {#if item.tags.length > 0}
                <div class="flex gap-2">
                  {#each item.tags as tag (tag)}
                    <span class="badge badge-sm">{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>
