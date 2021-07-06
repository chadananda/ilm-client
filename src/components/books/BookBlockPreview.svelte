<script>
  export let data;
</script>

<div id="{data.blockId}" data-rid="{data.blockRid}" class="content-scroll-item">
  <div class="col">
    <div class="block-preview">

      {#each data.blockView.blockParts as blkPart, blkPartIdx}

        <div class="table-body -block -subblock -mode-{data.blockView.mode} -voicework-{data.blockView.voicework} {data.blockView.viewOutPaddings}" data-blockid="{data.blockId}" >

          {#if data.blockView.mode !== 'narrate'}
            <div class="table-cell controls-left sub-parnum">
              <div class="table-row"></div>
              <div class="table-row check-row"></div>
            </div>
            <!--<div class="table-cell controls-left">-->
          {/if}

          <div class="-content-block table-cell" class:completed="{data.blockView.isCompleted}">
            <div class="table-body -content -langblock-{data.blockView.language}">
              {#if data.blockView.mode !== 'narrate'}
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">
                    <label class="par-num" class:has-num="{data.blockView.viewParnum.length}">{data.blockView.viewParnum}<input style="display:none" type="text"/></label>
                  </div>
                </div>
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">

                  </div>
                </div>
              {/if}
              <div class="table-row ilm-block">
                {#if data.blockView.mode === 'narrate'}
                  <div class="table-cell controls-left audio-controls"></div>
                {/if}
                <div class="table-cell -content-wrapper">

                  {#if data.blockView.type === 'illustration'}
                    <div class="table-body illustration-block illustration">
                    <div class="ilm-upload-image">
                      {#if data.blockView.viewIllustration}
                        {#if data.blockView.viewIllustration}
                          <!--src="{data.blockView.viewIllustration}"-->
                          <img alt="{data.blockId}" class="{data.blockView.classes}"
                          src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                          height="{data.blockView.illustration_height}"
                          width="50"
                          data-width="{data.blockView.illustration_width}"
                          data-height="{data.blockView.illustration_height}"/>
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
                    {#if data.blockView.description}
                      <div class="table-row content-description {data.blockView.classes}">
                        <div class="content-wrap-desc description">
                          {@html data.blockView.description}
                        </div>
                      </div>
                    {/if}

                  {:else if data.blockView.type === 'hr'}
                    <hr class="{data.blockView.classes}"/>
                  {:else}
                    <div class="content-wrap-preview {data.blockView.classes}">
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
