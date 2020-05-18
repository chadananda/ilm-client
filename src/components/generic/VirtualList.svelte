<svelte-virtual-list-viewport
  bind:this={viewport}
  bind:offsetHeight={viewport_height}
  on:scroll={handle_scroll}
  style="height: {height};"
>
  <svelte-virtual-list-contents
    bind:this={contents}
    style="padding-top: {top}px; padding-bottom: {bottom}px;"
  >
    {#each visible as row (row.index)}
      <svelte-virtual-list-row>
        <slot item={row.data}>Missing template</slot>
      </svelte-virtual-list-row>
    {/each}
  </svelte-virtual-list-contents>
</svelte-virtual-list-viewport>

<script>
  import { onMount, tick } from 'svelte';

  // props
  export let items;
  export let height = '100%';
  export let itemHeight = undefined;

  // read-only, but visible to consumers via bind:start
  export let start = 0;
  export let end = 0;
  export let scrollTo = false;
  export let startFrom = false;

  export let startReached = false;
  export let endReached = false;

  // local state
  let height_map = [];
  let rows;
  let viewport;
  let contents;
  let viewport_height = 0;
  let visible;
  let mounted;
  let _scrollInterval;

  let top = 0;
  let bottom = 0;
  let average_height;

  let _onScrollEv = false;

  $: visible = items.slice(start, end).map((data, i) => {
    return { index: i + start, data };
  });

  // whenever `items` changes, invalidate the current heightmap
  $: if (mounted) refresh(items, viewport_height, itemHeight);

  async function refresh(items, viewport_height, itemHeight) {
    //console.log('refresh', 'items.length', items.length);
    const { scrollTop } = viewport;

    await tick(); // wait until the DOM is up to date

    let content_height = top - scrollTop;
    let i = start;

    while (content_height < viewport_height && i < items.length) {
      let row = rows[i - start];

      if (!row) {
        end = i + 1;
        await tick(); // render the newly visible row
        row = rows[i - start];
      }

      let offsetHeight = row.offsetHeight;
      let imgHeight = 0;

//       let img = row.getElementsByTagName('img');
//       if (img.length) {
//         img = img.item(0);
//         imgHeight = img.dataset.height;
//         console.log('img', img.getAttribute('alt'), imgHeight);
//       }

      offsetHeight = imgHeight > offsetHeight ? imgHeight : offsetHeight;

      const row_height = height_map[i] = itemHeight || offsetHeight;
      content_height += row_height;
      i += 1;
    }

    end = i;

    const remaining = items.length - end;
    average_height = (top + content_height) / end;

    bottom = remaining * average_height;
    height_map.length = items.length;

  }

  $: handle_scrollTo(scrollTo);

  async function handle_scrollTo(scrollTo) {
    //console.log('VirtualList.svelte->handle_scrollTo(scrollTo)', scrollTo);
    if (scrollTo === false) return;
    else if (typeof scrollTo === 'string') {
      scrollTo = 1*scrollTo.split(':')[0]
    }

    //console.log('VirtualList.svelte->handle_scrollTo(scrollTo) int', scrollTo);

    if (scrollTo > 0) {
      viewport.scrollTo(0, 0);
    }

    //await tick();
    await refresh(items, viewport_height, itemHeight);
    await handle_scroll();

    let expected_height = 0;

    for (let i = 0; i < scrollTo; i +=1) {
      expected_height += height_map[i] || average_height || 0;
    }

    _onScrollEv = true;
    viewport.scrollTo(0, expected_height + 2);

    await tick();
    await handle_scroll();

    const isScrollToEnd = scrollTo && (scrollTo == items.length - 1);

    if (isScrollToEnd) {
      console.log('IS SCROLL TO END', isScrollToEnd);
      let scrollTop = viewport.scrollTop;
      let checkTop = 0;
      _scrollInterval = setInterval(function(){
        scrollTop += 80;
        viewport.scrollTop = scrollTop;
        //console.log('interval', count, viewport.scrollTop, checkTop, scrollTop, start, end);
        if (checkTop == viewport.scrollTop || scrollTo < items.length - 1) {
          clearInterval(_scrollInterval);
        }
        checkTop = viewport.scrollTop;
      }, 20);
    } else {
      setTimeout(function(){
        //console.log('viewport_height', viewport_height);
        //console.log('contents.offsetHeight', contents.offsetHeight-top-bottom);
        if (contents.offsetHeight-top-bottom < viewport_height) {
          handle_scroll().then(function(){
            //viewport.scrollTo(0, viewport.scrollTop + 1);
            handle_scroll();
          })
        }
      }, 1);
    }
  }

  async function handle_scroll(params) {
    //console.log('handle_scroll', params);
    if (_onScrollEv) {
      _onScrollEv = false;
      return;
    }
    const { scrollTop } = viewport;
    //console.log('handle_scroll viewport.scrollTop', scrollTop);
    const old_start = start;

    for (let v = 0; v < rows.length; v += 1) {
      height_map[start + v] = itemHeight || rows[v].offsetHeight;
    }

    let i = 0;
    let y = 0;

    while (i < items.length) {

      const row_height = height_map[i] || average_height;
      if (y + row_height > scrollTop) {
        start = i;
        top = y;

        break;
      }

      y += row_height;
      i += 1;
    }

    while (i < items.length) {
      y += height_map[i] || average_height;
      i += 1;

      if (y > scrollTop + viewport_height) break;
    }

    end = i;

    const remaining = items.length - end;
    average_height = y / end;

    while (i < items.length) height_map[i++] = average_height;
    bottom = remaining * average_height;

    endReached = (bottom == 0);
    startReached = (top == 0);

    // prevent jumping if we scrolled up into unknown territory
    if (start < old_start) {
      await tick();

      let expected_height = 0;
      let actual_height = 0;

      for (let i = start; i < old_start; i +=1) {
        if (rows[i - start]) {
          expected_height += height_map[i] || average_height;
          actual_height += itemHeight || rows[i - start].offsetHeight;
        }
      }

      const d = actual_height - expected_height;
      viewport.scrollTo(0, scrollTop + d);
    }

    return true;

    // TODO if we overestimated the space these
    // rows would occupy we may need to add some
    // more. maybe we can just call handle_scroll again?
  }

  // trigger initial refresh
  onMount(async () => {
    rows = contents.getElementsByTagName('svelte-virtual-list-row');
    //console.log('onMount startFrom', startFrom);
    if (startFrom) {
      //await refresh(items, viewport_height, itemHeight);
      //await handle_scroll();
      scrollTo = startFrom;
    } else {
      mounted = true;
    }
  });
</script>

<style>
  svelte-virtual-list-viewport {
    position: relative;
    overflow-y: auto;
    -webkit-overflow-scrolling:touch;
    display: block;
  }

  svelte-virtual-list-contents, svelte-virtual-list-row {
    display: block;
  }

  svelte-virtual-list-row {
    overflow-y: hidden;
  }
</style>
