<template>
{blockRid}->{isLoaded}
{#if block && block.getClass}
  <div data-rid="{blockRid}" id="{block.blockid}" data-id="{block.blockid}" class="ilm-block ilm-display -langblock-{block.language} {blockOutPaddings()}">
  {#if block.type === 'illustration'}
    <img alt="block.blockid" class="{block.getClass()}" src="{getIllustration()}"/>
  {:else if block.type === 'hr'}
    <hr class="{block.getClass()}"/>
  {:else}
    {#if getParnum()}
      <div class="parnum">{@html getParnum()}</div>
    {/if}
    {#if isLoaded}
    <div id="display-{block.blockid}" lang="{block.language}"
      class="{block.getClass ? block.getClass() : ''} hide-archive"
      data-parnum="{getParnum()}"
      data-type="{block.type}"
      on:click={handleFootnote}>
      {@html block.content}
    </div>
    {:else}
    <div class="content-process-run preloader-loading"></div>
    {/if}
  {/if}
  </div>
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}
<div class="clearfix"></div>
</template>
<script>

  //import { fade } from 'svelte/transition';

  export let block = {};
  export let blockRid = '';
  export let isLoaded = false;

  const getIllustration = () => {
    return (block && block.getIllustration) ? block.getIllustration() : '';
  }

  const blockOutPaddings = () => {
    if (block) {
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  const getParnum = () => {
    if (block) {
      if (block.type == 'header' && block.isNumber && !block.isHidden) {
        return block.secnum;
      }
      else if (block.type == 'par' && block.isNumber && !block.isHidden) {
        return block.parnum;
      }
    }
    return false;
  }

  const getContent = () => {
    return new Promise((resolve, reject) => {
      let _content = block.content;
      window.setTimeout(function() {
        resolve(_content);
      }, 50);
    });
  }

  const handleFootnote = (ev) => {
    console.log('handleFootnote', ev.target.dataset.idx);
//     if (ev.target.dataset.idx && this.$refs.footNotes[ev.target.dataset.idx]) {
//       let className = this.$refs.footNotes[ev.target.dataset.idx].className;
//       if (className == '-hidden') {
//         this.$refs.footNotes[ev.target.dataset.idx].className = '';
//       } else this.$refs.footNotes[ev.target.dataset.idx].className = '-hidden';
//     }
  }

</script>


<!--<script>
  import { createEventDispatcher } from 'svelte';

  export let number = 0;
  export let lang = 'en';
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  let fntCounter = 0;
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

  const getParnum = (blockRid) => {
    let block = parlistO.getBlockByRid(blockRid)
    if (block) {
      if (block.type == 'header' && block.isNumber && !block.isHidden) {
        return block.secnum;
      }
      else if (block.type == 'par' && block.isNumber && !block.isHidden) {
        return block.parnum;
      }
    }
    return false;
  }

  const blockOutPaddings = (blockRid) => {
    let block = blockFull(blockRid);
    if (block) {
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  const handleFootnote = (ev) => {
    console.log('handleFootnote', ev.target.dataset.idx);
//     if (ev.target.dataset.idx && this.$refs.footNotes[ev.target.dataset.idx]) {
//       let className = this.$refs.footNotes[ev.target.dataset.idx].className;
//       if (className == '-hidden') {
//         this.$refs.footNotes[ev.target.dataset.idx].className = '';
//       } else this.$refs.footNotes[ev.target.dataset.idx].className = '-hidden';
//     }
  }

  /*<h1>{ number }</h1>
    <button on:click={ () => dispatch('magicalclick') }>
      Click Me
    </button>*/

</script>



<div data-count="{number}"></div>
{#each blocks as blockRid}
<div data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display -langblock-{blockView(blockRid).language} {blockOutPaddings(blockRid)}">

{#if blockFull(blockRid)}

  {#if blockType(blockRid) === 'illustration'}
  <img alt="blockId(blockRid)" class="{getClass(blockRid)}" src="{getIllustration(blockRid)}"/>
  {:else if blockType(blockRid) === 'hr'}
  <hr class="{getClass(blockRid)}"/>
  {:else}
    {#if getParnum(blockRid)}
      <div class="parnum">{@html getParnum(blockRid)}</div>
    {/if}
    <div id="{blockId(blockRid)}" lang="{blockView(blockRid).language}"
      class="{getClass(blockRid)} hide-archive"
      data-parnum="{getParnum(blockRid)}"
      data-type="{blockType(blockRid)}"
      on:click={handleFootnote}>
      {@html blockView(blockRid).content}
    </div>
    {#if blockView(blockRid).footnotes.length > 0}
      <div class="footnotes">
        {#each blockView(blockRid).footnotes as footnote, footnoteIdx}
        <div class="-hidden" data-ref="footNotes">
          <div class="-langftn-{footnote.language}">
            <div class="-num">[fn{footnote.ftnIdx+1}]</div>
            <div class="-text">
              {@html footnote.content}
            </div>
          </div>
        </div>
        {/each}
      </div>
    {/if}
  {/if}

{:else}
  <div  data-id="{blockId(blockRid)}" data-rid="{blockRid}" id="{blockId(blockRid)}" class="ilm-block ilm-display content-process-run preloader-loading">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}--
  </div>
{/if}
</div>
<div class="clearfix"></div>
{/each}-->
