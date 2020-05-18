<template>
<!--{blockRid}->{blockListObj.blockId}->{blockListObj.loaded}->{blockListObj.visible}-->
{#if blockListObj && blockListObj.blockId}
  <div data-rid="{blockRid}" id="{block.blockid}" data-id="{block.blockid}" class="ilm-block ilm-display -langblock-{block.language} {block.viewOutPaddings}" style="/*min-height:{block.illustration_height}px*/">
  {#if block.type === 'illustration'}
    {#if block.viewIllustration}
      <img alt="{block.blockid}" class="{block.getClass()}"
      src="{block.viewIllustration}"
      data-width="{block.illustration_width}"
      data-height="{block.illustration_height}"/>
    {:else}
      <div class="bview-empty-image-wrapper">
        <div class="bview-empty-image">No image</div>
      </div>
    {/if}
    {#if block.description}
      <div class="bview-image-descr-wrapper">
        {@html block.description}
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
      data-type="{block.type}"
      on:click={handleFootnote}>
      {@html block.content}
    </div>

    {#if block.footnotes && block.footnotes.length > 0}
    <div class="footnotes">
      {#each block.footnotes as footnote, footnoteIdx (footnote)}
      <div class="{footnote.isShow ? '' : '-hidden'}">
        <div class="-langftn-{footnote.language}">
          <div class="-num">[fn{footnote.ftnIdx+1}]</div>
          <div  class="-text">
            {@html footnote.content}
          </div>
        </div>
      </div>
      {/each}
    </div>
    {/if}

  {/if}
  </div>
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}
<!--<div class="clearfix"></div>-->
</template>
<script>

  //import { fade } from 'svelte/transition';

  export let block;
  export let blockListObj;
  export let blockRid = '';

  let footNotes = {};

  /*let getRandomInt = (min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }*/
  //let rand = getRandomInt(0, 200);

  const handleFootnote = (ev) => {
    if (ev.target.dataset && ev.target.dataset.idx) {
      block.footnotes.forEach((footnote)=>{
        if (footnote.ftnIdx == ev.target.dataset.idx) {
          if (!footnote.isShow) {
            footnote.isShow = true;
          } else {
            footnote.isShow = false;
          }
        }
      });
      block.footnotes = block.footnotes;
      /*let className = footNotes[ev.target.dataset.idx].className;
      if (className == '-hidden') {
        footNotes[ev.target.dataset.idx].className = '';
      } else footNotes[ev.target.dataset.idx].className = '-hidden';*/
    }
  }

</script>

<style>
  .ilm-block.ilm-display {
    position: relative;
  }
  .bview-parnum {
    padding-top: 10px;
    font-family: GentiumPlus, 'Georgia', 'serif';
    padding-left: 15px;
    color: rgba(26, 26, 26, 0.7);
    font-size: 12px;
    cursor: pointer;
    position: absolute;
    left: 0px;
    /*font-family: 'Georgia', 'serif';
    font-size: 10px;*/
  }
  .bview-empty-image-wrapper {
    width: 100px;
    margin: 0px auto;
  }
  .bview-empty-image {
    width: 100px;
    height: 100px;
    background: #E5E5E5;
    border: 1px solid black;
    text-align: center;
    display: table-cell;
    vertical-align: middle;
  }
  .bview-image-descr-wrapper {
    text-align: center;
  }
</style>
