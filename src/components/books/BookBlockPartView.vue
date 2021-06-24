<template>
<div>

  <div ref="viewBlock" :id="block.blockid + '-' + blockPartIdx"
    :class="['table-body -block -subblock block-preview', blockOutPaddings]">
    <div v-if="isLocked" :class="['locked-block-cover', 'content-process-run', 'preloader-' + lockedType]"></div>
    <div class="table-cell controls-left sub-parnum" v-if="mode === 'narrate'">
      <div class="table-row">
        <div class="table-cell">
          <span v-if="parnumComp.length" :class="[{'sub-parnum-main': !isSplittedBlock}]">{{parnumComp}}</span>
        </div>
      </div>
    </div>
    <div class="table-cell" :class="{'completed': isCompleted}">
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
                      <i class="fa fa-pencil" v-on:click="showAudioEditor()" v-if="tc_showBlockAudioEdit(block, blockPart) && !isUpdating && mode === 'edit'"></i>
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
              <div class="table-cell controls-left audio-controls" v-if="mode === 'narrate'">
                <div class="table-body">
                  <div class="table-row">
                    <div class="table-cell -hidden-subblock" v-if="tc_showBlockAudioEdit(block, blockPart) && !isAudioChanged">
                      <i class="fa fa-pencil" v-on:click="showAudioEditor()"></i>
                    </div>
                    <template v-if="tc_showBlockNarrate(block, blockPart) && !isAudStarted">
                      <div class="table-cell -hidden-subblock">
                        <i class="fa fa-microphone" v-if="!isChanged" @click="_startRecording(true)"></i>
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
              <div class="table-cell -content-wrapper"  :forced_bind="blockPart.blockId" :class="[{'__unsave': !((!this.$parent.isChanged && !isChanged) && (!this.$parent.isAudioChanged || this.$parent.isAudioEditing) && !this.$parent.isIllustrationChanged)}]">
                <hr v-if="block.type=='hr'"
                  :class="[block.getClass(mode), {'checked': blockO.checked}]"
                  @click="onClick($event)"/>
                <div
                  v-else-if="block.type == 'illustration'"
                  :class="['table-body illustration-block', block.getClass(mode), {'checked': blockO.checked}]"
                  @click="onClick($event)"
                >
                  <img
                    v-if="block.illustration && !allowEditing"
                    :src="block.getIllustration()"
                    :height="illustrationHeight"
                  />
                    <UploadImage
                      v-if="allowEditing && !proofreadModeReadOnly"
                      :id="block._id"
                      :value="block.getIllustration()"
                      :height="+block.illustration_height"
                      :width="+block.illustration_width"
                      @input="onIllustrationChange"
                    />

                    <!-- <div class="save-illustration" v-if="isIllustrationChanged">
                      <button class="btn btn-default" @click="uploadIllustration">Save picture</button>
                    </div> -->

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
                  @contextmenu.prevent.stop="onContext"
                  @focusout="onFocusout"
                  @inputSuggestion="onInputSuggestion">
                </div>

                <div :class="['table-row content-description', block.getClass(mode), {'hidden': block.type !== 'illustration'}]" @click="onClick($event)">
                  <div class="content-wrap-desc description"
                    ref="blockDescription"
                    @input="commitDescription($event)"
                    v-html="block.description"
                    @contextmenu.prevent.stop="onContext">
                  </div>
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
                      v-if="_is('proofer', true) && part.status == 'resolved' && !isCompleted && !editingLocked"
                      @click.prevent="hideFlagPart($event, partIdx)">
                      Archive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="_is('proofer', true) && part.status == 'hidden' && (!isCompleted || isProofreadUnassigned()) && !editingLocked"
                      @click.prevent="unHideFlagPart($event, partIdx)">
                      Unarchive flag</a>

                    <a href="#" class="flag-control -right -top"
                      v-if="canDeleteFlagPart(part) && part.status == 'open'"
                      @click.prevent="_delFlagPart($event, partIdx)">
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
                      :disabled="!canCommentFlagPart(part) || (isCompleted && !isProofreadUnassigned() && !tc_allowNarrateUnassigned(block))">
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

                    <a v-if="canResolveFlagPart(part) && part.status == 'open' && !part.collapsed && (!isCompleted || isProofreadUnassigned() || tc_allowNarrateUnassigned(block))"
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
                  <template v-if="isFootnoteAllowed() && !this.proofreadModeReadOnly">
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
                  <template v-if="isSplitPointAllowed()">
                    <li class="separator"></li>
                    <li @click="setSplitPoint($event)">Set split point</li>
                  </template>
                  <!--<li @click="test">test</li>-->
                </block-cntx-menu>
                <split-pin-cntx-menu
                  ref="splitPinCntx"
                  dir="bottom"
                  @close="splitPinCntxClose">
                  <li @click="delSplitPoint">Delete split point</li>
                </split-pin-cntx-menu>
              </div>
            </div>
            <!--<div class="table-row ilm-block">-->
        </div>
        <!--<div :class="['table-body', '-content',-->
    </div>
    <!--<div :class="['table-cell'-->
  </div>
  <div class="table-body">
    <div class="table-row controls-bottom" v-if="isSplittedBlock">
      <div class="controls-bottom-wrapper">
        <div class="par-ctrl -hidden -left" v-if="isMergeSubblocksAllowed">
          <div class="merge-subblocks" @click="mergeSubblocks()"></div>
          <!-- <object type="image/svg+xml" data="/static/merge-blocks.svg" style="width: 25px; height: 25px;"></object> -->
        </div>
        <div class="par-ctrl -hidden -right">
          <div class="save-block -right" @click="discardBlock"
               v-bind:class="{'-disabled': !((allowEditing || isProofreadUnassigned) && (isChanged || isIllustrationChanged)) || isLocked}">
            Discard
          </div>
          <div class="save-block -right"
          v-bind:class="{ '-disabled': ((!isChanged && (!isAudioChanged || isAudioEditing) && !isIllustrationChanged)) || isLocked }"
          @click="assembleBlockProxy(true, needsRealignment)">
            {{saveBlockLabel}}
          </div>
        </div>
        <!--<div class="-hidden">-->
      </div>
    </div>
    <!--<div class="table-row controls-bottom">-->
  </div>
</div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import { mapGetters, mapActions, mapMutations }    from 'vuex'
import {  QuoteButton, QuotePreview,
          SuggestButton, SuggestPreview, MediumEditor
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
import RecordingBlock from './block/RecordingBlock';
import UploadImage from './block/UploadImage'
var BPromise = require('bluebird');
import narrationBlockContent from './narrationBlockContent.js'

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
      //isAudioChanged: false,
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
      voiceworkUpdating: false,
      changes: [],
      deletePending: false,
      audioEditFootnote: {footnote: {}, isAudioChanged: false},
      check_id: null,
      footnoteIdx: null,
      //isSaving: false,
      splitPinSelection: null,
      editingLocked: false,
      pinUpdated: null
    }
  },
  components: {
    UploadImage,
      'block-menu': BlockMenu,
      'block-cntx-menu': BlockContextMenu,
      'block-flag-popup': BlockFlagPopup,
      //'modal': modal,
      'split-pin-cntx-menu': BlockContextMenu
  },
  props: ['block', 'blockO', 'putBlockO', 'putNumBlockO', 'putBlock', 'putBlockPart', 'getBlock',  'recorder', 'blockId', 'audioEditor', 'joinBlocks', 'blockReindexProcess', 'getBloksUntil', 'allowSetStart', 'allowSetEnd', 'prevId', 'putBlockProofread', 'putBlockNarrate', 'blockPart', 'blockPartIdx', 'isSplittedBlock', 'parnum', 'assembleBlockAudioEdit', 'discardAudioEdit', 'startRecording', 'stopRecording', 'delFlagPart', 'initRecorder', 'saveBlockPart', 'isCanReopen', 'isCompleted', 'checkAllowNarrateUnassigned', 'addToQueueBlockAudioEdit', 'splitPointAdded'],
  mixins: [taskControls, apiConfig, access],
  computed: {
      isLocked: {
        get () {
          if (!this.isSplittedBlock) {
            return false;
          }
          if (this.isSaving) {
            return true;
          }
          if (this.isUpdating) {
            return true;
          }
          if (this.audioTasksQueue.block.blockId === this.block.blockid && this.blockPartIdx === this.audioTasksQueue.block.partIdx && this.audioTasksQueue.running) {
            return true;
          }
          return this.block ? this.isBlockLocked(this.block.blockid, this.isSplittedBlock ? this.blockPartIdx : null) : false;
        },
        cache: false
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
          if (this.audioTasksQueue.block.blockId === this.block.blockid && this.blockPartIdx === this.audioTasksQueue.block.partIdx && this.audioTasksQueue.running) {
            return 'audio-positioning';
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
          if (this.changes.indexOf('split_point') !== -1) {
            return 'Save & Split';
          }
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
          narrationBlockContent.setContent( this.blockPart.content);
          narrationBlockContent.setClasses( this.block.classes);
          narrationBlockContent.prepare( this.getBlockLang);
          return narrationBlockContent.getContent();
          // let content = this.blockPart.content.replace(/<sup[^>]*>.*?<\/sup>/img, '');
          // //content = $(`<div>${content}</div>`).text();
          // /*let replaceHTMLRg = new RegExp(`<(?!\/|ol|ul|li|u)[^>]*>([^<]+?)<\/[^>]+>`, 'mg');
          // while (content.match(replaceHTMLRg)) {
          //   content = content.replace(replaceHTMLRg, '$1');
          // }*/
          // content = content.replace(/<br[^>]*>\s*$/, '').replace(/[\r\n]\s*$/, '');//remove <br> at the end of the block
          // content = content.replace(/(<\/?(?:ol|ul|li|u|br)[^>]*>)|<[^>]+>/img, '$1');
          // content = content.replace(/(<\/li>[^<]*?<li[^>]*>)/img, '<br>$1');
          // let is_list = this.block.content.match(/<br[^>]*>/m) || content.match(/<br[^>]*>/m) || this.block.content.match(/<li[^>]*>/m) || content.match(/<li[^>]*>/m);
          // if (this.block.classes && typeof this.block.classes === 'object' && typeof this.block.classes.whitespace !== 'undefined' && this.block.classes.whitespace.length > 0 && content.match(/[\r\n]/)) {
          //   content = content.replace(/[\r\n]/mg, '<br>');
          //   is_list = true;
          // }
          // let separator = '<div class="part-separator"></div>'
          // let joinBy = is_list ? '<split/>' : `<split/><split/>`;
          // /*let rg = new RegExp('((?<!St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|(?=\\b)cf|(?=\\b)Cap|(?=\\b)ca|(?=\\b)cca|(?=\\b)fl|(?=\\b)gen|(?=\\b)gov|(?=\\b)vs|(?=\\b)v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|(?=\\b)scil|(?=\\b)ed|(?=\\b)p|(?=\\b)viz|\\W[A-Z]))([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])', 'img');
          // content = content.replace(rg, '$1$2<br><br>');*/
          // let parts = [];
          // let lettersPattern = 'a-zA-Zа-яА-Я\\u0600-\\u06FF';
          // let regEx = new RegExp(`[\.\!\?\…\؟]+[^${lettersPattern}]*?( |[\r\n]|<br[^>]*>|<\/[^>]+>)(?![\\W]*[a-z])`, 'mg')
          // let regExAbbr = new RegExp(`(?=\\b)(St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|cf|Cap|ca|cca|fl|gen|gov|vs|v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|scil|ed|p|viz|[^\\wáíú’][A-Z])([\.\!\?\…\؟])$`, 'img');
          // let regExColon = new RegExp(`[\:\;\؛]\\W* `, 'mg');
          // if (this.getBlockLang !== 'en') {
          //   regEx = new RegExp(`[\.\!\?\…\.\!\…\؟] `, 'mg');
          //   regExColon = new RegExp(`[\:\;\؛] `, 'mg');
          // }
          // let regExLetters = new RegExp(`[${lettersPattern}]`);
          // let regExNewline = new RegExp(`[^\.\!\?\…\؟]<br[^>]*>[^${lettersPattern}]*$`);
          // let regExNewlineSpace = new RegExp(`[^\.\!\?\…\؟]\s+<br[^>]*>[^${lettersPattern}]*$`);
          // //var regExLower = new RegExp('$([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])')
          // let match;
          // let shift = 0;
          // while ((match = regEx.exec(content))) {
          //   //console.log(match)
          //   let pos = match.index + match[0].length;
          //   let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
          //   //var substrLower = str.substring(match.index);
          //   //console.log(`CHECK "${substr}"`);
          //   //console.log('MATCH: ', substr.match(regExAbbr))
          //   if (!substr.match(regExAbbr) && substr.match(regExLetters) && (!substr.match(regExNewline) || !substr.match(regExNewlineSpace))) {
          //     parts.push(substr);
          //     shift = pos;
          //   }
          // }
          // if (parts.length > 0) {
          //   if (shift < content.length) {
          //     let substr = content.substring(shift);
          //     if (substr.match(regExLetters) && !substr.match(regExNewline)) {
          //       parts.push(substr);
          //     } else {
          //       parts[parts.length - 1]+=substr;
          //     }
          //   }
          //   content = parts.join(joinBy);
          // }
          // parts = [];
          // shift = 0;
          // while ((match = regExColon.exec(content))) {
          //   let pos = match.index + match[0].length;
          //   let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
          //   if (substr.match(regExLetters)) {
          //     parts.push(substr);
          //     shift = pos;
          //   }
          // }
          // if (parts.length > 0) {
          //   if (shift < content.length) {
          //     let substr = content.substring(shift);
          //     if (substr.match(regExLetters)) {
          //       parts.push(substr);
          //     } else {
          //       parts[parts.length - 1]+=substr;
          //     }
          //   }
          //   content = parts.join('<split/>');
          // }
          // try {
          //   content = content.replace(new RegExp('(?<!<split\\/>)<br[^>]*>(?!<split\\/>)', 'gm'), `<br>${separator}`);// lists with br should have empty line
          // } catch (e) {// Firefox does not support negative lookbehind
          //
          // }
          // content = content.replace(/<split\/>/gm, '<br>');// replace split with html br
          // content = content.replace(/<br><br><br>/gm, '<br><br>');
          // content = content.replace(/<br[^>]*><br[^>]*>/gm, '<br><div class="part-separator"></div>');
          // //content = content.replace(, '$1<br>');
          // return content;
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
          blockLockType: 'blockLockType',
          audioTasksQueue: 'audioTasksQueue',
          checkRunningAudioTask: 'checkRunningAudioTask',
          isBlockOrPartLocked: 'isBlockOrPartLocked',
          audioEditorLockedSimultaneous: 'audioEditorLockedSimultaneous',
          storeListById: 'storeListById'
      }),
    ...mapGetters('uploadImage', {
      tempImage: 'file'
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
      proofreadModeReadOnly: {
          get() {
              return this.allowEditing && this.mode === 'proofread';
          }
      },
      hasIllustration: {
        get() {
          return this.block.illustration && this.block.illustration.length > 0 ? true : false;
        },
        cache: false
      },
      blockIllustration: {
        get() {
          return this.block.getIllustration();
        },
        cache: false
      },
      isAudioEditing: {
        get() {
          if (this.isSplittedBlock) {
            return this.audioTasksQueue.block.blockId === this.block.blockid && this.audioTasksQueue.block.partIdx !== null && this.audioTasksQueue.block.partIdx === this.blockPartIdx;
          } else {
            return this.$parent.isAudioEditing;
          }
        },
        cache: false
      },
      isAudioChanged: {
        get() {
          if (!this.block.getIsSplittedBlock()) {
            return this.block && this.block.isAudioChanged;
          } else {
            return this.block && this.block.parts[this.blockPartIdx] && this.block.parts[this.blockPartIdx].isAudioChanged;
          }
        },
        set(val) {
          if (!this.block.getIsSplittedBlock()) {
            this.block.isAudioChanged = val;
            this.$parent.isAudioChanged = val;
          } else {
            this.block.parts[this.blockPartIdx].isAudioChanged = val;
          }
          if (typeof val !== 'undefined') {
            this.editingLocked = val;
            Vue.nextTick(() => {// wait for parent to be mounted
              this.$parent.editingLocked = val;
            });
          }
        },
        cache: false
      },
      isSaving: {
        get() {
          if (this.isSplittedBlock && this.block.parts[this.blockPartIdx]) {
            return this.block.parts[this.blockPartIdx].isSaving;
          }
          return false;
        },
        set(val) {
          if (this.isSplittedBlock) {
            this.block.parts[this.blockPartIdx].isSaving = val;
          }
        },
        cache: false
      },
      isMergeSubblocksAllowed: {
        get() {
          if (['edit', 'narrate'].indexOf(this.mode) === -1) {
            return false;
          }
          if (this.blockPartIdx >= this.block.parts.length - 1) {
            return false;
          }
          if (this.isLocked) {
            return false;
          }
          if (this.$parent.$refs.blocks) {
            let locked = this.$parent.$refs.blocks.find(blk => {
              return blk.isLocked;
            });
            if (locked) {
              return false;
            }
          }
          return true;
        },
        cache: false
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
        this.isChanged = this.block.parts[this.blockPartIdx].isChanged || false;
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
      //this.showPinnedInText();
      if (this.audioTasksQueue.block.blockId === this.block.blockid && (!this.isSplittedBlock || this.blockPartIdx === this.audioTasksQueue.block.partIdx)) {
        this.check_id = this.generateAudioCheckId();
        this.audioEditorEventsOn();// was scrolled out of visible, and scrolled back, with audio editor opened
      }
      Vue.nextTick(() => {
        this.showPinnedInText();
      })
  },
  beforeDestroy: function () {
//     console.log('beforeDestroy', this.block._id);
//     console.log('this.isChanged', this.isChanged);
    this.audioEditorEventsOff();

    this.$root.$off('block-state-refresh-' + this.block._id, this.$forceUpdate);

    if (this.check_id) {
      this.block.check_id = this.check_id;
    }
    if (this.footnoteIdx) {
      this.block.footnoteIdx = this.footnoteIdx;
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

    $(`#content-${this.block.blockid}-part-${this.blockPartIdx}`).off('click', '[data-flag]', this.handleFlagClick);
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
  updated: function() {
    this.showPinnedInText();
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
        'checkError',
        'getBookAlign',
        'recountVoicedBlocks',
        'revertAudio',
        'addAudioTask',
        'clearAudioTasks',
        'shiftAudioTask',
        'applyTasksQueue',
        'saveBlockAudio',
        'mergeBlockParts'
      ]),
    ...mapMutations('uploadImage',{
      removeTempImg: 'removeImage'
    }),
      //-- Checkers -- { --//
      isCanFlag: function (flagType = false, range_required = true) {
        if (flagType === 'narrator' && this.block.voicework !== 'narration') {
          return false;
        }
        if (this.editingLocked) {
          return false;
        }
        if (this.isProofreadUnassigned()) {
          return true;
        }
        if (this.tc_isNarrateUnassigned(this.block) && flagType === 'editor') {
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
      isProofreadUnassigned: function() {
        if (this._is('proofer', true) && this.mode === 'proofread') {
          if (this.block.status && this.block.status.proofed === true && this.tc_isProofreadUnassigned(this.block)) {
            return true;
          }
          if (this.block.flags && this.block.flags.length && this.tc_isProofreadUnassigned(this.block)) {
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
        if (this.editingLocked) {
          return false;
        }

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

            let blockLang = this.getBlockLang;
            /*if (this.block.language === 'fa'){
              blockLang = 'fa';
            } else {
              blockLang = 'en';
            }*/

            this.editor = new MediumEditor('#content-' + this.block.blockid + '-part-' + this.blockPartIdx, {
                toolbar: toolbar,
                buttonLabels: 'fontawesome',
                quotesList: this.authors,
                onQuoteSave: this.onQuoteSave,
                suggestEl: this.suggestEl,
                blockLang: blockLang,
                extensions: extensions,
                disableEditing: !this.allowEditing || this.editingLocked,
                imageDragging: false,
                spellcheck: false
            });
            this.editor.subscribe('editableInput', (event, target) => {
              //console.log(event, target);
              if (event.inputType === 'formatItalic') {
                this.$refs.blockContent.innerHTML = this.$refs.blockContent.innerHTML.replace(/<span class="pin"><\/span>/img, '<i class="pin"></i>');// adding italic replaces split positions
              }
            });
          } else if (this.tc_isNarrationEnabled(this.block._id) && this.mode === 'narrate') {
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
                disableEditing: true,
              imageDragging: false
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
              disableEditing: !this.allowEditing,
            imageDragging: false
          });
        } else if (this.editorDescr) {
          this.editorDescr.setup();
        }

        this.initFtnEditor(force)

        $('.medium-editor-toolbar.medium-editor-stalker-toolbar').css('display', '');
      },
      initFtnEditor(force) {
        return false;
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
      onBlur: function(e) {
        if (this.$refs.blockCntx && this.$refs.blockCntx.viewMenu) this.$refs.blockCntx.close();
        if (this.$refs.splitPinCntx && this.$refs.splitPinCntx.viewMenu && (!e.target || e.target.nodeName !== 'I')) {
          this.$refs.splitPinCntx.close();
        }
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
      onContext(e) {
        if (!this.$refs.blockCntx) {
          return;
        }
        let container = $(e.target).closest('.-block.-subblock')[0]
        let offsetX = container.offsetLeft
        e.preventDefault();
        e.stopPropagation();
        let currentRange = window.getSelection().getRangeAt(0);
        let isRangeDiffers = !this.range ? true : currentRange.compareBoundaryPoints(Range.START_TO_START, this.range) !== 0;
        this.range = currentRange.cloneRange();
        let isMac = navigator && navigator.platform === 'MacIntel';
        if (this.mode === 'edit' && this.block.voicework === 'narration' && isMac && isRangeDiffers) {
          if (this.range.startContainer && this.range.startContainer.nodeName === 'DIV') {// possible click at line break <br>
            let targetElement = this.range.endContainer/*.parentElement.previousElementSibling.previousElementSibling.firstChild*/;
            if (targetElement.parentElement && targetElement.parentElement.nodeName === 'W') {
              targetElement = targetElement.parentElement;
              while (targetElement.previousElementSibling) {
                targetElement = targetElement.previousElementSibling;
                if (targetElement.childNodes.length > 0) {
                  do {
                    targetElement = targetElement.firstChild;
                  } while (targetElement.nodeType !== 3);
                  break;
                }
              }
            }
            this.range.setStart(targetElement, targetElement.length);
            this.range.setEnd(targetElement, targetElement.length);
          } else if (this.range.startContainer && this.range.startContainer.nodeType === 3 && this.range.endContainer && this.range.endContainer.nodeName === 'LI') {
            let rangeLength = /[\s]+$/.test(this.range.startContainer.nodeValue) ? this.range.startContainer.length - 1 : this.range.startContainer.length;
            this.range.setStart(this.range.startContainer, rangeLength);
            this.range.setEnd(this.range.startContainer, rangeLength);
          } else if (this.range.startContainer && this.range.startContainer.nodeType === 3 && this.range.endContainer && (this.range.endContainer.nodeName === 'W' || this.range.endContainer.nodeType === 3)) {
            let parentElement = this.range.startContainer.parentElement;
            let isUl = false;
            while (parentElement.nodeName !== 'DIV' && !isUl) {
              if (parentElement.nodeName === 'LI') {
                break;
              }
              isUl = parentElement.nodeName === 'UL';
              parentElement = parentElement.parentElement;
            }
            if (isUl) {
              let rangeLength = /[\s]+$/.test(this.range.startContainer.nodeValue) ? this.range.startContainer.length - 1 : this.range.startContainer.length;
              this.range.setStart(this.range.startContainer, rangeLength);
              this.range.setEnd(this.range.startContainer, rangeLength);
            }
          }
        }
        this.$refs.blockCntx.open(e, container, offsetX);
        this.$nextTick(() => {
          //hide medium editor if context menu is active
          $('.medium-editor-toolbar-active').css('visibility', 'hidden');
        })
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
        this.isChanged = true;
        this.pushChange('flags');
        //this.$emit('inputFlag');
        //ev.target.focus();
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
          if (block.type === 'illustration') {
              this.removeTempImg(block._id);
            this.block.description = block.description;
            if (this.$refs.blockDescription) {
              this.$refs.blockDescription.innerHTML = block.description;
            }
          }

        });
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
      assembleBlockProxy: function (check_realign = true, realign = false, check_audio_changes = true) {
        this.$root.$emit('closeFlagPopup', true);
        let flagUpdate = this.hasChange('flags') ? this.block.flags : null;
        if (flagUpdate) {
          if (this.isAudioEditing) {
            this.$root.$emit('for-audioeditor:set-process-run', true, realign ? 'align' : 'save');
          }
          let partContent = this.clearBlockContent();
          return this.$parent.assembleBlockProxy(false, false, ['flags', 'parts'])
            .then(() => {
              if (this.hasChange('split_point')) {// can be pending split
                this.changes = ['split_point']
                if (this.isSplittedBlock) {
                  this.block.setPartContent(this.blockPartIdx, partContent);
                }
                return this.assembleBlockProxy(false, false, false);
              }
              this.isChanged = false;
              if (this.isAudioEditing) {
                if (this.isLocked) {
                  this.$root.$emit('for-audioeditor:set-process-run', true, this.lockedType);
                } else {
                  this.$root.$emit('for-audioeditor:set-process-run', false);
                }
              }
              return Promise.resolve();
            })
        }
        let isSplitting = this.hasChange('split_point');
        let checkSplit = new Promise((resolve, reject) => {// temporary solution, not allow split if any aligning task is running. Correct solution in develop in branch ilm-server 0.133-ILM-3110-align-part ; saving part id in block parts array
          if (isSplitting) {
            if (this.isBlockOrPartLocked(this.block.blockid)) {
              this.block.isSaving = true;
              this.$parent.isSaving = true;
              this.$parent.$forceUpdate();
              let checkAlign = setInterval(() => {
                if (!this.isBlockOrPartLocked(this.block.blockid)) {
                  clearInterval(checkAlign);
                  return resolve();
                }
              }, 500);
            } else {
              return resolve();
            }
          } else {
            return resolve();
          }
        });
        return checkSplit
          .then(() => {
            if (check_realign === true && this.needsRealignment) {
              realign = true;
            }
            if (this.$refs.blockContent) {// if splitting and audio changes saving - content was rebuilt
              this.blockPart.content = this.clearBlockContent(this.$refs.blockContent.innerHTML);
            }

            let splitPoints = this.blockPart.content ? this.blockPart.content.match(/<i class="pin"><\/i>/img) : [];
            splitPoints = splitPoints ? splitPoints.length : 0;
            let isAudioEditorOpened = Array.isArray(this.$parent.$refs.blocks) ? this.$parent.$refs.blocks.find((b, i) => {
                return b.isAudioEditing;
              }) : false;
            if (isSplitting && isAudioEditorOpened) {
              this.$root.$emit('for-audioeditor:force-close');
            }
            this.block.parts.forEach((p, pIdx) => {
              if (pIdx !== this.blockPartIdx) {
                let ref = this.$parent.$refs.blocks.find(br => {
                  return br.blockPartIdx === pIdx;
                });
                if (ref) {
                  p.content = ref.clearBlockContent();
                }
              }
            });
            if (splitPoints) {
              this.$parent.isSaving = true;
              this.block.isSaving = true;
              this.$parent.$forceUpdate();
            } else {
              this.isSaving = true;
            }
            this.$forceUpdate();
            let reloadParent = this.hasChange('split_point');
            if (this.isAudioEditing && !isSplitting) {
              this.$root.$emit('for-audioeditor:set-process-run', true, realign ? 'align' : 'save');
            }
            if ((this.hasChange('content') || this.hasChange('suggestion')) && this.isSplittedBlock) {
              this.block.parts[this.blockPartIdx].content_changed = true;
              this.blockPart.content_changed = true;
            }
            let saveBlockPromise;
            if (this.mode === 'proofread') {
              saveBlockPromise = this.assembleBlockProofread();
            } else if (this.mode === 'narrate') {
              saveBlockPromise = this.assembleBlockNarrate();
            } else {
              saveBlockPromise = this.saveBlockPart(this.blockPart, this.blockPartIdx, realign)
            }
            return saveBlockPromise
              .then((response) => {
                this.isChanged = false;
                if (response && Array.isArray(response.parts)) {
                  let storeBlock = this.storeListById(this.block.blockid);
                  response.parts.forEach((part, pIdx) => {
                    this.block.setPartContent(pIdx, storeBlock.getPartContent(pIdx));// content not reloaded automatically, but reload can be necessary because it was modified on server
                    if (pIdx === this.blockPartIdx) {
                      this.blockPart.content = storeBlock.getPartContent(pIdx);
                    }
                  });
                }
                if (this.blockAudio.map) {
                  this.blockAudio.map = this.blockPart.content;
                }
                if (this.isLocked && this.isAudioEditing && !isSplitting) {
                  this.$root.$emit('for-audioeditor:set-process-run', true, this.lockedType);
                }
                if (reloadParent) {
                  //let oldLength = this.$parent.$refs.blocks.length;
                  this.$parent.isSaving = false;
                  this.$parent.$parent.refreshTmpl();
                  this.$parent.$forceUpdate();
                  /*if (isSplitting && splitPoints && oldLength < response.parts.length) {
                    //commit('set_storeList', new BookBlock(response.data));
                    Vue.nextTick(() => {
                      this.$parent.$refs.blocks.forEach((p, pIdx) => {
                        if (pIdx > this.blockPartIdx && (p.isChanged || p.isAudioChanged) && pIdx < oldLength) {
                          this.$parent.$refs.blocks[pIdx + splitPoints].isChanged = p.isChanged;
                          this.$parent.$refs.blocks[pIdx + splitPoints].isAudioChanged = p.isAudioChanged;
                          this.$parent.$refs.blocks[pIdx + splitPoints].changes = p.changes;
                          p.isChanged = false;
                          p.isAudioChanged = false;
                        }
                      });
                    });
                  }*/
                  if (isAudioEditorOpened) {
                    this.$root.$emit('for-audioeditor:force-close');
                  }
                }
                this.isSaving = false;
                //this.block.isSaving = false;
                return Promise.resolve();
              });
        })
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
        if (this.isSplittedBlock) {
          this.blockPart.content = this.clearBlockContent(this.$refs.blockContent.innerHTML);
          this.isChanged = false;
          this.isSaving = true;
          let promise = Promise.resolve();
          let evt = {};
          evt.waitUntil = p => promise = p
          this.$root.$emit(`save-block:${this.block.blockid}`, evt);
          return promise.then(() => {
            this.isSaving = false;
          });
        }
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
            return Promise.resolve();
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      assembleBlockNarrate(check_realign = true, realign = false) {
        if (check_realign === true && this.needsRealignment) {
          realign = true;
        }
        let refreshTasks = this.isCompleted;
        return this.putBlockNarrate([Object.assign(this.blockPart, {
            blockid: this.block.blockid,
            bookid: this.block.bookid,
        }), realign, this.blockPartIdx])
          .then((response) => {
            if (refreshTasks) {
              this.getCurrentJobInfo();
            }
            return Promise.resolve(response);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      clearBlockContent: function(content = false) {
        //console.log(content)
        if (content === false && !this.$refs.blockContent) {
          return '';
        }
        if (content === false) {
          content = this.$refs.blockContent.innerHTML;
        }
        content = content.replace(/(<[^>]+)(selected)/g, '$1');
        content = content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
        content = content.replace(/(<[^>]+)(pinned-word)/g, '$1');
        content = content.replace(/<br class="narrate-split"[^>]*>/g, '')
        content = content.replace('<span class="content-tail"></span>', '');
        content = content.replace(/&nbsp;/gm, ' ')
        content = content.replace(/ style="[^"]*?"/img, '');// in some cases redactor adds styles
        if (this.block && this.block.classes.whitespace && ['verse', 'pre', 'list'].indexOf(this.block.classes.whitespace) !== -1) {
          content = content.replace(/<br\/?>/img, `\n`);
          if (/\r\n|\r|\n|<p[^>]*>|<div[^>]*>/.test(content)) {
            content = content.replace(/<p[^>]*><[^>]+>[\n]<\/[^>]+><\/p>/img, '<p>\n</p>');
            content = content.replace(/[\r\n]<p[^>]*>[\n]<\/p>$/, '\n\n').replace(/<p[^>]*>[\n]<\/p>$/, '\n\n');// line break at the end of text
            content = content.replace(/<p><br[\/]?><\/p>/gm, '\n');
            content = content.replace(/<p>([\r\n]+)<\/p>/gm, '$1');
            content = content.replace(/<\/p><p[^>]*>/img, '\n');
            content = content.replace(/([\r\n]+)<p[^>]*>([\s\S]+?)<\/p>$/img, '$1$2');// remove p at the end preceeded with line break
            content = content.replace(/([\s\S]+)<p[^>]*>([\s\S]+?)<\/p>$/img, '$1\n$2');// remove p at the end with line break
            content = content.replace(/^<p[^>]*>([\s\S]+?)<\/p>$/, '$1');// content wrapped with p
            content = content.replace(/<p[^>]*>([\s\S]+?)<\/p>/gm, `$1\n`);// remove Editor's p instead of line breaks
            content = content.replace(/<\/div><div>/gm, '\n');
            content = content.replace(/^<div[^>]*>([\s\S]+?)<\/div>$/, '$1');// content wrapped with div
            content = content.replace(/<div[^>]*>([\s\S]+)<\/div>/img, '\n$1');// remove Editor's div instead of line breaks
            content = content.replace(/<div>/gm, '')
            content = content.replace(/<\/div>/gm, '\n')
          }
        }
        if (/<(p|div)[^>]*>/.test(content)) {
          content = content.replace(/<p[^>]*><[^>]+><br\/?><\/[^>]+><\/p>/img, '<p><br></p>');
          content = content.replace(/<br\/?><p[^>]*><\/p>/gm, '<br>');
          content = content.replace(/<br\/?><p[^>]*><br\/?><\/p>$/, '<br><br>');// end of block, after line break
          content = content.replace(/<p[^>]*><br\/?><\/p>$/, '<br><br>');// end of block, need empty line after text
          content = content.replace(/<p[^>]*>([\s\S]*?)<br[^>]*><\/p>/gm, '<p>$1</p>').replace(/<div[^>]*>([\s\S]*?)<br\/?><\/div>/img, '<div>$1<\/div>');
          content = content.replace(/<p[^>]*><\/p>/img, '<br>');
          content = content.replace(/<\/p><p[^>]*>/img, '<br>')/*.replace(/(<div[^>]*>)<p[^>]*><br\/?><\/p>/img, '$1')*/;
          content = content.replace(/<div[^>]*><w[^>]*><\/w><\/div>/mg, ''); // for aligned blocks editor creates empty <w></w> tags on line break adding
          content = content.replace(/<w[^>]*><\/w>/mg, '');
          content = content.replace(/(<br\/?>)<div[^>]*><p[^>]*>([\s\S]*?)<\/p>([\s\S]*?)<\/div>/img, '$1$2<br>$3');
          content = content.replace(/<div[^>]*><p[^>]*>([\s\S]*?)<\/p><\/div>$/img, '<br>$1');
          content = content.replace(/<div[^>]*><p[^>]*>([\s\S]*?)<\/p>([\s\S]*?)<\/div>/img, '<br>$1<br>$2');
          content = content.replace(/<div[^>]*>([\s\S]*?)<\/div>/img, '<br>$1');
          content = content.replace(/^<p[^>]*>([\s\S]*?)<\/p>$/img, '$1');
          content = content.replace(/^<p[^>]*>([\s\S]*?)<\/p>/img, '$1<br>');
        }
        try {
          content = content.replace(new RegExp('(?<!<\\/ul>|<\\/ol>)<p[^>]*>([\\s\\S]*?)<\\/p>([\\s\\S]+?)', 'gm'), '<br/>$1<br>$2')//paragrapth not preceeded by list
          content = content.replace(new RegExp('(?<!<\\/ul>|<\\/ol>)<p[^>]*>([\\s\\S]*?)<\\/p>(<\\/div>)?$', 'gm'), '<br/>$1')//paragrapth not preceeded by list, at the end of the block
          content = content.replace(new RegExp('(?<=<\\/ul>|<\\/ol>)<p[^>]*>([\\s\\S]*?)<\\/p>', 'gm'), '$1')//paragrapth preceeded by list
        } catch (e) {// Firefox does not support negative lookbehind

        }
        content = content.replace(/<p[^>]*><\/p>/gm, '')
        //content = content.replace(/^<br[\/]?>/gm, '')
        content = content.replace(/<span[^>]*>([\s\S]*?)<\/span>/gm, '$1')
        //content = content.replace(/<br[\/]?><br[\/]?>/gm, '<br>');
        //content = content.replace(/^<br[\/]?>/, '');
        //console.log(content);
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
        if (this.editingLocked) return false;
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
        if (this.block.getIsSplittedBlock()) {
          this.block.parts[this.blockPartIdx].footnote_added = true;// temporary flag
        }
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
        if (!this.checkAllowNarrateUnassigned()) {
          return false;
        }
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
          let fixed_start = false;
          let fixed_end = false;
          let startElementWrapper = windowSelRange.startContainer.parentElement;
          if (startElementWrapper.nodeName.toLowerCase() !== 'div') {
            while (startElementWrapper.parentElement && startElementWrapper.parentElement.nodeName.toLowerCase() !== 'div') {
              startElementWrapper = startElementWrapper.parentElement;
            }
            windowSelRange.setStartBefore(startElementWrapper);
            //if (startElementWrapper.nodeName.toLowerCase() !== 'u') {
              fixed_start = true;
            //}
          }

          let endElementWrapper = windowSelRange.endContainer.parentElement;
          if (endElementWrapper.nodeName.toLowerCase() !== 'div') {
            while (endElementWrapper.parentElement && endElementWrapper.parentElement.nodeName.toLowerCase() !== 'div') {
              endElementWrapper = endElementWrapper.parentElement;
            }
            windowSelRange.setEndAfter(endElementWrapper);
            //if (endElementWrapper.nodeName.toLowerCase() !== 'u') {
              fixed_end = true;
            //}
          }
          if (!this.$refs.blockContent.innerHTML.match(/<w[^>]*>/)) {// no alignment
            let lettersPattern = 'a-zA-Zа-яА-ЯÀ-ÿ\\u0600-\\u06FF\\ā\\ī\\ū\\ṛ\\ṝ\\ḷ\\ṅ\\ñ\\ṭ\\ḍ\\ṇ\\ś\\ṣ\\ḥ\\ṁ\\ṃ\\Ā\\Ī\\Ū\\Ṛ\\Ṝ\\Ḻ\\Ṅ\\Ñ\\Ṭ\\Ḍ\\Ṇ\\Ś\\Ṣ\\Ḥ\\Ṁ\'’"\\?\\!:\\.,“‘«”’»\\(\\[\\{﴾\\)\\]\\}\\-﴿؟؛…';
            let checkWords = new RegExp(`([${lettersPattern}\\d]+?)([^${lettersPattern}\\d]+?)`, 'img');
            let match = false;
            let selection = {};
            let offset = 0;//-1 * windowSelRange.startOffset;
            let found = false;
            let checkNodes = [startElementWrapper];
            let checkNode;
            if (fixed_start) {
              checkNodes = [this.$refs.blockContent];
              while(checkNode = checkNodes.pop()) {
                if (checkNode !== startElementWrapper) {
                  if (!found) {
                    if (checkNode.nodeType == 3) {
                      offset+= checkNode.length;
                    } else {
                      let i = checkNode.childNodes.length;
                      while (i--) {
                        checkNodes.push(checkNode.childNodes[i]);
                      }
                    }
                  }
                } else {
                  found = true;
                  if (checkNode.nodeName.toLowerCase() === 'u') {
                    fixed_start = false;
                    offset-= windowSelRange.startOffset;
                    //fixed_end = false;
                    //offsetEnd+= checkNode.innerText.length;
                    //console.log(checkNode)
                    //return;
                  } else {
                    //selection.end = offsetEnd + checkNode.innerText.length;
                  }
                }
              }
              selection.start = offset;
            } else {
              while(checkNode = checkNodes.pop()) {
                if (checkNode !== windowSelRange.startContainer) {
                  if (!found) {
                    if (checkNode.nodeType == 3) {
                      offset+= checkNode.length;
                    } else {
                      let i = checkNode.childNodes.length;
                      while (i--) {
                        checkNodes.push(checkNode.childNodes[i]);
                      }
                    }
                  }
                } else {
                  found = true;
                }
              }
            }
            let offsetEnd = 0;//-1 * windowSelRange.endOffset;
            found = false;
            if (fixed_end) {
              checkNodes = [this.$refs.blockContent];
              while(checkNode = checkNodes.pop()) {
                if (checkNode !== endElementWrapper) {
                  if (!found) {
                    if (checkNode.nodeType == 3) {
                      offsetEnd+= checkNode.length;
                    } else {
                      let i = checkNode.childNodes.length;
                      while (i--) {
                        checkNodes.push(checkNode.childNodes[i]);
                      }
                    }
                  }
                } else {
                  found = true;
                  if (checkNode.nodeName.toLowerCase() === 'u') {
                    fixed_end = false;
                    offsetEnd+= checkNode.innerText.length;
                    offsetEnd-=windowSelRange.endOffset;
                    //if (!this.$refs.blockContent.innerText.charAt(offsetEnd) || this.$refs.blockContent.innerText.charAt(offsetEnd).trim().length == 0) {// if u at the end of word - do not make selection bigger
                      //--offsetEnd;
                    //}
                  } else {
                    selection.end = offsetEnd + checkNode.innerText.length;
                  }
                }
              }
            } else {
              checkNodes = [endElementWrapper];
              while(checkNode = checkNodes.pop()) {
                if (checkNode !== windowSelRange.endContainer) {
                  if (!found) {
                    if (checkNode.nodeType == 3) {
                      offsetEnd+= checkNode.length;
                    } else {
                      let i = checkNode.childNodes.length;
                      while (i--) {
                        checkNodes.push(checkNode.childNodes[i]);
                      }
                    }
                  }
                } else {
                  found = true;
                }
              }
            }
            while((match = checkWords.exec(this.$refs.blockContent.textContent))) {
              if (match.index <= windowSelRange.startOffset + offset && !fixed_start) {
                selection.start = match.index;
                if (selection.start + match[0].length <= windowSelRange.startOffset + offset) {
                  selection.start = match.index + match[0].length;
                }
              } else if (typeof selection.start === 'undefined') {
                selection.start = 0;
              }
              if (match.index + match[0].length >= windowSelRange.endOffset + offsetEnd && typeof selection.end === 'undefined') {
                selection.end = match.index + match[0].length;
              }
            }
            if (typeof selection.end === 'undefined') {
              selection.end = startElementWrapper.innerText.length;
            }
            if (typeof selection.start !== 'undefined' && typeof selection.end !== 'undefined') {
              windowSelRange = this.restoreSelection(this.$refs.blockContent, selection);
            }
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
            this.handleFlagClick({target: flag, layerY: ev.layerY, clientY: ev.clientY});
          } else {
            this.block.addFlag(existsFlag.dataset.flag, windowSelRange, type, this.mode);
            this.handleFlagClick({target: existsFlag, layerY: ev.layerY, clientY: ev.clientY});
          }
          this.$refs.blockFlagPopup.scrollBottom();
          this.isChanged = true;
          this.pushChange('flags');
          //this.$emit('addFlag');
        }
      },

      addFlagPart: function(content, type = 'editor') {
        if (!this.checkAllowNarrateUnassigned()) {
          return false;
        }
        this.block.addPart(this.flagsSel._id, content, type, this.mode);

        this.updateFlagStatus(this.flagsSel._id);
        this.$refs.blockFlagPopup.reset();

        this.$refs.blockFlagPopup.scrollBottom();
        this.isChanged = true;
        this.pushChange('flags');
        //this.$emit('addFlagPart');
      },

      _delFlagPart(ev, partIdx) {
        this.delFlagPart(ev, partIdx, this.blockPartIdx);
        this.isChanged = true;
        this.pushChange('flags');
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
        ev.cancelBubble = true;
        let flagId = ev.target.dataset.flag;
        let curFlagId = ev.currentTarget && ev.currentTarget.dataset ? ev.currentTarget.dataset.flag : false;
        if (!curFlagId || curFlagId === flagId) {
          this.flagsSel = this.block.flags.filter((flag)=>{
            return flag._id === flagId;
          })[0];
          this.isHideArchParts = true;
          this.$refs.blockFlagPopup.open(ev, flagId);
          this.updateFlagStatus(flagId);
        }
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
          return !this.editingLocked && this.tc_canResolveFlagPart(flagPart, this.block);
      },
      canCommentFlagPart: function(flagPart) {
        return this.canResolveFlagPart(flagPart) && flagPart.status == 'open' && !flagPart.collapsed/* && (!this.isCompleted || this.isProofreadUnassigned())*/;
      },

      canDeleteFlagPart: function (flagPart) {
          if (this.editingLocked) {
            return false;
          }
          if (this.tc_allowNarrateUnassigned(this.block) && flagPart.creator === this.auth.getSession().user_id && this.block.voicework === 'narration') {
            return true;
          }
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
        this.isChanged = true;
        this.pushChange('flags');
        //this.$emit('resolveFlagPart');
      },

      reopenFlagPart: function(ev, partIdx) {
        if (!this.checkAllowNarrateUnassigned()) {
          return false;
        }
        this.flagsSel.parts[partIdx].status = 'open';
        this.flagsSel.parts[partIdx].isReopen = true;
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
        //this.$emit('reopenFlagPart');
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

      _startRecording(check_allow = false) {
        this.$root.$emit('closeFlagPopup', null);
        if (check_allow && !this.checkAllowNarrateUnassigned()) {
          return false;
        }
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
          this.block.parts[this.blockPartIdx].isUpdating = true;
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
        if (!this.checkAllowNarrateUnassigned()) {
          return false;
        }
        //$('.table-body.-content').removeClass('editing');
        //$('#' + this.block._id + ' .table-body.-content').addClass('editing');
        this.footnoteIdx = footnoteIdx;
        this.check_id = this.generateAudioCheckId();
        this.audioEditorEventsOff();
        let isChanged = this.isChanged || this.$parent.isChanged;
        this.$root.$emit('for-audioeditor:lock-editing', isChanged, this.audioEditorLockedSimultaneous);


        Vue.nextTick(() => {
          let audiosrc = this.blockAudio.src;
          let text = this.blockAudio.map;
          let loadBlock = Object.assign({}, this.blockPart);
          loadBlock._id = this.check_id;
          loadBlock.blockid = this.block.blockid;
          loadBlock.partIdx = this.isSplittedBlock ? this.blockPartIdx : null;
          this.$root.$emit('for-audioeditor:load-and-play', audiosrc, text, loadBlock);

          this.audioEditorEventsOn();
        });
      },

      //-- Events -- { --//
      evFromAudioeditorClosed(blockId) {

        if (blockId === this.check_id) {
          this.clearAudioTasks(false);
          if (this.isAudioChanged) {
            let checks = 0;
            let waitStopRunning = new Promise((resolve, reject) => {// if there is running queue request then wait for it to finish
              let waitInterval = setInterval(() => {
                ++checks;
                if (this.audioTasksQueue.running === null || checks >= 20) {
                  clearInterval(waitInterval);
                  return resolve();
                }
              }, 1000);
            });
            if (this.isSplittedBlock) {
              this.isUpdating = true;
            } else {
              this.$parent.isUpdating = true;
            }
            return waitStopRunning
              .then(() => {
                this.discardAudioEdit(this.footnoteIdx, false, this.isSplittedBlock ? this.blockPartIdx : null)
                  .then(() => {
                    this.isAudioChanged = false;
                    this.isChanged = false;
                    this.unsetChange('audio');
                    this.unsetChange('content');
                    this.unsetChange('manual_boundaries');

                    this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
                    this.isUpdating = false;
                  });
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
          Vue.nextTick(() => {
          $('nav.fixed-bottom').removeClass('hidden');
          let lockedType = false;
          if (this.isLocked) {
            lockedType = this.lockedType;
          } else if (this.$parent.isLocked) {
            lockedType = this.$parent.lockedType;
          }
          if (lockedType && lockedType !== 'audio-positioning' && lockedType !== 'save') {
            this.$root.$emit('for-audioeditor:set-process-run', true, lockedType);
          }
          });
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
                this.unsetChange('manual_boundaries');
                this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
                //this.showPinnedInText();
            });
        }
      },
      evFromAudioeditorSelect (blockId, indexes) {
        if (blockId == this.check_id) {
          if (Array.isArray(indexes) && indexes.length > 0) {

            if (this.$refs.blockContent && this.$refs.blockContent.querySelectorAll) {
              this.$refs.blockContent.querySelectorAll('w.selected').forEach(el => {
                el.classList.remove('selected');
              });
              indexes.forEach(i => {
                this.$refs.blockContent.querySelectorAll('w[data-map]')[i].classList.add('selected');
              });
              //this.$forceUpdate();
            }
          }
        }
      },
      audioEditorEventsOn() {
        this.$root.$on('from-audioeditor:block-loaded', this.evFromAudioeditorBlockLoaded);
        //this.$root.$on('from-audioeditor:undo', this.evFromAudioeditorUndo);
        this.$root.$on('from-audioeditor:discard', this.evFromAudioeditorDiscard);
        this.$root.$on('from-audioeditor:select', this.evFromAudioeditorSelect);

        //this.$root.$on('from-audioeditor:closed', this.evFromAudioeditorClosed);
      },
      audioEditorEventsOff() {
        this.$root.$off('from-audioeditor:block-loaded', this.evFromAudioeditorBlockLoaded);
        //this.$root.$off('from-audioeditor:undo', this.evFromAudioeditorUndo);
        this.$root.$off('from-audioeditor:discard', this.evFromAudioeditorDiscard);
        this.$root.$off('from-audioeditor:select', this.evFromAudioeditorSelect);
        //this.$root.$off('from-audioeditor:closed', this.evFromAudioeditorClosed);
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
        let image = this.tempImage(this.block._id)
        formData.append('illustration', image, image.name);
        formData.append('block', JSON.stringify({'description': this.$refs.blockDescription.innerHTML}));

        let api = this.$store.state.auth.getHttp()
        let api_url = this.API_URL + 'book/block/' + this.block.blockid + '/image';

        api.post(api_url, formData, {}).then((response) => {
          if (response.status===200) {
            if (this.isCompleted) {
              this.tc_loadBookTask();
              this.getCurrentJobInfo();
            }
            this.removeTempImg(this.block._id)
            // hide modal after one second
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
      onIllustrationChange(obj ={}) {
       this.isIllustrationChanged = true;
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
            this.range = window.getSelection().getRangeAt(0).cloneRange();
            //console.log(this.range, window.getSelection(), range)
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
            if (startRange && endRange && this.isAudioEditing) {
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
          $(`#content-${this.block.blockid}-part-${this.blockPartIdx}`).off('click', '[data-flag]', this.handleFlagClick);
          $(`#content-${this.block.blockid}-part-${this.blockPartIdx}`).on('click', '[data-flag]', this.handleFlagClick);

          $(`#content-${this.block.blockid}-part-${this.blockPartIdx}`).off('click', 'i.pin', this.handlePinClick);
          $(`#content-${this.block.blockid}-part-${this.blockPartIdx}`).on('click', 'i.pin', this.handlePinClick);
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
      assembleBlockPartAudioEdit(realign, preparedData = false) {

        this.$root.$emit('closeFlagPopup', true);
        if (this.isChanged && preparedData === false) {
          this.$root.$emit('show-modal', {
            title: 'Unsaved Changes',
            text: `Block text has been modified and not saved.<br>
Save text changes and realign the Block?`,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
                class: ['btn btn-default']
              },
              {
                title: 'Save & Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  let preparedData = {content: this.clearBlockContent()}
                  return this.assembleBlockProxy(false, false, false)
                    .then(() => {
                      return this.assembleBlockPartAudioEdit(true, preparedData);
                    });
                },
                class: ['btn btn-primary']
              }
            ],
            class: ['align-modal']
          });
          return Promise.resolve();
        }
        let isSplitting = this.hasChange('split_point');
        this.$root.$emit('for-audioeditor:set-process-run', true, 'save');
        return this.applyTasksQueue([null])
          .then(() => {
            if (isSplitting && this.needsRealignment) {
              preparedData.content = (preparedData.content ? preparedData.content : this.block.getPartContent(this.blockPartIdx)).replace(/<i class="pin"><\/i>/img, '');
            }
            return this.saveBlockAudio([realign, preparedData])
          })
          .then((response) => {
            this.$root.$emit('for-audioeditor:flush');
            if (realign) {
              this.$root.$emit('for-audioeditor:set-process-run', true, 'align');
            } else if (!isSplitting) {
              let part = response.data.parts[this.blockPartIdx];
              part._id = this.check_id;
              part.blockid = this.block.blockid;
              part.partIdx = this.isSplittedBlock ? this.blockPartIdx : null;
              this.$root.$emit('for-audioeditor:load',
                this.blockAudiosrc('m4a'),
                this.block.getPartContent(this.blockPartIdx), false, part);
              }
              if (isSplitting) {// block was split in audio saving
                this.unsetChange('split_point');
                this.$refs.blockContent.innerHTML = this.block.getPartContent(this.blockPartIdx);
                //this.$forceUpdate();
                this.$parent.$forceUpdate();
              }
              this.blockAudio.map = this.blockContent();
              this.blockAudio.src = this.blockAudiosrc('m4a');
            if (this.isCompleted) {
              this.tc_loadBookTask();
            }
          });
      },
      addToQueueBlockPartAudioEdit(realign = false) {
        this.$root.$emit('closeFlagPopup', true);
        if (this.isChanged) {
          this.$root.$emit('show-modal', {
            title: 'Unsaved Changes',
            text: `Block text has been modified and not saved.<br>
Save text changes and realign the Block?`,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
                class: ['btn btn-default']
              },
              {
                title: 'Save & Realign',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  //let preparedData = {content: this.clearBlockContent()}
                  //return this.assembleBlockProxy(false, false, false)
                    //.then(() => {
                      //return this.assembleBlockPartAudioEdit(true, preparedData);
                    //});
                  this.$root.$emit('for-audioeditor:set-process-run', true, 'save');
                  this.addAudioTask(['save-part-then-audio', [true]]);
                },
                class: ['btn btn-primary']
              }
            ],
            class: ['align-modal']
          });
          return Promise.resolve();
        } else {
          this.$root.$emit('for-audioeditor:set-process-run', true, 'save');
          this.addAudioTask(['save-part-audio', [realign]]);
        }
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
      },
      restoreSelection(containerEl, savedSel) {
        if (window.getSelection && document.createRange) {
          var charIndex = 0, range = document.createRange();
          range.setStart(containerEl, 0);
          range.collapse(true);
          var nodeStack = [containerEl], node, foundStart = false, stop = false;
          while (!stop && (node = nodeStack.pop())) {
              if (node.nodeType == 3) {
                  var nextCharIndex = charIndex + node.length;
                  if (!foundStart && savedSel.start >= charIndex && savedSel.start < nextCharIndex) {
                      range.setStart(node, savedSel.start - charIndex);
                      foundStart = true;
                  }
                  if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                      range.setEnd(node, savedSel.end - charIndex);
                      stop = true;
                  }
                  charIndex = nextCharIndex;
              } else {
                  var i = node.childNodes.length;
                  while (i--) {
                      nodeStack.push(node.childNodes[i]);
                  }
              }
          }
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return range;
        } else if (document.selection) {
          var textRange = document.body.createTextRange();
          textRange.moveToElementText(containerEl);
          textRange.collapse(true);
          textRange.moveEnd("character", savedSel.end);
          textRange.moveStart("character", savedSel.start);
          textRange.select();
          return textRange;
        }
      },

      showPinnedInText() {
        if (this.$refs.blockContent && Array.isArray(this.blockPart.manual_boundaries)) {
          Vue.nextTick(() => {
            //if (this.block.blockid === '1306_s_0005_en-bl37') {
              //console.time('showPinnedInText');
            //}
            if (Date.now() - this.pinUpdated < 2000) {
              return;
            }
            if (!this.$refs.blockContent || this.blockPart.manual_boundaries.length === this.$refs.blockContent.querySelectorAll('.pinned-word').length) {
              return;
            }
            this.$refs.blockContent.querySelectorAll('.pinned-word').forEach(el => {
              el.classList.remove('pinned-word');
            });
            let list = this.$refs.blockContent.querySelectorAll(`w[data-map]`).values();
            let el = list.next();
            this.blockPart.manual_boundaries.sort((a, b) => {return a - b;}).forEach(mb => {
              let found = false;
              let targetMb = parseInt(mb);
              while (el && !el.done && !found) {
                let map = el.value.getAttribute('data-map');
                if (map) {
                  let boundaries = map.split(',');
                  if (boundaries.length === 2 && Math.abs(parseInt(boundaries[0]) + parseInt(boundaries[1]) - targetMb) <= 10) {
                    el.value.classList.add('pinned-word');
                    found = true;
                  }
                }
                el = list.next();
              }
            });
            //if (this.block.blockid === '1306_s_0005_en-bl37') {
              //console.timeEnd('showPinnedInText');
              //var err = new Error();
              //console.log(err.stack);
            //}
            this.pinUpdated = Date.now();
          });
        }
      },
      reloadBlockPart() {
        this.blockPart.audiosrc = this.blockAudiosrc(null, false);
        this.blockPart.audiosrc_ver['m4a'] = this.blockAudiosrc('m4a', false);
        this.blockAudio.map = this.blockContent();
        this.blockAudio.src = this.blockAudiosrc('m4a');
        //this.showPinnedInText();
      },
      isSplitPointAllowed() {
        /*if (this.isSplittedBlock) {
          return false;
        }*/
        if (this.block.voicework !== 'narration') {
          return false;
        }
        if (this.editingLocked) {
          return false;
        }
        /*if (this._is('narrator', true) && this.mode === 'narrate') {
          console.log(this.range, `${this.range.startOffset}:${this.range.endOffset}`);
        } else */if (((this._is('editor', true) || this.adminOrLibrarian) && this.mode === 'edit') || (this._is('narrator', true) && this.mode === 'narrate')) {
          if (!(this.currentJobInfo.text_cleanup || this.currentJobInfo.mastering || this.currentJobInfo.mastering_complete)) {
            if (!this.range) {
              return false;
            }
            //console.log(this.range);
            let isMac = navigator && navigator.platform === 'MacIntel';
            let container = this.range.commonAncestorContainer;
            if (typeof container.length == 'undefined') {
              return false;
            }
            let checkRange = document.createRange();
            checkRange.setStart( container, this.range.startOffset );
            if (this.range.startOffset > 0) {
              checkRange.setStart(container, this.range.startOffset - 1);
              //let checkString = checkRange.toString();
              if (checkRange.startOffset > 0 && /^\s$/.test(checkRange.toString())) {//  && checkString.substring(checkString.length - 1, checkString.length) === ' ' container.data.substring(checkRange.endOffset, checkRange.endOffset + 1) === ' '
                while (checkRange.startOffset > 0 && /^\s$/.test(container.data.substring(checkRange.startOffset, checkRange.startOffset - 1))) {// add all speces till container beginning to range
                  checkRange.setStart( container, checkRange.startOffset-1 );
                }
              }
            }
            if (checkRange.startOffset === 0 && /^[\s]*$/.test(checkRange.toString())) {// click at the beginning of the block
              if (!(container.parentElement && container.parentElement.nodeName !== 'DIV' && container.parentElement.previousSibling)) {
                return false;
              }
            }
            if (!isMac && this.range.startOffset < this.range.endOffset) {// do not display menu for range
              return false;
            }
            let skipLengthCheck = false;
            if (this.range.endOffset >= container.length && container.parentElement && container.parentElement.nodeName !== 'DIV') {// && (container.parentElement.nextSibling || (container.parentElement.parentElement && container.parentElement.parentElement.nodeName !== 'DIV' && this.$refs.blockContent.lastChild !== container.parentElement.parentElement));// means click at the end of <w></w> tag, and this tag is not last in container DIV
              let parent = container.parentElement;
              while (parent.parentElement && parent.parentElement !== this.$refs.blockContent && !skipLengthCheck) {
                skipLengthCheck = parent.nextSibling ? true : false;
                parent = parent.parentElement;
              }
              if (!skipLengthCheck) {
                skipLengthCheck = parent.nextSibling ? true : false;
              }
            }
            if (!skipLengthCheck && container.nodeType === 3) {// not aligned block
              skipLengthCheck = this.range.endOffset >= container.length && container.nextSibling;
            }
            if (this.range.endOffset >= container.length && !container.nextSibling && !skipLengthCheck) {
              //console.log('LENGTH CHECK'/*this.range*/);
              return false;
            }
            let checkSibling = container.previousElementSibling ? container.previousElementSibling : (container.previousSibling ? container.previousSibling : null);
            if (checkSibling) {
              if (checkSibling.nodeName === 'I' && checkSibling.classList.contains('pin') && this.range.startOffset === 0) {
                //console.log('SIBLING CHECK')
                return false;
              }
            }
            checkSibling = container.nextElementSibling ? container.nextElementSibling : (container.nextSibling ? container.nextSibling : null);
            if (checkSibling) {
              if (checkSibling.nodeName === 'I' && checkSibling.classList.contains('pin') && this.range.startOffset === container.length) {
                return;
              }
            }
            //console.log(container.previousElementSibling, container.previousSibling, this.range);
            let regexp = null;
            //console.log(container, container.length, this.range.endOffset);
            if (!isMac) {
              let wordString = `a-zA-Zа-яА-Я0-9À-ÿ\\u0600-\\u06FF\\ā\\ī\\ū\\ṛ\\ṝ\\ḷ\\ṅ\\ñ\\ṭ\\ḍ\\ṇ\\ś\\ṣ\\ḥ\\ṁ\\ṃ\\Ā\\Ī\\Ū\\Ṛ\\Ṝ\\Ḻ\\Ṅ\\Ñ\\Ṭ\\Ḍ\\Ṇ\\Ś\\Ṣ\\Ḥ\\Ṁ\\ufdfa\\’"\\?\\!\\:\\;\\.\\\\,\\/\\<\\>\\'\\*\\‒\\|“‘«”’»\\(\\[\\{﴾\\)\\]\\}\\-﴿؟؛…`;
              regexp = skipLengthCheck ? /^(\S+)|(\s+)$/i : new RegExp(`^([${wordString}]+[^${wordString}]+[${wordString}]*)|([^${wordString}]+[${wordString}]+)|(\\s+)$`, 'i');
              checkRange.setEnd( container, this.range.endOffset >= container.length ? this.range.endOffset : this.range.endOffset+1 );
              let checkString = checkRange.toString();
              if (/^\s$/.test(checkString.substring(checkString.length - 1, checkString.length))) {
                while (checkRange.endOffset < container.length && /^\s$/.test(container.data.substring(checkRange.endOffset, checkRange.endOffset + 1))) {// add all spaces till container end to range
                  checkRange.setEnd( container, checkRange.endOffset+1 );
                }
              }
              if (this.block.hasClass('whitespace', ['couplet'])) {
                if (/[\r\n]$/.test(checkRange.toString()) || /^[ ]*[\r\n]/.test(checkRange.toString())) {
                  return true;
                }
                regexp = /[\r\n]$/;// check for line end with line break
                if (container.parentElement && container.parentElement.nodeName === 'W' && !regexp.test(checkRange.toString())) {// for wrapped word check that next element is line break
                  if (container.length === checkRange.endOffset) {// end of line
                    if (container.parentElement.nextSibling && container.parentElement.nextSibling.nodeType === 3 && regexp.test(container.parentElement.nextSibling.nodeValue) && container.parentElement.nextElementSibling) {
                      regexp = /.*$/;
                    }
                  } else if (checkRange.toString().length <= 1) {// beginning of the line
                    if (container.parentElement.previousSibling && container.parentElement.previousSibling.nodeType === 3 && regexp.test(container.parentElement.previousSibling.nodeValue) && container.parentElement.previousElementSibling) {
                      regexp = /^.?/;
                    }
                  }
                }
              }
            } else {// Mac OS right mouse click selects psrt of the text
              checkRange.setEnd(container, this.range.endOffset);
              regexp = /^([\s]*)|(\s+\S*)$/i;
            }
            if (this.range.endOffset < container.length && checkRange.endOffset === container.length/* && !container.nextSibling*/ && /\s$/.test(checkRange.toString())) {// check if click made at the end of text with space
              if (!(container.parentElement && container.parentElement.nodeName !== 'DIV' && container.parentElement.nextSibling)) {
                //console.log(container.parentElement, container.parentElement.nextSibling, skipLengthCheck);
                let beforeDiv = container;
                while (beforeDiv && beforeDiv.parentElement.nodeName !== 'DIV') {// search for container before block wrapper, skip if it has no sibling
                  beforeDiv = beforeDiv.parentElement;
                }
                if (beforeDiv && !beforeDiv.nextSibling) {
                  return false;
                }
              }
            }
            /*console.log(checkRange.toString());
            if (this.range.startOffset > 0) {
              let _checkRange = document.createRange();
              //console.log(container, container.length, this.range.endOffset);
              _checkRange.setStart( container, this.range.startOffset-1 );
              _checkRange.setEnd( container, this.range.endOffset+1 );
              console.log(_checkRange.toString());
            }*/
        //regexp = skipLengthCheck ? /^(\S+)|(\s+)$/i : /^(\S+\s+)|(\s+\S+)|(\s+)$/;
            if (isMac) {
              console.log('IS ALLOWED', `"${checkRange.toString()}"`, regexp.test(checkRange.toString()), regexp, checkRange, this.range);
            }
            //console.log(`${skipLengthCheck}, '${checkRange.toString()}'`);
            return regexp.test(checkRange.toString());
          }
        }
        return false;
      },
      setSplitPoint() {
        let el = document.createElement('i');
        el.classList.add('pin');
        this.range.insertNode(el);
        //this.$parent.$forceUpdate();
        if (!this.isSplittedBlock) {
          this.splitPointAdded();
        } else {
          this.pushChange('split_point');
          this.isChanged = true;
        }
        let isMac = navigator && navigator.platform === 'MacIntel';
        if (isMac) {
          //console.log(this.$refs.blockContent.innerHTML);
          this.$refs.blockContent.innerHTML = this.$refs.blockContent.innerHTML.replace(/(<\/w><w[^>]*?>)(<i class="pin"><\/i>)/img, '$2$1');
          //console.log(this.$refs.blockContent.innerHTML);
        }
      },
      handlePinClick(e) {
        if (this.$refs.splitPinCntx && e.target) {
          //console.log(`OFFSET: ${-1 * e.target.offsetTop}, ${-1 * e.originalEvent.target.offsetTop}`)
          let container = $(e.target).closest('.-block.-subblock')[0];
          let offsetX = container.offsetLeft;
          this.$refs.splitPinCntx.open(e.originalEvent, container, /*this.mode === 'narrate' ? narrationShift : */offsetX, -1 * e.target.offsetTop);
          this.splitPinSelection = e.target;
        }
      },
      delSplitPoint() {
        if (this.splitPinSelection) {
          this.splitPinSelection.remove();
          this.splitPinSelection = null;
        }
      },
      splitPinCntxClose() {
        this.splitPinSelection = null;
      },
      mergeSubblocks(confirm = true) {
        let partFrom = this.blockPart;
        let partTo = this.block.parts[this.blockPartIdx + 1];
        if (partFrom && partTo) {
          if (this.isAudioChanged || partTo.isAudioChanged) {
            return false;
          }
          if (this.isChanged || this.isAudioChanged || partTo.isChanged || partTo.isAudioChanged) {

            this.$root.$emit('show-modal', {
              title: `Unsaved Changes`,
              text: `Subblocks have unsaved changes.<br>
Please save or discard your changes before joining.`,
              buttons: [
                {
                  title: 'Ok',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                  },
                  class: ['btn btn-primary']
                }
              ]
            });
          }
        }
        if (confirm) {
          let message = `Join with the next subblock?`;
          if (partFrom && partTo) {
            if ((partFrom.audiosrc && !partTo.audiosrc) || (!partFrom.audiosrc && partTo.audiosrc)) {
              message = `Join of narrated and pending subblocks will also delete current audio.<br>
Join with next subblock?`;
            }
          }
          this.$root.$emit('show-modal', {
            title: 'Join subblocks',
            text: message,
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$root.$emit('hide-modal');
                },
                class: ['btn btn-default']
              },
              {
                title: 'Join',
                handler: () => {
                  this.$root.$emit('hide-modal');
                  return this.mergeSubblocks(false);
                },
                class: ['btn btn-primary']
              }
            ],
            class: ['align-modal']
          });
        } else {
          this.$parent.isSaving = true;
          this.$parent.$forceUpdate();
          let isAudioEditorOpened = Array.isArray(this.$parent.$refs.blocks) ? this.$parent.$refs.blocks.find((b, i) => {
            return b.isAudioEditing;
          }) : false;
          return this.mergeBlockParts([this.block.blockid, this.blockPartIdx, this.blockPartIdx + 1])
            .then((response) => {
              if (this._isDestroyed) {
                this.storeListO.refresh();// hard reload if component was destroyed. If skip it than block is not updated in storeList
              }
              this.$parent.isSaving = false;
              /*if (this.isCompleted) {
                this.tc_loadBookTask(this.block.bookid);
                this.getCurrentJobInfo();
              }*/
              if (isAudioEditorOpened) {
                this.$root.$emit('for-audioeditor:force-close');
              }
              this.$parent.$parent.refreshTmpl();
              return Promise.resolve();
            });
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
              if (this.block.blockid === this.audioTasksQueue.block.blockId && this.blockPartIdx === this.audioTasksQueue.block.partIdx) {
                this.refreshBlockAudio();
                this.showAudioEditor();
              }
            }
          }

        }
      },
      'isLocked': {
        handler(val) {
          //console.log('IS LOCKED', val, this.block)
          if (this.blockPart.audiosrc) {
            this.blockAudio.src = this.blockAudiosrc('m4a');
          }
          if (val === false) {
            if (this.isCompleted) {
              this.tc_loadBookTask(this.block.bookid);
              this.getCurrentJobInfo();
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
      'blockPart.audiosrc': {
        handler(val) {
          //console.log(`audiosrc changed HERE ${val}`);
          this.blockAudio.src = this.blockAudiosrc('m4a');
          this.$forceUpdate();
        }
      },
      'isChanged' : {
        handler(val) {
          if (val === false) {
            this.flushChanges();
            this.recountVoicedBlocks();
          }
          if (!this.isSplittedBlock) {
            this.block.isChanged = val;
          } else {
            if (this.block.parts[this.blockPartIdx]) {
              this.block.parts[this.blockPartIdx].isChanged = val;
            }
          }
          this.recountApprovedInRange();
          if (this.audioTasksQueue.block.blockId === this.block.blockid && this.blockPartIdx !== null && this.blockPartIdx === this.audioTasksQueue.block.partIdx) {
            this.$root.$emit('for-audioeditor:lock-editing', val, this.audioEditorLockedSimultaneous);
          }
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
      'block.language' : {
        handler(val) {
          this.destroyEditor();
          this.initEditor(true);
        }
      },
      'block.footnotes' : {
        handler(val) {
          this.destroyEditor();
          this.initEditor(true);
        }
      },
      'audioTasksQueue.time': {
        handler(val, oldVal) {
          //console.log(`audioTasksQueue.time: ${val}`, Object.assign({}, this.audioTasksQueue));
          if (oldVal < val && this.audioTasksQueue.block.checkId === this.check_id) {
            //console.log('START ', this.check_id);
            //console.log('FIRE');
            //this.evFromAudioEditorTasksQueuePush(this.check_id);
          }
        },
        deep: true
      },
      'editingLocked': {
        handler(val) {
          this.destroyEditor();
          this.initEditor(true);
        }
      }/*,
      'audioTasksQueue.running': {
        handler(val) {
          //console.log(`audioTasksQueue.running: ${val}`, val);
          if (val === null && this.audioTasksQueue.blockId === this.check_id) {
            //console.log('CONTINUE', this.check_id);
            if (this.audioTasksQueue.queue.length > 0) {
              this.evFromAudioEditorTasksQueuePush(this.check_id);
            }
          }
        }
      },
      'audioTasksQueue.queue.length': {
        handler(val) {
          //console.log(`audioTasksQueue.running: ${val}`, val);
          if (this.audioTasksQueue.block.blockId === this.check_id) {
            //console.log('CONTINUE', this.check_id);
            if (this.audioTasksQueue.queue.length > 0) {
              this.evFromAudioEditorTasksQueuePush(this.check_id);
            }
          }
        }
      }*/
  }
}
</script>

<style lang='less'>

   .-content-block {
      .-mode-narrate & {
         padding-inline-end: 185px;
         @media all and (max-width: 1100px) {
            padding-inline-end: 0;
         }
         .meta-visible & {
            @media all and (max-width: 1540px) {
               padding-inline-end: 0;
            }
         }
      }
   }

</style>
