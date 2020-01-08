<template>

{#if blockListObj && blockListObj.blockId}
  <div data-rid="{blockRid}" id="{block.blockid}" data-id="{block.blockid}" class="ilm-block ilm-display -langblock-{block.language} {block.viewOutPaddings}">
  {#if block.type === 'illustration'}
    {#if block.viewIllustration}
      <img alt="block.blockid" class="{block.getClass()}" src="{block.viewIllustration}"/>
    {:else}
      <div class="bview-empty-image-wrapper">
        <div class="bview-empty-image">No image</div>
      </div>
    {/if}
  {:else if block.type === 'hr'}
    <hr class="{block.getClass()}"/>
  {:else}
    {#if block.viewParnum}
      <div class="bview-parnum">{block.viewParnum}</div>
    {/if}

    <div id="display-{block.blockid}" lang="{block.language}"
      class="bview-content part-0 {block.getClass ? block.getClass() : ''} hide-archive"
      data-parnum="{block.viewParnum}"
      data-type="{block.type}">
      {@html block.content}
    </div>

  {/if}
  </div>
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}

</template>
<script>

export let block;
export let blockListObj;
export let blockRid = '';
export let lang = 'en';

</script>

<style>
</style>
