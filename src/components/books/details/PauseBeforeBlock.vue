<template>
  <div v-bind:key="blockType + '_pause_before'" :class="['pause-before-container', 'mode-' + bookMode]">
    <template v-if="blockTypesInRange.length > 1">
      <template v-if="range.length > 1">
        <div class="range-info">From {{range[0]}} to {{range[range.length - 1]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a></div>
      </template>
      <template v-else>
        <div class="range-info">{{range[0]}} sec. is applied to {{blockTypesInRange.length}} {{blockTypeLabel}} in range <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a></div>
      </template>
    </template>
    <vue-slider v-model="pause" 
        :min="min" 
        :max="max" 
        :interval="interval" 
        :width="'auto'" 
        tooltip="none"
        :lazy="true"
        :silent="true"
        :debug="false"
        ref="pause_before_slider"
        @input="pauseValueChange"
        @drag-end="pauseDragEnd"
        v-if="bookMode !== 'proofread'"></vue-slider>
    <div class="hidden">pause: "{{pause}}", {{parseFloatToFixed(pause)}}, range: {{range}}</div><!-- class="hidden" -->
    <div class="hidden">{{parseFloatToFixed(pause) === min}},{{parseFloatToFixed(pause) === max}}</div>
    <div class="col-md-12">
      <div class="pause-before-input col-md-8">
        <template v-if="bookMode === 'proofread'">
          <input  class="pause-before" type="number" disabled
            v-if="range.length > 1"/>
          <input type="number" class="pause-before" v-model="pause" disabled v-else />
        </template>
        <template v-else>
          <button @click="decreasePause" :disabled="parseFloatToFixed(pause) === min" class="minus"></button>
          <input  class="pause-before" type="number" disabled
            v-if="range.length > 1"/>
          <input  class="pause-before" type="number" v-model="pauseInput"
            :min="min"
            :max="max"
            :step="interval"
            v-on:change="onPauseInput"
            v-on:focusout="onFocusout"
            v-else/>
          <button @click="increasePause" class="plus" :disabled="parseFloatToFixed(pause) === max"></button>
        </template>
      </div>
      <div class="listen-block col-md-4" v-if="listenBlockDisplay">
        <label>Listen</label>
        <i class="fa fa-play-circle-o" disabled v-if="listenBlockDisabled"></i>
        <i class="fa fa-play-circle-o" v-else @click="listenBlock"></i>
        <div class="hidden">{{nowPlaying}},{{pause}}</div>
      </div>
    </div>
  </div>
</template>
<script>
  import VueSlider from 'vue-slider-component';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  //import _ from 'lodash'
  export default {
    name: "PauseBeforeBlock",
    components: {VueSlider},
    props: ["blockType", "styleValue", "styleProps"],
    data() {
      return {
        pause: 0,
        pauseUpdateEmitted: false,
        min: 0,
        max: 4, 
        interval: 0.1,
        range: [],
        blockList: [],
        player: null,
        nowPlaying: false
      }
    },
    mounted() {
      //console.log(`MOUNTED`, this.selectedValues, this.styleValue(this.blockType, 'pause_before', 'none'))
      //setInterval(() => {
        //this.$refs.pause_before_slider.refresh();
      //}, 1000)
      //setTimeout(() => {
        //this.pause = 2.9;
        //this.$refs.pause_before_slider.setValue(2.9);
      //}, 5000);
      this.resetPause();
      /*let sorted = Array.from(this.storeList).sort((a, b) => {
        return a[1].index > b[1].index ? 1 : -1;
      }).map((a) => {
        return a[1];
      });*/
      //this.blockList = blockList;
    },
    activated: function() {
      console.log(`ACTIVATED`, this.blockType)
    },
    methods: {
      setPauseBefore(val) {
        //console.log(val, typeof val);
        if (val && val % 1 !== 0) {
          val = parseFloat(parseFloat(val).toFixed(1));
        }
        this.$emit('setPauseBefore', this.blockType, val);
      },
      pauseValueChange(val) {
          //console.log(val, this.selectedBlock.pause_before, this.pauseUpdateEmitted);
        if (this.pauseUpdateEmitted) {
          let blk = Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange.find(b => {
            return b.pause_before != val;
          }) : false;
          if (blk) {
            //console.log('ON INPUT', val, typeof val);
            val = this.parseFloatToFixed(val);
            //if (this.pause != val) {
              this.$emit('setPauseBefore', this.blockType, val);
            //}
          }
        }
      },
      pauseDragEnd(val) {
        //console.log('DRAG END');
        //console.log(arguments)
        if (val && typeof val.getValue === 'function') {
          this.pauseValueChange(val.getValue());
          this.pauseUpdateEmitted = false;
        }
      },
      recalcPauseBeforeRange(reset_pause = false) {
        let range = [];
        let selectedProps = this.styleProps.get(this.blockType);
        if (selectedProps) {
          let pauses = selectedProps.get('pause_before');
          if (pauses) {
            range = Array.from(pauses.keys()).map((v) => {
              if (v === 'none') {
                v = 0;
              }
              return this.parseFloatToFixed(v);
            });
          }
        }
        this.range = range.sort((a, b) => {
          return a > b ? 1 : -1;
        });
        //console.log('recalc range', this.pause, this.range[0], reset_pause);
        if (this.range.length === 1 && this.pause !== this.range[0] && reset_pause) {
          this.pauseUpdateEmitted = false;
          this.pause = this.range[0];
        }
      },
      resetPause() {
        this.pauseUpdateEmitted = false;
        this.recalcPauseBeforeRange();
        let val;
        if (this.range.length === 1 && this.range[0] !== 'none') {
          val = this.parseFloatToFixed(this.range[0]);
        } else {
          val = 0;
        }
        let changedVal = this.pause != val;
        //console.log('reset', this.pause, val);
        this.pause = val;
        if (!changedVal) {
          this.pauseUpdateEmitted = true;
        }
      },
      increasePause() {
        if (this.range.length > 1) {
          this.pause = this.min;
          this.pauseUpdateEmitted = true;
          this.pauseValueChange(this.pause);
          this.resetPause();
        } else if (this.pause <= this.max - this.interval) {
          this.pause = this.parseFloatToFixed(this.parseFloatToFixed(this.pause) + this.interval);
        }
      },
      decreasePause() {
        if (this.pause >= this.min + this.interval) {
          this.pause = this.parseFloatToFixed(this.parseFloatToFixed(this.pause) - this.interval);
        }
      },
      parseFloatToFixed(val, precision = 1) {
        if (val && (val % 1 !== 0 || typeof val === 'string')) {
          val = parseFloat(parseFloat(val).toFixed(precision));
        }
        return val;
      },
      recalcBlocks() {
        return;
        let blockList = [];
        if (this.blockSelection.start && this.blockSelection.start._id && this.blockSelection.end && this.blockSelection.end._id) {
          let crossId = this.blockSelection.start._id;
          for (let idx = 0; idx < this.storeList.size; idx++) {
            let block = this.storeList.get(crossId);
            if (block) {
              if (this.bookMode === 'edit') {
                blockList.push(block);
              } else if (this.bookMode === 'narrate') {
                if (block.voicework === 'narrate') {
                  blockList.push(block);
                }
              }
              /*let hasAssignment = this.currentJobInfo.mastering  || this.currentJobInfo.text_cleanup;
              let hasTask = this.tc_currentBookTasks.tasks.find((t) => {
                return t.blockid == block._id;
              })
              //if (!hasAssignment && state.adminOrLibrarian) {
                //hasAssignment = state.currentJobInfo.completed;
              //}
              if (!hasTask && this.adminOrLibrarian) {
                hasTask = this.currentJobInfo.can_resolve_tasks.find((t) => {
                  return t.blockid == block._id;
                });
              }
              if ((block.status && block.status.marked) || (!hasAssignment && !hasTask)) {
                switch (block.voicework) {
                  case 'audio_file' :
                    ++approved;
                    break;
                  case 'tts':
                    ++approved_tts;
                    break;
                  case 'narration':
                    ++approved_narration;
                    break;
                }
                if (block.voicework !== 'tts' && block.footnotes && Array.isArray(block.footnotes) && block.footnotes.length > 0) {
                  let ftn = block.footnotes.find(f => {
                    return f.voicework === 'tts';
                  });
                  if (ftn) {
                    ++approved_tts;
                  }
                }
              }
              if (block.isChanged || block.isAudioChanged) {
                if (block.voicework === 'audio_file') {
                  ++changed_in_range;
                }
                if (block.voicework === 'tts') {
                  ++changed_in_range_tts;
                }
                if (block.voicework === 'narration') {
                  ++changed_in_range_narration;
                }
              }*/
              if (block.blockid == this.blockSelection.end._id) {
                break;
              }
              crossId = this.storeListO.getOutId(block.blockid);
              if (!crossId) {
                break;
              }
            } else break;
          }
        }
        this.blockList = blockList;
      },
      listenBlock() {
        let length = 3;
        if (this.blockTypesInRange.length === 1) {
          let previousBlock = this.storeList.get(this.storeListO.getInId(this.selectedBlock.blockid));
          let selectedBlockAudiosrc;
          if (!this.selectedBlock.getIsSplittedBlock()) {
            selectedBlockAudiosrc = this.selectedBlock.getAudiosrc('m4a');
          } else {
            selectedBlockAudiosrc = this.selectedBlock.getPartAudiosrc(0, 'm4a');
          }
          if (selectedBlockAudiosrc) {
            if (!this.player) {
              this.player = document.createElement('audio');
            }
            //this.audio_element.play();
            if (this.player) {
              let playPrevious = new Promise((resolve, reject) => {
                if (previousBlock) {
                  let audiosrc;
                  if (previousBlock.getIsSplittedBlock()) {
                    audiosrc = previousBlock.getPartAudiosrc(previousBlock.parts.length - 1, 'm4a');
                  } else {
                    audiosrc = previousBlock.getAudiosrc('m4a');
                  }
                  if (audiosrc) {
                    this.nowPlaying = previousBlock.blockid;
                    this.player.onloadedmetadata = () => {
                      //console.log(this.player.duration);
                      if (!isNaN(this.player.duration)) {
                        if (this.player.duration > length) {
                          this.player.currentTime = this.player.duration - length;
                        }
                        this.player.play();
                      }
                    };
                    this.player.onerror = () => {
                      return resolve();
                    };
                    this.player.onended = () => {
                      return resolve();
                    };
                    this.player.src = audiosrc;
                  } else {
                    return resolve();
                  }
                } else {
                  return resolve();
                }
              });
              playPrevious
                .then(() => {
                  this.nowPlaying = 'pause';
                  setTimeout(() => {
                    this.player.ontimeupdate = () => {
                      if (this.player.currentTime >= length) {
                        this.stopAudio();
                      }
                    };
                    this.player.onended = () => {
                      //this.player.src = null;
                      this.stopAudio();
                    }
                    this.player.onloadedmetadata = () => {
                      this.player.play();
                    };
                    this.nowPlaying = this.selectedBlock.blockid;
                    this.player.src = selectedBlockAudiosrc;
                  }, this.pause * 1000);
                });
              /*if (map[0] + map[1] < (2 * length + 1) * 1000) {
                this.player.playBlock('content-' + this.block._id + '-part-0');
              } else {

                this.player.audio_element.onpause = () => {
                  //console.log('PAUSE')
                  let delay = 1000;
                  if (this.player.load_delay) {
                    delay+=this.player.load_delay;
                  }
                  this.$root.$emit('for-bookedit:scroll-to-block-end', this.block._id);
                  setTimeout(() => {
                    this.player.playRange(`content-${this.block._id}-part-0`, map[0] + map[1] - length * 1000, map[0] + map[1]);
                  }, delay);

                  //console.log(this.player);
                  this.player.audio_element.onpause = null;
                };
                this.player.playRange(`content-${this.block._id}-part-0`, 0, length * 1000);
              }*/

            }
          }
        }
      },
      stopAudio() {
        if (this.player) {
          this.nowPlaying = false;
          this.player.pause();
          this.player.onloadedmetadata = null;
          this.player.onerror = null;
          this.player.onended = null;
          this.player.ontimeupdate = null;
        }
      },
      goToBlock(blockId) {
        this.$root.$emit('for-bookedit:scroll-to-block', blockId);
      },
      onPauseInput($ev) {
        //console.log($ev.target.value);
        let value = parseFloat($ev.target.value);
        if (isNaN(value) || !value) {
          value = 0;
        }
        this.pause = this.parseFloatToFixed(value);
      },
      onFocusout($ev) {
        if (/[^\d\.\,]/.test($ev.target.value)) {
          $ev.target.value = this.pause;
        }
      }
    },
    computed: {
      pauseBeforeSelection: {
        get() {
          let range = this.pausesBeforeRange;
          if (range.length === 1 && range[0] !== 'none') {
            return range[0];
          }
          return 0;
        },
        set(val) {
          this.setPauseBefore(val);
        }
      },
      pausesBeforeRange: {
        get() {
          let range = [];
          let selectedProps = this.styleProps.get(this.blockType);
          if (selectedProps) {
            let pauses = selectedProps.get('pause_before');
            if (pauses) {
              range = Array.from(pauses.keys());
            }
          }
          return range.sort((a, b) => {
            return parseFloat(a) > parseFloat(b) ? 1 : -1;
          });
        }
      },
      blockTypeLabel: {
        get() {
          let type = this.blockType === 'par' ? 'paragraph' : this.blockType;
          return type.charAt(0) + type.slice(1) + 's';
        }
      },
      blockTypesInRange: {
        get() {
          if (Array.isArray(this.selectedBlocks)) {
            let blocks = this.selectedBlocks.filter(b => {
              return b.type === this.blockType;
            });
            return blocks;
          }
          return [];
        }
      },
      pauseInput: {
        get() {
          return this.pause;
        },
        set(val) {
          /*console.log(arguments);
          let wait = _.debounce((key,event) => {
            console.log(key, event, val);
          },  500);
          wait();*/
        }
      },
      selectedBlock: {
        get() {
          return Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange[0] : null;
        },
        cache: false
      },
      listenBlockDisabled: {
        get() {
          let audiosrc;
          if (this.selectedBlock) {
            if (this.selectedBlock.getIsSplittedBlock()) {
              audiosrc = this.selectedBlock.getPartAudiosrc(0, 'm4a');
            } else {
              audiosrc = this.selectedBlock.getAudiosrc('m4a');
            }
          }
          return this.blockTypesInRange.length > 1 || this.nowPlaying || !this.selectedBlock || !audiosrc;
        },
        cache: false
      },
      listenBlockDisplay: {
        get() {
          let blocks = Array.isArray(this.blockTypesInRange) ? this.blockTypesInRange : [];
          if (blocks.length === 1 && this.selectedBlock.voicework === 'no_audio') {
            return false;
          }
          let audioBlocks = blocks.find(b => {
            return b.voicework !== 'no_audio';
          });
          return audioBlocks && !['hr', 'illustration'].includes(this.blockType);
        },
        cache: false
      },
      ...mapGetters({
        blockSelection: 'blockSelection',
        storeList: 'storeList',
        storeListO: 'storeListO',
        bookMode: 'bookMode',
        selectedBlocks: 'selectedBlocks'
      })
    },
    watch: {
      'pause': {
        handler(val) {
          Vue.nextTick(() => {
            this.pauseUpdateEmitted = true;
          });
        }
      },
      'blockSelection': {
        handler(val) {
          this.resetPause();
          this.recalcBlocks();
        },
        deep: true
      },
      'styleProps': {
        handler() {
          this.recalcPauseBeforeRange(true);
          //this.pauseUpdateEmitted = false;
          //this.resetPause();
        },
        deep: true
      },
      'bookMode': {
        handler() {
          this.recalcBlocks();
        }
      }
    }
  }
</script>
<style lang="less">
  .pause-before-container {
    .pause-before-input {
      text-align: left;
      padding: 0px;
      input[type="number"] {
        -webkit-appearance: textfield;
        -moz-appearance: textfield;
        appearance: textfield;
      }

      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
      }

      /*.number-input {
        border: 0;
        display: inline-flex;
      }*/

      .pause-before {
        box-sizing: border-box;
      }

      button {
        outline:none;
        -webkit-appearance: none;
        background-color: transparent;
        border: none;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        cursor: pointer;
        margin: 0;
        position: relative;
        /*box-shadow: 0px 0px 1px #474747;
        border-radius: 50%;*/
        vertical-align: super;
        &.minus:disabled, &.plus:disabled {
          background-color: inherit !important;
          &:before, &:after {
            color: gray;
            background-color: gray;
          }
        }
      }

      button:before,
      button:after {
        display: inline-block;
        position: absolute;
        content: '';
        width: 1rem;
        height: 2px;
        background-color: #3498db;
        transform: translate(-50%, -50%);
      }
      button.plus:after {
        transform: translate(-50%, -50%) rotate(90deg);
      }

      input[type=number] {
        max-width: 5rem;
        padding: .5rem;
        /*border: none;*/
        border-width: 1px 1px;
        /*font-size: 2rem;*/
        height: 2rem;
        font-weight: bold;
        text-align: center;
        color:#3498db;
        &:disabled {
          font-style: normal;
        }
      }
    }
    .listen-block {
      label {
        display: inline-block;
        font-weight: normal;
        /*padding: 9px 8px;*/
        vertical-align: sub;
      }
      i {
        font-size: 25px !important;
        vertical-align: text-top;
        color: #3498db;
        &[disabled="disabled"] {
          color: gray;
          background-color: inherit !important;
          cursor: inherit;
        }
      }
    }
    a {
      cursor: pointer;
    }
    .col-md-12 {
      padding: 0px;
    }
    &.mode-proofread {
      .listen-block {
        i {
          vertical-align: top;
        }
      }
    }
  }
</style>