<script>
  import { createEventDispatcher } from 'svelte';

  export let number = 0;
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  const dispatch = createEventDispatcher();
  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;
  const blockType = (blockRid) => parlistO.getBlockByRid(blockRid).type;
  const blockFull = (blockRid) => {
//     console.log('blockRid', blockRid);
//     console.log('blockId', blockId(blockRid));
//     console.log('blockType', blockType(blockRid));
    console.log(`parlist has ${blockId(blockRid)}`, parlist.has(blockId(blockRid)));
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : false;
  }
</script>

<h1>{ number }</h1>
<button on:click={ () => dispatch('magicalclick') }>
  Click Me
</button>

{#each blocks as blockRid}
<div data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display -langblock-">

{#if blockFull(blockRid)}

  {#if blockType(blockRid) === 'illustration'}
  <img alt="blockId(blockRid)" src="{blockFull(blockRid).getIllustration()}"/>
  {:else}
  <div></div>
  {/if}

{:else}
  <div  data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display content-process-run preloader-loading">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>
{/if}
</div>
<div class="clearfix"></div>
{/each}
