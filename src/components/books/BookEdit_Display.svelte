<script>
  import { createEventDispatcher } from 'svelte';

  export let number = 0;
  export let lang = 'en';
  export let fntCounter = 0;
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  //const dispatch = createEventDispatcher();
  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;
  const blockType = (blockRid) => parlistO.getBlockByRid(blockRid).type;
  const blockFull = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : false;
  }

  const blockView = (blockRid) => {
    let block = blockFull(blockRid);
    if (block) {
      let viewObj = { footnotes: block.footnotes, language: block.language || lang };
      viewObj.content = block.content.replace(
        /[\s]*?<sup[\s]*?data-pg[\s]*?=[\s]*?['"]+(.*?)['"]+.*?>.*?<\/sup>/mig,
        '<span data-pg="$1"></span>'
      );
      //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
      viewObj.content = viewObj.content.replace(
        /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
        '<span class="service-info" data-pg="$1"></span>'
      );

      let ftnIdx = 0;
      viewObj.content = viewObj.content.replace(
        /[\s]*?<sup[\s]*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );
      //<sup class="service-info" data-idx="2"><w class="service-info" data-sugg="">2</w></sup>
      viewObj.content = viewObj.content.replace(
        /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup class="service-info" data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );
      return viewObj;
    } else return { footnotes: [], language: lang };
  }

  const getIllustration = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)).getIllustration() : '';
  }

  const getClass = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)).getClass() : '';
  }

  const blockOutPaddings = (blockRid) => {
    let block = blockFull(blockRid);
    if (block) {
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  /*<h1>{ number }</h1>
    <button on:click={ () => dispatch('magicalclick') }>
      Click Me
    </button>*/

</script>

<style lang='less'>
  .ilm-display {
    [data-flag] {
      pointer-events: all;
      cursor: default;
      &:before {
        cursor: default;
      }
    }
  }
</style>


{#each blocks as blockRid}
<div data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display -langblock-{blockView(blockRid).language} {blockOutPaddings(blockRid)}">

{#if blockFull(blockRid)}

  {#if blockType(blockRid) === 'illustration'}
  <img alt="blockId(blockRid)" class="{getClass(blockRid)}" src="{getIllustration(blockRid)}"/>
  {:else if blockType(blockRid) === 'hr'}
  <hr class="{getClass(blockRid)}"/>
  {:else}
  <div class="{getClass(blockRid)} hide-archive">
  {@html blockView(blockRid).content}
  </div>
  {/if}

{:else}
  <div  data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display content-process-run preloader-loading">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>
{/if}
</div>
<div class="clearfix"></div>
{/each}
