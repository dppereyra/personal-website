<script lang="ts">
  import Button from './Button.svelte';

  export let variant: 'primary' | 'secondary' | 'ghost' | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' | undefined = undefined;
  export let onclick: (() => void) | undefined = undefined;
  export let text = '';
</script>

<Button {variant} {type} {onclick}>
  {text}
</Button>
