<template>
  <div>
    <cntx-menu
      ref="waveformContext"
      dir="bottom">
      <li v-on:click="setSelectionStart(null, $event)" v-if="mode == 'file'">Selection Start</li>
      <li v-on:click="setSelectionEnd(null, $event)" v-if="mode == 'file'">Selection End</li>
      <li v-on:click="unpinRight($event)" v-if="mode == 'block'">Unpin Rightward</li>
    </cntx-menu>
    <div class="waveform-playlist">
      <div class="close-player-container pull-right">
        <span class="close-player" v-on:click="close()">&times;</span>
      </div>
      <div class="waveform-wrapper" @contextmenu.prevent="onContext">
        <div id="playlist" class="wf-playlist" ref="playlist"></div>
      </div>
      <div class="player-controls">

        <div :class="['play-controls', '-' + mode]">
          <i class="fa fa-play-circle-o" v-if="!isPlaying" v-on:click="play()"></i>
          <i class="fa fa-pause-circle-o" v-if="isPlaying" v-on:click="pause()"></i>
          <i class="fa fa-step-backward" v-on:click="goToStart()"></i>
          <i class="fa fa-step-forward" v-on:click="goToEnd()"></i>
        </div>
        <div class="zoom-controls">
          <i :class="['fa', 'fa-search-plus', {'disabled': !allowZoomIn}]" v-on:click="zoomIn()"></i>
          <i :class="['fa', 'fa-search-minus', {'disabled': !allowZoomOut}]" v-on:click="zoomOut()"></i>
        </div>
        <div class="selection-controls" v-bind:class="['-' + mode]">
          <div class="hidden">{{origFilePositions}}
            {{selection}}</div>
          <div v-if="selection.start >= 0" class="selection-display">
            <div>Selection Start</div>
            <div>
              <template v-if="mode == 'block'">
                <input type="text" v-model="selectionStartH" disabled />:<input type="text" v-model="selectionStartM" disabled />:<input type="number" v-model="selectionStartS" class="sec" step="0.1" ref="selectionStartNum" />
              </template>
              <template v-else-if="mode == 'file'">
                <input type="number" step="1" v-model="selectionStartH" />:
                <input type="number" step="1" v-model="selectionStartM" />:
                <input type="number" v-model="selectionStartS" class="sec" step="0.1" ref="selectionStartNum" />
              </template>
            </div>
          </div>
          <div v-if="selection.end >= 0" class="selection-display">
            <div>Selection End</div>
            <div>
              <template v-if="mode == 'block'">
                <input type="text" v-model="selectionEndH" disabled />:<input type="text" v-model="selectionEndM" disabled />:<input type="number" v-model="selectionEndS" class="sec" step="0.1" ref="selectionEndNum" :disabled="isSinglePointSelection"/>
              </template>
              <template v-else-if="mode == 'file'">
                <input type="number" step="1" v-model="selectionEndH" />:
                <input type="number" step="1" v-model="selectionEndM" />:
                <input type="number" v-model="selectionEndS" class="sec" step="0.1" ref="selectionEndNum" :disabled="isSinglePointSelection"/>
              </template>
            </div>
          </div>
          <template v-if="mode == 'block'">
            <div>
              <button class="btn btn-default" v-on:click="clearSelection()" :disabled="!hasSelection || isSinglePointSelection">Clear</button>
              <button class="btn btn-primary" v-on:click="cut()"  :disabled="!hasSelection || isSinglePointSelection">Cut</button>
            </div>
          </template>
        </div>
        <div class="selection-controls" v-if="mode == 'block'">
          <input type="number" step="0.1" v-model="silenceLength" />
          <button class="btn btn-primary" v-on:click="addSilence()" :disabled="cursorPosition === false">Add Silence</button>
        </div>
        <div class="audio-controls" v-if="isModifiedComputed && mode == 'block'">
          <button class="btn btn-default" v-if="history.length" v-on:click="undo()">Undo</button>
          <button class="btn btn-default" v-on:click="showModal('onDiscardMessage')">Discard</button>
          <button class="btn btn-primary" v-on:click="save()">Save</button>
          <button class="btn btn-primary" v-on:click="saveAndRealign()">Save & Re-align</button>
        </div>
        <div class="audio-controls" v-if="mode == 'file'">
          <button class="btn btn-default" :disabled="!isModifiedComputed" v-on:click="undo()">Undo</button>
          <button class="btn btn-primary" :disabled="!allowAlignSelection" v-on:click="align()" v-if="!alignProcess">Align</button>
          <span v-else class="align-preloader -small"></span>
          <button class="cancel-align" v-if="hasLocks('align')" v-on:click="cancelAlign()" title="Cancel aligning"><i class="fa fa-ban"></i></button>
          <span v-if="!hasAlignSelection" class="red-message">Define block range</span>
          <template v-else>
            <span v-if="hasAlignSelectionStart && hasAlignSelectionEnd" class="blue-message">
              {{selectionBlocksToAlign}} audio blocks in range <a v-if="hasAlignSelectionStart" class="blue-message" v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> - <a v-if="hasAlignSelectionEnd" class="blue-message" v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
            </span>
          </template>
        </div>
      </div>
    </div>
    <modal name="onDiscardMessage" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Discard unsaved audio changes?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="hideModal('onDiscardMessage')">Cancel</button>
        <button class="btn btn-primary" v-on:click="discard()">Discard</button>
      </div>
    </modal>
    <modal name="onExitMessage" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p v-if="mode == 'block'">Discard unsaved audio changes?</p>
        <p v-if="mode == 'file'">Discard unsaved markers position?</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="checkExitState()">Cancel</button>
        <button v-if="mode == 'block'" class="btn btn-primary" v-on:click="discardAndExit()">Confirm</button>
        <button v-if="mode == 'file'" class="btn btn-primary" v-on:click="discardAndExit()">Discard</button>
      </div>
    </modal>
    <modal name="onWordRepositionMessage" :class="['on-word-reposition']" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Words repositioning will be lost on unmastered audio</p>
      </div>
      <div class="modal-footer">
         <button class="btn btn-primary" v-on:click="hideModal('onWordRepositionMessage')">OK</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import Vue from 'vue'
  import api_config from '../mixins/api_config.js'
  import task_controls from '../mixins/task_controls.js'
  import BlockContextMenu from './generic/BlockContextMenu';
  //import { modal } from 'vue-strap'
  import v_modal from 'vue-js-modal';
  import {mapActions, mapGetters} from 'vuex'
  import _ from 'lodash';
  //import Peaks from 'peaks.js';
  var WaveformPlaylist = require('waveform-playlist');
  var Draggable = require ('draggable')
  var {TimeScale} = require('../store/AudioTimeScale.js');
  Vue.use(v_modal, { dialog: true });

  export default {
      name: 'AudioEditor',
      components: {
        //'modal': modal,
        'cntx-menu': BlockContextMenu
      },
      mixins: [api_config, task_controls],
      data() {
        return {
          audiosourceEditor: false,
          peaksPlayer: false,
          content: "",
          audiofile: "",//'http://localhost:3000/audiofiles/aaiw1_en/aaiw1_en_31/aaiw1_en_31.flac',
          blockId: null,
          block: null,
          plEventEmitter: false,
          words: [],
          currentWord: null,
          selection: {},
          zoomLevel: 100,
          zoomLevels: [50, 100, 200, 500, 2000, 5000],
          isPlaying: false,
          isPaused: false,
          isSingleWordPlaying: false,
          silenceLength: 0.1,
          audioContext: null,
          contentContainer: null,
          isModified: false,
          isAudioModified: false,
          history: [],
          isHistoryFull: true,
          discardOnExit: false,
          mode: 'block',
          origFilePositions: {},
          cursorPosition: false,
          dragLeft: null,
          dragRight: null,
          playlistScrollPosition: 0,
          audiofileId: null,
          blockSelectionEmit: false,
          contextPosition: null,
          pendingLoad: null,
          mouseSelection: {
            start: null,
            end: null
          },
          alignProcess: false,
          annotations: [],
          minWordSize: 0.05,
          wordSelectionMode: false,
          processRun: false,
          processRunType: null
        }
      },
      mounted() {
        this.$root.$on('for-audioeditor:load-and-play', this.load);
        this.$root.$on('for-audioeditor:load', this.setAudio);
        //this.$root.$on('for-audioeditor:reload-text', this._setText);
        //this.$root.$on('for-audioeditor:select', this.select);
        this.$root.$on('for-audioeditor:close', this.close);
        this.$root.$on('for-audioeditor:force-close', this.forceClose);
        this.$root.$on('start-align', () => {
          this.alignProcess = true;
        })
        this.$root.$on('stop-align', () => {
          this.alignProcess = false;
        })
        this.$root.$on('for-audioeditor:set-process-run', this.setProcessRun);
        this.$root.$on('for-audioeditor:flush', this.flush);
      },
      beforeDestroy() {
        if (this.audioContext) {
          this.audioContext.close();
          //this.audioContext = null;
          this.audiosourceEditor = null;
        }
        this.$root.$off('for-audioeditor:close', this.close);
        this.$root.$off('for-audioeditor:force-close', this.forceClose);
        this.$root.$off('for-audioeditor:load-and-play', this.load);
        this.$root.$off('for-audioeditor:load', this.setAudio);
        this.$root.$off('for-audioeditor:reload-text', this._setText);
        this.$root.$off('for-audioeditor:select', this.select);
        this.$root.$off('for-audioeditor:set-process-run', this.setProcessRun);
        this.$root.$off('for-audioeditor:flush', this.flush);
      },
      methods: {
        select (block_id, start, end, selectElement = false) {
          if (block_id && this.blockId === block_id) {
            this.blockSelectionEmit = true;
            this.selection.start = start / 1000;
            this.selection.end = end / 1000;
            this.wordSelectionMode = false;
            this._clearWordSelection();
            this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            this._showSelectionBorders(true);
            if (selectElement) {
              let index = this.contentContainer.find('w[data-map]:not([data-map=""])').index($(selectElement));
              if (typeof index =='undefined' || index === false || index < 0) {
                let index_no_data = this.contentContainer.find('w:not([data-map])').index($(selectElement));
                let total_index = this.contentContainer.find('w').index($(selectElement));
                index = total_index - index_no_data;
              }
              if (index >= 0) {
                Vue.nextTick(() => {
                  this._setWordSelection(index, false, false);
                });
              }
            }
          }
        },
        load(audio, text, block, autostart = false, bookAudiofile = {}, reloadOnChange = true) {
          //console.log('load', audio, text, block, autostart, bookAudiofile, reloadOnChange);

          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext);
          }

          let blockId = block ? block._id : null;

          this.$root.$off('for-audioeditor:select', this.select);
          this.$root.$off('for-audioeditor:reload-text', this._setText);
          this.$root.$on('for-audioeditor:select', this.select);
          this.$root.$on('for-audioeditor:reload-text', this._setText);

          //if (bookAudiofile && bookAudiofile.blockMap) {
            //this.blockMap = bookAudiofile.blockMap;
          //} else {
            //this.blockMap = {};
          //}
          $('.playlist-tracks').off('scroll');
          if (this.audioContext && this.audioContext.state === 'closed') {
            return false;//component was destroyed;
          }
          let mode = bookAudiofile.id ? 'file' : 'block';
          let closingId = this.audiofileId;
          if (bookAudiofile.id) {
            this.audiofileId = bookAudiofile.id;
          }
          let changeZoomLevel = mode != this.mode;
          if ((this.blockId && this.blockId != blockId) || (mode == 'file' && reloadOnChange) || mode != this.mode) {
            if (this.isModifiedComputed && this.mode === 'block') {
              this.pendingLoad = arguments;
              this.showModal('onExitMessage');
              return;
            }
            if (this.isModifiedComputed && this.mode === 'file') {
              this.$root.$emit('from-audioeditor:save-positions', closingId, this.selection);
            }
            if (this.dragRight) {
              this.dragRight.destroy();
            }
            if (this.dragLeft) {
              this.dragLeft.destroy();
            }
            this.silenceLength = 0.1;
            this.cursorPosition = false;
            this.isModified = false;
            this.playlistScrollPosition = 0;
            this.selection = {};
            this.wordSelectionMode = false;
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            this._clearWordSelection();
            //this.isAudioModified = false;
            //this.contentHistory = [];
            //this.audioHistory = [];
            //this.close();
          }
          this.setProcessRun(true, 'loading');
          this.pendingLoad = null;
          this.isPlaying = false;
          this.isPaused = false;
          let clear = [];
          if (this.audiosourceEditor) {
            this.audiosourceEditor.tracks.forEach(t => {
              //console.log(t.playout);
              delete t.playout.buffer;
            });
            //console.log('CLEAR');
            clear.push(this.audiosourceEditor.clear());
          }
          Promise.all(clear)
            .then(() => {


          if (bookAudiofile) {
            if (bookAudiofile.positions) {
              if (bookAudiofile.positions.start) {
                //bookAudiofile.positions.start = parseInt(bookAudiofile.positions.start);
              }
              if (bookAudiofile.positions.end) {
                //bookAudiofile.positions.end = parseInt(bookAudiofile.positions.end);
              }
            }
          }


          this.currentWord = null;
          this.contextPosition = null;
          this.mode = mode;

          if (this.$refs.waveformContext) {
            this.$refs.waveformContext.close();
          }

          var self = this;

          this.audiofile = audio;
          this.blockId = blockId;
          this.block = block;

          if (!this.audiosourceEditor) {
            if (!this.audioContext) {
              this.audioContext = new (window.AudioContext || window.webkitAudioContext);
            }
            if (mode == 'file') {
               this.zoomLevel = this.zoomLevels[this.zoomLevels.length - 1];
            }
            this.audiosourceEditor= WaveformPlaylist.init({
              ac: this.audioContext,
              samplesPerPixel: this.zoomLevel,
              waveHeight: 80,
              container: document.getElementById('playlist'),
              state: 'select',
              colors: {
                waveOutlineColor: '#E0EFF1',
                timeColor: 'grey',
                fadeColor: 'black'
              },
              zoomLevels: this.zoomLevels,
              timescale: true,
              linkEndpoints: true
            });
            this.audiosourceEditor.renderTimeScale = function() {// temporary solution for ILM-2453, need to have audio editor in local repositories
              const controlWidth = this.controls.show ? this.controls.width : 0;
              const timeScale = new TimeScale(this.duration, this.scrollLeft,
                this.samplesPerPixel, this.sampleRate, controlWidth);

              return timeScale.render();
            }
//             var _this15 = this.audiosourceEditor;
//             this.audiosourceEditor.drawRequest = function (){
//               console.log('drawRequest', blockId);
//               if (_this15) {
//                 _this15.draw(_this15.render());
//               }
//            }
          } else if (changeZoomLevel) {
            if (this.mode == 'file') {
              let zoom = this.zoomOut();// if previously loaded block audio - set zoom level to max zoom out
              while(zoom) {
                zoom = this.zoomOut();
              }
            } else {
              let zoom = this.zoomIn(100);// if previously loaded file audio - set zoom level to max zoom in
              while(zoom) {
                zoom = this.zoomIn(100);
              }
            }
          }
          /*try {
            if (this.audiosourceEditor.getEventEmitter().__ee__ && this.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
              this.audiosourceEditor.getEventEmitter().off('dragged', this.audiosourceEditor.getEventEmitter().__ee__['dragged']);
            }
          } catch(e) {}*/
          this._setText(text, block);
          this.audiosourceEditor.load([
            {
              src: this.audiofile,
              name: 'block-audio',
              gain: 0.5,
              waveOutlineColor: '#f3f3f3',
              customClass: 'block-audio',
              states: {
                cursor: true,
                fadein: true,
                fadeout: true,
                select: true,
                shift: true,
              }
            }
          ])
          .then(() => {
            if (this.mode === 'block') {
              this.clearSelection();
            }
            this.setProcessRun(false);
            this.audiosourceEditor.stopAnimation();
            if (this.audiosourceEditor.tracks.length > 1) {
              this.audiosourceEditor.getEventEmitter().emit('clear');
              this.load(audio, text, block, autostart, bookAudiofile);
              return;
            }
            let self = this;;
            if (this.blockId) {
              this.$root.$emit('from-audioeditor:block-loaded', this.blockId);
            } else if (bookAudiofile && bookAudiofile.id) {
              this.$root.$emit('from-audioeditor:audio-loaded', bookAudiofile.id);
            }
            $('.playlist-tracks').scrollLeft(this.playlistScrollPosition);
            $('.playlist-tracks').trigger('scroll');
            $('.playlist-tracks').on('scroll', () => {
              this.playlistScrollPosition = $('.playlist-tracks').scrollLeft();
            });
            if (this.selection.end && this.selection.end > parseFloat(this.audiosourceEditor.duration)) {
              this.selection.end = this._round(parseFloat(this.audiosourceEditor.duration), 1);
              if (this.selection.start >= this.selection.end) {
                this.selection.start = this.selection.end - 0.1;
              }
            }
            this._setSelectionOnWaveform();
            this.plEventEmitter = this.audiosourceEditor.getEventEmitter();
            if (!text) {
              //this.plEventEmitter.emit('automaticscroll', true);
            }
            this.plEventEmitter.on('timeupdate', function(position) {
              //console.log('this.plEventEmitter.on(timeupdate');
              if (self.isPlaying) {
                let cursor_position = $('.cursor').position().left;
                let waveform_position = $('.playlist-tracks')[0].scrollLeft;
                let waveform_width = $('.playlist-tracks')[0].offsetWidth;
                if (cursor_position > 0 && (
                        cursor_position < waveform_position ||
                        cursor_position > waveform_position + waveform_width)) {
                    let scrollPosition = cursor_position > waveform_position + waveform_width ? waveform_position + waveform_width / 2 : cursor_position;
                    $('.playlist-tracks').scrollLeft(scrollPosition);// scrolls to start, changes scroll on click
                }
              }
              if (self.mode == 'block') {
                if ((!self.isSingleWordPlaying && !self.isPlaying) || (self.currentWord && self.currentWord.start <= position && self.currentWord.end > position)) {
                  return;
                }
                let word = self.words.find(_w => {
                  return _w.start <= position && _w.end >position;
                })
                if (word) {
                  self.currentWord = word;
                  self._setWordSelection(word.alignedIndex);
                  if (!self.isAnnotationVisible(word.alignedIndex)) {
                    self.scrollPlayerToAnnotation(word.alignedIndex);
                  }
                  if (self.isSingleWordPlaying) {
                    self.isSingleWordPlaying = false;
                  }
                }
              }
            });
            this.plEventEmitter.on('finished', function() {
              self._clearWordSelection();
              self.isPlaying = false;
              self.isPaused = false;
            });
            this.plEventEmitter.on('select', function(start, end) {
              start = self._round(start, 2);
              end = self._round(end, 2);
              let is_single_cursor = end - start == 0;
              if (is_single_cursor && self.contextPosition && self.mode === 'file' &&
                      typeof self.selection.start !== 'undefined' &&
                      typeof self.selection.end !== 'undefined') {
                self.plEventEmitter.emit('select', self.selection.start, self.selection.end);
                return;
              }
              if (self.mode === 'file' && Math.abs(end - start) < 0.2 &&
                      typeof self.selection.start !== 'undefined' &&
                      typeof self.selection.end !== 'undefined' &&
                      (self.selection.start != start ||
                      self.selection.end != end)) {

                self.plEventEmitter.emit('select', self.selection.start, self.selection.end);
                return;
              }
              if (!is_single_cursor) {
                if (start != self.selection.start) {
                  //self.cursorPosition = start;
                }
                self.selection = {start: start, end: end};
              } //else {
                //self.cursorPosition = start;
              //}
              return;
            });
            let dragDropInterval = setInterval(() => {
              if ($('.waveform .selection').length > 0) {
                clearInterval(dragDropInterval);
                $('.waveform .selection').after('<div id="resize-selection-right" class="resize-selection"></div>').after('<div id="resize-selection-left" class="resize-selection"></div>').after('<div id="cursor-position" class="cursor-position"></div>').after('<div id="context-position" class="context-position"></div>');
                if (self.cursorPosition) {//reset cursor position
                  let cp = this.cursorPosition;
                  this.cursorPosition = 0;
                  Vue.nextTick(() => {
                    this.cursorPosition = cp;
                  });
                }
                self.dragRight = new Draggable (document.getElementById('resize-selection-right'), {

                  limit: {x:[0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
                  onDrag: function(element, x, y, event) {
                    self.wordSelectionMode = false;
                    if ($('[id="resize-selection-left"]').position().left >= x) {
                      let start = x * self.audiosourceEditor.samplesPerPixel /  self.audiosourceEditor.sampleRate;
                      self.selection.start = start-1;
                      self._setSelectionOnWaveform();
                      return false;
                    }
                    let startX = 0;
                    if (self.selection && typeof self.selection.start !== 'undefined') {
                      startX = self.selection.start / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                    } else {
                      startX = $('[id="resize-selection-left"]').position().left;
                    }
                    if ($('.selection.segment').length > 0) {
                      $('.selection.segment').css('width', x - $('.selection.segment')[0].offsetLeft)
                    }

                    if (typeof self.audiosourceEditor.activeTrack !== 'undefined') {
                      self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                      if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                        self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                      } else {
                        let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                        self.plEventEmitter.emit('select', self.selection.start, startSec);
                      }
                    }
                    //self.cursorPosition = self.selection.start;
                  }
                })
                self.dragLeft = new Draggable (document.getElementById('resize-selection-left'), {
                  limit: {x: [0, $('.channel-0').length ? $('.channel-0').width() : 10000], y: [0, 0]},
                  onDrag: function(element, x, y, event) {
                    self.wordSelectionMode = false;
                    if ($('[id="resize-selection-right"]').position().left <= x) {
                      let start = x * self.audiosourceEditor.samplesPerPixel /  self.audiosourceEditor.sampleRate;
                      self.selection.end = start+1;
                      self._setSelectionOnWaveform();
                      return false;
                    }
                    $('.selection.segment').css('width', $('[id="resize-selection-right"]').position().left - $('[id="resize-selection-left"]').position().left)
                    $('.selection.segment').css('left', x - 5)
                    let startX = 0;
                    if (self.selection && typeof self.selection.end !== 'undefined') {
                      startX = self.selection.end / (self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate);
                    } else {
                      startX = $('[id="resize-selection-right"]').position().left;
                    }
                    if (typeof self.audiosourceEditor.activeTrack !== 'undefined') {
                      self.audiosourceEditor.activeTrack.stateObj.startX = startX;
                      if (typeof self.audiosourceEditor.activeTrack.stateObj.emitSelection !== 'undefined') {
                        self.audiosourceEditor.activeTrack.stateObj.emitSelection(x);
                      } else {
                        let startSec = x * self.audiosourceEditor.samplesPerPixel / self.audiosourceEditor.sampleRate;
                        self.plEventEmitter.emit('select', startSec, self.selection.end);
                      }
                    }
                    self.cursorPosition = self.selection.start;
                  }
                })
                if (self.mode === 'file') {
                  self._showSelectionBorders();
                }
              }
            }, 100)
            this.hideModal('onDiscardMessage');
            if (this.mode == 'file') {
              if (bookAudiofile && bookAudiofile.positions) {
                this.origFilePositions = bookAudiofile.positions;
              } else {
                this.origFilePositions = {start: 0, end: parseInt(this.audiosourceEditor.duration)}
              }
              if (!this._setBlocksSelection()) {
                if (bookAudiofile && bookAudiofile.positions && typeof bookAudiofile.positions.start !== 'undefined' && typeof bookAudiofile.positions.end !== 'undefined') {
                  this.plEventEmitter.emit('select', bookAudiofile.positions.start, bookAudiofile.positions.end);
                } else {
                  this.plEventEmitter.emit('select', 0, parseFloat(this.audiosourceEditor.duration));
                }
                this._showSelectionBorders();
              }
            }
            if (this.discardOnExit) {
              this.discardOnExit = false;
              this._setDefaults();
              this.close();
            } else if (autostart) {
              this.play();
            }
            //$(`#content-${this.blockId}`).on('click', 'w', {blockId: this.blockId}, this.showSelection)
          })
          .catch(err => {
            //console.log(err)
            this._setDefaults();
            this.close();
          });
          });
          let self = this;
          $('.wf-playlist').on('click', '.annotations-boxes .annotation-box', function(e) {
            self.wordSelectionMode = false;
            let index = $('.annotations-boxes .annotation-box').index($(this));
            self.blockSelectionEmit = true;
            self._setWordSelection(index, true, true);
            self.wordSelectionMode = index;
          });
          $('.wf-playlist').on('dragend', '.annotations-boxes .annotation-box .resize-handle', (ev)=>{
            this.smoothDrag(ev);
          });

          $('body').on('mouseup', '.playlist-overlay.state-select', this._showSelectionBordersOnClick);

          $('body').on('click', '.playlist-overlay', (e) => {
            if (typeof this.audiosourceEditor !== 'undefined') {
              let restart = this.isPlaying;
              let stop = new Promise((resolve, reject) => {
                if (this.isPlaying) {
                  return this.stop()
                    .then(() => {
                      return resolve();
                    });
                } else {
                  return resolve();
                }
              });
              stop.then(() => {
              let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              let pos_r = this._round(pos, 1);
              //console.log('click', this.mouseSelection.start, Math.abs(pos_r - this.mouseSelection.start));
              if (this.mouseSelection.start !== null && Math.abs(pos_r - this.mouseSelection.start) < 0.1) {
                //console.log('2', this.cursorPosition, pos_r);
                if (this.mode === 'block' && e.shiftKey && this.cursorPosition >= 0) {
                  if (this.cursorPosition > pos_r) {
                    let end_pos = this.cursorPosition;
                    this.setSelectionStart(pos);
                    this.setSelectionEnd(end_pos);
                  } else {
                    this.setSelectionStart(this.cursorPosition);
                    this.setSelectionEnd(pos);
                  }
                } else {
                  if (typeof this.selection.start !== 'undefined') {
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  }
                  this.cursorPosition = pos;
                  if (this.isPlaying) {
                    this.stop().then(() => this.play(pos));
                  }
                }
              } else {
                this.wordSelectionMode = false;
                if (this.isPlaying) {
                  this.cursorPosition = pos;
                } else {
                  this.cursorPosition = this.selection.start;
                }
                //console.log(this.mouseSelection.start, pos)
              }
              //$('#cursor-position').show();

              this._showSelectionBorders();
              if (restart) {
                this.play();
              }
              })
            }
          });

          $('body').on('mousedown', '.playlist-overlay', (e) => {
            //console.log('this.mouseSelection', e.which, this.mouseSelection.start, this.mouseSelection.end);
            if (e.which !== 1) {
              return;
            }

            let stop = new Promise((resolve, reject) => {
                if (this.isPlaying) {
                  return this.stop()
                    .then(() => {
                      return resolve();
                    });
                } else {
                  return resolve();
                }
              });
              stop.then(() => {
            $('[id="resize-selection-right"]').hide().css('left', 0);
            $('[id="resize-selection-left"]').hide().css('left', 0);
            $('#cursor-position').hide();
            if (typeof this.audiosourceEditor.samplesPerPixel !== 'undefined') {
              let pos = (e.clientX + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              if (typeof this.selection.start !== 'undefined') {
                this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
              }
              this.mouseSelection = {start: this._round(pos, 1), end: null};
            }
          });
            //console.log("$('body').on('mousedown', '.playlist-overlay'");
          });

          $('.player-controls').keydown('input[type="number"]', function(e) {
            e.preventDefault();
          });
          if (self.mode == 'file') {
            let eventsTimer = setInterval(() => {
              if (this.$refs.playlist) {
                let ref = this.$refs.playlist.querySelector('.block-audio');
                $(ref).on('click', (e) => {
                  clearInterval(eventsTimer);
                  if (e && e.target && e.target.className && e.target.className.indexOf('resize-selection') !== -1) {
                    return;
                  }
                  //this.cursorPosition = (e.offsetX) * this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate;
                  //$('.cursor').css('left', e.offsetX);
                })
              }
            }, 500);
          }
        },
        showSelection (event) {
          this.wordSelectionMode = false;
          let blockId = event.data.blockId;
          let index = $('#content-' + blockId).find('w[data-map]').index($(event.target));
          if (typeof index =='undefined' || index === false || index < 0) {
            let index_no_data = $('#content-' + blockId).find('w:not([data-map])').index($(event.target));
            let total_index = $('#content-' + blockId).find('w').index($(event.target));
            index = total_index - index_no_data;
          }
          if (!this.isAnnotationVisible(index)) {
            this.scrollPlayerToAnnotation(index, 'middle');
          }
          this._clearWordSelection();
        },
        setAudio(audio, text, saveToHistory = true, block = null) {
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
          if (typeof saveToHistory === 'undefined') {
            saveToHistory = true;
          }
          if (saveToHistory && this.content && this.audiofile) {
            this._addHistory(this.content, this.audiofile, this.block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
          }
          this.load(audio, text, block ? block : this.block);
        },
        play(cursorPosition) {
          if (typeof cursorPosition === 'undefined') {
            if (this.cursorPosition !== false) {
              cursorPosition = this.cursorPosition;
            } else if (!this.selection.start && this.selection.start !== 0 && this.mode === 'block') {
              //this.cursorPosition = 0;
              this.audiosourceEditor.setTimeSelection(0);
              cursorPosition = 0;
            }
          }
          this.cursorPosition = false;
          if (cursorPosition) {
            this.audiosourceEditor.play(cursorPosition);
          } else {
            this.audiosourceEditor.play();
          }
          this.isPlaying = true;
          this.$root.$emit('from-audioeditor:play');
        },
        stop(go_to_start = true) {
          if (this.isPlaying || this.isPaused) {
            this.cursorPosition = false;
            return this.audiosourceEditor.stop()
              .then(() => {
                this.isPlaying = false;
                this._clearWordSelection();
                if (go_to_start) {
                  if (this.hasSelection) {
                    this._scrollToCursor();
                  } else {
                    $('.playlist-tracks').scrollLeft(0);
                  }
                }
                this.$root.$emit('from-audioeditor:stop');
                return Promise.resolve();
              })
              .catch(err => console.log(err));
          } else {
            return Promise.resolve();
          }
        },
        pause() {
          if (this.isPlaying) {
            return this.audiosourceEditor.pause()
              .then(() => {
                this.isPlaying = false;
                this.isPaused = true;
                this.cursorPosition = this.audiosourceEditor.playbackSeconds;
                this.$root.$emit('from-audioeditor:pause');
                return Promise.resolve();
              })
              .catch(err => console.log(err));
          } else {
            return Promise.resolve();
          }
        },
        zoomIn(till = false) {
          if (till !== false) {
            let index = this.zoomLevels.indexOf(this.zoomLevel);
            --index;
            if (!this.zoomLevels[index] || this.zoomLevels[index] < till) {
              return false;
            }
          }
          if (this.allowZoomIn) {
            this._setDraggableOptions();
            this.plEventEmitter.emit('zoomin');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[--index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            this._showSelectionBorders();
            this._scrollToCursor();
            if ($('.cursor').position()) {
              $('.cursor-position').css('left', $('.cursor').position().left);
            }
            return true;
          }
          return false;
        },
        zoomOut() {
          if (this.allowZoomOut) {
            this._setDraggableOptions();
            this.plEventEmitter.emit('zoomout');
            let index = this.zoomLevels.indexOf(this.zoomLevel)
            if (this.zoomLevels[++index]) {
              this.zoomLevel = this.zoomLevels[index]
            }
            this._showSelectionBorders();
            this._scrollToCursor();
            if ($('.cursor').position()) {
              $('.cursor-position').css('left', $('.cursor').position().left);
            }
            return true;
          }
          return false;
        },
        _setDraggableOptions() {
          if ($('.channel-0').length > 0 && this.dragLeft && this.dragRight) {
            let width = $('.channel-0').width();
            let self = this;
            let t = setInterval(function(){
              if ($('.channel-0').width() != width) {
                self.dragRight.setOption('limit', {x: [0, $('.channel-0').width()], y: [0, 0]});
                clearInterval(t);
              }
            }, 100);
          }
        },
        goToStart() {
          if (this.mode == 'block') {
            this.clearSelection();
            this.plEventEmitter.emit('rewind');
          } else if (this.mode == 'file') {
            $('.playlist-tracks').animate({scrollLeft: 0},500);
          }
          this.playPosition = 0;
          this.cursorPosition = 0;
          this.isPlaying = false;
          this.isPaused = false;
        },
        goToEnd() {
          if (this.mode == 'block') {
            this.clearSelection();
            this.plEventEmitter.emit('fastforward');
          } else if (this.mode == 'file') {
            $('.playlist-tracks').animate({scrollLeft: $('.channel-0').width()},500);
          }
          if (this.audiosourceEditor) {
            this.playPosition = this.audiosourceEditor.duration;
            this.cursorPosition = this.audiosourceEditor.duration;
          }
          this.isPlaying = false;
          this.isPaused = false;
        },
        scrollPlayerToAnnotation(index, position) {
          position = position || 'start'
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            let scrollPosition = $(annotations[index]).position().left + $('.playlist-tracks')[0].scrollLeft;
            if (position == 'middle') {
              scrollPosition-= $('.playlist-tracks').width()/ 2;
              scrollPosition+= $(annotations[index]).width() / 2;
            }
            $('.playlist-tracks').animate({
              scrollLeft: scrollPosition
            }, 200);
          }
        },
        isAnnotationVisible(index) {
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            return $(annotations[index]).position().left > 0 && $(annotations[index]).position().left < $('.playlist-tracks')[0].offsetWidth;
          } else {
            return true;
          }
        },
        clearSelection() {
          this.wordSelectionMode = false;
          let restart = this.isPlaying;
          this.pause()
            .then(() => {
              this.plEventEmitter.emit('select', undefined, undefined);
              $('[id="resize-selection-right"]').hide().css('left', 0);
              $('[id="resize-selection-left"]').hide().css('left', 0);
              if (restart) {
                this.play();
              }
            })
        },
        isEmpty() {
          return (!this.audiosourceEditor || !this.audiosourceEditor.tracks || this.audiosourceEditor.tracks.length == 0) && !this.processRun;
        },
        close(autosave = true) {
          //console.log('AudioEditor close', autosave);
          if (this.audiosourceEditor) this.audiosourceEditor.stopAnimation();
          if (this.isModifiedComputed && this.mode === 'block') {
            this.showModal('onExitMessage');
          } else {
            if (autosave && this.isModifiedComputed && this.mode === 'file') {
              this.save();
            }
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('automaticscroll', false);
              this.plEventEmitter.emit('clear');
              this._clearWordSelection();
            }
            this._setDefaults();
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            console.log('AudioEditor close this.blockId', this.blockId);
            $('body').off('mouseup', '.playlist-overlay.state-select', this._showSelectionBordersOnClick);
            $(`#content-${this.blockId}`).off('click', 'w', this.showSelection);
            this.$root.$off('for-audioeditor:select', this.select);
            this.$root.$off('for-audioeditor:reload-text', this._setText);
          }
        },
        forceClose() {
          this.setProcessRun(false);
          if (this.audiosourceEditor) this.audiosourceEditor.stopAnimation();
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('automaticscroll', false);
            this.plEventEmitter.emit('clear');
            this._clearWordSelection();
          }
          //console.log('forceClose');
          this._setDefaults();
          this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
          this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
          $('body').off('mouseup', '.playlist-overlay.state-select', this._showSelectionBordersOnClick);
          $(`#content-${this.blockId}`).off('click', 'w', this.showSelection);
          this.$root.$off('for-audioeditor:select', this.select);
        },
        addSilence() {
          if (this.silenceLength > 0 && this.cursorPosition >= 0) {
            this.setProcessRun(true, 'editing-audio');
            this.$root.$emit('from-audioeditor:insert-silence', this.blockId, this._round(this.cursorPosition, 2), this.silenceLength);
            this.isModified = true;
          }
        },
        save() {
          this.history = [];
          if (this.mode == 'block') {
            if (this.isModified) {
              this.setProcessRun(true, 'save');
              this.$root.$emit('from-audioeditor:save', this.blockId);
              this.isModified = false;
            }
          } else if(this.mode == 'file') {
            this.$root.$emit('from-audioeditor:save-positions', this.audiofileId, this.selection);
            this.origFilePositions = this.selection;
          }
        },
        align() {
          if (this.mode === 'file') {
            if (this.allowAlignSelection) {
              let save_selection = null;
              if (this.isModifiedComputed) {
                this.origFilePositions = Object.assign({}, this.selection);
                save_selection = this.selection;
              }
              this.$root.$emit('from-audioeditor:align', this.audiofileId, save_selection);
            }
          }
        },
        saveAndRealign() {
          if (this.isModified) {
            this.history = [];
            this.setProcessRun(true, 'align');
            this.$root.$emit('from-audioeditor:save-and-realign', this.blockId);
            this.isModified = false;
          }
        },
        cut() {
          this.setProcessRun(true, 'editing-audio');
          this.cursorPosition = this.selection.start;
          this.$root.$emit('from-audioeditor:cut', this.blockId, Math.round(this.selection.start * 1000), Math.round(this.selection.end * 1000));
          this.isModified = true;
        },
        undo() {
          if (this.mode === 'block') {
            let record = this._popHistory();
            if (this.history.length === 0 && this.isHistoryFull) {
              this.isModified = false;
            }
            if (record) {
              //this.block.manual_boundaries = record.manual_boundaries ? record.manual_boundaries.slice() : [];
              //this.setAudio(record.audio, record.text, false);
              this.$root.$emit('from-audioeditor:undo', this.blockId, record.audio, record.text, this.isModified);
            }
          } else if (this.mode === 'file') {
            if (this.origFilePositions) {
              //this.selection = this.origFilePositions;
              //this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
              //this._showSelectionBorders();
              if (this.origFilePositions.start == this.selection.end) {
                this.setSelectionEnd(this.origFilePositions.end);
              }
              this.setSelectionStart(this.origFilePositions.start);
              this.setSelectionEnd(this.origFilePositions.end);
            }
          }
        },
        discard() {
          this.setProcessRun(true, '');
          this.$root.$emit('from-audioeditor:discard', this.blockId);
          this._setDefaults();
          this.hideModal('onDiscardMessage');
        },
        discardAndExit() {
          //this.discardOnExit = true;
          this.hideModal('onExitMessage');
          if (this.mode == 'file') {
            this.selection = this.origFilePositions;
          } else if (this.mode == 'block') {
            this.isModified = false;
          }
          if (this.pendingLoad) {
            if (this.plEventEmitter) {
              this.plEventEmitter.emit('automaticscroll', false);
              this._clearWordSelection();
            }
            this._setDefaults();
            this.$root.$emit('from-audioeditor:closed', this.blockId, this.audiofileId);
            this.$root.$emit('from-audioeditor:close', this.blockId, this.audiofileId);
            this.load(...this.pendingLoad);
          } else {
            this.close();
          }
        },
        checkExitState() {
          this.hideModal('onExitMessage');
          this.$root.$emit('from-audioeditor:close-cancelled');
          if (this.discardOnExit) {
            this.discard();
          } else {
            /*if (this.pendingLoad) {
              if (this.pendingLoad[3]) {
                this.$root.$emit('from-audioeditor:closed', this.pendingLoad[3]);
              } else {
                this.$root.$emit('from-audioeditor:close');
              }
            }*/
          }
        },
        _setDefaults() {
          $('.playlist-tracks').off('scroll');
          this.words = [];
          this.currentWord = null;
          this.selection = {};
          this.wordSelectionMode = false;
          this.isModified = false;
          this.isAudioModified = false;
          this.history = [];
          this.isPlaying = false;
          this.isPaused = false;
          this.origFilePositions = {};
          this.hideModal('onExitMessage');
          if (this.plEventEmitter) {
            this.plEventEmitter.emit('clear');
          }
        },
        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
        },
        _numToTime(val) {
          let val_check = parseInt(val);
          if (('' + val_check).length > 1) {
            return val
          }
          return '0' + val
        },
        _round(val, precision) {
          precision = typeof precision == 'undefined' ? 1 : precision;
          let step = parseInt('1' + '0'.repeat(precision));
          return Math.round(val * step) / step;
        },
        _showSelectionBordersOnClick(ev) {
          ev.preventDefault();
          this._showSelectionBorders(false);
          return false;
        },
        _showSelectionBorders(scroll_to_selection = false) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              let selection = $('.selection.segment')[0];
              if (selection) {
                $('[id="resize-selection-right"]').show().css('left', selection.offsetLeft + selection.offsetWidth - 2);
                $('[id="resize-selection-left"]').show().css('left', selection.offsetLeft);
              } else {
                $('[id="resize-selection-right"]').hide().css('left', 0);
                $('[id="resize-selection-left"]').hide().css('left', 0);
              }
              if (scroll_to_selection) {
                this._scrollToCursor();
              }
              resolve();
            }, 50);
          })
        },
        _scrollToCursor() {
          if (this.cursorPosition && this.cursorPosition > 0) {
            let position = this.cursorPosition / (this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate);
            $('.cursor').css('left', position + 'px');
            let interval = setInterval(() => {
              if (typeof $('.cursor').position() !== 'undefined') {
                $('.playlist-tracks').scrollLeft($('.cursor').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
                clearInterval(interval);
              }
            }, 50);
          } else if (!this.isPlaying) {
            if (this.isSinglePointSelection) {
              setTimeout(function () {
                $('.playlist-tracks').scrollLeft($('.selection.point').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
              }, 50);
            } else if (this.hasSelection) {
              setTimeout(function () {
                if ($('#resize-selection-left').length > 0 && $('.playlist-tracks').length > 0) {
                  $('.playlist-tracks').scrollLeft($('#resize-selection-left').position().left - ($('.playlist-tracks')[0].offsetWidth / 2));
                  $('.cursor').css('left', $('#resize-selection-left').position().left + 'px');
                }
              }, 50);
            }
          }
        },
        _clearWordSelection() {
          if (!this.wordSelectionMode) {
            $(this.contentContainer).find('w').removeClass('selected');
            $('.annotations-boxes .annotation-box').removeClass('selected');
          }
        },
        _setWordSelection(index, select_range, autoplay = false) {
          if (this.wordSelectionMode !== false && this.wordSelectionMode !== index) {
            return;
          }
          select_range = typeof select_range == 'undefined' ? false : select_range;
          this._clearWordSelection();
          let annotations = $('.annotations-boxes .annotation-box');
          if (annotations[index]) {
            $(annotations[index]).addClass('selected');
          }
          let words = this.contentContainer.find('w[data-map]:not([data-map=""])');
          if (words[index]) {
            $(words[index]).addClass('selected');
          }
          if (select_range) {
            let word = this.words.find(_w => {
              return _w.alignedIndex == index;
            });
            if (word) {
              this.stop().then(() => {
                this.plEventEmitter.emit('select', word.start, word.end);
                this._showSelectionBorders()
                  .then(() => {
                    if (autoplay) {
                      this.cursorPosition = false;
                      Vue.nextTick(() => {
                        this.play()
                      });
                    }
                  });
              });
            }
          }
        },
        _emitSelection(part, field, value) {
          let new_selection = {start: this.selection.start, end: this.selection.end};
          switch(part) {
            case 'start':
              switch (field) {
                case 'h':
                  new_selection.start = parseInt(value) * 3600 + parseInt(this.selectionStartM) * 60 + parseFloat(this.selectionStartS);
                  break;
                case 'm':
                  new_selection.start = parseInt(this.selectionStartH) * 3600 + parseInt(value) * 60 + parseFloat(this.selectionStartS);
                  break;
                case 's':
                  new_selection.start = parseInt(this.selectionStartH) * 3600 + parseInt(this.selectionStartM) * 60 + parseFloat(value);
                  break;
                default:
                  return;
              }
              break;
            case 'end':
              switch (field) {
                case 'h':
                  new_selection.end = parseInt(value) * 3600 + parseInt(this.selectionEndM) * 60 + parseFloat(this.selectionEndS);
                  break;
                case 'm':
                  new_selection.end = parseInt(this.selectionEndH) * 3600 + parseInt(value) * 60 + parseFloat(this.selectionEndS);
                  break;
                case 's':
                  new_selection.end = parseInt(this.selectionEndH) * 3600 + parseInt(this.selectionEndM) * 60 + parseFloat(value);
                  break;
                default:
                  return;
              }
              break;
            default:
              return;
          }
          if (this.isSinglePointSelection) {
            new_selection.end = new_selection.start;
          }
          if (new_selection.end > this._round(this.audiosourceEditor.activeTrack.duration, 1)) {
            new_selection.end = this._round(this.audiosourceEditor.activeTrack.duration, 1)
          }
          if (this._round(new_selection.start, 1) == this._round(new_selection.end, 1) && field == 's') {
            switch (part) {
              case 'start':
                new_selection.end+= 0.1;
                if (new_selection.end > this._round(this.audiosourceEditor.activeTrack.duration, 1)) {
                  return;
                }
                break;
              case 'end':
                new_selection.start-= 0.1;
                if (new_selection.start < 0) {
                  return;
                }
                break;
            }
            new_selection.end = this._round(new_selection.end, 1);
            new_selection.start = this._round(new_selection.start, 1);
          }
          if (new_selection.start >= 0 && new_selection.start < new_selection.end) {
            //this._setSelectionOnWaveform();
            if (this.selection.end == new_selection.start) {
              this.setSelectionEnd(new_selection.end);
            }
            if (this.selection.start != new_selection.start) {
              this.setSelectionStart(new_selection.start);
            }
            if (this.selection.end != new_selection.end) {
              this.setSelectionEnd(new_selection.end);
            }
            //this._showSelectionBorders(true);
          }
        },
        _addHistory(text, audio, manual_boundaries) {
          this.history.push({
            text: text,
            audio: audio,
            manual_boundaries: manual_boundaries
          });
          if (this.history.length >= 6) {
            this.history.shift();
            this.isHistoryFull = false;
          }
        },
        _popHistory() {
          return this.history.pop();
        },
        _setSelectionOnWaveform() {
          if (this.selection && typeof this.selection.start != 'undefined' && typeof this.selection.end != 'undefined' && this.plEventEmitter) {
            this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
            this._showSelectionBorders();
          }
        },
        _setText(text, block, saveToHistory = false) {
          if (saveToHistory && this.content && this.audiofile) {
            this.isModified = true;
            this._addHistory(this.content, this.audiofile, block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
          }
          this.content = text;
          let self = this;
          let annotations = [];
          let alignedWords = 0;
          this.words = [];
          this.contentContainer = $('#content-' + this.blockId);
          if (this.contentContainer.length == 0) {
            this.contentContainer = $('#' + this.blockId);//footnote
          }
          $('<div>' + this.content + '</div>').find('w').each(function() {
            let map = $(this).attr('data-map');
            if (map) {
              let position = map.split(',');
              if (position.length == 2) {
                position[0] = parseInt(position[0]) / 1000;
                position[1] = parseInt(position[1]) / 1000;
                annotations.push({
                  "begin": position[0],
                  "children": [],
                  "end": self._round(position[1] + position[0], 3),
                  "id": $(this).text(),
                  "language": "eng",
                  "lines": []
                });
                self.words.push({start: position[0], end: self._round(position[0] + position[1], 3), index: self.words.length, alignedIndex: alignedWords++});
              }
            } else {
              self.words.push({start: null, end: null, index: self.words.length});
            }
          });
          //console.log(self.audiosourceEditor.annotationList.renderResizeLeft);
          if (self.audiosourceEditor && self.audiosourceEditor.getEventEmitter().__ee__ && self.audiosourceEditor.getEventEmitter().__ee__['dragged']) {
            self.audiosourceEditor.getEventEmitter().off('dragged', self.audiosourceEditor.getEventEmitter().__ee__['dragged']);
          }
          if (self.audiosourceEditor) {
            //annotations = annotations.splice(annotations.length - 10);
            self.annotations = annotations;
            self.audiosourceEditor.setAnnotations({
                annotations: annotations,
                editable: true,
                isContinuousPlay: false,
                linkEndpoints: true
              });
            $('.resize-handle').removeClass('manual');
            if (block && block.manual_boundaries && block.manual_boundaries.length > 0) {
              let waitAnnotations = setInterval(() => {
                if ($('.annotation-box').length > 0) {
                  clearInterval(waitAnnotations);
                  $('.annotation-box').each(function(index) {// set indexes for manual class
                    $(this).attr('data-index', index);
                  });
                  block.manual_boundaries.forEach(mb => {
                    let position = parseInt(mb) / 1000;
                    self.audiosourceEditor.annotationList.annotations.forEach((al, index) => {
                      if (al.start == position) {
                        $(`.annotation-box[data-index="${index}"] .resize-handle.resize-w`).addClass('manual');
                      }
                      if (al.end == position) {
                        $(`.annotation-box[data-index="${index}"] .resize-handle.resize-e`).addClass('manual');
                      }
                    });
                  });
                }
              }, 100);
            }
            if (self.audiosourceEditor.annotationList.annotations.length > 0) {
              $('.annotation-box').each(function(i, el) {
                if(typeof annotations[i] !== 'undefined') {
                  $(el).find('span.id').html(annotations[i].id);// workaround, waveform editor does not update text in annotations by annotations change
                }
              });
              //$('.channel-wrapper.block-audio').scroll();
            }
          }
            //self.audiosourceEditor.annotationList.renderResizeLeft(annotations.length - 1);
          $('.channel-wrapper.block-audio').trigger('scroll');
          $('.playlist-tracks').scrollLeft(0);
          $('.playlist-tracks').scrollLeft(this.playlistScrollPosition || 0);
          Vue.nextTick(() => {

            this.audiosourceEditor.annotationList.resizeHandlers.forEach((rh, i) => {
              this.audiosourceEditor.annotationList.resizeHandlers[i].ondragover = (e) => {
                if ($('.annotation-resize-pos').length == 0) {
                  $('.annotations').prepend('<div class="annotation-resize-pos"></div>')
                }
                if ((rh.data.direction === 'left' && rh.data.index == 0) ||
                        (rh.data.direction === 'right' && rh.data.index == this.annotations.length - 1)) {
                  return;
                }
                var deltaX = e.clientX - rh.prevX;
                $('.annotation-resize-pos').show();
                $('.annotation-resize-pos').css('left', (e.clientX - 10) + 'px');// show resize marker
                rh.prevX = e.clientX;

                // emit shift event if not 0
                if (deltaX) {
                  //let start = x * self.audiosourceEditor.samplesPerPixel /  self.audiosourceEditor.sampleRate;
                  var deltaTime = deltaX * this.audiosourceEditor.samplesPerPixel / this.audiosourceEditor.sampleRate;
                  var annotationIndex = rh.data.index;
                  var annotations = this.audiosourceEditor.annotationList.annotations;
                  var note = annotations[annotationIndex];

                  // resizing to the left
                  if (rh.data.direction === 'left') {
                    var originalVal = note.start;
                    note.start += deltaTime;

                    if (note.start < 0) {
                      note.start = 0;
                    }

                    if (annotations[annotationIndex - 1]) {
                      annotations[annotationIndex - 1].end = note.start;
                    }
                  } else {
                    // resizing to the right
                    var _originalVal = note.end;
                    note.end += deltaTime;

                    if (note.end > this.audiosourceEditor.duration) {
                      note.end = this.audiosourceEditor.duration;
                    }

                    if (annotations[annotationIndex + 1]) {
                      annotations[annotationIndex + 1].start = note.end;
                    }
                  }
                }
              };
            })
          });
          //this.$forceUpdate();
        },
        _isAnnotationsEditable() {
          return (!this.currentBookMeta.masteringRequired || this.currentBookMeta.isMastered) ||
                  (this.block && this.block.voicework === 'tts' ||
                  (this.block && this.block.status && this.block.status.proofed === false && this.tc_hasTask('audio_mastering') && this.block.status.stage === 'audio_mastering'));
        },
        _setBlocksSelection() {
          if (this.blockSelection && ((this.blockSelection.start && this.blockSelection.start._id) || (this.blockSelection.end && this.blockSelection.end._id)) && this.plEventEmitter) {
            let start = false;
            let end = false;
            if (this.blockSelection.start && this.blockSelection.start._id && this.blockMap[this.blockSelection.start._id]) {
              start = parseInt(this.blockMap[this.blockSelection.start._id][0])/1000;
              if (!this.blockSelection.end || !this.blockSelection.end._id || !this.blockMap[this.blockSelection.end._id]) {
                end = this.selection.end;//parseInt(this.blockMap[this.blockSelection.start._id][1])/1000;
              }
            }
            if (this.blockSelection.end && this.blockSelection.end._id && this.blockMap[this.blockSelection.end._id]) {
              end = parseInt(this.blockMap[this.blockSelection.end._id][1])/1000;
              if (!this.blockSelection.start || !this.blockSelection.start._id || !this.blockMap[this.blockSelection.start._id]) {
                start = this.selection.start;//parseInt(this.blockMap[this.blockSelection.end._id][0])/1000;
              }
            }

            if (start !== false && end !== false && start < end) {
              this.selection.start = this._round(start, 2);
              this.selection.end = this._round(end, 2);
              let replay = this.isPlaying;
              let wait = this.isPlaying ? [this.pause()] : [];
              Promise.all(wait)
                .then(() => {
                  this.cursorPosition = this.selection.start;
                  this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  this._showSelectionBorders(true);
                  if (replay) {
                    this.play();
                  }
                })
              //this.setSelectionStart(start);
              //this.setSelectionEnd(end);
              return true;
            } else {
              return false;
            }
          }
          return false;
        },
        onContext: function(e) {
          if (this.mode === 'file' &&
                  typeof this.selection.start !== 'undefined' &&
                  typeof this.selection.end !== 'undefined') {
            let t = setInterval(() => {
              if ($('.selection.point').length > 0) {
                this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                clearInterval(t);
              }
            }, 50);
          }
          this.contextPosition = e.clientX;
          $('.medium-editor-toolbar').each(function(){
              $(this).css('display', 'none');
          });
          if (this.$refs.waveformContext) {
            this.$refs.waveformContext.open(e, {}, 0, e.layerY - 80);
            $('body').one('click', this.$refs.waveformContext.close);
          }
        },
        setSelectionStart(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let start = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              start = this._round(start, 2);
              if (start == this.selection.start) {
                return;
              }
              if (start > this.selection.end) {
                if (this.audiosourceEditor.activeTrack && this.audiosourceEditor.activeTrack.duration) {
                  this.selection.end = this.audiosourceEditor.activeTrack.duration;
                } else {
                  return;
                }
              }
              let replay = this.isPlaying;
              this.stop(false)
                  .then(() => {
                    this.selection.start = start;
                    this.cursorPosition = this.selection.start;
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                    this._showSelectionBorders();
                    this.contextPosition = null;
                    if (replay) {
                      this.play();
                    }
                  });
            } else {
              return;
            }
          //}
          this.contextPosition = null;
        },
        setSelectionEnd(val, event) {
          //if (this.mode == 'file') {
            if (this.audiosourceEditor) {
              let end = val !== null ? val : (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
              end = this._round(end, 2);
              if (end == this.selection.end) {
                return;
              }
              if (end < this.selection.start) {
                //this.selection.start = 0;
                //this.cursorPosition = this.selection.start;
                this.setSelectionStart(0);
              }
              this.selection.end = end;
              //this.cursorPosition = this.selection.start;
              let pause;
              let replay = this.isPlaying;
              if (replay) {
                pause = this.pause();
              } else {
                pause = new Promise((res, rej) => {res()});
              }
              pause
                .then(() => {
                  this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                  this._showSelectionBorders();
                  this.contextPosition = null;
                  if (replay) {
                    this.play();
                  }
                });
            } else {
              return;
            }
          //}
          this.contextPosition = null;
        },
        goToBlock(blockId, ev) {
          this.$root.$emit('for-bookedit:scroll-to-block', blockId);
          //console.log('goToBlock', blockId, this.$route.name);
          //this.$router.push({name: this.$route.name, params: {}});
          //this.$router.push({name: this.$route.name, params:  { block: blockId }});
        },
        cancelAlign() {
          this.$root.$emit('cancel-align');
        },
        smoothSelection: _.debounce(function (val, oldVal) {
          if (!this.blockSelectionEmit) {
            if (typeof val.start !== 'undefined' && typeof val.end !== 'undefined') {
              if (val.start !== oldVal.start || val.end !== oldVal.end) {
                this._clearWordSelection();
                this.$root.$emit('from-audioeditor:select', this.blockId, val.start, val.end);
              }
            }
          } else {
            this.blockSelectionEmit = false;
          }
          this.$root.$emit('from-audioeditor:selection-change', this.blockId, val.start, val.end);
        }, 30),

        smoothDrag:_.debounce(function (ev) {
          let moveIndex = $('.annotations-boxes .annotation-box .resize-handle').index(ev.target);
          $('.annotation-resize-pos').remove();// hide resize marker
          if (!this._isAnnotationsEditable()) {
            this.showModal('onWordRepositionMessage');
          }
          let map = [];
          let direction = '';

          let shiftedAnnotation = null;
          let shiftedIndex = null;
          if (moveIndex === 0 || moveIndex === this.annotations.length * 2 - 1) {// do not pin first and last
            return;
          }

          this.audiosourceEditor.annotationList.annotations.forEach((al, i) => {// find the shifted annotation, find shift direction
            if (this.annotations[i]) {
              if (this.annotations[i].begin == al.start && this.annotations[i].end != al.end) {
                direction = this.annotations[i].end > al.end ? 'left' : 'right';
                if (direction === 'left') {
                  shiftedAnnotation = Object.assign({}, al);
                  shiftedIndex = i;
                } else if (direction === 'right') {
                  let next = this.audiosourceEditor.annotationList.annotations[i + 1];
                  if (next) {
                    shiftedAnnotation = Object.assign({}, next);
                    shiftedIndex = i + 1;
                  }
                }
              }
              this.annotations[i].begin = al.start;
              this.annotations[i].end = al.end;
            }
          });
          let shifted = false;

          if (shiftedAnnotation) {
            this._addHistory(this.content, this.audiofile, this.block.manual_boundaries ? this.block.manual_boundaries.slice() : []);
            if (shiftedAnnotation.end - shiftedAnnotation.start < this.minWordSize) {// find words with length less than minimum
              let shift = this.minWordSize - (shiftedAnnotation.end - shiftedAnnotation.start);
              let found = false;
              let shiftIndexes = [];
              switch (direction) {
                case 'left':
                  this.annotations[shiftedIndex].begin-= shift;
                  let j = shiftedIndex - 1;
                  do {
                    if (this.annotations[j]) {
                      this.annotations[j].end-=shift;
                      if (this.annotations[j].end - this.annotations[j].begin >= this.minWordSize) {
                        shifted = true;
                      } else {
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin-= shift;
                      }
                    }
                    --j;
                  } while (j >= 0 && !shifted);
                  shifted = true;
                  shift = 0;
                  for (j = 0; j <= shiftedIndex + 2; ++j) {// if some words start is before zero, shift all words
                    if (this.annotations[j]) {
                      if (this.annotations[j].begin < 0) {
                        if (shift == 0) {
                          shift+= -1 * (this.annotations[j].begin);
                        }
                        this.annotations[j].begin+=shift;
                        this.annotations[j].end+=shift;
                      }
                      else if (this.annotations[j].end - this.annotations[j].begin - shift >= this.minWordSize) {
                        this.annotations[j].begin+= shift;
                        shift = 0;
                      } else {
                        let diff = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin+=shift;
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].end+=shift;
                      }
                    }
                  }
                  break;
                case 'right':
                  this.annotations[shiftedIndex].end+= shift;
                  j = shiftedIndex + 1;
                  do {
                    if (this.annotations[j]) {
                      this.annotations[j].begin+=shift;
                      if (this.annotations[j].end - this.annotations[j].begin >= this.minWordSize) {
                        shifted = true;
                      } else {
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].end+= shift;
                      }
                    }
                    ++j;
                  } while (j < this.annotations.length && !shifted);
                  shifted = true;
                  shift = 0;
                  for (j = this.annotations.length; j >= shiftedIndex - 2; --j) {// if some words end if after audio finish, shift all words
                    if (this.annotations[j]) {
                      if (this.annotations[j].end > this.audiosourceEditor.duration) {
                        if (shift == 0) {
                          shift+= this.annotations[j].end - this.audiosourceEditor.duration;
                        }
                        this.annotations[j].begin-=shift;
                        this.annotations[j].end-=shift;
                      }
                      else if (this.annotations[j].end - this.annotations[j].begin - shift >= this.minWordSize) {
                        this.annotations[j].end-= shift;
                        shift = 0;
                      } else {
                        this.annotations[j].end-=shift;
                        shift = this.minWordSize - (this.annotations[j].end - this.annotations[j].begin);
                        this.annotations[j].begin-=shift;
                      }
                    }
                  }
                  break;
              }
            }
          }
          this.annotations.forEach((al, i) => {
            map.push([Math.round(al.begin * 1000), Math.round((al.end - al.begin) * 1000)]);
            let w = this.words.find(_w => {
              return _w.alignedIndex == i;
            });
            if (w) {
              w.start = al.begin;
              w.end = al.end;
            }
          });
          if (shifted) {
            this.annotations.forEach((al, i) => {
              this.audiosourceEditor.annotationList.annotations[i].start = al.begin;
              this.audiosourceEditor.annotationList.annotations[i].end = al.end;
            });
          }
          this.audiosourceEditor.drawRequest();
          this.$root.$emit('from-audioeditor:word-realign', map, this.blockId, {
            index: parseInt(moveIndex / 2),
            position: moveIndex % 2
          });
          this.isModified = true;
          if (this.wordSelectionMode !== false) {
            if (shiftedIndex === this.wordSelectionMode ||
                    (shiftedIndex - 1 === this.wordSelectionMode && direction === 'right') ||
                    (shiftedIndex + 1 === this.wordSelectionMode && direction === 'left')) {
              Vue.nextTick(() => {
                this._setWordSelection(this.wordSelectionMode, true, true);
              });
            }
          }
        }, 30),

        setProcessRun(val, type) {
          this.processRun = val;
          this.processRunType = type;
          if (val) {
            this.$root.$emit('preloader-toggle', true, type);
          } else {
            this.$root.$emit('preloader-toggle', false, '');
          }
        },

        flush() {
          this.setProcessRun(false);
          this.isModified = false;
        },

        unpinRight(event) {
          let position = (this.contextPosition + $('.playlist-tracks').scrollLeft()) * this.audiosourceEditor.samplesPerPixel /  this.audiosourceEditor.sampleRate;
          this.$root.$emit('from-audioeditor:unpin-right', position * 1000, this.blockId);
        }

      },
      computed: {
        selectionStartH: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(parseInt(this.selection.start / 3600))
          },
          set(value) {
            this._emitSelection('start', 'h', value);
          }
        },
        selectionStartM: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(parseInt(this.selection.start / 60))
          },
          set(value) {
            this._emitSelection('start', 'm', value);
          }
        },
        selectionStartS: {
          get() {
            if (typeof this.selection.start == 'undefined') {
              return false;
            }
            return this._numToTime(this._round(this.selection.start % 60))
          },
          set(value) {
            this._emitSelection('start', 's', value);
          }
        },
        selectionEndH: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(parseInt(this.selection.end / 3600))
          },
          set(value) {
            this._emitSelection('end', 'h', value);
          }
        },
        selectionEndM: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(parseInt(this.selection.end / 60))
          },
          set(value) {
            this._emitSelection('end', 'm', value);
          }
        },
        selectionEndS: {
          get(){
            if (typeof this.selection.end == 'undefined') {
              return false
            }
            return this._numToTime(this._round(this.selection.end % 60))
          },
          set(value) {
            this._emitSelection('end', 's', value);
          }
        },
        allowZoomIn: {
          get() {
            return this.zoomLevels[0] != this.zoomLevel;
          }
        },
        allowZoomOut: {
          get() {
            return this.zoomLevels[this.zoomLevels.length - 1] != this.zoomLevel;
          }
        },
        isSinglePointSelection: {
          get() {
            return typeof this.selection.start != 'undefined' && this.selection.start == this.selection.end;
          }
        },
        hasSelection: {
          get() {
            return typeof this.selection.start != 'undefined' && this.selection.start >= 0;
          }
        },
        isModifiedComputed: {
          get() {
            if (this.mode == 'file') {
              return this.hasSelection && !this.isSinglePointSelection && (
                      !this.origFilePositions || (this.origFilePositions.start != this.selection.start || this.origFilePositions.end != this.selection.end))
            } else if (this.mode == 'block') {
              return this.isModified;
            }
          },
        },
        hasAlignSelection: {
          get() {
            return (this.blockSelection.start && this.blockSelection.start._id) ||
                    (this.blockSelection.end && this.blockSelection.end._id)
          }
        },
        hasAlignSelectionStart: {
          get() {
            return this.blockSelection.start && this.blockSelection.start._id;
          }
        },
        hasAlignSelectionEnd: {
          get() {
            return this.blockSelection.end && this.blockSelection.end._id;
          }
        },
        allowAlignSelection: {
          get() {
            return this.blockSelection.start && this.blockSelection.start._id &&
                    this.blockSelection.end && this.blockSelection.end._id &&
                    this.alignCounter.count;
          }
        },
        selectionBlocksToAlign: {
          get() {
            if (this.alignCounter) {
              return this.alignCounter.countAudio;
            }
            return 0;
          }
        },
        blockMap: {
          get() {
            if (!this.currentAudiobook._id || !this.currentAudiobook.importFiles || !this.audiofileId) {
              return {};
            }
            let audio = this.currentAudiobook.importFiles.find(_if => _if.id === this.audiofileId);
            return audio && audio.blockMap ? audio.blockMap : {};
          }
        },
        blockSelection: {
          get() {
            return this.mode === 'file' ? this.blkSelection : {};
          }
        },
        ...mapGetters({
          currentBookMeta: 'currentBookMeta',
          blkSelection: 'blockSelection',
          alignCounter: 'alignCounter',
          hasLocks: 'hasLocks',
          currentAudiobook: 'currentAudiobook'})
      },
      watch: {
        'cursorPosition': {
          handler(val) {
            if (val !== false) {
              if (val == 0) {
                $('#cursor-position').css('left', 0);
                $('.cursor').css('left', 0)
              } else {
                let pos = val * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
                $('#cursor-position').css('left', pos);
                $('.cursor').css('left', pos);
              }
            }

            if (val > 0) {
              if (this.isPlaying) {
                this.stop()
                  .then(() => {
                    this.play(val);
                  });
              } else {
                $('#cursor-position').show();
              }
            } else {
              $('#cursor-position').hide();
            }
          }
        },
        'zoomLevel': {
          handler(val) {
            if (this.mode == 'file') {
              let pos = this.cursorPosition * this.audiosourceEditor.sampleRate / this.audiosourceEditor.samplesPerPixel;
              $('#cursor-position').css('left', pos);
            }
          }
        },
        'blockSelection.start._id': {
          handler(val, oldVal) {
            //console.log('blockSelection CHANGED', val)
            if ((!val) &&
                    (this.blockMap && this.blockMap[oldVal])) {
              if (this.mode === 'file' && this.origFilePositions) {
                this.selection.start = this._round(this.origFilePositions.start, 2);
                this.selection.end = this._round(this.origFilePositions.end, 2);
                let replay = this.isPlaying;
                let wait = this.isPlaying ? [this.pause()] : [];
                Promise.all(wait)
                  .then(() => {
                    this.cursorPosition = this.selection.start;
                    this.plEventEmitter.emit('select', this.selection.start, this.selection.end);
                    this._showSelectionBorders(true);
                    if (replay) {
                      this.play();
                    }
                  });
              }
            }
          },
          deep: true
        },
        'blockSelection.end._id': {
          handler(val) {
            this._setBlocksSelection();
          }
        },
        'selection': {
          handler(val, oldVal) {
            this.smoothSelection(val, oldVal);
          },
          deep: true
        },
        'contextPosition': {
          handler(val) {
            if (val !== null) {
              $('#context-position').css('left', val + $('.playlist-tracks').scrollLeft());
              $('#context-position').show();
            } else {
              $('#context-position').hide();
            }
          }
        },
        '$route' () {
//           console.log('$route', this.mode);
//           if (this.$route.params.hasOwnProperty('bookid') && this.mode === 'block') {
//             if (!this.currentBookMeta || this.$route.path.indexOf(this.currentBookMeta._id + '/edit' === -1)) {
//               this._setDefaults();
//               this.close();
//             }
//           }
        },
        'currentBookMeta._id': {
          handler(val, oldVal) {
            if (this.mode === 'file') {
              if (oldVal) {
                this.close();
              }
            }
          }
        },
        'wordSelectionMode': {
          handler(val) {
            if (val === false) {
              this._clearWordSelection();
            }
          }
        }
      }
  }
</script>
<style lang="less">
  @waveform-height: 80px;
  .waveform {
      max-height: @waveform-height;
      .resize-selection {
          width: 3px;
          height: 100%;
          border: 1px solid green;
          cursor: ew-resize;
          position: absolute;
          z-index: 1001;
          display: none;
          background-color: green;
      }
  }
  .waveform-playlist {
    background-color: #d9d9d9;
    .blue-message {
        color: blue;
        display: inline-block;
        padding: 1px 3px;
    }
    a.blue-message {
        font-weight: bold;
        text-decoration: underline;
        cursor: pointer;
    }
    .red-message {
        color: red;
        display: inline-block;
        padding: 1px 3px;
    }
  }
  .wf-playlist {
    min-height: 100px;
    .cursor {
      width: 2px;
      background-color: black;
    }
    .selection.point {
      width: 2px;
      background-color: green;
    }
    .channel-wrapper {
        max-height: @waveform-height;
    }
    .playlist {
        .annotations {
          .annotation-box {
            background-color: white;
            &.selected {
              background-color: yellow;
            }
            border: 1px solid grey;
            padding: 0 10px;
            cursor: pointer;
            .resize-handle {
                background: grey;
                opacity: 0.3;
                cursor: ew-resize;
                &.manual {
                  background: #6aa84f;
                }
            }
            .id {
                height: 100%;
                display: inline-block;
                margin: 4px 0px;
                width: 100%;
            }
            &:after {
              content: ' ';
              width: 98%;
              position: absolute;
              height: 100%;
              left: 1px;
              z-index: 1000;
            }
          }
          .annotations-text {
            display: none;
            max-height: 200px;
            overflow-x: scroll;
            .annotation {
              .annotation-id {
                  font-weight: bold;
                  margin: 0px 10px;
              }
              .annotation-start {
                  margin: 0px 10px;
              }
              .annotation-end {
                  margin: 0px 10px;
              }
            }
          }
          .annotations-text::-webkit-scrollbar-track {
            -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
            border-radius: 10px;
            background-color: #F5F5F5;
          }
          .annotations-text::-webkit-scrollbar {
            width: 12px;
            background-color: #F5F5F5;
          }
          .annotations-text::-webkit-scrollbar-thumb {
            border-radius: 10px;
            -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
            background-color: #555;
          }
          .annotation-resize-pos {
              width: 20px;
              height: 30px;
              position: absolute;
              background-color: gray;
              z-index: 9999;
              border-left: 9px solid #bebebe;
              border-right: 9px solid #bebebe;
              cursor: ew-resize;
              display: none;
          }
        }
        .playlist-time-scale {
            height: 30px;
            background-color: white;
        }
        .channel-progress {
            background: #b4b3b3;/*#53dbfe*/
        }
        .channel {
            background: #2e2e2e;/*#0000ba*/
            max-height: @waveform-height;
            canvas {
                /*max-height: @waveform-height;*/
            }
        }
        .playlist-overlay {
            max-height: @waveform-height;
        }
        .selection.segment {
            background: rgba(0, 128, 0, 0.1);
            border-right: 2px solid green;
            border-left: 2px solid green;
            cursor: ew-resize;
        }
    }
    &.annotations-fixed {
      .resize-handle {
        display: none;
      }
    }
  }
  .block-content {
    w {
      &.selected {
          background-color: yellow;
      }
    }
  }
  .player-controls {
    background-color: #d9d9d9;
    vertical-align: middle;
    min-height: 62px;
    height: auto;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    .play-controls {
      display: inline-block;
      padding: 17px 25px;
      /*width: 200px;*/
      i {
        font-size: 29px;
        color: #0089ff;
        display: inline-block;
        margin: 0px 5px;
      }
    }
    .zoom-controls {
      display: inline-block;
      padding: 17px 14px;
      /*width: 120px;*/
      i {
        font-size: 29px;
        color: #0089ff;
        display: inline-block;
        margin: 0px 5px;
        &.disabled {
            color: gray;
            cursor: inherit;
        }
      }
    }
    .selection-controls {
      display: inline-block;
      padding: 21px 20px 9px 20px;
      /*width: 500px;*/
      &>div {
        display: inline-block;
        padding: 0px 10px;
      }
      input[type="number"] {
        width: 40px;
        &.sec {
          width: 50px;
        }
      }
      input[type="text"] {
        width: 30px;
      }
      .selection-display {
        margin-top: -21px;
      }
      &.-file {
        padding: 25px 20px 14px 20px;
      }
    }
    .audio-controls {
      display: inline-block;
    }
    >div:not(.audio-controls) {
      border-right: solid 2px #b1b1b1;
    }
  }
  .cursor-position {
      width: 1px;
      height: 100%;
      border: 1px solid black;
      background-color: black;
      position: absolute;
      z-index: 1000;
      display: none;
  }
  .context-position {
      width: 1px;
      height: 100%;
      background-color: green;
      position: absolute;
      z-index: 1000;
      display: none;
  }
  .playlist-tracks {
    height: 92px;
  }
  .playlist-tracks::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .playlist-tracks::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .playlist-tracks::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }
  .waveform-wrapper {
    width: 100%;
  }
  .close-player-container {
    position: absolute;
    z-index: 1000;
    right: 0px;
    top: -22px;
    padding: 2px;
    height: 20px;
    .close-player {
      font-size: 25px;
      display: inline-block;
      padding: 0px 5px;
      cursor: pointer;
      color: black;
      background-color: #d9d9d9;
      height: 20px;
      line-height: 0.9;
    }
  }
  .modal.on-word-reposition {
    .btn.btn-default {
      display: none;
    }
  }
</style>
