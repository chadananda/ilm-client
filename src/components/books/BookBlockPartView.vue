<template>
  <div ref="viewBlock" :id="block.blockid + '-' + blockPartIdx"
    :class="['table-body -block -subblock', blockOutPaddings]">
    <div v-if="isLocked" :class="['locked-block-cover', 'content-process-run', 'preloader-' + lockedType]"></div>
    <div class="table-cell controls-left sub-parnum" v-if="mode === 'narrate'">
      <div class="table-row">
        <div class="table-cell">
          <span v-if="parnumComp.length" :class="[{'sub-parnum-main': !isSplittedBlock}]">{{parnumComp}}</span>
        </div>
      </div>
    </div>
    <div class="table-cell controls-left audio-controls" v-if="mode === 'narrate'">
      <div class="table-body">
        <div class="table-row">
          <div class="table-cell -hidden-subblock" v-if="blockAudio.src && tc_showBlockNarrate(block.blockid) && !isAudioChanged">
            <i class="fa fa-pencil" v-on:click="showAudioEditor()"></i>
          </div>
          <template v-if="tc_showBlockNarrate(block.blockid) && !isAudStarted">
            <div class="table-cell -hidden-subblock">
              <i class="fa fa-microphone" v-if="!isChanged" @click="_startRecording($event)"></i>
            </div>
          </template>
          <template v-if="player && blockAudio.src && !isRecording">
            <div class="table-cell -hidden-subblock" v-if="!isAudStarted">
              <i class="fa fa-play-circle-o"
                @click="audPlay($event)"></i>
            </div>
            <template v-else>
              <div class="table-cell">
                <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                  @click="audPause(block._id, $event)"></i>
                <i class="fa fa-play-circle-o paused" v-else
                  @click="audResume(block._id, $event)"></i>
              </div>
              <div class="table-cell">
                <i class="fa fa-stop-circle-o"
                  @click="audStop(block._id, $event)"></i>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
    <div class="table-cell" :class="{'completed': isCompleted}" >
        <div :class="['table-body', '-content', {'editing': isAudioEditing}, '-langblock-' + getBlockLang]"
        @mouseleave="onBlur"
        @click="onBlur">
            <div class="table-row-flex controls-top" v-if="mode !== 'narrate'">
              <div class="par-ctrl">
                <span v-if="parnumComp.length && isSplittedBlock" class="sub-parnum">{{parnumComp}}</span>
              </div>
              <div class="par-ctrl -audio -hidden" v-if="mode !== 'narrate'"> <!---->
                <template v-if="player && blockAudio.src && !isRecording">
                    <template v-if="!isAudStarted">
                      <i class="fa fa-pencil" v-on:click="showAudioEditor()" v-if="tc_showBlockAudioEdit(block._id) && !isUpdating && mode === 'edit'"></i>
                      <i class="fa fa-play-circle-o"
                        @click="audPlay($event)"></i>
                      <i class="fa fa-stop-circle-o disabled"></i>
                    </template>
                    <template v-else>
                      <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                        @click="audPause(block._id, $event)"></i>
                      <i class="fa fa-play-circle-o paused" v-else
                        @click="audResume(block._id, $event)"></i>
                      <i class="fa fa-stop-circle-o"
                        @click="audStop(block._id, $event)"></i>
                      <!--<div class="empty-control"></div>--><!-- empty block to keep order -->
                    </template>
                </template>
              </div>
              <!--<div class="par-ctrl -hidden">-->
            </div>
            <!--<div class="table-row-flex controls-top">-->

            <!-- <div style="" class="preloader-container">
              <div v-if="isUpdating" class="preloader-small"> </div>
            </div> -->

            <div :class="['table-row ilm-block', block.status.marked && !hasChanges ? '-marked':'']">
                <hr v-if="block.type=='hr'"
                  :class="[block.getClass(mode), {'checked': blockO.checked}]"
                  @click="onClick($event)"/>

                <div v-else-if="block.type == 'illustration'"
                :class="['table-body illustration-block', {'checked': blockO.checked}]"
                @click="onClick($event)">
                  <img v-if="block.illustration" :src="block.getIllustration()"
                  :height="illustrationHeight"
                  :class="[block.getClass(mode)]"/>
                  <div :class="['table-row drag-uploader', 'no-picture', {'__hidden': this.isChanged && !isIllustrationChanged}]" v-if="allowEditing">
                    <vue-picture-input
                      @change="onIllustrationChange"
                      @remove="onIllustrationChange"
                      ref="illustrationInput"
                      accept="image/*"
                      :customStrings="{ drag: 'Click here or drag image here' }"
                      :removable="true"
                      :crop="false">
                    </vue-picture-input>
                    <!-- <div class="save-illustration" v-if="isIllustrationChanged">
                      <button class="btn btn-default" @click="uploadIllustration">Save picture</button>
                    </div> -->
                  </div>

                  <div :class="['table-row content-description', block.getClass(mode)]">
                    <div class="content-wrap-desc description"
                      ref="blockDescription"
                      @input="commitDescription($event)"
                      v-html="block.description"
                      @contextmenu.prevent="onContext">
                    </div>
                  </div>

                </div>
                <!--<img v-if="block.illustration"-->

                <div v-else class="content-wrap -focus -hover"
                  :data-iseditor="block._id"
                  :id="'content-'+block._id+'-part-'+blockPartIdx"
                  ref="blockContent"
                  v-html="blockPart.content"
                  :class="[ block.getClass(mode), {
                    'updated': isUpdated,
                    'checked': blockO.checked,
                    'playing': blockAudio.src,
                    'hide-archive': isHideArchFlags
                  },
                    'part-' + blockPartIdx]"
                  :data-audiosrc="blockAudio.src"
                  @click="onClick($event)"
                  @selectionchange.prevent="onSelect"
                  @input="onInput"
                  @mouseenter="onHover"
                  @contextmenu.prevent="onContext"
                  @focusout="onFocusout"
                  @inputSuggestion="onInputSuggestion">
                </div>
                <!-- <div class="table-cell controls-left audio-controls" v-if="mode === 'narrate'"></div> -->
                <!--<div class="content-wrap">-->

                <block-flag-popup
                    ref="blockFlagPopup"
                    dir="top"
                    :isHideArchFlags="isHideArchFlags"
                    :isHideArchParts="isHideArchParts"
                    :toggleHideArchParts="toggleHideArchParts"
                    :countArchParts="countArchParts"
                >
                  <template v-if="flagsSel">
                  <template v-for="(part, partIdx) in flagsSel.parts">
                    <template v-if="part.status!=='hidden' || !isHideArchFlags || !isHideArchParts">
                    <li>

                    <div class="flag-header -left">

                      <i class="glyphicon glyphicon-triangle-bottom"
                        v-if="!part.collapsed"
                        @click.prevent="toggleFlagPart($event, partIdx)"></i>
                      <i class="glyphicon glyphicon-triangle-right"
                        v-if="part.collapsed"
                        @click.prevent="toggleFlagPart($event, partIdx)"></i>

                      <span v-if="part.type == 'editor'">Editing</span>
                      <span v-if="part.type == 'narrator'">Narrating</span>
                      <span class="flag-date">{{moment(part.created_at).format("D MMM")}}</span>
                      <i v-if="part.status == 'resolved'" class="glyphicon glyphicon-flag flag-resolved"></i>
                      <i v-if="part.status == 'open'" class="glyphicon glyphicon-flag flag-open"></i>
                      <i v-if="part.status == 'hidden'" class="glyphicon glyphicon-flag flag-hidden"></i>
                    </div>



                    <a href="#" class="flag-control -right -top"
                      v-if="_is('proofer', true) && part.status == 'resolved' && !isCompleted"
                      @click.prevent="hideFlagPart($event, partIdx)">
                      Archive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="_is('proofer', true) && part.status == 'hidden' && (!isCompleted || isProofreadUnassigned())"
                      @click.prevent="unHideFlagPart($event, partIdx)">
                      Unarchive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="canDeleteFlagPart(part) && part.status == 'open'"
                      @click.prevent="delFlagPart($event, partIdx, blockPartIdx)">
                      <i class="fa fa-trash"></i></a>

                    <div class="clearfix"></div>

                    <template v-if="!part.collapsed">

                    <p v-if="part.content" class="flag-content">"{{part.content}}"</p>

                    <p v-for="comment in part.comments" class="flag-comment">
                      <i>{{comment.creator}}</i>&nbsp;({{moment(comment.created_at).format("D MMM")}}): {{comment.comment}}
                    </p>

                    <textarea v-if="part.status !== 'hidden'"
                      class="flag-comment"
                      v-model="part.newComment"
                      placeholder="Enter description here ..."
                      @input="onInputFlag"
                      @focusout="onFocusoutFlag(partIdx, $event)"
                      :disabled="!canCommentFlagPart(part)">
                    </textarea>

                    </template>

                    <template v-if="block.isNeedAlso(flagsSel._id)">
                      <a v-if="isCanFlag('narrator', false) && part.type == 'editor'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'narrator')">
                      Flag for narration also</a>
                      <a v-if="isCanFlag('editor', false) && part.type == 'narrator'"
                      href="#" class="flag-control -right"
                      @click.prevent="addFlagPart(part.content, 'editor')">
                      Flag for editing also</a>
                    </template>

                    <a v-if="isCanReopen(flagsSel, partIdx)"
                      href="#" class="flag-control"
                      @click.prevent="reopenFlagPart($event, partIdx)">
                      Re-open flag</a>

                    <a v-if="canResolveFlagPart(part) && part.status == 'open' && !part.collapsed && (!isCompleted || isProofreadUnassigned())"
                      href="#" class="flag-control -left"
                      @click.prevent="resolveFlagPart($event, partIdx)">
                      Resolve flag</a>

                    <div class="clearfix"></div>

                    </li>
                    <!--<li class="separator"></li>-->

                    </template>
                  </template>
                  </template>

                </block-flag-popup>

                <block-cntx-menu
                    ref="blockCntx"
                    dir="bottom"
                    :update="update"
                >
                  <template v-if="isFootnoteAllowed()">
                    <li @click="addFootnote">Add footnote</li>
                    <li class="separator"></li>
                  </template>
                  <li v-if="isCanFlag('editor')" @click="addFlag($event, 'editor')">Flag for Editing</li>
                  <li v-if="isCanFlag('narrator')" @click="addFlag($event, 'narrator')">Flag for Narration</li>
                  <template v-if="!range.collapsed && blockAudio.src">
                    <li class="separator"></li>
                    <li @click="audPlayFromSelection()">Play from here</li>
                    <li @click="audPlaySelection()">Play selection</li>
                  </template>
                  <!--<li @click="test">test</li>-->
                </block-cntx-menu>

            </div>
            <!--<div class="table-row ilm-block">-->
            <div class="table-row controls-bottom" v-if="isSplittedBlock">
              <div class="par-ctrl -hidden -right">
                  <!--<span>isCompleted: {{isCompleted}}</span>-->
                  <div class="save-block -right" @click="discardBlock"
                       v-bind:class="{'-disabled': !((allowEditing || isProofreadUnassigned) && hasChanges) || isAudioEditing}">
                    Discard
                  </div>
                  <div class="save-block -right"
                  v-bind:class="{ '-disabled': (!isChanged && (!isAudioChanged || isAudioEditing) && !isIllustrationChanged) }"
                  @click="assembleBlockProxy(true)">
                    {{saveBlockLabel}}
                  </div>
              </div>
              <!--<div class="-hidden">-->
            </div>
            <!--<div class="table-row controls-bottom">-->
        </div>
        <!--<div :class="['table-body', '-content',-->
    </div>
    <!--<div :class="['table-cell'-->
    <modal :name="'block-html' + block._id" height="auto" width="90%" class="block-html-modal" :clickToClose="false" @opened="setHtml">
    <div v-on:wheel.stop="">
      <div class="modal-header">
        <h4 class="modal-title">
          Block: {{((block._id).split('-bl').length > 1) ? 'bl'+(block._id).split('-bl')[1] : block._id}}
        </h4>
        <button type="button" class="close modal-close-button" aria-label="Close" @click="hideModal('block-html')"><span aria-hidden="true">×</span></button>
      </div>
      <div class="modal-body">
        <textarea :ref="'block-html' + block._id" class="block-html"></textarea>
      </div>
      <div class="modal-footer">
          <button class="btn btn-default" v-on:click="hideModal('block-html')">Cancel</button>
          <button class="btn btn-primary" v-on:click="setContent()">Apply</button>
      </div>
    </div>
    </modal>
  </div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import { mapGetters, mapActions }    from 'vuex'
import {  QuoteButton, QuotePreview,
          SuggestButton, SuggestPreview
        } from '../generic/ExtMediumEditor';
import _                  from 'lodash'
import ReadAlong          from 'readalong'
import BlockMenu          from '../generic/BlockMenu';
import BlockContextMenu   from '../generic/BlockContextMenu';
import BlockFlagPopup     from '../generic/BlockFlagPopup';
import taskControls       from '../../mixins/task_controls.js';
import apiConfig          from '../../mixins/api_config.js';
import { Languages }      from "../../mixins/lang_config.js"
import access             from '../../mixins/access.js';
//import { modal }          from 'vue-strap';
import v_modal from 'vue-js-modal';
import { BookBlock, BlockTypes, FootNote }     from '../../store/bookBlock'
import VuePictureInput    from 'vue-picture-input'
import RecordingBlock from './block/RecordingBlock';
var BPromise = require('bluebird');
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data () {
    return {
      editor: false,
      player: false,
      range: false,
      editorDescr: false,
      editorFootn: false,
      flagsSel: false,
      flagEl: 'f',
      quoteEl: 'qq',
      suggestEl: 'sg',
      footEl: 'sup',
      isHideArchFlags: true,
      isHideArchParts: true,
      moment: moment,

      classSel: false,
      styleSel: false,
      blockTypes: BlockTypes,
      languages: Languages,

      isUpdated: false,
      isChanged: false,

      isAudStarted: false,
      isAudPaused: false,
      isAudPartStarted: false,
      isRecording: false,
      isRecordingPaused: false,
      isAudioChanged: false,
      isIllustrationChanged: false,
      blockAudio: {
        src: '',
        map: ''
      },
      FtnAudio: {
        player: false,
        isStarted: false,
        isPaused: false,
        isEditing: false,
        isChanged: false,
        map: '',
        audPlay: function(){}
      },

      reRecordPosition: false,
      hasContentListeners: false,
      isUpdating: false,
      recordStartCounter: 0,
      voiceworkChange: false,
      voiceworkUpdateType: 'single',
      isAudioEditing: false,
      voiceworkUpdating: false,
      changes: [],
      deletePending: false,
      audioEditFootnote: {footnote: {}, isAudioChanged: false},
      check_id: null,
      footnoteIdx: null,
      audioSelectPos: {
        start: Number,
        end: Number
      },
      isSaving: false
    }
  },
  components: {
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup,
      //'modal': modal,
      'vue-picture-input': VuePictureInput
  },
  props: ['block', 'blockO', 'putBlockO', 'putNumBlockO', 'putBlock', 'putBlockPart', 'getBlock',  'recorder', 'blockId', 'audioEditor', 'joinBlocks', 'blockReindexProcess', 'getBloksUntil', 'allowSetStart', 'allowSetEnd', 'prevId', 'putBlockProofread', 'putBlockNarrate', 'blockPart', 'blockPartIdx', 'isSplittedBlock', 'parnum', 'assembleBlockAudioEdit', 'insertSilence', 'audDeletePart', 'discardAudioEdit', 'startRecording', 'stopRecording', 'delFlagPart', 'initRecorder'],
  mixins: [taskControls, apiConfig, access],
  computed: {
      isLocked: function () {
        if (!this.isSplittedBlock) {
          return false;
        }
        if (this.isSaving) {
          return true;
        }
        if (this.isUpdating) {
          return true;
        }
        return this.block ? this.isBlockLocked(this.block.blockid, this.isSplittedBlock ? this.blockPartIdx : null) : false;
      },
      hasLock: {
        get() {
          if (!this.isSplittedBlock) {
            return false;
          }
          return this.block ? this.isBlockLocked(this.block.blockid, this.isSplittedBlock ? this.blockPartIdx : null) : false;
        },
        cache: false
      },
      lockedType: {
        get() {
          if (this.isSaving) {
            return 'save';
          }
          if (this.isUpdating) {
            return 'editing-audio';
          }
          let lockType = this.blockLockType(this.block.blockid);
          switch (lockType) {
            case 'align':
              return 'align';
            default:
              return 'save';
          }
        },
        cache: false
      },
      isChecked: { cache: false,
      get: function () {
        return (this.blockO && this.blockO.checked === true);
      }},
      parnumComp: { cache: false,

      get: function () {
          if (this.mode === 'narrate') {
            if (!this.parnum) {
              return '';
            }
            return this.isSplittedBlock ? `${this.parnum}_${this.blockPartIdx+1}` : this.parnum;
          }
          return (this.parnum ? `${this.parnum}_` : '') + (this.blockPartIdx+1);
      }},
      isNumbered: { cache: false,
      get: function () {
        if (this.block.type == 'par' && this.blockO.isNumber == true) return true;
        if (this.block.type == 'header' && this.blockO.isNumber == true) return true;
        //if (this.block.type == 'par' && this.block.parnum !== false) return true;
        //if (this.block.type == 'header' && this.block.secnum !== false) return true;
        return false;
      }},
      blockClasses: function () {
          return this.blockTypes[this.block.type];
      },
      blockStyles: function () {
          if (this.classSel && this.blockTypes[this.block.type][this.classSel] && this.blockTypes[this.block.type][this.classSel].length) {
            return this.blockTypes[this.block.type][this.classSel];
          }
          return false;
      },
      blockOutPaddings: function () {
//         if (!this.block.getClass) return '';
//         let match = this.block.getClass().match(/out[^\s]*/ig);
//         return (match && match.length) ? match.join(' ') : '';
        return (this.mode !== 'narrate' && this.block && this.block.classes && this.block.classes.hasOwnProperty('outsize-padding')) ? this.block.classes['outsize-padding'] : ''
      },
      blockVoiceworks: function () {
        return {
          'audio_file': 'Audio file',
          'tts': 'Text to Speech',
          'narration': 'Narration',
          'no_audio': 'No audio'
        }
      },
      blockVoiceworksSel: function() {
        if (this.currentJobInfo.text_cleanup || (!this.currentJobInfo.mastering_complete && !this.currentJobInfo.mastering)) {
          return this.blockVoiceworks;
        }
        let voiceworks = {};
        let allowed = [];
        switch (this.block.voicework) {
          case 'narration':
            allowed = Object.keys(this.blockVoiceworks);
            break;
          default:
            allowed = ['audio_file', 'tts', 'no_audio'];
            break;
        }
        for (let k in this.blockVoiceworks) {
          if (allowed.indexOf(k) !== -1) {
            voiceworks[k] = this.blockVoiceworks[k];
          }
        }
        return voiceworks;
      },
      blockLanguages: function () {
        return this.languages;
      },
      footnVoiceworks: function () {
        return {
          'tts': 'Text to Speech',
          'no_audio': 'No audio'
        }
      },
      footnLanguages: function () {
        return this.languages;
      },
      voiceworkSel: { cache: false,
        get() {
          return this.block.voicework;
        },
        set(val) {
          if (val && val !== this.block.voicework) {
            this.voiceworkChange = val;
            if (!this.block.status.marked && this.currentJobInfo.text_cleanup) {
              this.showModal('voicework-change');
            } else {
              this.voiceworkUpdateType = 'single';
              this.updateVoicework();
            }
          }
        }
      },
      footnVoiceworkSel: { cache: false,
        get() {
          return 'ttn';
        },
        set(val) {
//           if (val !== this.block.voicework) {
//             this.voiceworkChange = val;
//           }
        }
      },
      countArchParts: function () {
          return this.flagsSel ? this.block.countArchParts(this.flagsSel._id) : 0;
      },
      countFlags: function () {
          return this.block.flags && this.block.flags.length;
      },
      isNeedWorkDisabled: function () {
        if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
          return true;
        }
        return this.tc_isNeedWorkDisabled(this.block, this.mode);
      },
      enableMarkAsDone: { cache: false,
        get() {
          return this.tc_enableMarkAsDone(this.block);
        }
      },
      markAsDoneButtonDisabled: { cache: false,
        get() {
          if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged) {
            return true;
          }
          let disable_footnotes = false;
          if (this.block.footnotes) {
            this.block.footnotes.forEach(f => {
              if (f.voicework === 'tts' && !f.audiosrc) {
                disable_footnotes = true;
              }
            });
          }
          if (disable_footnotes) {
            return true;
          }
          if (this.block && this.block.voicework === 'no_audio') {
            return this.block.status.marked ? true : false;
          }
          let disable_audio = !this.block.audiosrc && (this.block.voicework === 'audio_file' || this.block.voicework === 'tts');
          return this.block.status.marked ||
                  (this.block.status && this.block.status.proofed === true) ||
                  disable_audio;
        }
      },
      isApproveDisabled: { cache: false,
        get() {
          if (this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged || this.isRecording || this.isUpdating) {
            return true;
          }
          return false;
        }
      },
      isCanApproveWithoutTask: function() {
        if (this._is('editor', true)) {
          let task = this.tc_getBlockTaskOtherRole(this.block._id);
          return task ? true : false;
        }
        return false;
      },
      isSpotCheckDisabled: {
        cache: false,
        get() {

          return this.mode != 'edit' || !this.block || this.tc_isSpotCheckDisabled(this.block);
        }
      },
      isCompleted: { cache: false,
        get() {
          return this.block ? this.tc_isCompleted(this.block) : true;
        }
      },
      displaySelectionStart() {
        return this.blockSelection.end._id == this.block._id ? this.blockSelection.start._id : false;
      },
      displaySelectionEnd() {
        return this.blockSelection.start._id == this.block._id ? this.blockSelection.end._id : false;
      },
      selectionStart() {
        return this.blockSelection.start._id
      },
      selectionEnd() {
        return this.blockSelection.end._id
      },
      allowBlockFlag() {
        if (this.isCanFlag('narrator', false) || this.isCanFlag('editor', false)) {
          return true;
        }
        let flags_summary = this.block.calcFlagsSummary(true);
        if (flags_summary && flags_summary.stat === 'open' && (this._is(flags_summary.dir, true) || (this._is('editor', true) && flags_summary.dir === 'narrator'))) {
          return true;
        }
        return false;
      },
      hasChanges: { cache: false,
        get() {
          return this.isChanged || this.isIllustrationChanged || this.isAudioChanged;
        }
      },
      isApproving :{
        get() {
          let r = this.approveBlocksList.find(_r => this.block && _r === this.block._id);
          return r;
        }
      },
      approveWaiting: {
        get() {
          return this._is('proofer', true) && this.approveBlocksList.length > 0;
        }
      },
      saveBlockLabel: {
        get() {
          return this.needsRealignment ? 'Save & Re-align' : 'Save';
        }
      },
      needsRealignment: {
        get() {
          if (this.changes && this.blockPart.audiosrc) {
            if (this.changes.indexOf('content') !== -1 || this.changes.indexOf('suggestion') !== -1) {
              return true;
            }
          }
          return false;
        }
      },
      illustrationHeight: {
        get() {
          if (this.mode === 'narrate') {
            return parseInt((650 * this.block.illustration_height) / this.block.illustration_width);
          } else {
            return this.block.illustration_height;
          }
        },
        cache: false
      },
      narrationBlockContent: {
        get() {
          let content = this.blockPart.content.replace(/<sup[^>]*>.*?<\/sup>/img, '');
          //content = $(`<div>${content}</div>`).text();
          /*let replaceHTMLRg = new RegExp(`<(?!\/|ol|ul|li|u)[^>]*>([^<]+?)<\/[^>]+>`, 'mg');
          while (content.match(replaceHTMLRg)) {
            content = content.replace(replaceHTMLRg, '$1');
          }*/
          content = content.replace(/<br[^>]*>$/, '');//remove <br> at the end of the block
          content = content.replace(/(<\/?(?:ol|ul|li|u|br)[^>]*>)|<[^>]+>/img, '$1');
          content = content.replace(/([\.\!\?\…\؟]+[^${lettersPattern}]*?)(<\/li><li[^>]*>)/img, '$1<br>$2');
          let is_list = this.block.content.match(/<br[^>]*>/m) || content.match(/<br[^>]*>/m) || this.block.content.match(/<li[^>]*>/m) || content.match(/<li[^>]*>/m);
          if (this.block.classes && typeof this.block.classes === 'object' && typeof this.block.classes.whitespace !== 'undefined' && this.block.classes.whitespace.length > 0 && content.match(/[\r\n]/)) {
            content = content.replace(/[\r\n]/mg, '<br>');
            is_list = true;
          }
          let separator = '<div class="part-separator"></div>'
          let joinBy = is_list ? '<split/>' : `<split/><split/>`;
          /*let rg = new RegExp('((?<!St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|(?=\\b)cf|(?=\\b)Cap|(?=\\b)ca|(?=\\b)cca|(?=\\b)fl|(?=\\b)gen|(?=\\b)gov|(?=\\b)vs|(?=\\b)v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|(?=\\b)scil|(?=\\b)ed|(?=\\b)p|(?=\\b)viz|\\W[A-Z]))([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])', 'img');
          content = content.replace(rg, '$1$2<br><br>');*/
          let parts = [];
          let lettersPattern = 'a-zA-Zа-яА-Я\\u0600-\\u06FF';
          let regEx = new RegExp(`[\.\!\?\…\؟]+[^${lettersPattern}]*?( |[\r\n]|<br[^>]*>)(?![\\W]*[a-z])`, 'mg')
          let regExAbbr = new RegExp(`(?=\\b)(St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|cf|Cap|ca|cca|fl|gen|gov|vs|v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|scil|ed|p|viz|[^\\wáíú’][A-Z])([\.\!\?\…\؟])$`, 'img');
          let regExColon = new RegExp(`[\:\;\؛]\\W* `, 'mg');
          let regExLetters = new RegExp(`[${lettersPattern}]`);
          let regExNewline = new RegExp(`[^\.\!\?\…\؟]<br[^>]*>[^${lettersPattern}]*$`);
          //var regExLower = new RegExp('$([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])')
          let match;
          let shift = 0;
          while ((match = regEx.exec(content))) {
            //console.log(match)
            let pos = match.index + match[0].length;
            let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
            //var substrLower = str.substring(match.index);
            //console.log(`CHECK "${substr}"`);
            //console.log('MATCH: ', substr.match(regExAbbr))
            if (!substr.match(regExAbbr) && substr.match(regExLetters) && !substr.match(regExNewline)) {
              parts.push(substr);
              shift = pos;
            }
          }
          if (parts.length > 0) {
            if (shift < content.length) {
              let substr = content.substring(shift);
              if (substr.match(regExLetters) && !substr.match(regExNewline)) {
                parts.push(substr);
              } else {
                parts[parts.length - 1]+=substr;
              }
            }
            content = parts.join(joinBy);
          }
          parts = [];
          shift = 0;
          while ((match = regExColon.exec(content))) {
            let pos = match.index + match[0].length;
            let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
            if (substr.match(regExLetters)) {
              parts.push(substr);
              shift = pos;
            }
          }
          if (parts.length > 0) {
            if (shift < content.length) {
              let substr = content.substring(shift);
              if (substr.match(regExLetters)) {
                parts.push(substr);
              } else {
                parts[parts.length - 1]+=substr;
              }
            }
            content = parts.join('<split/>');
          }
          try {
            content = content.replace(new RegExp('(?<!<split\\/>)<br[^>]*>(?!<split\\/>)', 'gm'), `<br>${separator}`);// lists with br should have empty line
          } catch (e) {// Firefox does not support negative lookbehind
            
          }
          content = content.replace(/<split\/>/gm, '<br>');// replace split with html br
          content = content.replace(/<br><br><br>/gm, '<br><br>');
          content = content.replace(/<br><br>/gm, '<br><div class="part-separator"></div>');
          //content = content.replace(, '$1<br>');
          return content;
        },
        cache: false
      },
      ...mapGetters({
          auth: 'auth',
          book: 'currentBook',
          meta: 'currentBookMeta',
          watchBlk: 'contentDBWatch',
          tc_currentBookTasks: 'tc_currentBookTasks',
          authors: 'authors',
          isEditor: 'isEditor',
          isBlocked: 'isBlocked',
          blockSelection: 'blockSelection',
          isBlockLocked: 'isBlockLocked',
          lockedBlocks: 'lockedBlocks',
          storeListO: 'storeListO',
          approveBlocksList: 'approveBlocksList',
          adminOrLibrarian: 'adminOrLibrarian',
          currentJobInfo: 'currentJobInfo',
          mode: 'bookMode',
          blockLockType: 'blockLockType'
      }),
      getBlockLang: {
        cache: false,
        get() {
          if (this.block.language && this.block.language.length) {
            return this.block.language;
          } else {
            return this.meta.language;
          }
        }
      },
      illustrationChaged() {
        return this.$refs.illustrationInput.image
      },
      allowEditing: {
        get() {
          return this.block && this.tc_isShowEdit(this.block._id) && this.mode === 'edit';
        }
      },
      blockTypeLabel: {
        get() {
          return this.block.type === 'par' ? 'paragraph' : this.block.type;
        }
      },
      allowAudioRevert() {
        if (this.tc_hasBlockTask('fix-block-text') && this.block && this.block.audiosrc === 'audio_file') {
          return true;
        }
        if (this.tc_hasBlockTask(this.block._id, 'fix-block-narration')) {
          return true;
        }
        return false;
      }
  },
  mounted: function() {
      //this.initEditor();
      //console.log('mounted', this.block._id);
      this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
      if (!this.player && this.blockAudio.src) {
          this.initPlayer();
      }

      //this.voiceworkSel = this.block.voicework;
      if (Array.isArray(this.block.parts) && this.block.parts[this.blockPartIdx]) {
        this.isChanged = this.block.parts[this.blockPartIdx].isChanged;
        this.isAudioChanged = this.block.parts[this.blockPartIdx].isAudioChanged;
        this.isIllustrationChanged = this.block.parts[this.blockPartIdx].isIllustrationChanged;
        if (this.block.parts[this.blockPartIdx].changes) {
          this.changes = this.block.parts[this.blockPartIdx].changes;
          delete this.block.parts[this.blockPartIdx].changes;
        }
      }
      if (this.block.check_id) {
        this.check_id = this.block.check_id;
        delete this.block.check_id;
      }
      if (this.block.footnoteIdx) {
        this.footnoteIdx = this.block.footnoteIdx;
        delete this.block.footnoteIdx;
      }
      if (this.block.isAudioEditing) {
        this.isAudioEditing = this.block.isAudioEditing;
        this.audioEditorEventsOff();
        this.audioEditorEventsOn();
        delete this.block.isAudioEditing;
      }
      //console.log('mounted isChecked', this.blockO);
      //this.isChecked = this.blockO.checked;
      //this.detectMissedFlags();

      //console.log('mounted', this.block._id);
      this.destroyEditor();
      this.initEditor();
      this.addContentListeners();

      this.$root.$on('block-state-refresh-' + this.block._id, this.$forceUpdate);
      this.$root.$on('prepare-alignment', this._saveContent);
      this.$root.$on('from-styles:styles-change-' + this.block.blockid, this.setClasses);
      this.$root.$on('start-narration-part-' + this.block.blockid + '-part-' + this.blockPartIdx, this._startRecording);

//       Vue.nextTick(() => {
//
//       });
  },
  beforeDestroy: function () {
//     console.log('beforeDestroy', this.block._id);
//     console.log('this.isChanged', this.isChanged);
    this.audioEditorEventsOff();

    if (this.$refs.illustrationInput) {
      // a trick to avoid console warning about incorrect resizeCanvas
      // because somehow VuePictureInput does not destroyed in normal way
      // and window.listener for 'resize' stil exists
      this.$refs.illustrationInput.$refs.container = {};
    }
    this.$root.$off('block-state-refresh-' + this.block._id, this.$forceUpdate);

    if (this.check_id) {
      this.block.check_id = this.check_id;
    }
    if (this.footnoteIdx) {
      this.block.footnoteIdx = this.footnoteIdx;
    }
    if (this.isAudioEditing) {
      this.block.isAudioEditing = this.isAudioEditing;
    }
    if (this.block && this.isChanged && Array.isArray(this.block.parts) && this.block.parts[this.blockPartIdx]) {
        this.block.parts[this.blockPartIdx].changes = this.changes;
        switch (this.block.type) { // part from assembleBlock: function()
          case 'illustration':
            this.block.description = this.$refs.blockDescription.innerHTML;
            this.block.voicework = 'no_audio';
          case 'hr':
            this.block.content = '';
            this.block.voicework = 'no_audio';
            break;
          default:
            this._saveContent();
            break;
        }
    }

    if (this.$refs.blockContent) {
      this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
        flag.removeEventListener('click', this.handleFlagClick);
      });
    }
    if (this.isRecording) {
      this.cancelRecording();
    }
  },
  destroyed: function () {
    this.$root.$off('playBlockFootnote');
    this.$root.$off('playBlock');

    if(this.block) {

      this.$root.$off('from-audioeditor:closed', this.evFromAudioeditorClosed);

    }

    this.destroyEditor();
    this.$root.$off('prepare-alignment', this._saveContent);
    this.$root.$off('from-styles:styles-change-' + this.block.blockid, this.setClasses);
    this.$root.$off('start-narration-part-' + this.block.blockid + '-part-' + this.blockPartIdx, this._startRecording);
  },
  methods: {
      ...mapActions([
        'putMetaAuthors',
        'tc_approveBookTask',
        'setCurrentBookCounters',
        'getAlignCount',
        'recountApprovedInRange',
        'loadBookToc',
        'tc_loadBookTask',
        'getCurrentJobInfo',
        'updateBookVersion',
        'updateBlockToc',
        'saveNarrated',
        'checkError',
        'getBookAlign'
      ]),
      //-- Checkers -- { --//
      isCanFlag: function (flagType = false, range_required = true) {
        if (flagType === 'narrator' && this.block.voicework !== 'narration') {
          return false;
        }
        if (this.isProofreadUnassigned()) {
          return true;
        }
        //if (this.tc_allowAdminFlagging(this.block, flagType)) {
          //return true;
        //}
        if (!this.tc_getBlockTask(this.block._id, this.mode) && !this.tc_getBlockTaskOtherRole(this.block._id, this.mode)) {
          return false;
        }
        let canFlag = true;
        if (flagType) {
          switch(flagType) {
            case 'editor' : {
              if (this._is('editor', true)) canFlag = false;
              if (this.mode === 'edit') {
                canFlag = false;
              }
            } break;
            case 'narrator' : {
              if (this.block.voicework !== 'narration') {
                canFlag = false;
              } else {
                if (this.block.status && this.block.status.stage === 'audio_mastering') canFlag = false;
                else if (!(this.blockPart.audiosrc && this.blockPart.audiosrc.length)) canFlag = false;
              }
              if (this.mode === 'narrate') {
                canFlag = false;
              }
            } break;
          };
        }

        return canFlag && !this.tc_hasTask('content_cleanup') && (!this.range.collapsed || !range_required);
      },
      isCanReopen(flag, partIdx) {
        if (typeof flag !== 'undefined' && typeof partIdx !== 'undefined') {
          let part = flag.parts && flag.parts[partIdx] ? flag.parts[partIdx] : false;
          if (part) {
            if (this.mode !== 'proofread' && part.type === 'editor') {
              return false;
            }
            if (this.mode === 'narrate' && part.type === 'narrator') {
              return false;
            }
            return part.status == 'resolved' && !part.collapsed && (!this.isCompleted || this.isProofreadUnassigned());
          }
        }
        return false;
      },
      isProofreadUnassigned: function() {
        if (this._is('proofer', true) && this.mode === 'proofread') {
          if (this.block.status && this.block.status.proofed === true && this.tc_isProofreadUnassigned()) {
            return true;
          }
          if (this.block.flags && this.block.flags.length && this.tc_isProofreadUnassigned()) {
            let result = this.block.flags.find(f => {

              if ((f.creator === this.auth.getSession().user_id) || (f.creator_role && this._is(f.creator_role, true))) {
                return true;
              } else if (Array.isArray(f.parts) && f.parts.length > 0) {
                return f.parts.find(p => {
                  return p.creator === this.auth.getSession().user_id || (p.creator_role && this._is(p.creator_role, true));
                })
              }
              return false;
            });
            return result;
          }
        }
        return false;
      },
      //-- } -- end -- Checkers --//

      destroyEditor() {
        if (this.editor) {
          //this.editor.removeElements();
          this.editor.destroy();
          if (this.block && this.block.type === 'illustration') {
            Vue.nextTick(() => {
              $('[id="' + this.block._id + '"] .illustration-block')
              .removeAttr('contenteditable')
              .removeAttr('data-placeholder');
            });
          }
        }
        if (this.editorDescr) {
          //this.editorDescr.removeElements();
          this.editorDescr.destroy();
          //this.editorDescr = false;
        }
        if (this.editorFootn) {
          this.editorFootn.destroy();
        }
      },

      initEditor(force) {
        force = force || false;

        if ((!this.editor || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing && this.mode === 'edit') {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  //'superscript', 'subscript','orderedlist', 
                  'unorderedlist',
                  //'html', 'anchor',
                  'quoteButton', 'suggestButton'
                ]
              };
            this.editor = new MediumEditor('#content-' + this.block.blockid + '-part-' + this.blockPartIdx, {
                toolbar: toolbar,
                buttonLabels: 'fontawesome',
                quotesList: this.authors,
                onQuoteSave: this.onQuoteSave,
                suggestEl: this.suggestEl,
                extensions: extensions,
                disableEditing: !this.allowEditing
            });
          } else if (this.tc_showBlockNarrate(this.block._id) && this.mode === 'narrate') {
            extensions = {
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: ['suggestButton']
              };
            this.editor = new MediumEditor('#content-' + this.block.blockid + '-part-' + this.blockPartIdx, {
                toolbar: toolbar,
                buttonLabels: 'fontawesome',
                quotesList: [],
                onQuoteSave: this.onQuoteSave,
                suggestEl: this.suggestEl,
                extensions: extensions,
                disableEditing: true
            });
          }
    //       this.editor.subscribe('hideToolbar', (data, editable)=>{});
    //       this.editor.subscribe('positionToolbar', ()=>{})
        }  else if (this.editor) {
          this.editor.setup();
        }

        if ((!this.editorDescr || force === true) && this.block.type == 'illustration' && this.mode === 'edit') {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing) {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'unorderedlist',
                  'quoteButton', 'suggestButton'
                ]
              };
          }
          this.editorDescr = new MediumEditor(this.$refs.blockDescription, {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
        } else if (this.editorDescr) {
          this.editorDescr.setup();
        }

        this.initFtnEditor(force)

        $('.medium-editor-toolbar.medium-editor-stalker-toolbar').css('display', '');
      },
      initFtnEditor(force) {
        if ((!this.editorFootn || force === true) && this.block.needsText()) {
          let extensions = {};
          let toolbar = {buttons: []};
          if (this.allowEditing) {
            extensions = {
                'quoteButton': new QuoteButton(),
                'quotePreview': new QuotePreview(),
                'suggestButton': new SuggestButton(),
                'suggestPreview': new SuggestPreview()
              };
            toolbar = {
                buttons: [
                  'bold', 'italic', 'underline',
                  'superscript', 'subscript',
                  'unorderedlist',
                  'quoteButton', 'suggestButton'
                ]
              };
          }

          this.editorFootn = new MediumEditor('.content-wrap-footn' , {
              toolbar: toolbar,
              buttonLabels: 'fontawesome',
              quotesList: this.authors,
              onQuoteSave: this.onQuoteSave,
              suggestEl: this.suggestEl,
              extensions: extensions,
              disableEditing: !this.allowEditing
          });
        } else if (this.editorFootn) this.editorFootn.setup();
      },
      onQuoteSave: function() {
        this.putMetaAuthors(this.authors).then(()=>{
          this.update();
        });
      },
      onHover: function() {
        //this.$refs.blockContent.focus();
        //console.log(this.block.calcFlagsSummary());
        //console.log(this.tc_currentBookTasks.job.executors);
      },
      onBlur: function() {
        if (this.$refs.blockCntx && this.$refs.blockCntx.viewMenu) this.$refs.blockCntx.close();
      },
      onSelect: function($event) {
        console.log('onSelect');
      },
      onClick: function($event) {
//         $('.medium-editor-toolbar').each(function(){
//           $(this).css('display', 'inline-block');
//         });
        $event.target.checked = true;
        this.setRangeSelection('byOne', $event)
      },
      onContext: function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.range = window.getSelection().getRangeAt(0).cloneRange();

        if (this.$refs.blockCntx) {
          let narrationShift = ($('.content-scroll-wrapper').outerWidth() - $('.-block.-subblock').outerWidth()) / 2;//shift for specific width
          this.$refs.blockCntx.open(e, this.range, this.mode === 'narrate' ? narrationShift : 0);
        }
      },
      update: function() {
        //console.log('update');
        //this.isChanged = true;
        //Vue.set(this, 'isChanged', true);
      },
      onInput: function(ev) {
        this.isChanged = true;
        this.pushChange('content');
        $(ev.target).find("span[style]").contents().unwrap();
        ev.target.focus();
      },
      onInputSuggestion: function(ev) {
        this.isChanged = true;
        this.pushChange('suggestion');
        $(ev.target).find("span[style]").contents().unwrap();
        ev.target.focus();
      },
      onInputFlag: function(ev) {
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('inputFlag');
        ev.target.focus();
      },
      onFocusoutFlag: function(partIdx, ev) {
        if (ev && ev.target) {
          this.block.flags.forEach((flag, idx) => {
            if (flag._id === this.flagsSel._id) {
              this.block.flags[idx].parts[partIdx].newComment = ev.target.value;
            }
          });

        }
        //console.log(this.flagsSel);
      },
      onFocusout: function(el) {
        /*let blockContent = this.$refs.blockContent.innerHTML;
        this.block.content = blockContent.replace(/(<[^>]+)(selected)/g, '$1').replace(/(<[^>]+)(audio-highlight)/g, '$1');*/
      },
      discardBlock: function(ev) {

        this.getBlock(this.block.blockid)
        .then((block)=>{

          if (this.$refs.blockContent) {
            //let content = this.blockContent();
            let content = block.getPartContent(this.blockPartIdx);
            //if (this.mode !== 'narrate') {
              this.$refs.blockContent.innerHTML = content;
            //} else {
              //this.block.setPartContent(this.blockPartIdx, content);
              //this.$refs.blockContent.innerHTML = content;
            //}
            //this.$refs.blockContent.focus();
          }
          if (this.$refs.blockFlagPopup) {
            this.$refs.blockFlagPopup.close();
          }
          let part = this.isSplittedBlock ? this.block.parts[this.blockPartIdx] : this.block;
          if (part) {
            this.block.setPartAudiosrc(this.blockPartIdx, part.audiosrc, part.audiosrc_ver);
            this.refreshBlockAudio();
          }

          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });

          this.isChanged = false;
          this.updateFlagStatus(block._id);
          if (this.block.type === 'illustration') {
            if (this.$refs.illustrationInput) {
              this.$refs.illustrationInput.removeImage();
            }
            this.block.description = block.description;
            if (this.$refs.blockDescription) {
              this.$refs.blockDescription.innerHTML = block.description;
            }
          }

        });
      },
      discardAudio: function() {
        //this.blockAudio.src = this.block.getAudiosrc('m4a');
        //this.blockAudio.map = this.block.content;
        //let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
        //let api = this.$store.state.auth.getHttp();
        //api.delete(api_url, {}, {})
          //.then(response => {
          //
          //})
          //.catch(err => {
          //
          //});
        if (this.tc_hasBlockTask(this.block._id, 'fix-block-narration')) {
          let api = this.$store.state.auth.getHttp();
          api.post(this.API_URL + 'book/block/' + this.block._id + '/audio/revert')
            .then(response => {
              this.$root.$emit('bookBlocksUpdates', {blocks: [response.data.block]});
            })
            .catch(err => console.log(err));
        }
      },

      discardFtnAudio: function() {
//         this.blockAudio.src = this.block.audiosrc;
//         this.blockAudio.map = this.block.content;
//         let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
//         let api = this.$store.state.auth.getHttp();
//         api.delete(api_url, {}, {})
//           .then(response => {
//
//           })
//           .catch(err => {
//
//           });
      },
      assembleBlockProxy: function (check_realign = true, realign = false) {
        if (this.mode === 'proofread') {
          return this.assembleBlockProofread();
        } else if (this.mode === 'narrate') {
          return this.assembleBlockNarrate();
        }
        if (check_realign === true && this.needsRealignment && Array.isArray(this.blockPart.manual_boundaries) && this.blockPart.manual_boundaries.length > 0) {
          this.$root.$emit('from-block:save-and-realign-warning', () => {
                  this.$root.$emit('hide-modal');
                },
                () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.assembleBlockProxy(false, false)
                    }
                  }, 50);
                },
                () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.assembleBlockProxy(false, true)
                    }
                  }, 50);
                });
          return;
        }
        if (check_realign === true && this.needsRealignment) {
          realign = true;
        }
        this.blockPart.content = this.clearBlockContent(this.$refs.blockContent.innerHTML);
        this.isChanged = false;
        this.isSaving = true;
        return this.$emit('save', this.blockPart, this.blockPartIdx, realign);
      },

      assembleBlock: function(partUpdate = null, realign = false) {
        let update = partUpdate ? partUpdate : this.block;
        if (update.status && update.status.marked === true) {
          update.status.marked = false;
        }

        this.checkBlockContentFlags();
        this.updateFlagStatus(this.block._id);
        let is_content_changed = this.hasChange('content');
        let is_type_changed = this.hasChange('type');
        this.isSaving = true;
        if (this.isAudioEditing) {
          this.$root.$emit('for-audioeditor:set-process-run', true, realign ? 'align' : 'save');
        }
        return this.putBlock([update, realign]).then((updated)=>{
          //this.block.manual_boundaries = updated.manual_boundaries
          if (realign) {
            this.getBookAlign()
              .then(() => {
                this.isSaving = false;
              });
          } else {
            this.isSaving = false;
          }
          if (this.isCompleted) {
            this.tc_loadBookTask(this.block.bookid);
            this.getCurrentJobInfo();
          }
          this.isChanged = false;
          if (this.blockAudio.map) {
            this.blockAudio.map = this.block.content;
          }
          if (this.isAudioEditing && !realign) {
            this.$root.$emit('for-audioeditor:flush');
            this.$root.$emit('for-audioeditor:reload-text', this.block.content, this.block);
          }
          this.$refs.blockContent.dataset.has_suggestion = false;
          if (is_content_changed) {
            if (['title', 'header'].indexOf(this.block.type) !== -1) {
              this.updateBlockToc({blockid: this.block._id, bookid: this.block.bookid});
            }
          } else if (is_type_changed) {
            this.loadBookToc({bookId: this.block.bookid, isWait: true});
          }

          /*this.blockO.status = Object.assign(this.blockO.status, {
            marked: this.block.markedAsDone,
            assignee: this.block.status.assignee,
            proofed: this.block.status.proofed,
            stage: this.block.status.stage
          })
          let upd = {
            rid: this.blockO.rid,
            type: this.block.type,
            status: this.blockO.status,
          }*/
          //this.putBlockO(upd).then(()=>{
            if (is_type_changed) {
              //if (this.block.type == 'header' || this.block.type == 'par') {
                this.putNumBlockO({
                  bookId: this.block.bookid,
                  rid: this.blockO.rid,
                  type: this.block.type,
                  secnum: this.blockO.secnum,
                  parnum: this.blockO.parnum,
                  isManual: true,
                }).then((blocks)=>{
                  //console.log('assembleBlock putNumBlockO', blocks[0]);
                  this.storeListO.updBlockByRid(this.blockO.rid, {
                    type: this.block.type
                  })
                });
              //}
            }
          //});
        });
      },
      assembleBlockPart: function(update) {
        update.blockid = this.block.blockid;
        update.bookid = this.block.bookid;
        this.isSaving = true;
        if (this.isAudioEditing) {
          this.$root.$emit('for-audioeditor:set-process-run', true, 'save');
        }
        return this.putBlockPart(update)
          .then(() => {
            this.isSaving = false;
            this.isChanged = false;
            if (this.isAudioEditing) {
              this.$root.$emit('for-audioeditor:set-process-run', false);
            }
          });
      },
      assembleBlockProofread() {
        if (this.$refs.blockContent) {
          this.block.content = this.clearBlockContent(this.$refs.blockContent.innerHTML);
        }
        this.isSaving = true;
        return this.putBlockProofread(this.block.clean())
          .then(() => {
            this.isSaving = false;
            this.isChanged = false;
            if (this.isCompleted) {
              this.tc_loadBookTask(this.block.bookid);
              this.getCurrentJobInfo();
            }
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      assembleBlockNarrate(check_realign = true, realign = false) {
        if (check_realign === true && this.needsRealignment && Array.isArray(this.blockPart.manual_boundaries) && this.blockPart.manual_boundaries.length > 0) {
          this.$root.$emit('from-block:save-and-realign-warning', () => {
                  this.$root.$emit('hide-modal');
                },
                () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.assembleBlockNarrate(false, false)
                    }
                  }, 50);
                },
                () => {
                  this.$root.$emit('hide-modal');
                  let i = setInterval(() => {
                    if ($('.align-modal').length == 0) {
                      clearInterval(i);
                      this.assembleBlockNarrate(false, true)
                    }
                  }, 50);
                });
          return;
        }
        if (check_realign === true && this.needsRealignment) {
          realign = true;
        }
        this.blockPart.content = this.clearBlockContent(this.$refs.blockContent.innerHTML);
        this.isSaving = true;
        return this.putBlockNarrate([Object.assign(this.blockPart, {
            blockid: this.block.blockid,
            bookid: this.block.bookid,
        }), realign, this.blockPartIdx])
          .then(() => {
            this.isSaving = false;
            this.isChanged = false;
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      clearBlockContent: function(content = false) {
        //console.log(content)
        if (!content) {
          content = this.$refs.blockContent.innerHTML;
        }
        content = content.replace(/(<[^>]+)(selected)/g, '$1');
        content = content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
        content = content.replace(/<br class="narrate-split"[^>]*>/g, '')
        content = content.replace('<span class="content-tail"></span>', '');
        content = content.replace(/&nbsp;/gm, ' ')
        if (/\r\n|\r|\n/.test(content) && this.block && this.block.classes.whitespace && ['verse', 'pre', 'list'].indexOf(this.block.classes.whitespace) !== -1) {
          content = content.replace(/<p><br[\/]?><\/p>/gm, '\n');
          content = content.replace(/<p[^>]*>([\s\S]+?)<\/p>([\s\S]+?)/gm, `$1\n$2`)// remove Editor's p instead of line breaks
          content = content.replace(/<\/div><div>/gm, '')
          content = content.replace(/<div>/gm, '')
          content = content.replace(/<\/div>/gm, '\n')
        }
        content = content.replace(/<p[^>]*>([\s\S]*?)<br[^>]*><\/p>/gm, '<p>$1</p>');
        try {
          content = content.replace(new RegExp('(?<!<\\/ul>|<\\/ol>)<p[^>]*>([\\s\\S]*?)<\\/p>', 'gm'), '<br/>$1')//paragrapth not preceeded by list
          content = content.replace(new RegExp('(?<=<\\/ul>|<\\/ol>)<p[^>]*>([\\s\\S]*?)<\\/p>', 'gm'), '$1')//paragrapth preceeded by list
        } catch (e) {// Firefox does not support negative lookbehind
          
        }
        content = content.replace(/<p[^>]*><\/p>/gm, '')
        content = content.replace(/^<br[\/]?>/gm, '')
        content = content.replace(/<span[^>]*>([\s\S]*?)<\/span>/gm, '$1')
        content = content.replace(/<br[\/]?><br[\/]?>/gm, '<br>');
        content = content.replace(/^<br[\/]?>/, '');
        return content;
      },

      checkBlockContentFlags: function() {
        if (this.block.flags) this.block.flags.forEach((flag, flagIdx)=>{
          if (flag._id !== this.block._id) {
            let node = this.$refs.blockContent.querySelector(`[data-flag="${flag._id}"]`);
            if (!node) this.block.mergeFlags(flagIdx);
          }
        });
      },

      assembleBlockAudio: function() {
        if (this.blockAudio.map) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_tmp';
          let api = this.$store.state.auth.getHttp();
          return api.post(api_url, {
            content: this.blockAudio.map
          }, {})
            .then(response => {
              if (response.status == 200 && response.data.audiosrc) {
                //this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                //this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.isAudioChanged = false;
                this.block.isAudioChanged = false;
                //return this.putBlock(this.block);
                this.$root.$emit('bookBlocksUpdates', {blocks: [response.data.block]});
              }
            })
            .catch(err => {});
        }
        this.isAudioChanged = false;
      },
      audPlay: function(ev) {
        if (this.player) {
          this.isAudPartStarted = false;
          this.audCleanClasses(this.block.blockid, ev);
          this.player.playBlock('content-'+this.block.blockid+'-part-'+this.blockPartIdx);
        }
      },
      audPlayFromSelection() {
        if (this.player) {
          this.isAudPartStarted = false;
          this.player.loadBlock(this.block._id);
          let startElement = this._getParent(this.range.startContainer, 'w');
          if (startElement) {
            this.isAudStarted = true;
            this.player.playFromWordElement(startElement, 'content-'+this.block.blockid+'-part-'+this.blockPartIdx);
          }
        }
      },
      audPlaySelection() {
        if (this.player) {
          this.audStop(this.block._id);
          this.player.loadBlock(this.block._id);
          let startElement = this._getParent(this.range.startContainer, 'w');
          let endElement = this._getParent(this.range.endContainer, 'w');
          let startRange = this._getClosestAligned(startElement, 1);
          if (!startRange) {
            startRange = [0, 0];
          }
          let endRange = this._getClosestAligned(endElement, 0);
          if (!endRange) {
            endRange = this._getClosestAligned(endElement, 1)
          }

          this.player.playRange('content-' + this.block.blockid + '-part-' + this.blockPartIdx, startRange[0], endRange[0] + endRange[1]);
          this.isAudStarted = true;
          this.isAudPartStarted = true;
          this.$root.$emit('playBlock', this.block._id);
        }
      },
      audPause: function(block_id, ev) {
        if (this.player) {
          this.player.pause();
        }
      },
      audResume: function(block_id, ev) {
        if (this.player) {
          this.audCleanClasses(block_id, ev);
          this.player.resume();
        }
      },
      audStop: function(block_id, ev) {
        if (this.player) {
          this.isAudPartStarted = false;
          this.player.pause();
          this.isAudStarted = false;
          this.isAudPaused = false;
          this.audCleanClasses(block_id, ev);
        }
      },
      audCleanClasses: function(block_id, ev) {
        let reading_class = this.player.config.reading_class
        $('#'+block_id).find('.'+reading_class).each(function(){
          $(this).removeClass(reading_class);
        });
        let trail_class = this.player.config.trail_class
        $('#'+block_id).find('.'+trail_class).each(function(){
          $(this).removeClass(trail_class);
        });
      },

      audFootnoteCleanClasses: function(ftnId) {
        let reading_class = this.FtnAudio.player.config.reading_class
        $(`#${ftnId}`).find('.'+reading_class).each(function(){
          $(this).removeClass(reading_class);
        });
        let trail_class = this.FtnAudio.player.config.trail_class
        $(`#${ftnId}`).find('.'+trail_class).each(function(){
          $(this).removeClass(trail_class);
        });
      },

      isFootnoteAllowed: function() {
        if (!this.allowEditing) return false;
        if (this.block.type == 'illustration') return false;
        if (!this.range) return false;
        let container = this.range.commonAncestorContainer;
        if (typeof container.length == 'undefined') return false;
        if (this.range.endOffset >= container.length) return true;
        let checkRange = document.createRange();
        //console.log(container, container.length, this.range.endOffset);
        checkRange.setStart( container, this.range.startOffset );
        checkRange.setEnd( container, this.range.endOffset+1 );
        let regexp = /^[\.\s]+$/i;
        return regexp.test(checkRange.toString());
      },
      addFootnote: function() {
        //console.log('this.range', this.range);
        let el = document.createElement('SUP');
        el.setAttribute('data-idx', this.block.footnotes.length + 1);
        this.range.insertNode(el);
        /*this.block.footnotes.forEach((ftn, ftnIdx) => {
          let ref = this.$refs['footnoteContent_' + ftnIdx]
          if (ref && ref[0]) {
            this.block.setContentFootnote(ftnIdx, ref[0].innerHTML);
          }
        });
        let pos = this.updFootnotes(this.block.footnotes.length + 1);
        this.block.footnotes.splice(pos, 0, new FootNote({}));
        this.$forceUpdate();
        //this.isChanged = true;
        let ref = this.$refs['footnoteContent_' + pos];
        if (ref && ref[0]) {
          ref[0].innerHTML = this.block.footnotes[pos].content;
        }*/
        //this.pushChange('footnotes');
        /*Vue.nextTick(() => {
          //this.destroyEditor();
          this.initFtnEditor(true);
        });*/
        this.$emit('addFootnote');
        return;
      },
      delFootnote: function(pos, checkText = true) {
        if (checkText) {
          pos.forEach(p => {
            let footnote = this.$refs.blockContent.querySelector(`[data-idx='${p+1}']`);
            if (footnote) {
              footnote.remove();
            }
          })
        }
        this.updFootnotes();
        this.block.footnotes.forEach((ftn, ftnIdx) => {
          let ref = this.$refs['footnoteContent_' + ftnIdx]
          if (ref && ref[0]) {
            this.block.setContentFootnote(ftnIdx, ref[0].innerHTML);
          }
        });
        let posDecr = 0;
        pos.forEach(p => {
          this.block.footnotes.splice(p - posDecr, 1);
          ++posDecr;
        });

        this.isChanged = false; // to be shure to update view
        this.isChanged = true;
        this.pushChange('footnotes');
      },
      updFootnotes: function(c_pos = 0) {
        let pos = 0;
        this.$refs.blockContent.querySelectorAll('[data-idx]').forEach(function(el, idx) {
          if (el.getAttribute('data-idx') == c_pos) pos = idx;
          el.textContent = idx+1;
          el.setAttribute('data-idx', idx+1);
        });
        return pos;
      },
      commitFootnote: function(pos, ev, field = null) {
        //this.block.footnotes[pos] = ev.target.innerText.trim();
        this.isChanged = true;
        this.pushChange(field === null ? 'footnotes' : 'footnotes_' + field);
        if (field === 'voicework') {
          this.block.setAudiosrcFootnote(pos, '');
        }
      },
      commitDescription: function(ev) {
        //this.block.description = ev.target.innerText.trim();
        this.isChanged = true;
        this.pushChange('description');
      },

      addFlag: function(ev, type = 'editor') {
        if (window.getSelection) {
          let startPos = this.$refs.blockContent.compareDocumentPosition(this.range.startContainer);
          let endPos = this.$refs.blockContent.compareDocumentPosition(this.range.endContainer);
          if (startPos != 20) {
            this.range.setStart(this.$refs.blockContent.childNodes[0], 0);
          }
          if (endPos != 20) {
            let endNode = this.$refs.blockContent.lastChild;
            let selectionLength = endNode.nodeType == 3 ? endNode.textContent.length: 1;
            this.range.setEnd(endNode, selectionLength);
          }

          let existsFlag = this.detectExistingFlag();

          let windowSelRange = this.range;
          // ILM-2108: - because the last tag in the selection was not cropped
          // and was duplicated after adding a flag
          let startElementWrapper = windowSelRange.startContainer.parentElement;
          if (startElementWrapper.nodeName.toLowerCase() !== 'div') {
            while (startElementWrapper.parentElement && startElementWrapper.parentElement.nodeName.toLowerCase() !== 'div') {
              startElementWrapper = startElementWrapper.parentElement;
            }
            windowSelRange.setStartBefore(startElementWrapper);
          }

          let endElementWrapper = windowSelRange.endContainer.parentElement;
          if (endElementWrapper.nodeName.toLowerCase() !== 'div') {
            while (endElementWrapper.parentElement && endElementWrapper.parentElement.nodeName.toLowerCase() !== 'div') {
              endElementWrapper = endElementWrapper.parentElement;
            }
            windowSelRange.setEndAfter(endElementWrapper);
          }

          let flag = document.createElement(this.flagEl);
          if (!existsFlag) {
            flag.dataset.flag = this.block.newFlag(windowSelRange, type, false, this.mode);
            flag.dataset.status = 'open';
            flag.appendChild(windowSelRange.extractContents());
            flag.childNodes.forEach((n, i) => {
              if (n.dataset && n.dataset.map) {
                let ch = this.$refs.blockContent.querySelector('[data-map="' + n.dataset.map + '"]');
                if (ch) {
                  //if (i == 0) {
                    //n.innerHTML = ch.innerHTML+n.innerHTML
                  //} else {
                    //n.innerHTML+= ch.innerHTML
                  //}
                  if (!ch.innerHTML) {
                    this.$refs.blockContent.removeChild(ch);
                  } else if (!ch.innerHTML.trim()) {
                    ch.dataset.map = ''
                  } else {
                    let map = n.dataset.map.split(',');
                    map[0] = parseInt(map[0]);
                    let half = parseInt(map[1]) / 2;
                    let secondHalf = half;
                    if (parseInt(secondHalf) != secondHalf) {
                      half+=0.5;
                      secondHalf-=0.5
                    }
                    if (i == 0) {
                      ch.dataset.map = map[0] + ',' + half;
                      n.dataset.map = map[0] + half + ',' + secondHalf;
                    } else {
                      n.dataset.map = map[0] + ',' + half;
                      ch.dataset.map = map[0] + half + ',' + secondHalf;
                    }
                  }
                }
              }
            });
            windowSelRange.insertNode(flag);
            flag.addEventListener('click', this.handleFlagClick);
            this.handleFlagClick({target: flag, layerY: ev.layerY, clientY: ev.clientY});
          } else {
            this.block.addFlag(existsFlag.dataset.flag, windowSelRange, type, this.mode);
            this.handleFlagClick({target: existsFlag, layerY: ev.layerY, clientY: ev.clientY});
          }
          this.$refs.blockFlagPopup.scrollBottom();
          //this.isChanged = true;
          //this.pushChange('flags');
          this.$emit('addFlag');
        }
      },

      addFlagPart: function(content, type = 'editor') {
        this.block.addPart(this.flagsSel._id, content, type, this.mode);

        this.updateFlagStatus(this.flagsSel._id);
        this.$refs.blockFlagPopup.reset();

        this.$refs.blockFlagPopup.scrollBottom();
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('addFlagPart');
      },

      detectExistingFlag: function(ev) {
        let node = this.range.startContainer;
        let endNode = this.range.endContainer;
        // ILM-2108: .iseditor has been added, because in proofread mode
        // there is no an editor in fact and we need to stop traverse
        let target = MediumEditor.util.traverseUp(node, (element)=>{
          return element.dataset.flag || element.dataset.iseditor;
        })
        while (target === false && node && node != endNode) {
          target = MediumEditor.util.traverseUp(node = this.nextNode(node), (element)=>{
            return element.dataset.flag || element.dataset.iseditor;
          })
        }
        return target.dataset.flag ? target : false;
      },

      nextNode: function (node) {
        if (node.hasChildNodes()) {
          return node.firstChild;
        } else {
          while (node && !node.nextSibling) {
            node = node.parentNode;
          }
          if (!node) {
            return null;
          }
          return node.nextSibling;
        }
      },

      handleFlagClick: function(ev) {
        let flagId = ev.target.dataset.flag;
        this.flagsSel = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        })[0];
        this.isHideArchParts = true;
        this.$refs.blockFlagPopup.open(ev, flagId);
        this.updateFlagStatus(flagId);
      },

      handleBlockFlagClick: function(ev, type = 'editor') {
        let flagId = this.block._id;
        let foundBlockFlag = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        });

        if (foundBlockFlag.length == 0) {
          if (this.allowBlockFlag) {
            if (this.block && this.block.voicework === 'narration') {
              if (type === 'editor' && this._is('editor', true)) {
                type = 'narrator';
              }
              if (type === 'editor' && this.tc_allowAdminFlagging(this.block)) {
                type = 'narrator';
              }
            }
            flagId = this.$refs.blockFlagControl.dataset.flag = this.block.newFlag({}, type, true, this.mode);
            this.$refs.blockFlagControl.dataset.status = 'open';
            this.isChanged = true;
            this.pushChange('flags');
          } else {
            return;
          }
        }

        this.flagsSel = this.block.flags.filter((flag)=>{
          return flag._id === flagId;
        })[0];

        this.$refs.blockFlagControl.dataset.flag = flagId;
        this.isHideArchParts = true;
        this.$refs.blockFlagPopup.open(ev, flagId);
        this.updateFlagStatus(flagId);
      },

      updateFlagStatus: function (flagId) {
        let node;
        if (flagId ===  this.block._id) {
          node = this.$refs.blockFlagControl;
          if (node) node.dataset.flag = flagId;
        } else {
          node = this.$refs.blockContent.querySelector(`[data-flag="${flagId}"]`);
        }
        if (node) node.dataset.status = this.block.calcFlagStatus(flagId);
      },

      canResolveFlagPart: function (flagPart) {
          return this.tc_canResolveFlagPart(flagPart);
      },
      canCommentFlagPart: function(flagPart) {
        return this.canResolveFlagPart(flagPart) && flagPart.status == 'open' && !flagPart.collapsed/* && (!this.isCompleted || this.isProofreadUnassigned())*/;
      },

      canDeleteFlagPart: function (flagPart) {
          let result = false;
          let isProofreadUnassigned = this.isProofreadUnassigned();
          if ((!this.isCompleted || isProofreadUnassigned) && flagPart.creator === this.auth.getSession().user_id) {
            result = true;
            if (flagPart.comments.length && !isProofreadUnassigned) flagPart.comments.forEach((comment)=>{
              if (comment.creator !== flagPart.creator) result = false;
            });
          }
          return result;
      },


      toggleFlagPart: function(ev, partIdx) {
        if (!this.flagsSel.parts[partIdx].collapsed) this.flagsSel.parts[partIdx].collapsed = true;
        else this.flagsSel.parts[partIdx].collapsed = !this.flagsSel.parts[partIdx].collapsed;
        this.$refs.blockFlagPopup.reset();
      },

      resolveFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('resolveFlagPart');
      },

      reopenFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'open';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('reopenFlagPart');
      },

      hideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'hidden';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('hideFlagPart');
      },

      unHideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        //this.isChanged = true;
        //this.pushChange('flags');
        this.$emit('unHideFlagPart');
      },

      toggleArchFlags: function(ev, partIdx) {
        this.isHideArchFlags = !this.isHideArchFlags;
      },

      toggleHideArchParts: function() {
        this.isHideArchParts = !this.isHideArchParts;
        this.$refs.blockFlagPopup.reset();
      },

      _startRecording() {
        return this.initRecorder()
          .then(() => {

            this.$modal.show(RecordingBlock, {
              text: this.narrationBlockContent,
              cancelRecording: this.cancelRecording,
              stopRecording: this._stopRecording,
              pauseRecording: this.pauseRecording,
              resumeRecording: this.resumeRecording,
              lang: this.getBlockLang
            },
            {
              clickToClose: false,
              resizable: false,
              draggable: false,
              scrollable: false,
              height: 'auto',
              width: '700px'
            });
            //this.$root.$emit('show-modal', {
              //template: RecordingBlock
            //})
              //this.$emit('startRecording', this.blockPartIdx);
              this.isRecording = true;
              this.startRecording(this.blockPartIdx)
                .then(() => {

                })
                .catch(err => {
                  this.isRecording = false;
                });
          })
          .catch(err => {

            this.$root.$emit('show-modal', {
              title: '<center><h4>Microphone is not working</h4></center>',
              text: `<center>Please ensure:</center>
  <ul>
  <li>You have a working microphone connected to your computer with the volume turned up.</li>
  <li>Your browser allows accessing your microphone.</li>
  </ul>`,
              buttons: [
                {
                  title: 'OK',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                  },
                  class: ['btn btn-primary']
                }
              ],
              class: ['align-modal']
            });
          })
      },
      _stopRecording(start_next = false) {
        if (!this.isRecording) {
          return false;
        }
        this.isRecording = false;
        this.isRecordingPaused = false;
        this.reRecordPosition = false;
        if (this.isSplittedBlock) {
          this.isUpdating = true;
        }
        return this.stopRecording(this.blockPartIdx, this.reRecordPosition, start_next)
          .then(() => {
            this.isUpdating = false;
          })
          .catch(err => {
            this.isUpdating = false;
          });
      },
      cancelRecording() {
        this.$emit('cancelRecording');
        if (this.recorder) {
          this.isRecording = false;
          this.isRecordingPaused = false;
          this.recorder.stopRecording(() => {

          });
        }
      },
      pauseRecording() {
        this.isRecordingPaused = true;
        this.recorder.pauseRecording();
      },
      resumeRecording() {
        this.isRecordingPaused = false;
        this.recorder.resumeRecording();
      },
      initFootnotePlayer(playerObj) {
        let parent = this;
        playerObj.audPlay = function (blockId, ftnIdx) {
          parent.$root.$emit('playBlockFootnote', `${blockId}_${ftnIdx}`);
          parent.$root.$emit('playBlock', false);
          this.isStarted = `${blockId}_${ftnIdx}`;
          this.player.playBlock(`${blockId}_${ftnIdx}`);
        }

        playerObj.audPause = function (blockId, ftnIdx) {
          this.isPaused = true;
          this.player.pause();
        }

        playerObj.audResume = function (blockId, ftnIdx) {
          this.isPaused = false;
          this.player.resume();
        }

        playerObj.audStop = function (blockId, ftnIdx) {
          this.player.pause();
          parent.audFootnoteCleanClasses(this.isStarted);
          this.isStarted = false;
          this.isPaused = false;
        }

        playerObj.player = new ReadAlong({
            forceLineScroll: false
        },{
          on_start:   ()=>{},
          on_pause:   ()=>{},
          on_resume:  ()=>{},
          on_complete:()=>{
            playerObj.isStarted = false;
            playerObj.isPaused = false;
            parent.audFootnoteCleanClasses(playerObj.isStarted);
          }
        });

        parent.$root.$on('playBlockFootnote', (ftnId)=>{
          if (playerObj.isStarted !== ftnId) {
            if (playerObj.player) {
              playerObj.player.pause();
              parent.audFootnoteCleanClasses(playerObj.isStarted);
              playerObj.isStarted = false;
              playerObj.isPaused = false;
            }
          }
        });
        parent.$root.$on('playBlock', (blockid)=>{
          if (playerObj.player) {
            playerObj.player.pause();
            parent.audFootnoteCleanClasses(playerObj.isStarted);
            playerObj.isStarted = false;
            playerObj.isPaused = false;
          }
        });
      },
      initPlayer() {
        this.player = new ReadAlong({
            forceLineScroll: false
        },{
            on_start: ()=>{
                this.isAudStarted = true;
                this.isAudPaused = false;
                this.$root.$emit('playBlock', this.block._id);
                this.$root.$emit('playBlockFootnote', false);
            },
            on_pause: ()=>{
                this.isAudPaused = true;
            },
            on_resume: ()=>{
                this.isAudPaused = false;
                this.$root.$emit('playBlock', this.block._id);
            },
            on_complete: ()=>{
                this.isAudStarted = false;
                this.isAudPaused = false;
                this.audCleanClasses(this.block._id, {});
                if (!this.isAudPartStarted) {
                  this.$emit('partAudioComplete', this.blockPartIdx);
                }
            }
        });
        var self = this;
        this.$root.$on('playBlock', function(blockid) {
          if (blockid !== self.block._id) {
            if (self.player) {
              self.audStop();
            }
          }
        });
      },
      reRecord() {
        this._markSelection();
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
        let startRange = this._getClosestAligned(startElement, 0);
        if (!startRange) {
          startRange = [0, 0];
        }
        let endRange = this._getClosestAligned(endElement, 1);
        if (!endRange) {
          endRange = this._getClosestAligned(endElement, 0);
          if (!endRange) {
            endRange = [0, 0];
          }
        }
        this.reRecordPosition = [parseInt(startRange[0]), parseInt(endRange[0]) + parseInt(endRange[1])];
        //console.log(this.reRecordPosition, this.blockAudio.map.replace(/"/g, '\\"'));
        this.startRecording();
      },
      insertBlockBefore() {
        this.$emit('insertBefore', this.block, this.blockId);
      },
      insertBlockAfter() {
        this.$emit('insertAfter', this.block, this.blockId);
      },
      deleteBlock() {
        if (!this.blockReindexProcess) {
          this.deletePending = false;
          this.hideModal('delete-block-message');
          this.isSaving = true;
          this.$emit('deleteBlock', this.block, this.blockId);
        } else {
          this.deletePending = true;
        }
      },
      showModal(name) {
        this.$modal.show(name + this.block._id);
      },
      hideModal(name) {
        this.$modal.hide(name + this.block._id);
      },
      setChanged(val, type = null, event = null) {
        //console.log('setChanged', val);
        this.isChanged = val;
        if (val && type) {
          this.pushChange(type);
          if (this.block) {
            this.block.classes = {};
            //this.block.secnum = false;
            //this.block.parnum = false;
          }
          this.$root.$emit('from-block-edit:set-style');
          if (type === 'type' && event && event.target) {
            if (['hr', 'illustration'].indexOf(event.target.value) !== -1) {
              this.block.voicework = 'no_audio';
              this.block.setAudiosrc('');
              this.block.setContent('');
              this.refreshBlockAudio();
              this.pushChange('voicework');
              this.pushChange('content');
              this.pushChange('audiosrc');
              this.pushChange('audiosrc_ver');
            }
            if (event.target.value === 'illustration') {
              let i = setInterval(() => {
                if (this.$refs.blockDescription) {
                  this.initEditor();
                  clearInterval(i);
                }
              }, 500);
            }
          }
        }
      },
      setChangedByClass(val) {
        //console.log('setChangedByClass', this.block.type, val);
        if (this.block.type === 'title') {
          this.isChanged = val;
          this.pushChange('class');
        }
      },
      joinWithPrevious() {
        this.joinBlocks(this.block, this.blockId, 'previous')
        .then(()=>{})
        .catch(()=>{})
      },
      joinWithNext() {
        this.joinBlocks(this.block, this.blockId, 'next')
        .then(()=>{})
        .catch(()=>{})
      },
      showAudioEditor(footnoteIdx = null, footnote = null) {
        //$('.table-body.-content').removeClass('editing');
        //$('#' + this.block._id + ' .table-body.-content').addClass('editing');
        if (!footnoteIdx) {
          this.isAudioEditing = true;
          if (this.isAudioChanged) {
            this.discardAudio();
          }
        }
        this.footnoteIdx = footnoteIdx;
        this.check_id = this.generateAudioCheckId();
        this.audioEditorEventsOff();


        Vue.nextTick(() => {
          let audiosrc = this.blockAudio.src;
          let text = this.blockAudio.map;
          let loadBlock = this.blockPart;
          loadBlock._id = this.check_id;
          this.$root.$emit('for-audioeditor:load-and-play', audiosrc, text, loadBlock);

          this.audioEditorEventsOn();
        });
      },

      //-- Events -- { --//
      evFromAudioeditorClosed(blockId) {

        if (blockId === this.check_id) {
          this.isAudioEditing = false;
          if (this.isAudioChanged) {
            this.discardAudioEdit(this.footnoteIdx, false)
              .then(() => {
                this.isAudioChanged = false;
                this.isChanged = false;
                this.unsetChange('audio');
                this.unsetChange('content');

                this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
              });
          }
          //$('nav.fixed-bottom').addClass('hidden');

          this.$refs.viewBlock.querySelector(`.table-body.-content`).classList.remove('editing');
          //$('#' + this.block._id + ' .table-body.-content').removeClass('editing');
          //this.check_id = null;
          this.audioEditorEventsOff();
        }

        console.log('stop events', this.block._id);

      },
      evFromAudioeditorBlockLoaded(blockId) {
        if (blockId == this.check_id) {
          $('nav.fixed-bottom').removeClass('hidden');
        }
      },
      evFromAudioeditorWordRealign(map, blockId) {
        if (blockId == this.check_id) {
          this.audStop();
          //console.log('from-audioeditor:word-realign', this.$refs.blockContent.querySelectorAll('[data-map]').length, map.length);
          if (this.$refs.blockContent && this.$refs.blockContent.querySelectorAll) {
            let manual_boundaries = this.blockPart.manual_boundaries || [];
            this.$refs.blockContent.querySelectorAll('[data-map]').forEach(_w => {
              if ($(_w).attr('data-map') && $(_w).attr('data-map').length) {
                let _m = map.shift();
                if (_m) {
                  let w_map = _m.join()
                  let currentMap = $(_w).attr('data-map').split(',');
                  currentMap[0] = parseInt(currentMap[0]);
                  currentMap[1] = parseInt(currentMap[1]);
                  if (currentMap[0] != _m[0] && manual_boundaries.indexOf(_m[0]) == -1) {
                    if (manual_boundaries.indexOf(currentMap[0]) !== -1) {
                      manual_boundaries.splice(manual_boundaries.indexOf(currentMap[0]), 1);
                    }
                    manual_boundaries.push(_m[0]);
                  }
                  if (currentMap[0] + currentMap[1] != _m[0] + _m[1] && manual_boundaries.indexOf(_m[0] + _m[1]) == -1) {
                    if (manual_boundaries.indexOf(currentMap[0] + currentMap[1]) !== -1) {
                      manual_boundaries.splice(manual_boundaries.indexOf(currentMap[0] + currentMap[1]), 1);
                    }
                    manual_boundaries.push(_m[0] + _m[1]);
                  }
                  $(_w).attr('data-map', w_map)
                }
              }
            });
            /*this.blockPart.manual_boundaries = manual_boundaries;
            this.blockPart.content = this.$refs.blockContent.innerHTML;
            this.block.setPartManualBoundaries(this.blockPartIdx, manual_boundaries);
            this.blockAudio.map = this.blockPart.content;
            this.block.setPartContent(this.blockPartIdx, this.blockPart.content);
            if (!this.isSplittedBlock) {
              this.block.setManualBoundaries(manual_boundaries);
              this.block.setContent(this.blockPart.content);
              this.$parent.refreshBlockAudio();
            }
            this.$root.$emit('for-audioeditor:reload-text', this.$refs.blockContent.innerHTML, this.blockPart);*/
            this.blockPart.manual_boundaries = manual_boundaries;
            this.block.setPartManualBoundaries(this.blockPartIdx, manual_boundaries);
            this.$root.$emit('for-audioeditor:reload-text', this.$refs.blockContent.innerHTML, this.blockPart);
            this.blockPart.content = this.$refs.blockContent.innerHTML;
            this.blockAudio.map = this.blockPart.content;
            this.block.setPartContent(this.blockPartIdx, this.blockPart.content);
            this.block.setPartAudiosrc(this.blockPartIdx, this.blockAudiosrc(null, false), this.blockAudiosrc('m4a', false));
            //this.pushChange('content');
          }
        }
        this.isAudioChanged = true;
      },
      evFromAudioeditorSaveAndRealign (blockId, check_realign = true, realign = false) {
        if (blockId == this.check_id) {
          this.audStop();
          if (!this.isSplittedBlock) {
            //this.block.setAudiosrc(this.blockAudiosrc(null, false));
            this.block.setAudiosrc(this.block.getPartAudiosrc(this.blockPartIdx, null, false));
            this.block.setContent(this.blockAudio.map);
            return this.assembleBlockAudioEdit(null, true);
          } else {
            this.assembleBlockPartAudioEdit(true);
          }
        }
      },
      evFromAudioeditorCut (blockId, start, end) {
        if (blockId == this.check_id) {
          this.audStop();
          this.isAudioChanged = true;
          this.isUpdating = true;
          this.audDeletePart(start, end, null, this.blockPartIdx, this.check_id)
            .then(() => {
              this.isUpdating = false;
            })
            .catch(err => {
              this.isUpdating = false;
            });
        }
      },
      evFromAudioeditorSave (blockId) {
        if (blockId == this.check_id) {
          this.audStop();
          if (!this.isSplittedBlock) {
            //this.block.setAudiosrc(this.blockAudiosrc(null, false));
            this.block.setAudiosrc(this.block.getPartAudiosrc(this.blockPartIdx, null, false));
            this.block.setContent(this.blockContent());
            //this.block.setContent(this.blockContent());
            return this.assembleBlockAudioEdit(null, false);
          } else {
            this.assembleBlockPartAudioEdit(false);
          }
        }
      },
      evFromAudioeditorInsertSilence (blockId, position, length) {
        if (blockId == this.check_id) {
          this.audStop();
          this.isUpdating = true;
          this.insertSilence(position, length, null, this.blockPartIdx, this.check_id)
            .then(() => {
              this.isUpdating = false;
              this.isAudioChanged = true;
            });
        }
      },
      evFromAudioeditorUndo (blockId, audio, text, isModified) {
        if (blockId == this.check_id) {
          this.audStop();
          if (this.isSplittedBlock) {
            this.block.undoPartContent(this.blockPartIdx);
            this.block.undoPartAudiosrc(this.blockPartIdx);
          } else {
            this.block.undoContent();
            this.block.undoAudiosrc();
          }
          this.blockAudio.map = this.blockContent();
          this.blockAudio.src = this.blockAudiosrc('m4a');
          this.block.undoManualBoundaries();
          this.isAudioChanged = isModified;
          if (!isModified) {
            this.unsetChange('audio');
            this.unsetChange('content');
          }
        }
      },
      evFromAudioeditorDiscard (blockId) {
        if (blockId == this.check_id) {
          this.audStop();
          this.discardAudioEdit(null, true, this.blockPartIdx, this.check_id)
            .then(() => {

                this.isAudioChanged = false;
                this.isChanged = false;
                this.unsetChange('audio');
                this.unsetChange('content');
                this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
            });
        }
      },
      evFromAudioeditorSelect (blockId, start, end) {
        if (blockId == this.check_id) {
          if (start !== this.audioSelectPos.start || end !== this.audioSelectPos.end) {
            let ref;
            if (this.footnoteIdx !== null) {
              ref = this.$refs['footnoteContent_' + this.footnoteIdx];
              if (ref) {
                ref = ref[0];
              }
            } else {
              if (this.$refs.blockContent) {
                ref = this.$refs.blockContent;
              }
            }
            if (ref && ref.querySelectorAll) {
              let startInt = parseInt(start * 1000);
              let endInt = parseInt(end * 1000);
              //console.log('evFromAudioeditorSelect', startInt, endInt);
              ref.querySelectorAll('w').forEach(e => {
                let map = $(e).attr('data-map');
                if(map) {
                  map = map.split(',');
                  if (map.length == 2) {
                    map[0] = parseInt(map[0]);
                    map[1] = map[0] + parseInt(map[1]);
                    if ((map[0] >= startInt && map[0] < endInt) ||
                            (map[0] < startInt && map[1] > startInt)) {
                       $(e).addClass('selected');
                    } else {
                      $(e).removeClass('selected');
                    }
                  }
                }
              });
            }
            this.audioSelectPos.start = start;
            this.audioSelectPos.end = end;
          }
        }
      },
      audioEditorEventsOn() {
        this.$root.$on('from-audioeditor:block-loaded', this.evFromAudioeditorBlockLoaded);
        this.$root.$on('from-audioeditor:word-realign', this.evFromAudioeditorWordRealign);
        this.$root.$on('from-audioeditor:save', this.evFromAudioeditorSave);
        this.$root.$on('from-audioeditor:save-and-realign', this.evFromAudioeditorSaveAndRealign);
        this.$root.$on('from-audioeditor:cut', this.evFromAudioeditorCut);
        this.$root.$on('from-audioeditor:insert-silence', this.evFromAudioeditorInsertSilence);
        this.$root.$on('from-audioeditor:undo', this.evFromAudioeditorUndo);
        this.$root.$on('from-audioeditor:discard', this.evFromAudioeditorDiscard);
        this.$root.$on('from-audioeditor:select', this.evFromAudioeditorSelect);

        this.$root.$on('from-audioeditor:closed', this.evFromAudioeditorClosed);
      },
      audioEditorEventsOff() {
        this.$root.$off('from-audioeditor:block-loaded', this.evFromAudioeditorBlockLoaded);
        this.$root.$off('from-audioeditor:word-realign', this.evFromAudioeditorWordRealign);
        this.$root.$off('from-audioeditor:save-and-realign', this.evFromAudioeditorSaveAndRealign);
        this.$root.$off('from-audioeditor:save', this.evFromAudioeditorSave);
        this.$root.$off('from-audioeditor:cut', this.evFromAudioeditorCut);
        this.$root.$off('from-audioeditor:insert-silence', this.evFromAudioeditorInsertSilence);
        this.$root.$off('from-audioeditor:undo', this.evFromAudioeditorUndo);
        this.$root.$off('from-audioeditor:discard', this.evFromAudioeditorDiscard);
        this.$root.$off('from-audioeditor:select', this.evFromAudioeditorSelect);
        this.$root.$off('from-audioeditor:closed', this.evFromAudioeditorClosed);
      },
      //-- } -- end -- Events --//

      _getParent(node, tag) {
        if (node.localName == tag) {
          return node;
        }
        let parent = false;
        do {
          parent = parent === false ? node.parentElement : parent.parentElement;
          if (parent && parent.localName == tag) {
            return parent;
          }
        } while(parent);
        return null;
      },
      _getClosestAligned(node, direction) {
        if (!node) {
          return null;
        }
        if (node.dataset && node.dataset.map) {
          let splitted = node.dataset.map.split(',');
          if (splitted.length == 2) {
            splitted[0] = parseInt(splitted[0]);
            splitted[1] = parseInt(splitted[1]);
            return splitted;
          }
        }
        let sibling = false;
        if (direction > 0) {
          sibling = node.nextSibling ? node.nextSibling : null;
        } else {
          sibling = node.previousSibling ? node.previousSibling : null;
        }
        while (sibling) {
          if (sibling.dataset && sibling.dataset.map) {
            let splitted = sibling.dataset.map.split(',');
            if (splitted.length == 2) {
              splitted[0] = parseInt(splitted[0]);
              splitted[1] = parseInt(splitted[1]);
              return splitted;
            }
          }
          if (direction > 0) {
            sibling = sibling.nextSibling ? sibling.nextSibling : null;
          } else {
            sibling = sibling.previousSibling ? sibling.previousSibling : null;
          }
        }
        return null;
      },
      _markSelection() {
        let startElement = this._getParent(this.range.startContainer, 'w');
        let endElement = this._getParent(this.range.endContainer, 'w');
        if (startElement && endElement) {
          startElement.classList.add('audio-highlight');
          let next = false;
          do {
            next = next ? next.nextSibling : startElement.nextSibling;
            if (next) {
              next.classList.add('audio-highlight');
            }
          } while (next && next !== endElement);
        }
      },
      uploadIllustration(event) {
        let formData = new FormData();
        formData.append('illustration', this.$refs.illustrationInput.file, this.$refs.illustrationInput.file.name);
        formData.append('block', JSON.stringify({'description': this.$refs.blockDescription.innerHTML}));
        let api = this.$store.state.auth.getHttp()
        let api_url = this.API_URL + 'book/block/' + this.block.blockid + '/image';

        api.post(api_url, formData, {}).then((response) => {
          if (response.status===200) {
            if (this.isCompleted) {
              this.tc_loadBookTask();
              this.getCurrentJobInfo();
            }
            // hide modal after one second
            this.$refs.illustrationInput.removeImage();
            this.$emit('blockUpdated', this.block._id);
            //let offset = document.getElementById(self.block._id).getBoundingClientRect()
            //window.scrollTo(0, window.pageYOffset + offset.top);
            this.isIllustrationChanged = false;
            this.isChanged = false;
            this.block.isIllustrationChanged = false;
            this.block.isChanged = false;
            this.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
            //if (self.editor) {
              //self.editor.destroy();
            //}
            $('[id="' + this.block._id + '"] .illustration-block')
              .removeAttr('contenteditable')
              .removeAttr('data-placeholder');
          } else {

          }

          //if (this.blockO.type !== this.block.type) {
            this.blockO.status = Object.assign(this.blockO.status, {
              marked: this.block.markedAsDone,
              assignee: this.block.status.assignee,
              proofed: this.block.status.proofed,
              stage: this.block.status.stage
            })
            let upd = {
              rid: this.blockO.rid,
              type: this.block.type,
              status: this.blockO.status
            }
            this.putBlockO(upd).then(()=>{
              this.putNumBlockO({
                bookId: this.block.bookid,
                rid: this.blockO.rid,
                type: this.block.type,
                secnum: '',
                parnum: ''
              }).then((blocks)=>{
                //console.log('assembleBlock putNumBlockO', blocks[0]);
                //this.storeListO.updBlockByRid(this.blockO.rid, {
                //  type: this.block.type
                //})
              });
            });
          //}
        }).catch((err) => {
          console.log(err)
        });
      },
      onIllustrationChange() {
        //console.log(arguments, this.$refs.illustrationInput.image);
        if (this.$refs.illustrationInput && this.$refs.illustrationInput.image) {

          this.isIllustrationChanged = true;
          Vue.nextTick(() => {
            $('[id="' + this.block._id + '"] .drag-uploader').removeClass('no-picture');
          });
        } else {

          this.isIllustrationChanged = false;
          Vue.nextTick(() => {
            $('[id="' + this.block._id + '"] .drag-uploader').addClass('no-picture');
          });
        }
      },
      setRangeSelection(type, ev) {
        this.$emit('setRangeSelection', type, ev);
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },

      setSecnumHidden() {
        this.block.secHide = !this.block.secHide;
        this.putBlockPart({block: this.block, field: 'secHide'}).then(()=>{});
      },
      pushChange(change) {
        if (this.changes.indexOf(change) === -1) {
          this.changes.push(change);
          if (!this.isSplittedBlock) {
            this.$emit('hasChanges', change);
          }
        }
      },
      flushChanges() {
        this.changes = [];
        if (this.$refs.blockFlagPopup) {
          this.$refs.blockFlagPopup.close();
        }
      },
      hasChange(change) {
        return this.changes && this.changes.indexOf(change) !== -1;
      },
      unsetChange(change) {
        let index = this.changes.indexOf(change);
        if (index !== -1) {
          this.changes.splice(index, 1);
          this.$emit('hasChanges', change, false);
        }
      },
      setHtml() {
        if (this.$refs.blockContent) {
          this.$refs['block-html' + this.block._id].value = this.$refs.blockContent.innerHTML;
        }
      },
      setContent() {
        //console.log('value', this.$refs['block-html' + this.block._id].value)
        this.block.content = this.$refs['block-html' + this.block._id].value;
        this.$refs.blockContent.innerHTML = this.block.content;
        this.isChanged = true;
        this.pushChange('content');
        this.hideModal('block-html');
      },

      addContentListeners() {
        let handler = (id, ref) => {
          if (window.getSelection) {
            //let content = this.range.extractContents();
            let range = window.getSelection().getRangeAt(0).cloneRange();
            //console.log(this.range, window.getSelection(), range)
            let startElement = this._getParent(range.startContainer, 'w');
            let endElement = this._getParent(range.endContainer, 'w');
            let startRange = this._getClosestAligned(startElement, 1);
            if (!startRange) {
              startRange = [0, 0];
            }
            let endRange = this._getClosestAligned(endElement, 0);
            if (!endRange) {
              endRange = this._getClosestAligned(endElement, 1)
            }
            if (startRange && endRange) {
              //console.log(startRange[0], endRange[0] + endRange[1])
              this.$root.$emit('for-audioeditor:select', this.check_id, startRange[0], endRange[0] + endRange[1], startElement === endElement ? startElement : null);
            }
            //console.log(startElement, endElement, startRange, endRange)
          }

          if (ref && ref.querySelectorAll) {
            ref.querySelectorAll('w').forEach(e => {
              $(e).removeClass('selected');
            });
          }
        }
        if (this.$refs.blockContent) {
          this.$refs.blockContent.addEventListener("mouseup", () => {
            //console.log('Selection changed.');
            handler(this.block._id, this.$refs.blockContent);
          });
          this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
            flag.addEventListener('click', this.handleFlagClick);
          });
        }
        if (this.mode !== 'narrate') {
          if (this.block && this.block.footnotes) {
            for (let i in this.block.footnotes) {
              let ref = this.$refs['footnoteContent_' + i];
              if (ref && ref[0]) {
                ref = ref[0];
                ref.addEventListener("mouseup", () => {
                  //console.log('Selection changed.');
                  handler(this.block._id + '_' + i, ref);
                });
              }
            }
          }
        }
        this.hasContentListeners = true;
      },
      _handleSpacePress(e) {
        if (e) {
          if (e.charCode == 32 && this.isRecording) {
            if (!this.isRecordingPaused) {
              this.pauseRecording();
            } else {
              this.resumeRecording();
            }
          }
          if (e.charCode == 32 && this.isAudStarted) {
            if (!this.isAudPaused) {
              this.audPause();
            } else {
              this.audResume();
            }
          }
        }
      },
      _saveContent() {
        if (this.$refs.blockContent && this.isSplittedBlock && Array.isArray(this.block.parts) && this.block.parts[this.blockPartIdx]) {
          this.block.parts[this.blockPartIdx].content = this.$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
          this.block.parts[this.blockPartIdx].content = this.block.parts[this.blockPartIdx].content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
        }
      },
      refreshBlockAudio: function(map = true, src = true) {
        if (this.blockPart) {
          //if (!this.isSplittedBlock) {
            //this.blockPart.content = this.block.content;
          //}
          if (map) {
            this.blockAudio.map = this.blockPart.content;
          }
          if (src) {
            this.blockAudio.src = this.blockAudiosrc('m4a');
          }
        }
      },
      setClasses: function(classes) {
        if (this.block) {
          this.$forceUpdate();
          this.pushChange('classes');
        }
      },
      generateAudioCheckId() {
        return this.isSplittedBlock ? this.block.blockid + '-part-' + this.blockPartIdx : this.block.blockid;
      },
      assembleBlockPartAudioEdit(realign) {
        let api_url = this.API_URL + 'book/block/' + this.block.blockid + '/audio_edit/part/' + this.blockPartIdx;
        let api = this.$store.state.auth.getHttp();
        let data = {
          audiosrc: this.blockAudiosrc(null, false),
          content: this.blockAudio.map,//content: this.blockContent(),
          manual_boundaries: this.blockPart.manual_boundaries || [],
          mode: this.mode
        };
        this.isSaving = true;
        if (realign) {
          api_url+= '?realign=true';
        }
        return api.post(api_url, data, {})
          .then(response => {
            if (!realign) {
              this.isSaving = false;
            } else {
              this.getBookAlign()
                .then(() => {
                  this.$root.$emit('for-audioeditor:set-process-run', true, 'align');
                  this.isSaving = false;
                })
            }
            if (response.status == 200) {
              if (this.isCompleted) {
                this.tc_loadBookTask();
              }
              this.getCurrentJobInfo();

              if (this.block.status.marked != response.data.status.marked) {
                this.block.status.marked = response.data.status.marked;
              }
              let part = response.data.parts[this.blockPartIdx];
              this.block.setPartContent(this.blockPartIdx, part.content);
              this.block.setPartAudiosrc(this.blockPartIdx, part.audiosrc, part.audiosrc_ver);
              this.block.setPartManualBoundaries(this.blockPartIdx, part.manual_boundaries || []);
              //return this.putBlock(this.block);
              if (!realign) {
                this.$root.$emit('for-audioeditor:load',
                this.blockAudiosrc('m4a'),
                this.block.getPartContent(this.blockPartIdx), false);
              }
              this.isAudioChanged = false;
              this.isChanged = false;
              this.block.isAudioChanged = false;
              this.block.isChanged = false;
              return BPromise.resolve();
            }
          })
          .catch(err => {
            this.isSaving = false;
            this.checkError(err);
            BPromise.reject(err)
          });
      },

      blockAudiosrc(ver = null, full = true) {
        if (this.isSplittedBlock) {
          return this.block.getPartAudiosrc(this.blockPartIdx, ver, full);
        } else {
          return this.block.getAudiosrc(ver, full);
        }
      },
      blockContent() {
        if (this.isSplittedBlock) {
          return this.block.getPartContent(this.blockPartIdx);
        } else {
          return this.block.content;
        }
      }

  },
  watch: {
      'blockPart.content': {
        handler(val) {
          this.refreshBlockAudio(!(this.isChanged || this.isAudioChanged || this.isIllustrationChanged));

          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });
        }
      },
      'hasLock': {
        handler(val) {
          if (!val) {
            if (this.isAudioEditing) {
              if (this.check_id === this.generateAudioCheckId()) {
                this.refreshBlockAudio();
                this.showAudioEditor();
              }
            }
          }

        }
      },
      'classSel' (newVal, oldVal) {
        let styleCurr = this.block.setClass(newVal);
        if (styleCurr) this.styleSel = styleCurr;
        else this.styleSel = '';
      },
      'styleSel' (newVal, oldVal) {
        //console.log('styleSel');
        this.block.setClassStyle(this.classSel, newVal);
        this.$root.$emit('from-block-edit:set-style');
        //this.addContentListeners();
        //this.destroyEditor()
        //this.initEditor();
      },
      'blockAudio.src' (newVal) {
        if (newVal) {
          //console.log('Book audio', newVal, this.block._id);
          if (!this.player) {
            this.initPlayer();
          }
          if (newVal.indexOf('?') === -1) {
            this.blockAudio.src+= '?' + (new Date()).toJSON();
          }
          if (this.tc_showBlockNarrate(this.block._id) || this.isEditor) {
            /*let isChanged = newVal && this.block.audiosrc != newVal.split('?').shift() && !(this.block.audiosrc && this.block.audiosrc.indexOf('_tmp.') !== -1 && newVal.indexOf('_tmp.') === -1);
            if (!this.isAudioEditing) {
              this.isAudioChanged = isChanged;
            }
            if (isChanged) {
              this.infoMessage = 'Audio updated';
            }*/
          }
        }
      },
      'isChanged' : {
        handler(val) {
          if (val === false) {
            this.flushChanges();
          }
          if (!this.isSplittedBlock) {
            this.block.isChanged = val;
          } else {
            if (this.block.parts[this.blockPartIdx]) {
              this.block.parts[this.blockPartIdx].isChanged = val;
            }
          }
          this.recountApprovedInRange();
        }
      },
      'isAudioChanged': {
        handler(val) {
          /*if (val) {
            this.pushChange('audio');  //TODO ask !
            //this.voiceworkSel('audio');
          } else {
            this.unsetChange('audio');
          }*/
          if (!this.isSplittedBlock) {
            this.block.isAudioChanged = val;
            this.$emit('isAudioChanged', val);
          } else {
            if (this.block.parts[this.blockPartIdx]) {
              this.block.parts[this.blockPartIdx].isAudioChanged = val;
            }
          }
        }
      },
      'isIllustrationChanged': {
        handler(val) {
          if (val) {
            this.pushChange('illustration');
          } else {
            this.unsetChange('illustration');
          }
          this.block.isIllustrationChanged = val;
        }
      },
      'allowEditing': {
        handler(newVal, oldVal) {
          // because after page loaded tasks may be late
          if (newVal === true) {
            if (!this.editor || !this.editor.isActive) {
              this.initEditor();
            }
          }
          else {
            this.destroyEditor();
          }
        }
      },
      'mode': {
        handler(val, oldVal) {
          //if (val === 'narrate') {
            //this.destroyEditor();
          this.discardBlock();
          if (this.block.voicework === 'narration') {
            if ((oldVal === 'narrate' && val === 'edit') || (oldVal === 'edit' && val === 'narrate')) {
              this.destroyEditor();
              this.initEditor(true);
            }
          }
          if (this.isRecording) {
            this.cancelRecording();
          }
        }
      },
      'isAudStarted': {
        handler(val) {
          if (this.mode === 'narrate') {
            if (val === true) {
              $('body').off('keypress', this._handleSpacePress);
              $('body').on('keypress', this._handleSpacePress);
            } else {
              $('body').off('keypress', this._handleSpacePress);
            }
          }
        }
      },
      'approveWaiting': {
        handler(val) {
          //console.log(this.block._id, 'approveWaiting', val);
        }
      },
      /*'hasChanges' :{
        handler(val) {
          if (!this.isSplittedBlock) {
            this.$emit('hasChanges', val);
          }
        }
      }*/
      'isAudioEditing':  {
        handler(val) {
          if (!this.isSplittedBlock) {
            this.$emit('isAudioEditing', val)
          }
        }
      }
  }
}
</script>

<style lang='less'>



</style>
