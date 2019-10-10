<template>
{#each blocks as block, idx (block.blockRid)}
<!--{block.blockRid}->{block.blockId}->{block.loaded}<br/>-->
<!--<BookBlockDisplay
  block="{block}"
  lang="{lang}"
/>-->
<BookBlockDisplay
  blockRid="{block.blockRid}"
  block="{blockView(block.blockRid)}"
  blockListObj="{block}"
  idx="{idx}"
  lang="{lang}"
/>

{/each}
</template>

<script>
  import BookBlockDisplay from './BookBlockDisplay.svelte';
  export let lang = 'en';
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  let fntCounter = 0;
  const timestamp = (new Date()).toJSON();

  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;

  const blockFull = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
  }

  const blockView = (blockRid) => {
    let block = blockFull(blockRid);
    if (block) {
      //console.log('blockView', block.blockid);
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
      viewObj.isNumber = block.isNumber;
      viewObj.isHidden = block.isHidden;
      viewObj.secnum = block.secnum;
      viewObj.parnum = block.parnum;

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

</script>
