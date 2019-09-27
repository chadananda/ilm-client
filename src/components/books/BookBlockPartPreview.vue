<template>
<div ref="viewBlock" class="block-preview">
  <div v-if="block && (block.type != 'par' || (loaded === true || blockO.loaded === true))"
    :class="['table-body -block -subblock', blockOutPaddings]">

    <div class="table-cell controls-left sub-parnum" v-if="mode === 'narrate'"></div>
    <div class="table-cell controls-left audio-controls" v-if="mode === 'narrate'"></div>
    <div :class="['table-cell', {'completed': isCompleted}]">
      <div :class="['table-body', '-content']">
        <div class="table-row-flex controls-top" v-if="mode !== 'narrate'"></div>
        <!--<div class="table-row-flex controls-top">-->
        <div :class="['table-row ilm-block']">

        <hr v-if="block.type=='hr'"
          :class="[getClass]"/>

        <div v-else-if="block.type == 'illustration'"
        :class="['table-body illustration-block']">
          <img v-if="block.illustration" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          :height="illustrationHeight"
          :class="[getClass]"/>
          <div :class="['table-row drag-uploader', 'no-picture', {'__hidden': isChanged && !isIllustrationChanged}]" v-if="allowEditing">
            <div class="preview-container"></div>
          </div>

          <div :class="['table-row content-description', getClass]">
            <div class="content-wrap-desc description"
              v-html="block.description">
            </div>
          </div>

        </div>
        <!--<img v-if="block.illustration"-->

        <template v-else>
          <div v-cloak
          :class="['content-wrap-preview', block.getClass(mode), {'js-hidden': blockO.loaded !== true}]"
          v-html="blockPart.content">
          </div>
        </template>
        <!--<div class="content-wrap">-->

        </div>
        <!--<div :class="['table-row ilm-block']">-->
        <div class="table-row controls-bottom" v-if="isSplittedBlock">
          <div class="-left">
            <span>
              <i :class="['glyphicon']"></i>
            </span>
          </div>
        </div>

      </div>
      <!--<div :class="['table-body', '-content']">-->
    </div>
    <!--<div :class="['table-cell']">-->

  </div>
  <!--<div v-if="loaded === true || blockO.loaded === true"-->
  <div v-else :class="['in-loading']">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>
</div>
</template>

<script>
import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import access             from '../../mixins/access.js';
import {mapGetters} from 'vuex'

  export default {
    name: 'book-block-preview',
    props: [
      'blockRid', 'blockO', 'block', 'blockPart', 'blockPartIdx', 'isSplittedBlock'
    ],// loaded property is necessary for updating first part of loaded blocks, VueJS is not updating automatically
    data() {
      return {
        loaded: false
      }
    },
    mixins: [access, taskControls, apiConfig],
    computed: {
      /*...mapGetters({
        meta: 'currentBookMeta',
        parlist: 'storeList',
        parlistO: 'storeListO'
      }),*/
      blockId: function() {
        return this.blockO.blockid;
      },
      blockOutPaddings: function () {
        if (this.block) {
          return (this.mode !== 'narrate' && this.block.classes && this.block.classes.hasOwnProperty('outsize-padding')) ? this.block.classes['outsize-padding'] : ''
        } else return '';
      },
      parnum: { cache: true,
        get: function () {
          if (this.blockO.type == 'header' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.secnum;
          }
          else if (this.blockO.type == 'par' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.parnum;
          }
          else return false;
        }
      },
      getClass: { cache: true,
        get: function () {
          return this.block.getClass(this.mode);
        }
      },
      getIllustration: { cache: true,
        get: function () {
          return this.block.getIllustration();
        }
      },
      allowEditing: { cache: false,
        get() {
          return this.block && this.tc_isShowEdit(this.block._id) && this.mode === 'edit';
        }
      },
      blockParts: {
        get() {
          if (this.block.parts && this.block.parts.length > 0) {
            return this.block.parts;
          } else {
            return [
              {
                content: this.block.content,
                audiosrc: this.block.audiosrc,
                audiosrc_ver: this.block.audiosrc_ver
              }
            ];
          }
        },
        cache: false
      },
      isCompleted: { cache: false,
        get() {
          return this.block ? this.tc_isCompleted(this.block) : true;
        }
      },
      isIllustrationChanged: { cache: true,
        get() {
          return this.block.isIllustrationChanged;
        }
      },
      isChanged: {
        get() {
          return false;
        }
      },
      illustrationHeight: {
        get() {
          if (this.mode === 'narrate') {
            return parseInt((700 * this.block.illustration_height) / this.block.illustration_width);
          } else {
            return this.block.illustration_height;
          }
        },
        cache: false
      },
      ...mapGetters({
        mode: 'bookMode'
      })
    },
    methods: {

    }
  }
</script>

