<template>
  <fieldset class="complete-audio" v-if="allowExport">
    <legend>Export joined audio</legend>
    <div class="align-preloader -small" v-if="isGenerating"></div>
    <template v-else>
      <div v-if="currentBookMeta.complete_audio_time && currentBookMeta.complete_audio_time !== -1" class="build-time">
        <span>Last build: {{convertTime(currentBookMeta.complete_audio_time, true)}}</span>
      </div>
    </template>
    <div>
      <button class="btn btn-primary" v-if="!currentBookMeta.complete_audio" v-on:click="generateCompleteAudio" :disabled="!hasAudioblocks || isGenerating">Build</button>
      <button class="btn btn-primary" v-else v-on:click="generateCompleteAudio" :disabled="!hasAudioblocks || isGenerating">Rebuild</button>
      &nbsp;&nbsp;{{currentBookCounters.voiced_in_range}} voiced block(s) 
      <span v-if="blockSelection.start && blockSelection.start._id">
        in range 
        <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - 
        <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
      </span>
    </div>
    <div>
      <a :href="this.API_URL + 'download/complete_audio?path=' + currentBookMeta.complete_audio" v-if="currentBookMeta.complete_audio && !isGenerating" target="_blank" class="btn btn-primary">
        Download
      </a>
      <a v-else class="btn btn-primary disabled">
        Download
      </a>
    </div>
  </fieldset>
</template>
<script>
  import {mapGetters, mapActions} from 'vuex';
  import api_config from '../../../mixins/api_config.js';
  import access from '../../../mixins/access.js'
  export default {
    name: 'CompleteAudioExport',
    data() {
      return {}
    },
    props: ['convertTime', 'goToBlock'],
    mixins: [api_config, access],
    computed: {
      isGenerating: {
        get() {
          let dt = new Date(this.bookCompleteAudioTime);
          return this.bookCompleteAudioTime === -1 || (this.bookCompleteAudioTime && dt.getTime() <= 0);
        },
        cache: false
      },
      hasAudioblocks: {
        get() {
          return parseInt(this.currentBookCounters.voiced_in_range) > 0;
        },
        cache: false
      },
      allowExport: {
        get() {
          if (this._is('admin') || this._is('librarian') || this._is('editor', true)) {
            return true;
          }
          return false;
        },
        cache: false
      },
      ...mapGetters(['currentBookMeta', 'currentBookCounters', 'blockSelection', 'bookCompleteAudioTime'])
    },
    methods: {
      ...mapActions(['generateCompleteAudio'])
    }
  }
</script>
<style lang="less">
  fieldset.complete-audio {
    legend {
      margin-bottom: 5px;
    }
    div {
      margin: 7px 0px;
      &.build-time {
        height: 41px;
      }
    }
    a {
      cursor: pointer;
    }
  }
</style>