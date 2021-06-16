<template>

<div class="bview-container">
  {#if intBlocks.length > 0}
    <!--<VirtualList items={intBlocks} let:item
      bind:start={startBlockIdx} bind:end={endBlockIdx}
      bind:startFrom={vListStartFrom} bind:scrollTo={vListScrollTo}
      bind:startReached={startReached} bind:endReached={endReached} >
        <div class='card'>
        {item.idx}->{item.blockRid}->{item.blockId}<br/>
        <BookBlockDisplay
          blockRid="{item.blockRid}"
          block="{item.blockView}"
          blockListObj="{item}"
          lang="{lang}"
        />
        </div>
    </VirtualList>-->

    <VirtualScrollList
      bind:this={list}
      data={intBlocks}
      key="blockId"
      let:data
    >

    <div class='card'>
      <BookBlockPreview {data}/>
    </div>

    </VirtualScrollList>


  {:else}
    <div class="content-process-run preloader-loading"></div>
  {/if}
</div>

</template>

<script>
  import { /*beforeUpdate,*/ onMount, createEventDispatcher, tick } from 'svelte';
  //import VirtualList from '../generic/VirtualList.svelte';
  import VirtualScrollList    from "../generic/svelte-virtual-scroll-list"
  //import BookBlockDisplay from './BookBlockDisplay.svelte';
  import BookBlockPreview from './BookBlockPreview.svelte'

  export let lang = 'en';
  export let parlistO = {};
  export let parlist = {};
  export let startId;
  export let hotkeyScrollTo = false;
  export let updBlocks = [];

  let list;

  let blocks = parlistO.listObjs;
  let startBlockIdx = 0;
  let endBlockIdx = 0;
  let vListStartFrom = false;
  let vListScrollTo = false;
  let startReached = false;
  let endReached = false;
  let startIdIdx = 0;
  let fntCounter = 0;
  let intBlocks = [];
  let itemHeight = false;

  const dispatch = createEventDispatcher();

  $: scrolledTo(startBlockIdx);
  function scrolledTo(startBlockIdx) {
    if (blocks[startBlockIdx]) {
      if (vListStartFrom) {
        vListStartFrom = false;
        return;
      }
      if (vListScrollTo) {
        vListScrollTo = false;
        return;
      }
      dispatch('setStart', {
        blockIdx: startBlockIdx,
        blockId: blocks[startBlockIdx].blockId,
        blockRid: blocks[startBlockIdx].blockRid
      });
    }
  }

  $: update(updBlocks);
  function update(updBlocks) {
    console.log(`updBlocks:`, updBlocks);
    for (let i = 0; i < blocks.length; i++) {
      fntCounter = 0;
      blocks[i].blockView = blockView(blocks[i].blockRid);
      blocks[i].visible = blocks[i].loaded;
      blocks[i].idx = i;
      if (startId && blocks[i].blockId == startId) {
        startIdIdx = i;
      }
    }
    intBlocks = blocks;
  }

  $: scrolledToEdge(startReached, endReached);
  function scrolledToEdge(startReached, endReached) {
    dispatch('setEdge', {
      startReached: startReached,
      endReached: endReached,
    });
  }

  $: hotkeyScrolledTo(hotkeyScrollTo);
  async function hotkeyScrolledTo(hotkeyScrollTo) {
    if (hotkeyScrollTo !== false) {
      await tick();
      vListScrollTo = hotkeyScrollTo;
      //console.log('BookEdit_Display.svelte->hotkeyScrolledTo', vListScrollTo);
    }
  }

  onMount(/*async */() => {
    console.log(`onMount: ${true}`);
    if (parlistO.meta.bookid && blocks.length) {

      for (let i = 0; i < blocks.length; i++) {
        fntCounter = 0;
        blocks[i].blockView = blockView(blocks[i].blockRid);
        blocks[i].visible = blocks[i].loaded;
        blocks[i].idx = i;
        if (startId && blocks[i].blockId == startId) {
          startIdIdx = i;
        }
      }
      intBlocks = blocks;
      console.log(`intBlocks:`, intBlocks[0]);
      if (startIdIdx > 0) {
        vListStartFrom = startIdIdx;
      }
    } else {

    }
  });

//   beforeUpdate(/*async */() => {
//     console.log('beforeUpdate');
//
//     //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'parlistO.meta.bookid:', parlistO.meta.bookid, 'loadedBookId:', loadedBookId/*, 'reloadBook', reloadBook*/);
//     //loadedBookId = parlistO.meta.bookid;
//
//     //console.log(`blocks[0]:`, parlist.get('test_test_2_en-bl48').content);
//   });

  const timestamp = (new Date()).toJSON();

  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;

  const blockFull = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
  }

  const getOutPaddings = (block) => {
    if (block) {
      //console.log('blockOutPaddings');
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  const getIllustration = (block) => {
    return (block && block.getIllustration) ? block.getIllustration() : '';
  }

  const getParnum = (block) => {
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

  const blockView = (blockRid) => {
    let block = blockFull(blockRid);
    let blockO = parlistO.getBlockByRid(blockRid);
    if (block) {
      //console.log('blockView', block.blockid, fntCounter);
      let viewObj = { footnotes: block.footnotes, language: block.language || lang };
      viewObj.getIllustration = ()=>{
        if (block.illustration) {
          return process.env.ILM_API + block.illustration + '?' + timestamp;
        }
      }
      viewObj.getClass = block.getClass;
      viewObj.blockid = block.blockid;
      viewObj.classes = block.classes;
      viewObj.type = block.type;
      viewObj.isNumber = blockO.isNumber;
      viewObj.isHidden = blockO.isHidden;
      viewObj.secnum = blockO.secnum;
      viewObj.parnum = blockO.parnum;

      viewObj.illustration_height = block.illustration_height;
      viewObj.illustration_width = block.illustration_width;
      viewObj.description = block.description;

      //viewObj.content = block.content

      viewObj.content = block.content.replace(
        /<sup\s*data-pg\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        '<span data-pg="$1"></span>'
      );
      //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
      viewObj.content = viewObj.content.replace(
        /<sup(?=\s)\s*class=['"]{1}service-info['"]{1}\s*data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
        '<span class="service-info" data-pg="$1"></span>'
      );

      let ftnIdx = 0;
      viewObj.content = viewObj.content.replace(
        /<sup\s*data-idx\s*=\s*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
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
        /<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup class="service-info" data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );

      viewObj.viewOutPaddings = getOutPaddings(block);
      viewObj.viewIllustration = getIllustration(block);
      viewObj.viewParnum = getParnum(viewObj);

      return viewObj;
    } else return { footnotes: [], language: lang };
  }

</script>

<style>
  .bview-container {
    min-height: 200px;
    /*height: calc(100vh - 15em);*/
    height: 100%;
    width: 100%;
  }

  .card {
    position: relative;
    /*min-height: 5em;*/
  }

  .card::after {
    clear: both;
    display: block;
  }
</style>
