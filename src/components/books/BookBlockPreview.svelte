<script>
  export let item;
</script>

<div id="{item.blockId}" data-rid="{item.blockRid}" class="content-scroll-item">
  <div class="col">
    <div class="block-preview">

      {#each item.blockView.blockParts as blkPart, blkPartIdx}

        <div class="table-body -block -subblock -mode-{item.blockView.mode} -voicework-{item.blockView.voicework} {item.blockView.viewOutPaddings}" data-blockid="{item.blockId}" >

          {#if item.blockView.mode !== 'narrate'}
            <div class="table-cell controls-left sub-parnum">
              <div class="table-row"></div>
              <div class="table-row check-row"></div>
            </div>
            <!--<div class="table-cell controls-left">-->
          {/if}

          <div class="-content-block table-cell" class:completed="{item.blockView.isCompleted}">
            <div class="table-body -content -langblock-{item.blockView.language}">
              {#if item.blockView.mode !== 'narrate'}
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">
                    <label class="par-num" class:has-num="{item.blockView.viewParnum.length}">{item.blockView.viewParnum}<input style="display:none" type="text"/></label>
                  </div>
                </div>
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">

                  </div>
                </div>
              {/if}
              <div class="table-row ilm-block">
                {#if item.blockView.mode === 'narrate'}
                  <div class="table-cell controls-left audio-controls"></div>
                {/if}
                <div class="table-cell -content-wrapper">

                  {#if item.blockView.type === 'illustration'}
                    <div class="table-body illustration-block illustration">
                    <div class="ilm-upload-image">
                      {#if item.blockView.viewIllustration}
                        {#if item.blockView.viewIllustration}
                          <!--src="{item.blockView.viewIllustration}"-->
                          <img alt="{item.blockId}" class="{item.blockView.classes}"
                          src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                          height="{item.blockView.illustration_height}"
                          width="50"
                          data-width="{item.blockView.illustration_width}"
                          data-height="{item.blockView.illustration_height}"/>
                        {:else}
                          <div class="bview-empty-image-wrapper">
                            <div class="bview-empty-image">No image</div>
                          </div>
                        {/if}
                        <div class="preview-ilm-file-upload"></div>
                        <!--<div class="table-row drag-uploader no-picture" >
                          <div class="preview-container"></div>
                        </div>-->
                        <!--, {'__hidden': isChanged && !isIllustrationChanged}]
                        v-if="allowEditing"-->
                      {/if}
                    </div>
                    </div>
                    <!--<div class="table-body illustration-block">-->
                    {#if item.blockView.description}
                      <div class="table-row content-description {item.blockView.classes}">
                        <div class="content-wrap-desc description">
                          {@html item.blockView.description}
                        </div>
                      </div>
                    {/if}

                  {:else if item.blockView.type === 'hr'}
                    <hr class="{item.blockView.classes}"/>
                  {:else}
                    <div class="content-wrap-preview {item.blockView.classes}">
                        {@html blkPart.content}
                    </div>
                  {/if}


                </div>
                <!--<div class="table-cell -content-wrapper">-->

              </div>
              <!--<div class="table-row ilm-block">-->

              <div class="table-body -content"></div>

              {#if item.blockView.footnotes.length > 0 && item.blockView.mode !== 'narrate'}
              <div class="table-row content-footnotes">
                {#each item.blockView.footnotes as ftn, ftnIdx}
                <div class="table-body footnote">

                  <div class="table-row controls-top"
                       class:completed="{item.blockView.isCompleted}">
                  </div>

                  <div class="table-row">
                    <div class="table-cell -num">{ftnIdx+1}.</div>
                    <div class="content-wrap-footn-preview table-cell -text -langftn-{item.blockView.language}">
                        {@html ftn.content}
                    </div>
                    <div class="table-cell -control"></div>
                  </div>
                  <!--<div class="table-row">-->

                </div>
                <!--<div class="table-body footnote"-->
                {/each}
              </div>
              <!--<div class="table-row content-footnotes"-->
              {/if}

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

<style lang='less'>
.block-preview {
  .table-row-flex.controls-top .par-ctrl.-par-num label.par-num {
    top: 5px;
  }
}
</style>
