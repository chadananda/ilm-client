<script>
    export let data;
    let block = data;
    let blockView = block.blockView;
    //console.log(`block: `, block);
</script>

<div id="{block.blockId}" data-rid="{block.blockRid}" class="content-scroll-item">
  <div class="col">
    <div class="block-preview">

      {#each blockView.blockParts as blkPart, blkPartIdx}

        <div class="table-body -block -subblock -mode-{blockView.mode} -voicework-{blockView.voicework} {blockView.viewOutPaddings}" data-blockid="{block.blockId}" >

          {#if blockView.mode !== 'narrate'}
            <div class="table-cell controls-left sub-parnum">
              <div class="table-row"></div>
              <div class="table-row check-row"></div>
            </div>
            <!--<div class="table-cell controls-left">-->
          {/if}

          <div class="-content-block table-cell" class:completed="{blockView.isCompleted}">
            <div class="table-body -content -langblock-{blockView.language}">
              {#if blockView.mode !== 'narrate'}
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">
                    <label class="par-num" class:has-num="{blockView.viewParnum.length}">{blockView.viewParnum}<input style="display:none" type="text"/></label>
                  </div>
                </div>
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">

                  </div>
                </div>
              {/if}
              <div class="table-row ilm-block">
                {#if blockView.mode === 'narrate'}
                  <div class="table-cell controls-left audio-controls"></div>
                {/if}
                <div class="table-cell -content-wrapper">

                  {#if blockView.type === 'illustration'}
                    <div class="table-body illustration-block">
                      {#if blockView.viewIllustration}
                        {#if blockView.viewIllustration}
                          <img alt="{block.blockId}" class="{blockView.classes}"
                          src="{blockView.viewIllustration}"
                          height="{blockView.illustration_height}"
                          data-width="{blockView.illustration_width}"
                          data-height="{blockView.illustration_height}"/>
                        {:else}
                          <div class="bview-empty-image-wrapper">
                            <div class="bview-empty-image">No image</div>
                          </div>
                        {/if}
                        <div class="table-row drag-uploader no-picture" >
                          <div class="preview-container"></div>
                        </div>
                        <!--, {'__hidden': isChanged && !isIllustrationChanged}]
                        v-if="allowEditing"-->
                        {#if blockView.description}
                          <div class="table-row content-description {blockView.classes}">
                            <div class="content-wrap-desc description">
                              {@html blockView.description}
                            </div>
                          </div>
                        {/if}
                      {/if}
                    </div>
                    <!--<div class="table-body illustration-block">-->

                  {:else if blockView.type === 'hr'}
                    <hr class="{blockView.classes}"/>
                  {:else}
                    <div class="content-wrap-preview {blockView.classes}">
                        {@html blkPart.content}
                    </div>
                  {/if}


                </div>
                <!--<div class="table-cell -content-wrapper">-->

              </div>
              <!--<div class="table-row ilm-block">-->

              <div class="table-body -content"></div>
              <div class="table-row controls-bottom"></div>

            </div>
            <!--<div class="table-body -content"-->
          </div>
          <!--<div class="-content-block"-->

          <div class="table-cell controls-right"></div>


        </div>
        <!--<div class="table-body-->

      {/each}

    </div>
    <!--<div class="block-preview">-->
  </div>
  <!--<div class="col">-->
</div>
<!--<div id="{block.blockId}"-->

<style>

</style>
