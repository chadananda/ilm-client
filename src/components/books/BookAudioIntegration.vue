<template>
  <div>
    <accordion :one-at-atime="true" ref="accordionAudio" class="audio-integration-accordion">
      <panel :is-open="true" :header="'File audio catalogue'" v-bind:key="'file-audio-catalogue'" ref="panelAudiofile" class="panel-audio-catalogue">
        <div class="file-catalogue" id="file-catalogue">
          <div class="file-catalogue-buttons" v-if="allowEditing">
            <div class="" v-if="allowEditing">
              <label class="checkbox-container">
                <input type="checkbox" v-model="checkAllState"/>
                <span class="checkmark"></span>
              </label>
            </div>
            <dropdown text="" :type="audiobook.hasOwnProperty('sortDirection') == false || audiobook.sortDirection == '' ? 'default' : 'button'" ref="allAudioDropdownSort" class="all-audio-dropdown aad-sort">
                <li :class="audiobook.sortDirection == 'date_desc' ? ' aad_selected' : ' '">
                  <span v-on:click="listSort('date', 'desc')">Date imported</span>
                </li>
                <li :class="audiobook.sortDirection == 'name_asc' ? ' aad_selected' : ' '">
                  <span v-on:click="listSort('name', 'asc')">Filename</span>
                </li>
            </dropdown>
            <dropdown text="" :type="this.aad_filter == 'all' ? 'default' : 'button'" ref="allAudioDropdownFilter" class="all-audio-dropdown aad-filter">
                <li :class="this.aad_filter != 'pending' && this.aad_filter != 'aligned' && this.aad_filter != 'filename' ? ' aad_selected' : ' '">
                  <span v-on:click="filterAll()">All</span>
                </li>
                <li :class="this.aad_filter == 'pending' ? ' aad_selected' : ' '">
                  <span v-on:click="filterPending()">Pending</span>
                </li>
                <li :class="this.aad_filter == 'aligned' ? ' aad_selected' : ' '">
                  <span v-on:click="filterAligned()">Aligned</span>
                </li>
                <div style="padding: 7px 12px 7px 12px;"  :class="this.aad_filter == 'filename' ? ' aad_selected flexContainer ' : ' flexContainer '"><input style="padding: 3px" v-model="filterFilename" @input="filterFileNameInput()" placeholder="Filename" class="inputField" v-on:keyup.enter="filterFileName()"><button type="submit" @click="filterFileNameReset()">&nbsp;X&nbsp;</button></div>
            </dropdown>
            <div class="upload-audio left-divider">
              <button id="show-modal" type="button" @click="uploadAudio" class="btn btn-default btn_audio_upload btn-small" >
                <i class="fa" ></i>Import
              </button>
            </div>
            <div class="delete-audio">
              <button class="btn btn-default btn-small" :disabled="selectionLength == 0" v-on:click="deleteAudio()" ><i class="fa fa-trash" style="color:red"></i><span v-if="selectionLength > 0" style="color:red">({{selectionLength}})</span></button>
            </div>
            <div class="align-audio left-divider">
              <button class="btn btn-primary btn-small" :disabled="alignCounter.count == 0 || selections.length == 0" v-on:click="align(null)" v-if="!alignProcess">Align&nbsp;<span v-if="selectionLength > 0">({{selectionLength}})</span></button>
              <span v-else class="align-preloader -small"></span>
              <button v-if="hasLocks('align')" class="cancel-align" v-on:click="cancelAlign(true)" title="Cancel aligning"><i class="fa fa-ban"></i></button>
            </div>
          </div>
          <h5 v-if="audiobook.info && (!audiobook.importFiles || audiobook.importFiles.length == 0)"><i>{{audiobook.info}}</i></h5>
          <div class="file-catalogue-files-wrapper">
            <draggable v-model="audiobook.importFiles" class="file-catalogue-files" @end="listReorder">
              <div v-for="(audiofile, index) in audiobook.importFiles" v-if="(audiofile.title ? audiofile.title : audiofile.name).includes(filterFilename.trim())" :class="['audiofile', {'-selected': isAudiofileHighlighted(audiofile)}, {'-hidden': ((isAudiofileAligned(audiofile) && aad_filter == 'pending') || (!isAudiofileAligned(audiofile) && aad_filter == 'aligned'))}]" >
                <template v-if="(audiofile.title ? audiofile.title : audiofile.name).includes(filterFilename.trim())">
                  <template v-if="audiofile.status == 'processing' && (audiofile.title ? audiofile.title : audiofile.name).includes(filterFilename.trim())">
                    <div class="audiofile-info">
                      <i>Processing, {{audiofile.title}}</i>
                    </div>
                  </template>
                  <template v-else>
                    <div v-if="allowEditing"
                             class="audiofile-options">
                      <label class="checkbox-container">
                        <input type="checkbox" :checked="selections.indexOf(audiofile.id) !== -1"
                             v-on:click="addSelection(audiofile.id, selections.indexOf(audiofile.id) === -1)"/>
                        <span class="checkmark"></span>
                      </label>
                    </div>
                    <div :class="['audiofile-info', {'playing': playing == audiofile.id, done: audiofile.done}]">
                      <div class="audiofile-player-controls">
                        <span class="audio-opening" v-if="audioOpening === audiofile.id"></span>
                        <!-- <i v-else class="fa fa-play-circle-o" v-on:click="audiofileClick(audiofile.id, true, $event)"></i> -->
                        <template v-else>
                          <i v-if="audiofile.preview && audiofile.preview.start" class="fa fa-play-circle-o" v-on:click="playPreview(audiofile.id, 'start', $event)"></i>
                        </template>
                        <!-- <i class="fa fa-play-circle-o red" v-on:click="play()" v-if="paused === audiofile.id"></i>
                        <i class="fa fa-pause-circle-o" v-on:click="pause()" v-if="playing === audiofile.id && paused !== audiofile.id"></i>
                        <i class="fa fa-stop-circle-o" v-on:click="stop()" v-if="playing === audiofile.id"></i> -->
                      </div>
                      <div class="audiofile-name">
                        <span v-if="audiofile.hasOwnProperty('duplicate')" @click="duplicateAudiofileClick(audiofile.id, audiofile.duplicate, $event)" :title="audiofile.title ? audiofile.title : audiofile.name"><i>Duplicate: {{audiofile.title ? audiofile.title : audiofile.name}}</i></span>
                        <span v-if="renaming !== audiofile.id && !audiofile.hasOwnProperty('duplicate')"
                              :class="['audiofile-name-edit', audiofile.id.replace(/\./g, '')]"
                              @click="audiofileClick(audiofile.id, false, $event)"  :title="audiofile.title ? audiofile.title : audiofile.name" v-on:dblclick="renaming = audiofile.id">{{audiofile.title ? audiofile.title : audiofile.name}}</span>
                        <input id="rename-input" type="text" v-model="audiofile.title" 
                             class="audiofile-name-edit"
                             @focusout="saveAudiobook()"
                             v-else-if="!audiofile.hasOwnProperty('duplicate')" />
                      </div>
                      <div class="audiofile-player-controls">
                        <i v-if="audiofile.preview && audiofile.preview.end" class="fa fa-play-circle-o" v-on:click="playPreview(audiofile.id, 'end')"></i>
                      </div>
                      <div class="audiofile-duration"><span>{{ parseAudioLength(audiofile) }}</span></div>
                    </div>

                  </template>
                </template>
              </div>
            </draggable>
          </div>
        </div>
        <div :class="['audio-import-errors', 'errors-' + (audiobook.importErrors ? audiobook.importErrors.length : 0)]" id="audio-import-errors">
          <div style="overflow-y: scroll; min-height: 80px; height: 100%;">
            <div>Unable to import file(s):<span class="hide-errors" v-on:click="clearErrors()">&times;</span></div>
            <div v-for="ierr in audiobook.importErrors" class="audio-import-error">
              <a :href="ierr.link">{{ierr.file}}: {{ierr.error}}</a>
            </div>
          </div>
        </div>
      </panel>
      <panel :is-open="false" :header="'TTS audio catalogue'" v-bind:key="'tts-audio-catalogue'" ref="panelTTS">
        <div class="tts-volume-label">Volume:</div>
        <vue-slider ref="slider" v-model="pre_volume" :min="0.1" :max="1.0" :interval="0.1" :tooltip="false"></vue-slider>
        <table class="table table-striped table-bordered table-voices">
        <thead>
          <tr>
            <th>Block</th><th>Voice</th>
          </tr>
        </thead>
        <tbody v-if="pre_options">
          <tr>
            <td>Title</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices ? currentBookMeta.voices.title : ''"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('title', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Header</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices ? currentBookMeta.voices.header : ''"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('header', $event)"
            ></select-tts-voice></td>
          </tr>
          <!--<tr>
            <td>Subheader</td>
            <td><select-tts-voice
              pre_selected=""
              :pre_volume="pre_volume"
              :pre_options="pre_options"
            ></select-tts-voice></td>
          </tr>-->
          <tr>
            <td>Paragraph</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices ? currentBookMeta.voices.paragraph : ''"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('paragraph', $event)"
            ></select-tts-voice></td>
          </tr>
          <tr>
            <td>Footnote</td>
            <td><select-tts-voice
              :pre_selected="currentBookMeta.voices ? currentBookMeta.voices.footnote : ''"
              :pre_volume="pre_volume"
              :pre_options="pre_options"
              @onSelect="onTtsSelect('footnote', $event)"
            ></select-tts-voice></td>
          </tr>
        </tbody>
        </table>

        <!--<div class="pull-left" v-if="hasBlocksForAlignment && !enableAlignment">
          <span class="red">Select audio</span>
        </div>-->
        <div class="pull-right align-process-start">
          <button class="btn btn-default" :disabled="!enableTtsAlignment" v-on:click="alignTts()" v-if="!alignProcess">Convert text to speech &amp; Align with text</button>
          <span v-else class="align-preloader -big"></span>
          <button v-if="hasLocks('align')" class="cancel-align" v-on:click="cancelAlign()" title="Cancel aligning"><i class="fa fa-ban"></i></button>
        </div>
      </panel>
    </accordion>
    <div id="player"></div>
  </div>
</template>
<script>
  import {accordion, panel, dropdown} from 'vue-strap'
  import task_controls from '../../mixins/task_controls.js'
  import api_config from '../../mixins/api_config.js'
  import Vue from 'vue'
  import access from '../../mixins/access.js';
  import {mapGetters, mapActions} from 'vuex';
  import vueSlider from 'vue-slider-component';
  import SelectTTSVoice from '../generic/SelectTTSVoice'
  var WaveformPlaylist = require('waveform-playlist');
  import draggable from 'vuedraggable';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import Split from 'split.js';
  import _ from 'lodash';
  //var d3 = require('d3')
  export default {
    name: 'BookAudioIntegration',
    computed: {

    },
    components: {
      accordion,
      panel,
      dropdown,
      vueSlider,
      'select-tts-voice':SelectTTSVoice,
      draggable

    },
    props: {
      'isActive': Boolean
    },
    data() {
      return {
        renaming: false,
        selections: [],
        deleting: false,
        onDeleteMessage: false,
        player: false,
        playing: false,
        paused: false,
        draggableList: false,
        alignmentProcess: false,
        pre_options: false,
        pre_volume: 1.0,
        aligningBlocks: [],
        positions_tmp: {},
        alignProcess: false,
        audioOpening: false,
        activeTabIndex: 0,
        audio_element: false,
        aad_sort: '',
        aad_filter: 'all',
        filterFilename: '',
        highlightDuplicateId: ''
      }
    },
    mixins: [task_controls, api_config, access],
    mounted() {
      /*let ac = new (window.AudioContext || window.webkitAudioContext);
      this.player = WaveformPlaylist.init({
        ac: ac,
        samplesPerPixel: 0,
        waveHeight: 0,
        container: document.getElementById('player'),
        state: 'select',
        zoomLevels: [0],
        timescale: false,
        linkEndpoints: false
      });*/

      var self = this;

      this.$root.$on('from-audioeditor:close', function(blockId, audiofileId) {
        if (audiofileId && self.playing === audiofileId) {
          self.playing = false;
        }
      })
      this.$root.$on('from-audioeditor:save-positions', function(id, selections) {
        if (self.audiobook && self.audiobook.importFiles) {
          let record = self.audiobook.importFiles.find(_f => {
            return _f.id == id;
          });
          if (record) {
            record.positions = selections;
            self.saveAudiobook();
          }
        }
      });
      this.$root.$on('from-audioeditor:align', function(id, selections = null) {

        if (self.audiobook && self.audiobook.importFiles) {
          let record = self.audiobook.importFiles.find(_f => {
            return _f.id == id;
          });
          if (record) {
            if (selections) {
              record.positions = selections;
              self.saveAudiobook()
                .then(() => {
                  self.align(id);
                })
                .catch(err => console.log(err));
            } else {
              self.align(id);
            }
          }
        }
      });
      this.$root.$on('from-audioeditor:discard', function() {
        if (self.audiobook && self.audiobook.importFiles) {
          let record = self.audiobook.importFiles.find(f => {
            return f.id == self.playing;
          })
          if (record) {
            self.$root.$emit('for-audioeditor:load-and-play', process.env.ILM_API + self.audiobook.importUrl + record.id, '', null, false, record)
          }
        }
      });
      this.$root.$on('from-audioeditor:audio-loaded', (id) => {
        this.audioOpening = false;
        if (self.audiobook && self.audiobook.importFiles) {
          let record = this.audiobook.importFiles.find(f => f.id === id);
          if (record) {
            this.playing = id;
          }
        }
      });
      this.$root.$on('from-audioeditor:selection-change', (id, start, end) => {
        if (this.playing) {
          //console.log('FOR ', af)
          if (typeof start !== 'undefined' && typeof end !== 'undefined') {
            this.positions_tmp[this.playing] = {start: start, end: end};
            if (self.audiobook && self.audiobook.importFiles) {
              let record = this.audiobook.importFiles.find(f => f.id == this.playing);
              if (record) {
                record.positions = {start: start, end: end};
                this.$forceUpdate();
              } else {

              }
            }
          } else {
            delete this.positions_tmp[this.playing];

          }
        }
      });
      this.$root.$on('book-reimported', () => {
        this.positions_tmp = {};
      });
      this.$root.$on('from-audioeditor:close-cancelled', () => {
        this.audioOpening = false;
      });

      this.getTTSVoices(/*this.currentBookMeta.language*/)
      .then(()=>{
        this.pre_options = this.ttsVoices;
      })
      .catch(err=>err);
      this._setCatalogueSize();
      window.addEventListener('resize', this._setCatalogueSize, true);
      this.$root.$on('cancel-align', this.cancelAlign)
      this.$root.$on('start-align', () => {
        this.alignProcess = true;
      })
      this.$root.$on('stop-align', () => {
        this.alignProcess = false;
      })
      $('body').on('click', '.audio-integration-accordion .panel', () => {
        this.activeTabIndex = null;
        if (this.$refs.accordionAudio && this.$refs.accordionAudio.$children) {
          this.$refs.accordionAudio.$children.forEach((ch, i) => {
            if (ch.open === true) {
              this.activeTabIndex = i;
            }
          });
        }
      });
    },
    methods: {
      uploadAudio() {
        this.$emit('uploadAudio')
      },
      renameAudiofile(id) {
        this.renaming = id;
      },
      saveAudiobook(reorder = [], removeFiles = [], done = [], sortDirection = '') {
        if (removeFiles) {
          removeFiles.forEach(rf => {
            if (typeof this.positions_tmp[rf] !== 'undefined') {
              delete this.positions_tmp[rf];
            }
          })
        }
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/audiobooks/' + this.audiobook._id;
        let formData = new FormData();
        //let save_data = this.audiobook;
        //if (save_data.importFiles) {
          //save_data.importFiles.forEach(af => {
            //if (typeof this.positions_tmp[af.id] !== 'undefined') {
              //af.positions = this.positions_tmp[af.id];
            //}
          //});
        //}
        //formData.append('audiobook', JSON.stringify(save_data));
        formData.append('reorder', JSON.stringify(reorder));
        formData.append('removeFiles', JSON.stringify(removeFiles));
        formData.append('sortDirection', sortDirection);
        let rename = [];
        if (this.renaming) {
          let renaming = this.audiobook.importFiles.find(aif => aif.id == this.renaming);
          if (renaming) {
            rename.push({
                id: renaming.id,
                title: renaming.title
              });
          }
        }
        if (this.audiobook.importFiles) {
          this.audiobook.importFiles.forEach(af => {
            if (typeof this.positions_tmp[af.id] !== 'undefined') {
              rename.push({id: af.id, positions: this.positions_tmp[af.id]});
            }
          });
        }
        done.forEach(d => {
          rename.push(d);
        });
        formData.append('rename', JSON.stringify(rename));
        this.renaming = false;
        let api = this.$store.state.auth.getHttp()
        let self = this;
        return api.post(api_url, formData, {}).then(function(response){
          if (response.status===200) {
            if (response.data && response.data.audio) {
              self.getAudioBook();
            }
          } else {

          }
          return Promise.resolve();
        }).catch((err) => {
          console.log('error: '+ err)
          return Promise.reject();
        });
      },
      addSelection(id, value) {

        if (value === true) {
          if (this.selections.indexOf(id) === -1) {
            this.selections.push(id)
          }
        } else {
          this.selections.splice(this.selections.indexOf(id), 1)
          $('input[name="' + id + '"]').prop('checked', false);
        }
        if (this.selections.length > 1 && this.playing) {
          this.$root.$emit('for-audioeditor:close');
        }
      },
      audiofileClick:_.debounce(function(id, play, event) {
        if (id === this.playing) {
          return false;
        }
        if (!this.audioOpening && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          if (!this.renaming) {
            this.audioOpening = id;
          }
        } else if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
          return;
        }
        let BreakException = {};
        if(!this.renaming && event) {
          if (event.shiftKey) {
            if (this.selections.length > 0) {
              if (this.selections.indexOf(id) === -1) {
                let select = false;
                this.addSelection(id, true);
                let clicked_passed = false;
                try {
                  this.audiobook.importFiles.forEach(af => {
                    if (!clicked_passed) {
                      clicked_passed = af.id === id;
                    }
                    if (this.selections.indexOf(af.id) !== -1) {
                      if (select === false || clicked_passed) {
                        select = !select;
                        if (select === false) {
                          throw BreakException;
                        }
                      }
                    }
                    if (select) {
                      this.addSelection(af.id, true)
                    }
                  });
                } catch (e) {
                  if (e !== BreakException) {
                    throw(e);
                  }
                }
              } else {
                let split = {before: [], after: []};
                let container = split.before;
                this.audiobook.importFiles.forEach(af => {
                  if (this.selections.indexOf(af.id) !== -1) {
                    if (af.id === id) {
                      container = split.after;
                    } else {
                      container.push(af.id);
                    }
                  }
                });
                this.selections = [];
                this.addSelection(id, true);
                if (split.before.length < split.after.length || split.before.length === split.after.length) {
                  split.before.forEach(_id => this.addSelection(_id, true));
                } else {
                  split.after.forEach(_id => this.addSelection(_id, true));
                }
              }
            } else {
              this.addSelection(id, true);
              this.play(id, play);
            }
          } else if(event.ctrlKey || event.metaKey) {
            if (this.selections.indexOf(id) === -1) {
              this.addSelection(id, true);
            } else {
              this.addSelection(id, false);
            }
          } else {
            this.selections = [id];
            this.play(id, play);
          }
        }
      }, 500),
      duplicateAudiofileClick(id, duplicate_id, event) {
        const el = this.$el.getElementsByClassName(duplicate_id.replace(/\./g, ''))[0];
          if (el) {
            this.highlightDuplicateId = duplicate_id.replace(/\./g, '');
            el.scrollIntoView();
          }
      },
      playPreview(id, preview) {
        if (!this.allowEditing) {
          return;
        }
        if (id === this.playing) {
          return;
        }
        if (id) {let record = this.audiobook.importFiles.find(f => {
            return f.id == id;
          })
          if (record && record.preview && record.preview[preview]) {
            if (!this.audio_element) {
              this.audio_element = document.createElement('audio')
            }
            this.audio_element.src = process.env.ILM_API + this.audiobook.importUrl + record.preview[preview];
            this.audio_element.play();
          }
        }
        this.paused = false;
      },
      checkAll(event, value) {
        if (event && event.target) {
          value = event.target.checked;
        }
        //$('.file-catalogue-files input[type="checkbox"]').prop('checked', value);
        if (this.audiobook.importFiles) {
          this.audiobook.importFiles.forEach(_f => {
            this.addSelection(_f.id, value)
          })
        }
      },
      deleteAudio(id) {
        this.onDeleteMessage = true;
        this.deleting = id;

      },
      deleteAudioProcess() {
        if (!this.deleting) {
          if (!this.selections.length) {
            return false;
          }
          //let files = [];
          //this.audiobook.importFiles.forEach((_f, i) => {
            //if (this.selections.indexOf(_f.id) === -1) {
              //files.push(_f);
            //} else {
              //this.addSelection(_f.id, false);
            //}
          //});
          //this.audiobook.importFiles = files;
          let toDelete = this.selections;
          this.selections = [];
          this.checkAllState = false;
          this.saveAudiobook([], toDelete);
        } else {
          let files = [];
          if (this.selections.indexOf(this.deleting) !== -1) {
            this.addSelection(this.deleting, false);
          }
          this.audiobook.importFiles.forEach((_f, i) => {
            if (_f.id !== this.deleting) {
              files.push(_f);
            }
          });
          this.audiobook.importFiles = files;
          this.saveAudiobook();
        }
        this.onDeleteMessage = false;
        let self = this;
        Vue.nextTick(() => {
          self.selections.forEach(s => {
            $('input[name="' + s + '"]').prop('checked', true);
          });
        })
      },
      discardDeleteAudio() {
        this.onDeleteMessage = false;
        this.deleting = false;
      },
      play(id, autostart) {
        if (!this.allowEditing) {
          return;
        }
        if (id === this.playing) {
          return;
        }
        if (id) {
          let reloadOnChange = this.playing != id
          let record = this.audiobook.importFiles.find(f => {
            return f.id == id;
          })
          if (record/* && this.player*/) {
            let audio_th = record['ver'] && record['ver']['m4a'] ? record['ver']['m4a'] : record.id
            this.$root.$emit('for-audioeditor:load-and-play', process.env.ILM_API + this.audiobook.importUrl + audio_th, '', null, autostart, record, reloadOnChange);
          }
        } else if (this.player) {
          this.player.play();
        }
        this.paused = false;
      },
      pause() {
        this.player.pause();
        this.paused = this.playing;
      },
      stop() {
        this.player.stop();
        this.paused = false;
        this.playing = false;
      },
      parseAudioLength(record) {
        if (!record.duration) {
          return '';
        }
        let l = record.duration.split(':');
        if (l.length === 3) {
          l.shift();
        }
        if (l[1]) {
          l[1] = l[1].split('.').shift();
        }
        let length = l.join(':');
        let selection = this.positions_tmp[record.id] ? this.positions_tmp[record.id] : {};
        if (record.positions && typeof record.positions.start !== 'undefined' && typeof selection.start === 'undefined') {
          selection = record.positions;
        }
        if (selection && typeof selection.start !== 'undefined' && typeof selection.end !== 'undefined') {
          let selected = '';
          let selectionLength = selection.end - selection.start;
          let selectionStart=parseInt(selectionLength / 60);
          if (selectionStart < 10) {
            selectionStart = '0' + selectionStart;
          }
          selected+=selectionStart;
          selected+=':';
          let selectionEnd=parseInt(selectionLength % 60);
          if (selectionEnd < 10) {
            selectionEnd = '0' + selectionEnd;
          }
          selected+=selectionEnd;
          if (selectionStart != l[0] || selectionEnd != l[1]) {
            length = selected + ' of ' + length;
          }
        }
        return length;
      },
      align(id = null, warn = 2) {
        if (warn >= 2 && this.currentBookCounters.approved_audio_in_range > 0) {
          this.$root.$emit('show-modal', {
            title: 'Are you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            //text: 'Are you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.align(id, 1)
                    }
                  }, 50);
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        if (warn >= 1 && this.currentBookCounters.changed_in_range_audio > 0) {
          this.$root.$emit('prepare-alignment');
          this.$root.$emit('show-modal', {
            title: 'Unsaved changes',
            text: 'You have unsaved changes in selected block range.<br/>Save and align with audio?',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Save&Align',
                handler: () => {
                    this.getChangedBlocks({voicework: 'audio_file'})
                      .then(ids => {
                        if (!Array.isArray(ids)) {
                          return Promise.reject();
                        }
                        let wait = [];
                        ids.forEach(blockid => {
                          let promise = Promise.resolve();
                          let evt = {};
                          evt.waitUntil = p => promise = p
                          this.$root.$emit(`save-block:${blockid}`, evt)
                          wait.push(promise);
                        })
                        Promise.all(wait)
                          .then(() => {
                            this.$root.$emit('hide-modal');
                            let i = setInterval(() => {
                              if ($('.align-modal').length == 0) {
                                clearInterval(i);
                                this.align(id, false)
                              }
                            }, 50);
                          });
                      });
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        let api_url = this.API_URL + 'books/' + this.audiobook.bookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        let self = this;
        //this.alignmentProcess = true;
        let realign = this.currentJobInfo.mastering;
        let update = this.saveAudiobook()
          .then((updated) => Promise.resolve(updated))
          .catch((err) => Promise.resolve({error: true, err: err}));
        Promise.all([update])
          .then((updated) => {
            this.$root.$emit('start-align');
            api.post(api_url, {
              start: this.blockSelection.start._id,
              end: this.blockSelection.end._id,
              audiofiles: id ? [id] : this.selections,
              realign: realign,
              positions: this.positions_tmp
            }, {
              validateStatus: function (status) {
                return status == 200 || status == 504;
              }
            }).then(function(response){
              self.getBookAlign();
              self.$root.$emit('stop-align');
              if (response.status===200) {
                //self.$root.$emit('bookBlocksUpdates', response.data);
                self.$emit('alignmentFinished');
                self.aligningBlocks = [];
              } else if (response.status == 504) {
                //self.checkAligningBlocks();
              }
              self.setCurrentBookCounters();
            }).catch((err) => {
              self.getBookAlign();
              self.$root.$emit('stop-align');
              console.log('error: '+ err);
              if ((err.response && err.response.status == 504) || err.message == 'Network Error') {
                //self.checkAligningBlocks();
              } else {
                //self.aligningBlocks = [];
              }
            });
          });
      },
      checkAligningBlocks() {
        this.$root.$off('blockChange');
        var dbPath = superlogin.getDbUrl('ilm_content');
        var db = new PouchDB(dbPath);
        let keys = [];
        this.aligningBlocks.forEach(b => keys.push(b._id));
        db.allDocs({keys: keys, include_docs: true})
          .then(docs => {
            //console.log(docs);
            if (docs.rows) {
              docs.rows.forEach(doc => {
                let d = this.aligningBlocks.find(b => b._id == doc.id);
                if (d && d._rev != doc.value.rev) {
                  this.$root.$emit('bookBlocksUpdates', {blocks: [doc.doc]});
                  let i = this.aligningBlocks.indexOf(d);
                  if (i !== -1) {
                    this.aligningBlocks.splice(i, 1);
                  }
                }
              })
              if (this.aligningBlocks.length > 0) {
                setTimeout(() => {
                  this.checkAligningBlocks();
                }, 5000);
              } else {
                this.$emit('alignmentFinished');
              }
            }
            this.setCurrentBookCounters();
          })
          .catch(err => {
            console.log(err);
          })
      },
      cancelAlign(force = false) {
        let api_url = this.API_URL + 'align_queue/' + this.currentBookid;

        let api = this.$store.state.auth.getHttp()

        api.delete(api_url, {}, {}).then((response) => {
          this.getBookAlign();
        }).catch((err) => {
          this.getBookAlign();
        });
      },
      alignTts(warn = 2) {
        if (warn >= 2 && this.currentBookCounters.approved_tts_in_range > 0) {
          this.$root.$emit('show-modal', {
            title: 'Are you sure you want to realign ' + this.currentBookCounters.approved_tts_in_range + ' approved block(s)?',
            //text: 'Are you sure you want to realign ' + this.currentBookCounters.approved_audio_in_range + ' approved block(s)?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.alignTts(1)
                    }
                  }, 50);
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        if (warn >= 1 && this.currentBookCounters.changed_in_range_tts > 0) {
          this.$root.$emit('prepare-alignment');
          this.$root.$emit('show-modal', {
            title: 'Unsaved changes',
            text: 'You have unsaved changes in selected block range.<br/>Save and align with audio?',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //this.cancelAlign();
                },
              },
              {
                title: 'Save&Align',
                handler: () => {
                    this.getChangedBlocks({voicework: 'tts'})
                      .then(ids => {
                        if (!Array.isArray(ids)) {
                          return Promise.reject();
                        }
                        let wait = [];
                        ids.forEach(blockid => {
                          let promise = Promise.resolve();
                          let evt = {};
                          evt.waitUntil = p => promise = p
                          this.$root.$emit(`save-block:${blockid}`, evt)
                          wait.push(promise);
                        })
                        Promise.all(wait)
                          .then(() => {
                            this.$root.$emit('hide-modal');
                            let i = setInterval(() => {
                              if ($('.align-modal').length == 0) {
                                clearInterval(i);
                                this.alignTts(false)
                              }
                            }, 50);
                          });
                      });
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
          return;
        }
        let api_url = this.API_URL + 'books/' + this.currentBookid + '/selection_alignment';
        let formData = new FormData();
        let api = this.$store.state.auth.getHttp()
        this.$root.$emit('start-align');
        api.post(api_url, {
          start: this.blockSelection.start._id,
          end: this.blockSelection.end._id,
          audiofiles: false,
          realign: true,
          voicework: 'all_with_tts',
          voices: this.currentBookMeta.voices
        }, {
          validateStatus: function (status) {
            return status == 200 || status == 504;
          }
        }).then((response)=>{
          this.getBookAlign();
          this.$root.$emit('stop-align');
          if (response.status===200) {
            //this.$root.$emit('bookBlocksUpdates', response.data);
            this.$emit('alignmentFinished');
            //this.aligningBlocks = [];
          } else if (response.status == 504) {
            //self.checkAligningBlocks();
          }
          this.setCurrentBookCounters();
        }).catch((err) => {
          this.getBookAlign();
          this.$root.$emit('stop-align');
          console.log('error11: '+ err);
          if ((err.response && err.response.status == 504) || err.message == 'Network Error') {
            //this.checkAligningBlocks();
          } else {
            //this.aligningBlocks = [];
          }
        });
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },

      onTtsSelect(key, value) {
        this.currentBookMeta.voices[key] = value;
        if (value) this.$emit('onTtsSelect', 'voices.'+ key, value);
      },

      listReorder(info) {
        if (info && typeof info.newIndex !== 'undefined' && typeof info.oldIndex !== 'undefined' && info.newIndex !== info.oldIndex) {
          this.saveAudiobook([[info.oldIndex, info.newIndex]]);
        }
      },
      //field: 'name', 'date'; direction: 'asc', 'desc'
      listSort(field, direction){
        if (field == 'name'){
          if (direction == 'asc'){
            this.aad_sort = 'name_asc';
          }
          if (direction == 'desc'){
            this.aad_sort = 'name_desc';
          }
        }
        if (field == 'date'){
          if (direction == 'asc'){
            this.aad_sort = 'date_asc';
          }
          if (direction == 'desc'){
            this.aad_sort = 'date_desc';
          }
        }
        this.saveAudiobook([], [], [], this.aad_sort);
        this.$refs.allAudioDropdownSort.toggle();
      },
      filterAll() {
        this.aad_filter = 'all';
        this.$refs.allAudioDropdownFilter.toggle();
      },
      filterAligned() {
        this.aad_filter = 'aligned';
        this.$refs.allAudioDropdownFilter.toggle();
      },
      filterPending() {
        this.aad_filter = 'pending';
        this.$refs.allAudioDropdownFilter.toggle();
      },
      filterFileNameInput() {
        this.aad_filter = 'filename';
      },
      filterFileNameReset() {
        this.filterFilename = '';
        this.aad_filter = 'all';
      },
      filterFileName() {
        this.aad_filter = 'filename';
        this.$refs.allAudioDropdownFilter.toggle();
      },
      markSelected() {
        this._setDone(true);
        this.$refs.allAudioDropdownFilter.toggle();
      },
      unmarkSelected() {
        this._setDone(false);
        this.$refs.allAudioDropdownFilter.toggle();
      },
      mark(id) {
        this._setDone(true, [id]);
      },
      unmark(id) {
        this._setDone(false, [id]);
      },
      _setDone(done, ids = []) {
        if (!ids.length) {
          ids = this.selections;
        }
        if (ids.length) {
          let doneUpdates = [];
          ids.forEach(id => {
            this.audiobook.importFiles.forEach((f, i) => {
              if (f.id === id) {
                doneUpdates.push({id: id, done: done});
              }
            });
          });
          this.saveAudiobook([], [], doneUpdates);
        }
      },
      _setCatalogueSize() {
        let file_catalogue_height = $(document).height() - 500;
        $('.file-catalogue-files').css('max-height', file_catalogue_height + 'px');
      },

      clearErrors() {
        let url = this.API_URL + 'books/' + this.currentBookid + '/audiobooks/' + this.audiobook._id + '/clear_errors';
        this.$store.state.auth.getHttp().post(url)
          .then(resp => {
            this.getAudiobook();
          })
          .catch(err => {
            console.log(err)
          })
      },

      initSplit() {
        if (this.isActive === true && $('.gutter.gutter-vertical').length == 0 && $('#file-catalogue').length > 0 && this.activeTabIndex === 0) {
          let parentHeight = false;
          let minSize = false;
          let maxSize = false;
          let split = Split(['#file-catalogue', '#audio-import-errors'], {
            direction: 'vertical',
            //minSize: [80, 80],
            sizes: [70, 30],
            elementStyle: (dimension, size, gutterSize) => {
              let resizeWrapper = true;
              if (!parentHeight) {
                parentHeight = parseInt($('#file-catalogue').parent().css('height'));
                resizeWrapper = false;
                if (parentHeight) {
                  minSize = parentHeight / 100 * 30;
                  $('#audio-import-errors').css('height', minSize + 'px');
                  maxSize = parentHeight - minSize;
                }
              }
              //console.log(dimension, size, gutterSize)
              let height = parentHeight / 100 * size - gutterSize;
              //console.log('SET HEIGHT TO', height - gutterSize + 'px', height, parentHeight)
              if (resizeWrapper) {
                $('.file-catalogue-files-wrapper').css('height', parseInt($('#file-catalogue').css('height')) - parseInt($('.file-catalogue-buttons').css('height')) + 'px')
              }
              if (height < minSize && resizeWrapper) {
                height = minSize;
              }
              if (height > maxSize && resizeWrapper) {
                height = maxSize;
              }
              return {'height': height + 'px'};
            }
          });
          //console.log(split)
        }
      },
      isAudiofileHighlighted(audiofile) {
        console.log('duplicated id:', this.highlightDuplicateId);
        if (audiofile.id.replace(/\./g, '') == this.highlightDuplicateId) return true;
        if (this.alignCounter && this.alignCounter.blocks && audiofile.blockMap && !this.highlightDuplicateId) {
          let hasMap = this.alignCounter.blocks.find(b => {
            return typeof audiofile.blockMap[b.blockid] !== 'undefined';
          });
          return hasMap;
        } else {
          return false;
        }
      },
      isAudiofileAligned(audiofile) {
        if ('done' in audiofile && audiofile.done == true){
          return true;
        } else {
          return false;
        }
      },

      ...mapActions(['setCurrentBookCounters', 'getTTSVoices', 'getChangedBlocks', 'clearLocks', 'getBookAlign', 'getAudioBook'])
    },
    beforeDestroy() {
      this.$root.$off('from-audioeditor:save-positions');
      this.$root.$off('from-audioeditor:align');
      this.$root.$off('cancel-align', this.cancelAlign);
    },
    computed: {
      selectionLength: {
        get() {
          return this.selections.length
        }
      },
      checkAllState: {
        get() {
          return this.audiobook && this.audiobook.importFiles && this.audiobook.importFiles.length ? this.selections.length == this.audiobook.importFiles.length : false;
        },
        set(val) {
          this.checkAll(null, val)
        }
      },
      enableAlignment: function() {
        return this.hasBlocksForAlignment && this.selectionLength > 0
      },
      enableTtsAlignment: function() {
        let voicesSelected = true;
        if (this.currentBookMeta.voices) {
          for(let voice in this.currentBookMeta.voices) {
            if (!this.currentBookMeta.voices[voice] || this.currentBookMeta.voices[voice].length == 0) {
              voicesSelected = false;
            }
          }
        }
        //console.log('enableTtsAlignment', voicesSelected, this.currentBookMeta.voices);
        return this.hasBlocksForTTS && voicesSelected && this.blockSelection.start._id && this.blockSelection.end._id;
      },
      hasBlocksForAlignment: function() {
        return this.alignCounter.count > 0
      },
      hasBlocksForTTS: function() {
        return this.alignCounter.countTTS > 0
      },
      blocksForAlignment: function() {
        let blocks = this.alignCounter.count - this.alignCounter.countTTS;
        return blocks >=0 ? blocks : 0;
      },
      allowEditing: function() {
        return this._is('editor', true) || this.adminOrLibrarian;
      },
      ...mapGetters({
        currentBookCounters: 'currentBookCounters',
        ttsVoices: 'ttsVoices',
        currentBookid: 'currentBookid',
        currentBookMeta: 'currentBookMeta',
        blockSelection: 'blockSelection',
        alignCounter: 'alignCounter',
        hasLocks: 'hasLocks',
        lockedBlocks: 'lockedBlocks',
        audiobook: 'currentAudiobook',
        currentJobInfo: 'currentJobInfo',
        adminOrLibrarian: 'adminOrLibrarian'})
    },
    watch: {
      'audiobook': {
        handler(val, oldVal) {
          if (val && oldVal && val._id && oldVal._id && val._id != oldVal._id) {
            //console.log('AUDIOBOOK CHANGED')
            //this.checkAllState = false;
            this.selections = [];
            this.playing = false;
            this.renaming = false;
            this.audioOpening = false;
            return;
          }
          //console.log('Audiobook changed');
          if (typeof val.importFiles !== 'undefined') {
            val.importFiles.forEach(_if => {
              if (typeof this.selections[_if.id] === 'undefined') {
                //this.selections[_if.id] = false;
              }
              this.selections.forEach((s, i) => {
                let exists = val.importFiles.find(v => {return v.id === s});
                if (!exists) {
                  delete this.selections[i];
                }
              });
            });
            let self = this;
            Vue.nextTick(() => {
              /*self.draggableList = new List(document.querySelector('.draggable-list'));
              self.draggableList.on('move', function (node, newIndex, prevIndex) {
                self.saveAudiobook([[prevIndex, newIndex]]);
              })*/
              self.selections.forEach(s => {
                $('input[name="' + s + '"]').prop('checked', true);
              });
            })
          }
        },
        deep: true
      },
      'alignmentProcess': {
        handler(val) {
          if (val) {
            this.$root.$emit('show-modal', {
              title: 'Aligning blocks ' + this.blockSelection.start._id + ' - ' + this.blockSelection.end._id + ' with audio',
              text: '<div class="align-preloader"></div>',
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.cancelAlign();
                  },
                }
              ],
              class: ['align-modal']
            });
          } else {
            this.$root.$emit('hide-modal');
          }
        }
      },
      'onDeleteMessage': {
        handler(val) {
          if (val) {
            this.$root.$emit('show-modal', {
              title: this.deleting ? '<h4 class="modal-title">Delete audio file?</h4>' : '<h4 class="modal-title">Delete ' + this.selectionLength + ' audio files?</h4>',
              text: '',
              buttons: [
                {
                  title: 'Cancel',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.discardDeleteAudio();
                  }
                },
                {
                  title: 'Delete' + (!this.deleting ? '<span >(' + this.selectionLength + ')</span>' : ''),
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.deleteAudioProcess();
                  }
                }
              ]
            });
          } else {
            this.$root.$emit('hide-modal');
          }

        }
      },
      'ttsVoices': function (val) {
        this.pre_options = val;
      },
      'aligningBlocks': function() {
        /*if (this.aligningBlocks.length > 0) {
          this.alignmentProcess = true;
        } else {
          this.alignmentProcess = false;
        }*/
      },
      'blockSelection': {
        handler(val) {
          this.highlightDuplicateId = '';
          var openAudio = this.$refs.panelAudiofile ? this.$refs.panelAudiofile.open : false;
          var openTTS = this.$refs.panelTTS ? this.$refs.panelTTS.open : false;
          if (!openAudio && openTTS) {
            this.$root.$emit('from-bookedit:set-voice-test', this.blockSelection.start, this.blockSelection.end)
          }
        },
        deep: true
      },
      'isActive': {
        handler(val) {
          this.initSplit();
        }
      },
      'activeTabIndex': {
        handler(val) {
          this.initSplit();
        }
      },
      'renaming': {
        handler(val) {
          if (val !== false) {
            var i = setInterval(() => {
              if ($('#rename-input').length > 0) {
                $('#rename-input').focus();
                clearInterval(i);
              }
            }, 100)
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .btn-small {
    font-size: 12px;
  }
  .file-catalogue {
    .file-catalogue-buttons {
      &>div {
        display: inline-block;
        text-align: center;
        &.delete-audio, &.upload-audio, &.unselect-audio {
          /*width: 100px;*/
        }
      }
      .btn {height: 34px;}
    }
    .file-catalogue-files-wrapper {
        height: 100%;
        /*max-height: 220px;*/
        overflow-y: scroll;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
      border-radius: 10px;
      background-color: #F5F5F5;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar {
      width: 12px;
      background-color: #F5F5F5;
    }
    .file-catalogue-files-wrapper::-webkit-scrollbar-thumb {
      border-radius: 10px;
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
      background-color: #555;
    }
    .file-catalogue-files {
      list-style-type: none;
      margin-left: 0px;
      padding-left: 0px;
      min-height: 300px;
      max-height: 300px;
      .audiofile {
        list-style-type: none;
        padding: 2px;
        &.-selected {
            background-color: #d0e9ff;
        }
        i.fa {
          display: inline-block;
          padding: 0px 2px;
          &.red {
              color: red;
          }
        }
        &.-hidden {
            display: none;
        }
        span {
          display: inline-block;
          padding: 0px 2px;
        }
        .audiofile-info {
          display: inline-block;
          width: 95%;
          white-space: nowrap;
          /*max-width: 80%;*/
          overflow: hidden;
          .audiofile-player-controls {
            width: 19px;
            display: inline-block;
          }
          .audiofile-name {
            display: inline-block;
            cursor: pointer;
            white-space: nowrap;
            max-width: 60%;
            overflow: hidden;
            vertical-align: sub;
            min-width: 60%;
          }
          .audiofile-duration {
            display: inline-block;
            overflow: hidden;
            vertical-align: sub;
          }
          /*&.playing {
            color: maroon;
            i.fa {
              color: maroon;
            }
          }*/
          &.done {
              color: gray;
          }
        }
        .audiofile-options {
          display: inline-block;
          vertical-align: super;
          width: 3%;
          .btn-group {
            .dropdown-toggle {
                padding: 6px;
            }
          }
          ul.dropdown-menu {
              margin-left: -56px;
              min-width: 97px;
              max-width: 97px;
          }
        }
        button {
          background-color: inherit;
          border: none;
          cursor: pointer;
          span {
              display: none;
          }
        }
        ul.dropdown-menu {
          i {
              font-size: 12px;
              &.fa-trash {
                  color: red;
              }
              &.fa-check {
                  color: green;
              }
          }
          li {
              font-size: 12px;
              a {
                  display: inline-block;
                  padding: 0px 1px;
              }
          }
        }
        input[type="text"] {

        }
        input[disabled] {
            background-color: inherit;
            border: none;
        }
      }
    }
    .all-audio-dropdown {
      margin: 0px 10px;
      ul {
        span {
          display: inline-block;
          width: 100%;
          padding: 2px 12px;
          cursor: pointer;
          &.mark-done {
            color: gray;
          }
        }
      }
      span.caret {
        margin-top: -5px;
      }
    }
    .aad-sort button{
      font-family: 'Glyphicons Halflings';
    }
    .aad-sort button:before {
      content: "\e151";
      margin-right: -10px;
    }
    .aad-filter > button{
      font-family: 'Glyphicons Halflings';
    }
    .aad-filter > button:before {
      content: "\e138";
      margin-right: -10px;
    }
    .aad_selected {
     background: #95BCF2;
    }
    .left-divider {
      border-left: 1px solid #ccc;
      margin-left: 3px;
      padding-left: 7px;
    }
  }
  h4.panel-title {
    font-size: 14px;
  }
  #player {
      display: none;
  }
  .red {
    color: red;
  }
  .align-preloader {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 34px;
      display: inline-block;
      margin: 4px 0px;
      background-repeat: no-repeat;
      background-position-x: center;
  }
  .align-modal {
    .modal-header {
        border-bottom: none;
    }
    .modal-body {
        text-align: center;
    }
    .modal-footer {
      button {
          width: 100%;
      }
    }
  }
  .table.table-voices {
    margin-top: 10px;
    thead {
      tr {

      }
      th {
        background-color: silver;
        padding-top: 2px;
        padding-bottom: 2px;
        border-bottom: none;
      }
    }
    tbody {
      tr:nth-child(odd) {
        background-color:#eee;
      }
      td {
        vertical-align: middle;
      }
      td:nth-child(2) {
        width: 280px;
      }
    }
  }
  .panel-audio-catalogue {
      .panel-body {
        padding-left: 9px;
        padding-right: 9px;
        .all-audio-dropdown {
            margin: 0px;
        }
      }
  }
  .audio-import-errors {
    border: solid 1px red;
    border-radius: 8px;
    padding: 8px 5px 5px 5px;
    background-color: #ffd3d3;
    margin-top: 10px;
    height: 95px;
    color: red;
    /*overflow-y: scroll;*/
    &.errors-0 {
      display: none;
    }
    .audio-import-error {
      padding: 2px;
      /*width: 80%;*/
      word-break: break-all;
      a {
        font-weight: bolder;
      }
      &:nth-child(even) {
        background-color: #fcebeb;
      }
    }
    .hide-errors {
      display: inline-block;
      float: right;
      cursor: pointer;
      padding: 0px 3px;
      color: black;
    }
  }
  .align-preloader {
      background: url(/static/preloader-horizontal.gif);
      display: inline-block;
      background-repeat: no-repeat;
      vertical-align: middle;
      background-position: center;
      &.-small {
        background-size: 70px auto;
        width: 70px;
      }
      &.-big {
          background-size: 100px auto;
          width: 100px;
      }
  }
  .audio-opening {
    background: url(/static/preloader-snake-transparent-tiny.gif);
    display: inline-block;
    width: 19px;
    height: 19px;
    background-size: 19px;
    background-repeat: no-repeat;
    background-position: center;
  }

  .checkbox-container {
    display: block;
    position: relative;
    padding-left: 15px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 22px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    margin-left: -15px;
  }

  .checkmark {
    position: absolute;
    top: -3px;
    left: -2px;
    height: 15px;
    width: 15px;
    background-color: #eee;
    border: 1px solid #b3b0b0;
    border-radius: 3px;
  }

  .checkbox-container:hover input ~ .checkmark {
    background-color: #ccc;
  }

  .checkbox-container input:checked ~ .checkmark {
    background-color: #317bb8;
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }

  .checkbox-container .checkmark:after {
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }

  .flexContainer {
      display: flex;
  }

  .inputField {
      flex: 1;
  }
</style>
