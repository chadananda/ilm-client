<template>
<section>
  <div v-if="loaded === true || blockO.loaded === true" ref="viewBlock" :data-id="blockId" :data-rid="blockRid" :id="blockId" :class="['ilm-block', 'ilm-display', '-langblock-' + blockView.language, blockOutPaddings]">

      <div v-if="blockO.type == 'illustration'" :class="getClass">
        <img :class="getClass" :src="getIllustration"/>
        <div class="getDescription"
        :class="['content-description', getClass]"
        v-if="getDescription.length"
        v-html="getDescription">
        </div>
      </div>
      <div v-else-if="blockO.type == 'hr'">
        <hr :class="[getClass]"/>
      </div>
      <div v-else >
        <div
          v-if="parnum && parnum.length"
          v-html="parnum"
          :class="['parnum']">
        </div>
        <div
          @click="handleFootnote($event)"
          :class="[getClass, 'hide-archive', 'part-0']"
          :id="blockId"
          :data-parnum="parnum"
          :lang="blockView.language"
          :data-type="blockO.type"
          v-html="blockView.content">
        </div>
        <div class="footnotes"
          v-if="blockView.footnotes.length > 0">
          <div class="-hidden" ref="footNotes"
            v-for="(footnote, footnoteIdx) in blockView.footnotes" >
            <div :class="['-langftn-' + footnote.language]">
              <div class="-num">[fn{{footnote.ftnIdx+1}}]</div>
              <div  class="-text" v-html="footnote.content">
              </div>
            </div>
          </div>
        </div>
      </div>

  </div>
  <div v-else ref="viewBlock" :data-id="blockId" :data-rid="blockRid" :id="blockId" :class="['ilm-block', 'ilm-display', 'content-process-run', 'preloader-loading']">
    <!--{{blockId}}/{{blockRid}}/{{blockO.loaded}}-->
  </div>

  <div class="clearfix"></div>
</section>
</template>

<script>
import Vue from 'vue'
import { BookBlock }    from '../../store/bookBlock'
import { mapGetters, mapState, mapActions } from 'vuex'

  export default {
    name: 'book-block-display',
    props: [
      'blockRid', 'blockO', 'lang', 'loaded'
    ],// loaded property is necessary for updating first part of loaded blocks, VueJS is not updating automatically
    data() {
      return {
        fntCounter: 0
      }
    },
    computed: {
      ...mapGetters({
        parlist: 'storeList'
      }),
      blockId: function() {
        return this.blockO.blockid;
      },
      block: function() {
        return this.parlist.get(this.blockId)
      },
      blockOutPaddings: function () {
        if (this.block) {
          return (this.block.classes && this.block.classes.hasOwnProperty('outsize-padding')) ? this.block.classes['outsize-padding'] : ''
        } else return '';
      },
      parnum: { cache: false,
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
          return this.block.getClass();
        }
      },
      getIllustration: { cache: true,
        get: function () {
          return this.block.getIllustration();
        }
      },
      getDescription: { cache: true,
        get: function () {
          return this.block.description;
        }
      },
      blockView: function () {
        if (this.block) {
          let viewObj = { footnotes: this.block.footnotes, language: this.block.language || this.lang };//new BookBlock(this.block);//Object.assign({}, this.parlist.get(blockId));
          viewObj.content = this.block.content.replace(
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
                viewObj.footnotes[ftnIdx].ftnIdx = this.fntCounter;
              }
              ftnIdx++;
              return `<sup data-idx="${this.fntCounter++}">[${this.fntCounter}]</sup>`
            }
          );
          //<sup class="service-info" data-idx="2"><w class="service-info" data-sugg="">2</w></sup>
          viewObj.content = viewObj.content.replace(
            /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
            (idx)=>{
              if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
                viewObj.footnotes[ftnIdx].ftnIdx = this.fntCounter;
              }
              ftnIdx++;
              return `<sup class="service-info" data-idx="${this.fntCounter++}">[${this.fntCounter}]</sup>`
            }
          );
          return viewObj;
        } else return { footnotes: [], language: this.block.language || this.lang };
      }
    },
    methods: {
      handleFootnote: function (ev) {
        if (ev.target.dataset.idx && this.$refs.footNotes[ev.target.dataset.idx]) {
          let className = this.$refs.footNotes[ev.target.dataset.idx].className;
          if (className == '-hidden') {
            this.$refs.footNotes[ev.target.dataset.idx].className = '';
          } else this.$refs.footNotes[ev.target.dataset.idx].className = '-hidden';
        }
      }
    }
  }
</script>

<style lang='less'>
  .ilm-display {
    [data-flag] {
      pointer-events: all;
      cursor: default;
      &:before {
        cursor: default;
      }
    }
  }
</style>
