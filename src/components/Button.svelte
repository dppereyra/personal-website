<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost';
    type?: 'button' | 'submit' | 'reset';
    onclick?: () => void;
    children?: Snippet;
  }

  let { variant = 'primary', type = 'button', onclick, children }: Props = $props();

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  };
</script>

<button
  type={type}
  class="btn {variantClasses[variant]}"
  onclick={onclick}
>
  {@render children?.()}
</button>
