<script lang="ts">
  import Button from './Button.svelte';

  let { variant, type, onclick, text }: any = $props();
</script>

<Button {variant} {type} {onclick}>
  {text}
</Button>
