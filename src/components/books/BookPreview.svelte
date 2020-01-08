<template>
{#if intBlocks.length > 0}
  {#each intBlocks as block, idx (block.blockRid)}
    <div class="row content-scroll-item back"
      id="{'v-'+ block.blockId}"
      data-rid="{block.blockRid}">
      <div class='col'>
        <BookBlockPreview
          block="{block.blockView}"
          blockListObj="{block}"
          blockRid="{block.blockRid}"
          lang="{lang}"
        />
      </div>
      <!--<div class='col'>-->
    </div>
    <!--<div class="row content-scroll-item back"-->
  {/each}
{/if}
</template>

<script>

import { beforeUpdate, createEventDispatcher, tick } from 'svelte';
import BookBlockPreview from './BookBlockPreview.svelte';

export let lang = 'en';
export let mode = 'edit';
export let parlistO = {};
export let parlist = {};
export let startId;

let blocks = parlistO.listObjs;
let loadedBookId = '';
let intBlocks = [];

beforeUpdate(/*async */() => {
  console.log('beforeUpdate', 'blocks.length:', blocks.length, 'parlistO.meta.bookid:', parlistO.meta.bookid, 'loadedBookId:', loadedBookId, 'mode', mode);
  if (parlistO.meta.bookid && blocks.length && loadedBookId === '' || (loadedBookId !== '' && loadedBookId !== parlistO.meta.bookid)) {
    loadedBookId = parlistO.meta.bookid;

    intBlocks = blocks;
  }
});

</script>

<style>
</style>
