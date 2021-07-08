<template>

<div class="bview-container">
  {#if intBlocks.length > 0}

    <VirtualList
      bind:this={virtualPreviewlist}
      items={intBlocks}
      let:item
      on:scroll="{vsListScroll}"
    >

      <!--<div class='card'>-->
        <BookBlockPreview {item}/>
      <!--</div>-->


    </VirtualList>

  {:else}
    <div class="content-process-run preloader-loading"></div>
  {/if}
</div>

</template>

<script>
  import { /*beforeUpdate,*/ onMount, createEventDispatcher, tick } from 'svelte';
  import VirtualList from '../generic/VirtualList.svelte';
  //import VirtualScrollList    from "../generic/svelte-virtual-scroll-list"
  //import BookBlockDisplay from './BookBlockDisplay.svelte';
  import BookBlockPreview from './BookBlockPreview.svelte';

  export let mode = '';
  export let parlistO = {};
  export let parlist = {};
  export let meta = {};
  export let jobInfo = {};
  export let startId;
  export let hotkeyScrollTo = false;
  export let updBlocks = [];

  let virtualPreviewlist;

  let blocks = parlistO.listObjs;
  const lang = meta.language || 'en';
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

  const vsListScroll = (event)=>{
    //console.log(`vsListScroll: `, event);
    //console.log(`virtualPreviewlist: `, virtualPreviewlist);
    //console.log(`virtualPreviewlist.getOffset(): `, virtualPreviewlist.getOffset());
    dispatch('onScroll',
      Object.assign(
        event.detail.range,
        {
          offset: event.detail.offset,//virtualPreviewlist.getOffset(),
          height: event.detail.clientHeight//virtualPreviewlist.getClientSize()
        }
      )
    );
  }

//   $: scrolledTo(startBlockIdx);
//   function scrolledTo(startBlockIdx) {
//     if (blocks[startBlockIdx]) {
//       if (vListStartFrom) {
//         vListStartFrom = false;
//         return;
//       }
//       if (vListScrollTo) {
//         vListScrollTo = false;
//         return;
//       }
//       dispatch('setStart', {
//         blockIdx: startBlockIdx,
//         blockId: blocks[startBlockIdx].blockId,
//         blockRid: blocks[startBlockIdx].blockRid
//       });
//     }
//   }

  $: update(updBlocks);
  function update(updBlocks) {
    //console.log(`updBlocks:`, updBlocks);
    for (let i = 0; i < blocks.length; i++) {
      fntCounter = 0;
//       if (updBlocks.indexOf(blocks[i].blockId) > -1) {
//         console.log(`blocks[${i}]: `, blocks[i]);
//           intBlocks[i].blockView = blockView(blocks[i].blockRid);
// //         blocks[i].visible = blocks[i].loaded;
// //         blocks[i].idx = i;
//
// //         intBlocks[i] = Object.assign(intBlocks[i], {
// //           blockView: blockView(blocks[i].blockRid)
// //         })
//       }

      blocks[i].blockView = blockView(blocks[i].blockRid);
//       blocks[i].visible = blocks[i].loaded;
//       blocks[i].idx = i;
//       if (startId && blocks[i].blockId == startId) {
//         startIdIdx = i;
//       }
    }
    intBlocks = blocks;
    updBlocks = [];
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
    return '';
  }

  const isSplittedBlock = (block, inJobInfo) => {
      if (block.voicework === 'narration' && !inJobInfo.text_cleanup && Array.isArray(block.parts) && block.parts.length > 1 && !(inJobInfo.mastering || inJobInfo.mastering_complete)) {
        return true;
      }
      return false;
  }

  const getBlockLang = (block, inMeta) => {
    if (block.language && block.language.length) {
      return block.language;
    } else {
      return inMeta.language;
    }
  }

  const parnumComp = (block) => {
    if (block.type == 'header' && block.isNumber && !block.isHidden) {
      return block.secnum.toString();
    }
    if (block.type == 'par' && block.isNumber && !block.isHidden) {
      return block.parnum.toString();
    }
    return '';
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
      viewObj.mode = mode;
      viewObj.getClass = block.getClass;
      viewObj.blockId = block.blockid;
      viewObj.classes = block.getClass(viewObj.mode);
      viewObj.type = block.type;
      viewObj.isNumber = blockO.isNumber;
      viewObj.isHidden = blockO.isHidden;
      viewObj.secnum = blockO.secnum;
      viewObj.parnum = blockO.parnum;

      viewObj.illustration_height = block.illustration_height;
      viewObj.illustration_width = block.illustration_width;
      viewObj.description = block.description;
      viewObj.voicework = block.voicework;
      viewObj.language = getBlockLang(block, meta);
      viewObj.isSplitted = isSplittedBlock(block, jobInfo);
      viewObj.parnumComp = parnumComp(block);

      viewObj.content = block.content;

//       viewObj.content = block.content.replace(
//         /<sup\s*data-pg\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
//         '<span data-pg="$1"></span>'
//       );
//       //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
//       viewObj.content = viewObj.content.replace(
//         /<sup(?=\s)\s*class=['"]{1}service-info['"]{1}\s*data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
//         '<span class="service-info" data-pg="$1"></span>'
//       );

//       let ftnIdx = 0;
//       viewObj.content = viewObj.content.replace(
//         /<sup\s*data-idx\s*=\s*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
//         (idx)=>{
//           if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
//             viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
//           }
//           ftnIdx++;
//           return `<sup data-idx="${fntCounter++}">[${fntCounter}]</sup>`
//         }
//       );
      //<sup class="service-info" data-idx="2"><w class="service-info" data-sugg="">2</w></sup>
//       viewObj.content = viewObj.content.replace(
//         /<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
//         (idx)=>{
//           if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
//             viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
//           }
//           ftnIdx++;
//           return `<sup class="service-info" data-idx="${fntCounter++}">[${fntCounter}]</sup>`
//         }
//       );

      viewObj.blockParts = viewObj.isSplitted ? block.parts : [
        {
          content: viewObj.content,
          blockId: viewObj.blockId,
          audiosrc: block.audiosrc,
          audiosrc_ver: block.audiosrc_ver,
          manual_boundaries: block.manual_boundaries
        }
      ];

      viewObj.isCompleted = false;

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

/*  .card {
    position: relative;
  }

  .card::after {
    clear: both;
    display: block;
  }*/
</style>
