<template>
  <div ref="viewBlock" :id="block.blockid"
    :class="['table-body -block', '-mode-' + mode, blockOutPaddings, '-voicework-'  +block.voicework]">
    <div v-if="isLocked" :class="['locked-block-cover', 'content-process-run', 'preloader-' + lockedType]"></div>
    <div :class="['table-cell', 'controls-left', {'_-check-green': blockO.checked==true}]">

        <!-- <div class="table-row" v-if="meta.numbering !== 'none'">
            <div v-if="false" class='par-ctrl -hidden'>
                <i class="glyphicon glyphicon-volume-up"></i>
                <i class="glyphicon glyphicon-volume-off"></i>
            </div>
        </div> -->
        <div class="table-row check-row" v-if="allowEditing">

          <div class="set-range">
            <i class="fa fa-square-o -hidden" aria-hidden="true"
            v-if="isChecked === false"
            v-on:click="$event.target.checked = true; setRangeSelection('byOne', $event)"></i>
            <i class="fa fa-check-square-o" aria-hidden="true"
            v-if="isChecked === true"
            v-on:click="setRangeSelection('byOne', false)"></i>

            <template v-if="selectionStart && selectionStart !== selectionEnd">
            <i v-if="selectionEnd && block._id == selectionStart"
            class="fa fa-arrow-circle-down" aria-hidden="true"
            v-on:click="scrollToBlock(selectionEnd)"></i>
            <i v-if="selectionStart && block._id == selectionEnd"
            class="fa fa-arrow-circle-up" aria-hidden="true"
            v-on:click="scrollToBlock(selectionStart)"></i>
            </template>
          </div>
        </div>
    </div>
    <div class="table-cell" :class="{'completed': isCompleted}" >
        <div :class="['table-body', '-content', {'editing': isAudioEditing}, '-langblock-' + getBlockLang]"
        @mouseleave="onBlur"
        @click="onBlur">
            <div class="table-row-flex controls-top">
              <div v-if="isNumbered && (mode !== 'narrate' || isSplittedBlock)" :class="['par-ctrl', '-par-num', {'-hidden-hover': mode !== 'narrate'}]">
                <!--<i class="fa fa-hashtag"></i>-->
                <label ref="parnumRef" :class="['par-num', {'has-num': parnumComp.length}, {'hide-from': block.parHide || block.secHide}]">{{parnumComp}}</label>
              </div>
              <div class="par-ctrl -hidden">
                <div class="block-menu" v-if="mode !== 'narrate'">
                  <i class="glyphicon glyphicon-menu-hamburger"
                  @click.prevent="$refs.blockMenu.open($event, block._id)">
                  </i><!-- {{changes}} -->
                  <block-menu
                      ref="blockMenu"
                      dir="top"
                      :update="update"
                      @click.stop>

                    <li v-if="isHideArchFlags"
                      @click.prevent="toggleArchFlags()">
                      <i class="fa fa-eye" aria-hidden="true"></i>
                      Show archived flags</li>
                    <li v-else
                      @click.prevent="toggleArchFlags()">
                      <i class="fa fa-eye-slash" aria-hidden="true"></i>
                      Hide archived flags</li>

                    <li class="separator"></li>
                    <template v-if="allowEditing">
                      <li v-if="!isBlockLocked(prevId)" @click="insertBlockBefore()">
                        <i class="fa fa-angle-up" aria-hidden="true"></i>
                        Insert block before</li>
                      <li v-else class="disabled">
                        <i class="fa menu-preloader" aria-hidden="true"></i>
                        Insert block before</li>
                      <li v-if="!isBlocked" @click="insertBlockAfter()">
                        <i class="fa fa-angle-down" aria-hidden="true"></i>
                        Insert block after</li>
                      <li v-else class="disabled">
                        <i class="fa menu-preloader" aria-hidden="true"></i>
                        Insert block after</li>
                      <li v-if="!isBlockLocked(prevId)" @click="showModal('delete-block-message')">
                        <i class="fa fa-trash" aria-hidden="true"></i>
                        Delete block</li>
                      <li v-else class="disabled">
                        <i class="fa menu-preloader" aria-hidden="true"></i>
                        Delete block</li>
                      <!--<li>Split block</li>-->
                      <li v-if="!isBlockLocked(block._id) && !isBlockLocked(prevId)" @click="joinWithPrevious()">
                        <i class="fa fa-angle-double-up" aria-hidden="true"></i>
                        Join with previous block</li>
                      <li v-else class="disabled">
                        <i class="fa menu-preloader" aria-hidden="true"></i>
                        Join with previous block</li>
                      <li v-if="!isBlockLocked(block._id) && !isBlockLocked(block.chainid)" @click="joinWithNext()">
                        <i class="fa fa-angle-double-down" aria-hidden="true"></i>
                        Join with next block</li>
                      <li v-else class="disabled">
                        <i class="fa menu-preloader" aria-hidden="true"></i>
                        Join with next block</li>
                      <li class="separator"></li>
                      <li @click.stop="function(){return false}" v-if="block.type=='title' || block.type=='header' || block.type=='par' || block.type=='illustration'">
                          <i class="fa fa-language" aria-hidden="true"></i>
                          Language: <select v-model='block.language' style="min-width: 100px;" @input.prevent="selectLangSubmit($event);">
                          <option v-for="(val, key) in blockLanguages" :value="key">{{ val }}</option>
                        </select>
                      </li>
                      <li class="separator"></li>
                      <template v-if="block.type != 'illustration' && block.type != 'hr'">
                      <li @click="showModal('block-html')">
                        <i class="fa fa-code" aria-hidden="true"></i>
                        Edit HTML</li>
                      <li class="separator"></li>
                      </template>
                    </template>
                    <li @click="discardAudio" v-if="allowAudioRevert">
                      <i class="fa fa-cloud-download" aria-hidden="true"></i>
                      Revert to original audio</li>
                  </block-menu>
                </div>
                <!--<div class="block-menu">-->
                <div class="par-ctrl-divider"></div>

                <!--<i class="fa fa-trash-o fa-lg"></i>-->
                <!--<i class="fa fa-pencil-square-o fa-lg"></i>-->

                <template v-if="allowEditing">
                  <!--{{blockO.rid}} - {{isNumbered}}-->
                  <div v-if="isNumbered"
                    :class="['parnum-row', {'-locked': blockO.isManual==true}]">

                    <input v-if="block.type=='header'"
                      @input="setNumVal" v-model="blockO.secnum"
                      class="num" type="text" maxlength="12" size="12"/>
                    <input v-if="block.type=='par'"
                      @input="setNumVal" v-model="blockO.parnum"
                      class="num" type="text" maxlength="12" size="12"/>

                  </div>
                  <!--<div v-else class="parnum-row"></div>-->
                  <div class="par-ctrl-divider"></div>
                  <div class="par-ctrl-divider"></div>

                  <!-- Block Type selector -->
                  <label>
                    <select v-model="block.type" @input="setChanged(true, 'type', $event)"><!--v-model='block.type'--><!--:value="type"-->
                      <option v-for="(type, key) in blockTypes" :value="key">{{ key }}</option>
                    </select>
                  </label>

                  <div class="par-ctrl-divider"></div>

                  <template v-if="allowVoiceworkChange()">
                    <i class="fa fa-volume-off"></i>
                    <div class="par-ctrl-divider"></div>
                    <label>
                      <select v-model='voiceworkSel'>
                        <option v-for="(val, key) in blockVoiceworksSel" :value="key">{{ val }}</option>
                      </select>
                    </label>
                  </template>
                  <template v-else>
                    <i class="fa fa-volume-off"></i>
                    <div class="par-ctrl-divider"></div>
                    <label>
                      <span>{{blockVoiceworks[block.voicework]}}</span>
                    </label>
                  </template>
                </template>
                <template v-else >

                </template>
              </div>
              <!--<div class="par-ctrl -hidden">-->
               <!-- <div class="par-ctrl -audio -hidden" v-if="mode !== 'narrate'">
                <template v-if="player && blockAudio.src && !isRecording">
                    <template v-if="!isAudStarted">
                      <i class="fa fa-pencil" v-on:click="showAudioEditor()" v-if="tc_showBlockAudioEdit(block._id) && !isUpdating && mode === 'edit'"></i>
                      <i class="fa fa-play-circle-o"
                        @click="audPlay(block._id, $event)"></i>
                      <i class="fa fa-stop-circle-o disabled"></i>
                    </template>
                    <template v-else>
                      <i class="fa fa-pause-circle-o" v-if="!isAudPaused"
                        @click="audPause(block._id, $event)"></i>
                      <i class="fa fa-play-circle-o paused" v-else
                        @click="audResume(block._id, $event)"></i>
                      <i class="fa fa-stop-circle-o"
                        @click="audStop(block._id, $event)"></i>
                    </template>
                </template>
              </div> -->
              <!--<div class="par-ctrl -hidden">-->
            </div>
            <!--<div class="table-row-flex controls-top">-->

            <!-- <div style="" class="preloader-container">
              <div v-if="isUpdating" class="preloader-small"> </div>
            </div> -->
            <BookBlockPartView v-for="(blockPart, blockPartIdx) in blockParts" v-bind:key="block.blockid + '-' + blockPartIdx" ref="blocks"
              :block="block"
              :blockO="blockO"
              :blockId = "blockId"
              :putBlock ="putBlock"
              :getBlock ="getBlock"
              :putBlockPart ="putBlockPart"
              :putBlockO ="putBlockO"
              :putNumBlockO ="putNumBlockO"
              :recorder ="recorder"
              :blockReindexProcess="blockReindexProcess"
              :getBloksUntil="getBloksUntil"
              :allowSetStart="allowSetStart"
              :allowSetEnd="allowSetEnd"
              :prevId="prevId"
              :putBlockProofread="putBlockProofread"
              :putBlockNarrate="putBlockNarrate"
              :blockPart="blockPart"
              :blockPartIdx="blockPartIdx"
              :isSplittedBlock="isSplittedBlock"
              :parnum="subBlockParnumComp"
              :assembleBlockAudioEdit="assembleBlockAudioEdit"
              :insertSilence="insertSilence"
              :audDeletePart="_audDeletePart"
              :startRecording="startRecording"
              :initRecorder="initRecorder"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
              :joinBlocks="joinBlocks"
              :discardAudioEdit="discardAudioEdit"
              :stopRecording="stopRecording"
              :delFlagPart="delFlagPart"
              @setRangeSelection="setRangeSelection"
              @blockUpdated="$emit('blockUpdated')"
              @cancelRecording="cancelRecording"
              @save="saveBlockPart"
              @hasChanges="onPartChanges"
              @addFootnote="addFootnote"
              @partAudioComplete="partAudioComplete"
              @addFlagPart="onAddFlagPart"
              @addFlag="addFlag"
              @inputFlag="onInputFlag"
              @resolveFlagPart="onResolveFlagPart"
              @reopenFlagPart="onReopenFlagPart"
              @hideFlagPart="onHideFlagPart"
              @unHideFlagPart="onUnHideFlagPart"
              @isAudioEditing="onIsAudioEditing"
              @isAudioChanged="onIsAudioChanged"
          /></BookBlockPartView>
            <div v-if="blockParts.length === 1" class="hidden" ref="blockContent" v-html="blockParts[0].content"></div>
          <div class="ilm-block flag-popup-container">
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
                  @click.prevent="delFlagPart($event, partIdx)">
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

                </template>
              </template>
              </template>

            </block-flag-popup>
          </div>
            <div class="table-row content-footnotes"
              v-if="block.footnotes.length > 0 && mode !== 'narrate'">
              <div class="table-body footnote"
                v-for="(footnote, ftnIdx) in block.footnotes">

                <div class="table-row controls-top -hidden">
                  <div class="table-cell"></div>
                  <div class="table-cell">
                    <template v-if="allowEditing">
                      <template v-if="allowVoiceworkChange">
                        <label>
                          <i class="fa fa-volume-off"></i>

                          <select v-model='footnote.voicework' style="min-width: 100px;" @input="commitFootnote(ftnIdx, $event, 'voicework')">
                            <option v-for="(val, key) in footnVoiceworks" :value="key">{{ val }}</option>
                          </select>
                        </label>
                        <label><i class="fa fa-language" aria-hidden="true"></i>
                        <select v-model='footnote.language' style="min-width: 100px;" @input="commitFootnote(ftnIdx, $event, 'language')">
                          <option v-for="(val, key) in footnLanguages" :value="key">{{ val }}</option>
                        </select>
                        </label>
                      </template>
                    </template>
                  </div>
                  <div class="table-cell -audio -right">
                    <template v-if="(footnote.audiosrc && footnote.audiosrc.length) && ((_is('editor', true) || adminOrLibrarian) && tc_isShowEdit(block._id))"> <!--&& !isAudioChanged"-->
                      <i class="fa fa-pencil" v-on:click="showFootnoteAudioEditor(footnote, ftnIdx, $event)" v-if="allowEditing"></i>
                    </template>
                    <template v-if="FtnAudio.palyer!==false && footnote.audiosrc && footnote.audiosrc.length">
                        <template v-if="!FtnAudio.isStarted || FtnAudio.isStarted!==`${block._id}_${ftnIdx}`">
                          <i class="fa fa-play-circle-o"
                            @click="FtnAudio.audPlay(block._id, ftnIdx)"></i>
                          <i class="fa fa-stop-circle-o disabled"></i>
                        </template>
                        <template v-else>
                          <i class="fa fa-pause-circle-o" v-if="!FtnAudio.isPaused"
                            @click="FtnAudio.audPause(block._id, ftnIdx)"></i>
                          <i class="fa fa-play-circle-o paused" v-else
                            @click="FtnAudio.audResume(block._id, ftnIdx)"></i>
                          <i class="fa fa-stop-circle-o"
                            @click="FtnAudio.audStop(block._id, ftnIdx)"></i>
                          <!--<div class="empty-control"></div>--><!-- empty block to keep order -->
                        </template>
                    </template>
                  </div>
                </div>

                <div class="table-row">
                  <div class="table-cell -num">{{ftnIdx+1}}.</div>
                  <div class="content-wrap-footn table-cell -text"
                    :id="block._id +'_'+ ftnIdx"
                    :data-audiosrc="block.getAudiosrcFootnote(ftnIdx, 'm4a', true)"
                    :data-footnoteIdx="block._id +'_'+ ftnIdx"
                    :class="['js-footnote-val', 'js-footnote-'+ block._id, {'playing': (footnote.audiosrc)}, '-langftn-' + getFtnLang(footnote.language)]"
                    @input="commitFootnote(ftnIdx, $event)"
                    @inputSuggestion="commitFootnote(ftnIdx, $event, 'suggestion')"
                    v-html="footnote.content"
                    :ref="'footnoteContent_' + ftnIdx">
                  </div>
                  <div class="table-cell -control" v-if="allowEditing">
                    <span @click="delFootnote([ftnIdx])"><i class="fa fa-trash"></i></span>
                  </div>
                </div>
              </div>
            </div>

            <div class="table-row controls-bottom">
              <div class="-hidden -left">
                <span>
                  <i :class="['glyphicon', 'glyphicon-flag']"
                    ref="blockFlagControl"
                    @click="handleBlockFlagClick"
                  ></i>
                </span>
              </div>
              <div class="par-ctrl -hidden -right">
                  <div class="save-block -right" @click="discardBlock"
                       v-bind:class="{'-disabled': !hasChanges || isAudioEditing}">
                    Discard
                  </div>
                  <div class="save-block -right"
                  v-bind:class="{ '-disabled': (!isChanged && (!isAudioChanged || isAudioEditing) && !isIllustrationChanged) }"
                  @click="assembleBlockProxy(true)">
                    {{saveBlockLabel}}
                  </div>
                  <template v-if="!isCompleted">
                  <div v-if="!enableMarkAsDone" :class="['save-block', '-right', {'-disabled': isNeedWorkDisabled || isApproving}]"
                    @click.prevent="reworkBlock">
                    Need work</div>
                  <div v-if="!enableMarkAsDone" :class="['save-block', '-right', {'-disabled': isApproveDisabled || isApproving, 'approve-waiting': approveWaiting}]"
                    @click.prevent="approveBlock">
                    Approve</div>

                  <div v-if="enableMarkAsDone" :class="['save-block', '-right', {'-disabled': markAsDoneButtonDisabled}]"
                    @click.prevent="markBlock">
                    Approve</div>
                  <div :class="['save-block', '-right', {'-disabled': isSpotCheckDisabled }]" @click.prevent="spotCheck">
                    Spot check
                  </div>

                  </template>
              </div>
              <!--<div class="-hidden">-->
            </div>
            <!--<div class="table-row controls-bottom">-->
        </div>
        <!--<div :class="['table-body', '-content',-->
    </div>
    <!--<div :class="['table-cell'-->
    <div class="table-cell controls-right">
    </div>
    <modal :name="'delete-block-message' + block._id" :resizeable="false" :clickToClose="false" height="auto">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>Delete block?</p>
      </div>
      <div class="modal-footer">
        <template v-if="deletePending">
          <div class="voicework-preloader"></div>
        </template>
        <template v-else>
          <button class="btn btn-default" v-on:click="hideModal('delete-block-message')">Cancel</button>
          <button class="btn btn-primary" v-on:click="deleteBlock()">Delete</button>
        </template>
      </div>
    </modal>
    <modal :name="'voicework-change' + block._id" :resizeable="false" :height="250">
      <!-- custom header -->
      <div class="modal-header">
        <h4 class="modal-title">
          Voicework update
        </h4>
      </div>
      <div class="modal-body">
        <div>Apply "{{blockVoiceworks[voiceworkChange]}}" voicework type to</div>
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="single" :disabled="voiceworkUpdating"/>this {{blockTypeLabel}}</label></div>
        <div><label><input type="radio" name="voicework-update-type" v-model="voiceworkUpdateType" value="all" :disabled="voiceworkUpdating"/>all unapproved {{blockTypeLabel}}s</label></div>
        <div>This will also delete current audio from the {{blockTypeLabel}}(s)</div>
      </div>
      <!-- custom buttons -->
      <div class="modal-footer">
        <template v-if="!voiceworkUpdating">
          <button type="button" class="btn btn-default" @click="voiceworkChange = false">Cancel</button>
          <button type="button" class="btn btn-confirm" @click="updateVoicework()">Apply</button>
        </template>
        <template v-else>
          <div class="voicework-preloader"></div>
        </template>
      </div>
    </modal>
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
import BookBlockPartView from './BookBlockPartView';
var BPromise = require('bluebird');
Vue.use(v_modal, { dialog: true });

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
      'vue-picture-input': VuePictureInput,
      BookBlockPartView: BookBlockPartView
  },
  props: ['block', 'blockO', 'putBlockO', 'putNumBlockO', 'putBlock', 'putBlockPart', 'getBlock',  'recorder', 'blockId', 'audioEditor', 'joinBlocks', 'blockReindexProcess', 'getBloksUntil', 'allowSetStart', 'allowSetEnd', 'prevId', 'mode', 'putBlockProofread', 'putBlockNarrate', 'initRecorder'],
  mixins: [taskControls, apiConfig, access],
  computed: {
      isLocked: function () {
        if (this.isSaving) {
          return true;
        }
        if (this.isUpdating) {
          return true;
        }
        return this.hasLock;
      },
      hasLock: {
        get() {
          return this.block ? this.isBlockLocked(this.block.blockid) : false;
        }
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
          if (this.blockO.type == 'header' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.secnum;
          }
          if (this.blockO.type == 'par' && this.blockO.isNumber && !this.blockO.isHidden) {
            return this.blockO.parnum;
          }
          return '';
      }},
      subBlockParnumComp: {
        get: function() {
          if (this.blockO.type == 'header' && this.blockO.isNumber) {
            return this.blockO.secnum;
          }
          if (this.blockO.type == 'par' && this.blockO.isNumber) {
            return this.blockO.parnum;
          }
          return '';
        },
        cache: false
      },
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
          let partsDisabled = false;
          if (this.$refs.blocks) {
            this.$refs.blocks.forEach(ref => {
              if (ref.isApproveDisabled) {
                partsDisabled = true;
              }
            })
          }
          if (partsDisabled || this.isChanged || this.isAudioChanged || this.isAudioEditing || this.isIllustrationChanged || this.isRecording || this.isUpdating) {
            return true;
          }
          if (this.hasLockedPart) {
            return true;
          }
          return this.tc_isApproveDisabled(this.block, this.mode);
        }
      },
      hasLockedPart: {
        get() {
          let hasLocked = false;
          if (this.$refs.blocks) {
            this.$refs.blocks.forEach(ref => {
              if (ref.isLocked) {
                hasLocked = true;
              }
            })
          }
          return hasLocked;
        },
        cache: false
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

          return this.mode != 'edit' || !this.block || this.isSplittedBlock || this.tc_isSpotCheckDisabled(this.block);
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
          if (this.changes && this.block.audiosrc) {
            if (this.changes.indexOf('content') !== -1 || this.changes.indexOf('suggestion') !== -1) {
              return true;
            }
          }
          return false;
        },
        cache: false
      },
      isSplittedBlock: {
        get() {
          if (this.block.voicework === 'narration' && !this.currentJobInfo.text_cleanup && Array.isArray(this.block.parts) && this.block.parts.length > 1 && !(this.currentJobInfo.mastering || this.currentJobInfo.mastering_complete)) {
            return true;
          }
          return false;
        },
        cache: false
      },
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
          blockLockType: 'blockLockType'
      }),
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
      blockParts: {
        get() {
          if (this.isSplittedBlock) {
            return this.block.parts;
          } else {
            return [
              {
                content: this.block.content,
                audiosrc: this.block.audiosrc,
                audiosrc_ver: this.block.audiosrc_ver,
                manual_boundaries: this.block.manual_boundaries
              }
            ];
          }
        },
        cache: false
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
      this.blockAudio = {'map': this.block.content, 'src': this.block.getAudiosrc('m4a')};
      if (!this.player && this.blockAudio.src) {
          this.initPlayer();
      }

      if (this.block.footnotes && this.block.footnotes.length) {
        this.block.footnotes.forEach((footnote, footnoteIdx)=>{
          if (footnote.audiosrc && !this.FtnAudio.player) {
            this.initFootnotePlayer(this.FtnAudio);
            return true;
          }
        });
      }

      this.updateFlagStatus(this.block._id);
      if (Object.keys(this.blockTypes[this.block.type])[0] !== '') {
        this.classSel = Object.keys(this.blockTypes[this.block.type])[0];
      } else {
        let blockClasses = Object.keys(this.block.classes);
        if (blockClasses.length) {
          this.classSel = blockClasses[0];
        }
      }

      //this.voiceworkSel = this.block.voicework;
      this.isChanged = this.block.isChanged;
      this.isAudioChanged = this.block.isAudioChanged;
      this.isIllustrationChanged = this.block.isIllustrationChanged;
      if (this.block.changes) {
        this.changes = this.block.changes;
        delete this.block.changes;
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
      this.$root.$on('saved-block:' + this.block._id, () => {
        this.isChanged = false;
        this.isAudioChanged = false;
        this.isIllustrationChanged = false;
        this.recountApprovedInRange();
      });
      this.$root.$on(`save-block:${this.block.blockid}`, (evt) => {
        evt.waitUntil(new Promise((resolve, reject) => {
          this.assembleBlockProxy(false, false)
            .then(() => {
              resolve();
            })
        }));
      });
      this.$root.$on('prepare-alignment', this._saveContent);
      this.$root.$on('from-styles:styles-change-' + this.block.blockid, this.setClasses);

      if (!this.block.language) this.block.language = this.meta.language;

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
    if (this.block && this.isChanged) {
        this.block.changes = this.changes;
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
        if (this.isSplittedBlock) {
          this.blockParts.forEach((part, partIdx) => {
            if (!this.$refs.blocks[partIdx].isChanged && this.$refs.blocks[partIdx].$refs.blockContent) {
              this.block.setPartContent(partIdx, this.$refs.blocks[partIdx].clearBlockContent());
            }
          });
        }
    }

    if (this.$refs.blockContent) {
      this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
        flag.removeEventListener('click', this.handleFlagClick);
      });
    }
  },
  destroyed: function () {
    this.$root.$off('playBlockFootnote');
    this.$root.$off('playBlock');

    if(this.block) {

      this.$root.$off('saved-block:' + this.block._id);

      this.$root.$off('from-audioeditor:closed', this.evFromAudioeditorClosed);
      this.$root.$off(`save-block:${this.block.blockid}`);

    }

    this.destroyEditor();
    this.$root.$off('prepare-alignment', this._saveContent);
    this.$root.$off('from-styles:styles-change-' + this.block.blockid, this.setClasses);
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
        'getBookAlign',
        'updateBlockPart'
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
        if (!this.tc_getBlockTask(this.block._id) && !this.tc_getBlockTaskOtherRole(this.block._id)) {
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
                else if (!(this.block.audiosrc && this.block.audiosrc.length)) canFlag = false;
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

      destroyEditor(destroyPart = false) {
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
        if (destroyPart) {
          this.$refs.blocks.forEach(blk => {
            blk.destroyEditor();
          });
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
                  //'superscript', 'subscript',
                  'unorderedlist',
                  //'html', 'anchor',
                  'quoteButton', 'suggestButton'
                ]
              };
            this.editor = new MediumEditor('#content-' + this.block._id, {
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
            this.editor = new MediumEditor('#content-' + this.block._id, {
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
          this.$refs.blockCntx.open(e, this.range);
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
        this.isChanged = true;
        this.pushChange('flags');
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

        let checked = this.block.checked;
        this.getBlock(this.block._id)
        .then((block)=>{
          this.isChanged = false;
          this.isIllustrationChanged = false;
          if (this._isDestroyed) {
            this.block.isChanged = false;
            this.block.isIllustrationChanged = false;
            this.block.isAudioEditing = false;
            this.block.changes = [];
            return Promise.resolve();
          }

          if (this.$refs.blocks) {
            if (this.mode !== 'narrate') {
            } else {
              this.block.content = block.content;
            }
            //this.$refs.blockContent.focus();
            this.blockParts.forEach((part, partIdx) => {
              if (this.$refs.blocks[partIdx].$refs.blockContent) {
                this.$refs.blocks[partIdx].$refs.blockContent.innerHTML = part.content;
                this.block.setPartContent(partIdx, part.content);
                Vue.nextTick(() => {
                  this.$refs.blocks[partIdx].addContentListeners();
                });
              }
              this.$refs.blocks[partIdx].isIllustrationChanged = false;
              if (this.$refs.blocks[partIdx].$refs.blockFlagPopup) {
                this.$refs.blocks[partIdx].$refs.blockFlagPopup.close();
              }
            });
          }
          if (this.$refs.blockFlagPopup) {
            this.$refs.blockFlagPopup.close();
          }
          this.block.footnotes = block.footnotes ? block.footnotes : [];
          this.block.footnotes.forEach((ftn, ftnIdx) => {
            let ref = this.$refs['footnoteContent_' + ftnIdx];
            if (ref && ref[0]) {
              ref[0].innerHTML = ftn.content;
            }
          });
          if (this.block.footnotes.length > 0) {
            this.initFtnEditor(true);
          }
          this.block.setAudiosrc(block.audiosrc, block.audiosrc_ver);
          this.refreshBlockAudio();

          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });

          this.updateFlagStatus(block._id);
          if (this.block.type === 'illustration' && this.$refs.blocks && this.$refs.blocks[0]) {
            if (this.$refs.blocks[0].$refs.illustrationInput) {
              this.$refs.blocks[0].$refs.illustrationInput.removeImage();
            }
            this.block.description = block.description;
            if (this.$refs.blocks[0].$refs.blockDescription) {
              this.$refs.blocks[0].$refs.blockDescription.innerHTML = block.description;
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

      discardAudioEdit: function(footnoteIdx = null, reload = true, partIdx = null, check_id = null) {
        if (!this.isSplittedBlock) {
          partIdx = null;
        }
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
        if (footnoteIdx !== null) {
          api_url+= '/footnote/' + footnoteIdx;
        }
        if (partIdx !== null) {
          api_url+= '/part/' + partIdx;
        }
        let api = this.$store.state.auth.getHttp();
        return api.delete(api_url, {}, {})
          .then(response => {
            if (response.status == 200 && response.data) {
              if (partIdx !== null) {

                let part = response.data.parts[partIdx];
                this.block.setPartContent(partIdx, part.content);
                this.block.setPartAudiosrc(partIdx, part.audiosrc, part.audiosrc_ver);
                this.block.setPartManualBoundaries(partIdx, part.manual_boundaries || []);
                part._id = check_id;
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', this.block.getPartAudiosrc(partIdx, 'm4a'), this.block.getPartContent(partIdx), true, part);
                }
              } else if (footnoteIdx === null) {
                this.block.content = response.data.content;
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.map = response.data.content;
                //this.block.audiosrc = this.blockAudio.src;
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.block.manual_boundaries = response.data.manual_boundaries || [];
                this.isAudioChanged = false;
                this.unsetChange('audio');
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map, false, this.block);
                }
              } else {
                let resp_block = response.data;
                let resp_f = resp_block.footnotes[footnoteIdx];
                this.block.setContentFootnote(footnoteIdx, resp_f.content);
                this.block.setAudiosrcFootnote(footnoteIdx, resp_f.audiosrc, resp_f.audiosrc_ver);
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content, false, Object.assign({_id: this.check_id}, this.audioEditFootnote.footnote));
                }
                this.audioEditFootnote.isAudioChanged = false;
              }
            }
            return Promise.resolve();
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },

      assembleBlockProxy: function (check_realign = true, realign = false) {
        if (this.isSplittedBlock && this.$refs.blocks) {
          this.$refs.blocks.forEach((blk, blkIdx) => {
            this.block.setPartContent(blkIdx, blk.clearBlockContent());
          });
        }
        if (this.mode === 'proofread') {
          return this.assembleBlockProofread();
        } else if (this.mode === 'narrate') {
          return this.assembleBlockNarrate();
        }
        if (check_realign === true && this.needsRealignment && Array.isArray(this.block.manual_boundaries) && this.block.manual_boundaries.length > 0) {
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
        switch (this.block.type) {
          case 'illustration':
            if (!this.$refs.blocks || !this.$refs.blocks[0]) {
              return Promise.reject();
            }
            this.block.description = this.$refs.blocks[0].$refs.blockDescription.innerHTML;
            this.block.voicework = 'no_audio';
            this.block.content = '';
            break;
          case 'hr':
            this.block.content = '';
            this.block.voicework = 'no_audio';
            break;
          default:
            this.block.content = this.clearBlockContent();
            if (this.mode !== 'narrate') {
              if (this.block.footnotes && this.block.footnotes.length && this.$refs.blocks) {
                let footnotesInText = [];
                this.$refs.blocks.forEach((blk, blkIdx) => {
                  let blkFootnotes = document.getElementById(`${this.block.blockid}-${blkIdx}`).querySelectorAll(`sup[data-idx]`);
                  if (blkFootnotes) {
                    blkFootnotes.forEach(bf => {
                      footnotesInText.push(bf.getAttribute('data-idx'));
                    })
                  }
                });
                let delCount = this.block.footnotes.length - footnotesInText.length;
                if (delCount > 0) {
                  let delIdxList = [];
                  this.block.footnotes.forEach((ftn, ftnIdx) => {
                    let footnote = footnotesInText.find(fin => {
                      return fin == ftnIdx + 1
                    });
                    if (!footnote) {
                      delIdxList.push(ftnIdx);
                    }
                  });
                  this.delFootnote(delIdxList, false);
                  this.block.content = this.clearBlockContent();
                }
                if (!delCount) {
                  this.block.footnotes.forEach((footnote, footnoteIdx)=>{
                    this.block.footnotes[footnoteIdx].content = this.clearBlockContent($('[data-footnoteIdx="'+this.block._id +'_'+ footnoteIdx+'"').html());
                  });
                }
              }
            }
            break;
        }
        if (this.block.type == 'illustration') {
          if (this.isIllustrationChanged) {
            return this.uploadIllustration();
          } else if (this.isChanged) {
            return this.assembleBlock({
              description: this.block.description,
              voicework: this.block.voicework,
              content: this.block.content,
              blockid: this.block.blockid
            });
          }
        } else {
          if (this.isAudioChanged && !this.isAudioEditing) return this.assembleBlockAudio();
          else if (this.isChanged) {
            let fullUpdate = false;
            this.block.clean();
            let partUpdate = {blockid: this.block.blockid, bookid: this.block.bookid};
            if (this.isSplittedBlock) {
              partUpdate.parts = this.block.parts;
            }
            if (this.changes && Array.isArray(this.changes)) {
              this.changes.forEach(c => {
                switch(c) {
                  case 'content':
                    fullUpdate = true;
                    partUpdate.content = this.block.content;
                    partUpdate.manual_boundaries = this.block.manual_boundaries || [];
                    break;
                  case 'footnotes':
                    fullUpdate = true;
                    partUpdate.footnotes = this.block.footnotes;
                    partUpdate.content = this.block.content;
                    break;
                  case 'footnotes_language':
                    fullUpdate = true;
                    partUpdate.footnotes = this.block.footnotes;
                    break;
                  case 'type':
                    fullUpdate = true;
                    partUpdate.type = this.block.type;
                    break;
                  case 'language':
                    fullUpdate = true;
                    partUpdate.language = this.block.language;
                    break;
                  case 'suggestion':
                    partUpdate['content'] = this.block.content;
                    if (this.block.audiosrc) {
                      fullUpdate = true;
                    }
                    break;
                  case 'footnotes_voicework':
                  case 'footnotes_suggestion':
                    partUpdate['footnotes'] = this.block.footnotes;
                    break;
                  case 'flags':
                    this.checkBlockContentFlags();
                    this.updateFlagStatus(this.block._id);
                    partUpdate['flags'] = this.block.flags;
                    partUpdate['content'] = this.block.content;
                    partUpdate['parts'] = this.block.parts;
                    break;
                  default:
                    partUpdate[c] = this.block[c];
                    break;
                }
              });
            }
            if (this.block.status.marked) {
              partUpdate['status'] = partUpdate['status'] || {};
              partUpdate.status.marked = false;
            }
            let updateTask = null;
            if (fullUpdate) {
              updateTask = this.assembleBlock(partUpdate, realign);
            } else {
              updateTask = this.assembleBlockPart(partUpdate);
            }
            return updateTask
              .then(() => {

              });
          }
        }
        return BPromise.resolve();
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
            this.$root.$emit('for-audioeditor:set-process-run', false);
            this.$root.$emit('for-audioeditor:reload-text', this.block.content, this.block);
          }
          //this.$refs.blockContent.dataset.has_suggestion = false;
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
      saveBlockPart(blockPart, blockPartIdx, realign) {
        //console.log(arguments);
        let update = {};
        let isPartUpdate = this.isSplittedBlock;
        //if (!isPartUpdate) {
          Object.keys(blockPart).forEach(k => {
            update[k] = blockPart[k];
          });
        //} else {
          //update.parts = this.block.parts;
          //Object.keys(blockPart).forEach(k => {
            //update.parts[blockPartIdx][k] = blockPart[k];
          //});
        //}
        let updateTask;
        if (this.mode !== 'narrate') {
          if (this.block.footnotes && this.block.footnotes.length) {
            let footnotesInText = document.getElementById(this.block.blockid).querySelectorAll(`sup[data-idx]`);
            if (footnotesInText) {
              footnotesInText = footnotesInText.length;
            } else {
              footnotesInText = 0;
            }
            let delCount = this.block.footnotes.length - footnotesInText;
            if (this.block.footnotes.length > footnotesInText && this.$refs.blocks) {
              let delIdxList = [];
              let contentMerged = '';
              this.$refs.blocks.forEach(blk => {
                contentMerged+= blk.$refs.blockContent.innerHTML;
              })
              this.block.footnotes.forEach((ftn, ftnIdx) => {
                let footnote = $(`<div>${contentMerged}</div>`).find(`sup[data-idx='${ftnIdx + 1}']`);
                if (!footnote || footnote.length === 0) {
                  delIdxList.push(ftnIdx);
                }
              });
              this.delFootnote(delIdxList, false);
              this.block.content = this.clearBlockContent();
            }
            if (!delCount) {
              this.block.footnotes.forEach((footnote, footnoteIdx)=>{
                this.block.footnotes[footnoteIdx].content = this.clearBlockContent($('[data-footnoteIdx="'+this.block._id +'_'+ footnoteIdx+'"').html());
              });
            }
          }
        }
        if (!isPartUpdate) {
          update.blockid = this.block.blockid;
          update.bookid = this.block.bookid;
          if (!realign) {
            updateTask = this.assembleBlockPart(update);
          } else {
            updateTask = this.assembleBlock(update, realign);
          }
        } else {
          updateTask = this.updateBlockPart([this.block._rid, update, blockPartIdx, realign]);
        }
        return updateTask
          .then(() => {
            this.isChanged = false;
            if (this.$refs && this.$refs.blocks[blockPartIdx]) {
              this.$refs.blocks[blockPartIdx].isSaving = false;
            }
          })
          .catch(err => {
            if (this.$refs && this.$refs.blocks[blockPartIdx]) {
              this.$refs.blocks[blockPartIdx].isSaving = false;
            }
          })
      },
      assembleBlockProofread() {
        if (this.$refs.blockContent) {
          this.block.content = this.clearBlockContent();
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
        if (check_realign === true && this.needsRealignment && Array.isArray(this.block.manual_boundaries) && this.block.manual_boundaries.length > 0) {
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
        this.block.content = this.clearBlockContent();
        this.isSaving = true;
        return this.putBlockNarrate([this.block.clean(), realign])
          .then(() => {
            this.isSaving = false;
            this.isChanged = false;
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      clearBlockContent: function(content = false) {
        if (!content) {
          content = '';
          this.$refs.blocks.forEach((blk, idx) => {
            let cnt = blk.clearBlockContent();
            content+= cnt;
            this.block.setPartContent(idx, cnt);
          });
        }
        //console.log(content)
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
        content = content.replace(/<p[^>]*>([\s\S]*?)<br[^>]*><\/p>/, '<p>$1</p>');
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
            let node = this.$refs.blocks.find(blk => {
              return blk.$refs.blockContent.querySelector(`[data-flag="${flag._id}"]`);
            });
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

      assembleBlockAudioEdit: function(footnoteIdx = null, realign = false) {// to save changes from audio editor
        let manual_boundaries = [];
        if (this.footnoteIdx) {
          if (this.audioEditFootnote && this.audioEditFootnote.footnote) {
            manual_boundaries = this.audioEditFootnote.footnote.manual_boundaries || [];
          }
        } else {
          manual_boundaries = this.block.manual_boundaries || [];
        }
        if ((this.blockAudio.map && this.blockAudio.src) || (typeof footnoteIdx !== 'undefined' && footnoteIdx !== null && this.audioEditFootnote.footnote)) {
          let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_edit';
          let api = this.$store.state.auth.getHttp();
          let data = {};
          if (footnoteIdx === null) {
            data = {
              //audiosrc: this.block.getAudiosrc(null, false),
              //content: this.blockAudio.map,
              //manual_boundaries: this.block.manual_boundaries
              audiosrc: this.block.getPartAudiosrc(0, null, false),
              content: this.block.getPartContent(0),
              manual_boundaries: this.block.getPartManualBoundaries(0),
              mode: this.mode
            };
          } else {
            data = {
              audiosrc: this.block.getAudiosrcFootnote(footnoteIdx, null, false),
              content: this.audioEditFootnote.footnote.content,
              footnote_idx: footnoteIdx,
              manual_boundaries: this.audioEditFootnote.footnote.manual_boundaries || []
            }
          }
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
                //this.$emit('blockUpdated', this.block._id);
                this.isAudioChanged = false;
                this.isChanged = false;
                this.block.isAudioChanged = false;
                this.block.isChanged = false;
                if (footnoteIdx === null) {
                  this.block.content = response.data.content;
                  this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                  this.blockAudio.map = response.data.content;
                  this.blockAudio.src = this.block.getAudiosrc('m4a');
                  this.block.manual_boundaries = response.data.manual_boundaries || [];
                  Vue.nextTick(() => {
                    if (Array.isArray(this.block.flags) && this.block.flags.length > 0) {
                      this.block.flags.forEach(f => {
                        this.updateFlagStatus(f._id);
                      });
                      //console.log(this.$refs.blockContent.innerHTML)
                    }
                  })
                  //return this.putBlock(this.block);
                  if (!realign) {
                    this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map, false, this.block);
                  }
                  return BPromise.resolve();
                } else {
                  let resp_block = response.data;
                  let resp_f = resp_block.footnotes[footnoteIdx];
                  this.block.setContentFootnote(footnoteIdx, resp_f.content);
                  this.block.setAudiosrcFootnote(footnoteIdx, resp_f.audiosrc, resp_f.audiosrc_ver);
                  this.audioEditFootnote.footnote.manual_boundaries = resp_f.manual_boundaries || [];
                  if (!realign) {
                    this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content, false, Object.assign({_id: this.check_id}, this.audioEditFootnote.footnote));
                  }
                  this.audioEditFootnote.isAudioChanged = false;
                  return BPromise.resolve();
                }
              }
            })
            .catch(err => {
              this.isSaving = false;
              this.checkError(err);
              BPromise.reject(err)
            });
        } else {
          return BPromise.reject();
        }
        //this.isAudioChanged = false;
      },
      reworkBlock: function(ev) {
        if (!this.isNeedWorkDisabled) {

          this.actionWithBlock(ev)
        }
      },

      approveBlock: function(ev) {
        if (!this.isApproveDisabled) {

          this.actionWithBlock(ev);
        }
      },

      unmarkBlock: function(ev) {
        if (this.block.status.marked) {
          this.block.status.marked = false;
          this.assembleBlock(ev)
          .then(()=>{
            //this.setCurrentBookBlocksLeft(this.block.bookid);
            this.recountApprovedInRange();
          });
        }
      },

      markBlock: function(ev) {
        if (!this.markAsDoneButtonDisabled) {
          if (!this.block.audiosrc && (this.block.voicework === 'audio_file' || this.block.voicework === 'tts')) {
            return false;
          }
          let status = Object.assign(this.block.status, {marked: true});
          this.assembleBlockPart({status: status})
          .then(()=>{
            if (this.tc_hasTask('audio_mastering')) {
              this.setCurrentBookCounters(['not_proofed_audio_blocks']);
            }

            this.recountApprovedInRange();
          });
        }
      },

      actionWithBlock: function(ev) {
        if (this.approveWaiting) {
          return;
        }
        //this.isApproving = true;
        let task = this.tc_getBlockTask(this.block._id);

        if (!task) {
          let other_task = this.tc_getBlockTaskOtherRole(this.block.blockid);
            if (other_task) {
              task = Object.assign({}, other_task);
            } else {
            task = {
              blockid: this.block.blockid,
              bookid: this.block.bookid
            }
          }
        }

        let blockSummary = this.block.calcFlagsSummary();
        task.nextStep = blockSummary.dir;

        if (task.nextStep == 'proofer' && !this.block.hasAudio()) {
          switch (this.block.voicework) {
            case 'narration':
              task.nextStep = 'narrator';
              break;
          }
        }
        this.isSaving = true;
        this.tc_approveBookTask(task)
        .then(response => {
          this.isSaving = false;
          //this.isApproving = false;
          if (response.status == 200) {
            if (typeof response.data._id !== 'undefined') {
              this.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
            }
            //this.$router.push({name: this.$route.name, params:  { block: 'unresolved', task_type: true }});
            this.recountApprovedInRange();
            //this.getBloksUntil('unresolved', true, this.block._id)
            if (this.mode === 'narrate') {// after block was moved from narrator
              this.destroyEditor(true);
            }
          }
        })
        .catch(err => {
          this.isSaving = false;
          //this.isApproving = false;
        });

        this.$root.$emit('closeFlagPopup', true);
      },

      audPlay: function(block_id, ev) {
        if (this.player) {
          this.audCleanClasses(block_id, ev);
          this.player.playBlock('content-'+block_id);
        }
      },
      audPlayFromSelection() {
        if (this.player) {
          this.player.loadBlock(this.block._id);
          let startElement = this._getParent(this.range.startContainer, 'w');
          if (startElement) {
            this.isAudStarted = true;
            this.player.playFromWordElement(startElement, 'content-'+this.block._id);
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

          this.player.playRange('content-' + this.block._id, startRange[0], endRange[0] + endRange[1]);
          this.isAudStarted = true;
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
          this.player.pause();
          this.isAudStarted = false;
          this.isAudPaused = false;
          this.audCleanClasses(block_id, ev);
        }
      },
      audDeleteSelection() {
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
        this._audDeletePart(startRange[0], endRange[0] + endRange[1]);
      },
      _audDeletePart(start, end, footnoteIdx = null, part_idx = null, check_id = null) {
        if (!this.isSplittedBlock) {
          part_idx = null;
        }
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio_remove';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = part_idx === null;
        let formData = {};
        let position = [start, end];
        formData.position = position;
        if (part_idx !== null) {
          formData.modified = this.isPartAudioChanged(part_idx);
          formData.content = this.block.getPartContent(part_idx);
          formData.audio = this.block.getPartAudiosrc(part_idx, null, false);
          formData.manual_boundaries = this.block.getPartManualBoundaries(part_idx);
        } else if (footnoteIdx === null ) {
          formData.modified = this.isAudioChanged;
          formData.content = this.block.content;
          formData.audio = this.block.getAudiosrc(null, false);
          formData.manual_boundaries = this.block.manual_boundaries || [];
        } else {
          formData.content = this.audioEditFootnote.footnote.content;
          formData.audio = this.block.getAudiosrcFootnote(footnoteIdx, null, false);
          formData.modified = this.audioEditFootnote.isAudioChanged;
          formData.footnote_idx = footnoteIdx;
          formData.manual_boundaries = this.audioEditFootnote.footnote.manual_boundaries || [];
        }
        return api.post(api_url, formData, {})
          .then(response => {
            if (this._isDestroyed) {
              this.discardBlock();
              return Promise.resolve();
            }
            this.isUpdating = false;
            if (response.status == 200 && response.data && response.data.content && response.data.audiosrc) {

              if (part_idx !== null) {
                let part = response.data;
                this.block.setPartContent(part_idx, part.content);
                this.block.setPartAudiosrc(part_idx, part.audiosrc, part.audiosrc_ver);
                this.block.setPartManualBoundaries(part_idx, part.manual_boundaries || []);
                this.$root.$emit('for-audioeditor:load', this.block.getPartAudiosrc(part_idx, 'm4a'), this.block.getPartContent(part_idx), true, Object.assign({_id: check_id}, part));
                this.audioEditFootnote.isAudioChanged = true;
              } else if (footnoteIdx === null) {
                this.blockAudio.map = response.data.content;
                this.block.setContent(response.data.content);
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.block.setManualBoundaries(response.data.manual_boundaries || []);
                this.isAudioChanged = true;
                this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map, true, this.block);
              } else {
                this.block.setContentFootnote(footnoteIdx, response.data.content);
                this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
                this.block.setManualBoundariesFootnote(footnoteIdx, response.data.manual_boundaries || []);
                this.audioEditFootnote.footnote.manual_boundaries = response.data.manual_boundaries || [];
                this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content, true, Object.assign({_id: this.check_id}, this.audioEditFootnote.footnote));
                this.audioEditFootnote.isAudioChanged = true;
              }
            } else {
              this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
              this.$root.$emit('for-audioeditor:set-process-run', false);
            }
            return Promise.resolve();
          })
          .catch(err => {
            this.checkError(err);
            this.isUpdating = false;
            this.$root.$emit('for-audioeditor:set-process-run', false);
            this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
            return Promise.reject(err);
          });
      },
      insertSilence(position, length, footnoteIdx = null, partIdx = null, check_id = null) {
        if (!this.isSplittedBlock) {
          partIdx = null;
        }
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/audio/insert_silence';
        let api = this.$store.state.auth.getHttp();
        this.isUpdating = partIdx === null;
        let formData = {};
        formData.position = position;
        formData.length = length;
        if (partIdx !== null) {
          formData.content = this.block.getPartContent(partIdx);
          formData.audio = this.block.getPartAudiosrc(partIdx, null, false);
          formData.modified = this.isPartAudioChanged(partIdx);
          formData.manual_boundaries = this.block.getPartManualBoundaries(partIdx);
          formData.part_idx = partIdx;
        } else if (footnoteIdx === null ) {
          formData.content = this.block.content;
          formData.audio = this.block.getAudiosrc(null, false);
          formData.modified = this.isAudioChanged;
          formData.manual_boundaries = this.block.manual_boundaries || [];
        } else {
          formData.content = this.audioEditFootnote.footnote.content;
          formData.audio = this.block.getAudiosrcFootnote(footnoteIdx, null, false)
          formData.modified = this.audioEditFootnote.isAudioChanged;
          formData.manual_boundaries = this.audioEditFootnote.footnote.manual_boundaries || [];
        }
        if (footnoteIdx !== null) {
          formData.footnote_idx = footnoteIdx
        }
        return api.post(api_url, formData, {})
          .then(response => {
            if (this._isDestroyed) {
              this.discardBlock();
              return Promise.resolve();
            }
            this.isUpdating = false;
            if (response.status == 200 && response.data && response.data.content && response.data.audiosrc) {
              if (partIdx !== null) {
                this.block.setPartContent(partIdx, response.data.content);
                this.block.setPartAudiosrc(partIdx, response.data.audiosrc, response.data.audiosrc_ver);
                this.block.setPartManualBoundaries(partIdx, response.data.manual_boundaries || []);
                let part = this.block.parts[partIdx];
                part._id = check_id;
                this.$root.$emit('for-audioeditor:load', this.block.getPartAudiosrc(partIdx, 'm4a'), this.block.getPartContent(partIdx), true, part);
              } else if (footnoteIdx === null) {
                this.blockAudio.map = response.data.content;
                this.block.setContent(response.data.content);
                this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                this.blockAudio.src = this.block.getAudiosrc('m4a');
                this.block.setManualBoundaries(response.data.manual_boundaries || []);
                this.$root.$emit('for-audioeditor:load', this.blockAudio.src, this.blockAudio.map, true, this.block);
                this.isAudioChanged = true;
              } else {
                this.block.setContentFootnote(footnoteIdx, response.data.content);
                this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
                //this.audioEditFootnote.footnote.manual_boundaries = response.data.manual_boundaries || [];
                this.block.setManualBoundariesFootnote(footnoteIdx, response.data.manual_boundaries || []);
                this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content, true, Object.assign({_id: this.check_id}, this.audioEditFootnote.footnote));
                this.audioEditFootnote.isAudioChanged = true;
              }
            } else {
              this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
              this.$root.$emit('for-audioeditor:set-process-run', false);
            }
            return Promise.resolve();
          })
          .catch(err => {
            this.checkError(err);
            this.isUpdating = false;
            this.$root.$emit('for-audioeditor:set-process-run', false);
            this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
            return Promise.reject(err);
          });
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
        /*let el = document.createElement('SUP');
        el.setAttribute('data-idx', this.block.footnotes.length + 1);
        this.range.insertNode(el);*/
        this.block.footnotes.forEach((ftn, ftnIdx) => {
          let ref = this.$refs['footnoteContent_' + ftnIdx]
          if (ref && ref[0]) {
            this.block.setContentFootnote(ftnIdx, ref[0].innerHTML);
          }
        });
        let pos = this.updFootnotes(this.block.footnotes.length + 1);
        this.block.footnotes.splice(pos, 0, new FootNote({}));
        this.$forceUpdate();
        this.isChanged = true;
        let ref = this.$refs['footnoteContent_' + pos];
        if (ref && ref[0]) {
          ref[0].innerHTML = this.block.footnotes[pos].content;
        }
        this.pushChange('footnotes');
        Vue.nextTick(() => {
          //this.destroyEditor();
          this.initFtnEditor(true);
        });
      },
      delFootnote: function(pos, checkText = true) {
        if (checkText) {
          pos.forEach(p => {
            let footnote = document.getElementById(this.block.blockid).querySelector(`[data-idx='${p+1}']`);
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
        let idx = 0;
        this.$refs.blocks.forEach((blk) => {
          blk.$refs.blockContent.querySelectorAll('[data-idx]').forEach(function(el) {
            if (el.getAttribute('data-idx') == c_pos) pos = idx;
            el.textContent = idx+1;
            el.setAttribute('data-idx', idx+1);
            ++idx;
          });
        })
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

      addFlag: function() {
        this.isChanged = true;
        this.pushChange('flags');
      },

      addFlagPart: function(content, type = 'editor') {
        this.block.addPart(this.flagsSel._id, content, type, this.mode);

        this.updateFlagStatus(this.flagsSel._id);
        this.$refs.blockFlagPopup.reset();

        this.$refs.blockFlagPopup.scrollBottom();
        this.isChanged = true;
        this.pushChange('flags');
      },

      onAddFlagPart: function(content, type = 'editor') {
        this.isChanged = true;
        this.pushChange('flags');
      },

      detectExistingFlag: function(ev) {
        let node = this.range.startContainer;
        let endNode = this.range.endContainer;
        let target = MediumEditor.util.traverseUp(node, (element)=>{
          return element.dataset.flag;
        })
        while (target === false && node && node != endNode) {
          target = MediumEditor.util.traverseUp(node = this.nextNode(node), (element)=>{
            return element.dataset.flag;
          })
        }
        return target;
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
              if (type === 'editor' && this.mode === 'edit') {
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

      updateFlagStatus: function (flagId, blockPartIdx = null) {
        let _this = null;
        if (blockPartIdx !== null) {
          if (this.$refs.blocks && this.$refs.blocks[blockPartIdx]) {
            _this = this.$refs.blocks[blockPartIdx];
          }
        } else {
          _this = this;
        }
        let node;
        if (_this) {
          if (flagId ===  this.block._id) {
            node = _this.$refs.blockFlagControl;
            if (node) node.dataset.flag = flagId;
          } else {
            node = _this.$refs.blockContent.querySelector(`[data-flag="${flagId}"]`);
          }
          if (node) node.dataset.status = this.block.calcFlagStatus(flagId);
        }
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

      delFlagPart: function(ev, partIdx, blockPartIdx = null) {
        let _this = null;
        if (blockPartIdx !== null) {
          if (this.$refs.blocks && this.$refs.blocks[blockPartIdx]) {
            _this = this.$refs.blocks[blockPartIdx];
          }
        } else {
          _this = this;
        }
        if (_this && this.canDeleteFlagPart(_this.flagsSel.parts[partIdx])) {

          _this.flagsSel.parts.splice(partIdx, 1);

          if (_this.flagsSel.parts.length == 0) {
            if (_this.flagsSel._id !== this.block._id) {
              let node = _this.$refs.blockContent.querySelector(`[data-flag="${_this.flagsSel._id}"]`);
              let parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
              this.block.delFlag(_this.flagsSel._id);
            } else {
              this.$refs.blockFlagControl.removeAttribute('data-flag');
              this.$refs.blockFlagControl.removeAttribute('data-status');
              this.block.delFlag(_this.flagsSel._id);
            }
            _this.$root.$emit('closeFlagPopup', true);
          }
          else {
            _this.$refs.blockFlagPopup.reset();
            this.updateFlagStatus(_this.flagsSel._id, blockPartIdx);
          }
          //this.pushChange('flags');
          //this.$emit('delFlagPart');

          this.isChanged = true;
          this.pushChange('flags');
        }
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
      },

      onResolveFlagPart: function(ev, partIdx) {
        this.isChanged = true;
        this.pushChange('flags');
      },

      reopenFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'open';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      onReopenFlagPart: function() {
        this.isChanged = true;
        this.pushChange('flags');
      },

      hideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'hidden';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      onHideFlagPart: function() {
        this.isChanged = true;
        this.pushChange('flags');
      },

      unHideFlagPart: function(ev, partIdx) {
        this.flagsSel.parts[partIdx].status = 'resolved';
        this.$refs.blockFlagPopup.reset();
        this.updateFlagStatus(this.flagsSel._id);
        this.isChanged = true;
        this.pushChange('flags');
      },

      onUnHideFlagPart: function() {
        this.isChanged = true;
        this.pushChange('flags');
      },

      toggleArchFlags: function(ev, partIdx) {
        this.isHideArchFlags = !this.isHideArchFlags;
      },

      toggleHideArchParts: function() {
        this.isHideArchParts = !this.isHideArchParts;
        this.$refs.blockFlagPopup.reset();
      },

      startRecording(blockPartIdx) {
        return this.recordTimer()
          .then(() => {
            //this.recordStartCounter = 0;
            this.isRecording = true;
            this.recorder.startRecording();
            //} catch(err) {
              //return Promise.reject(err);
            //}
            return Promise.resolve();
          })
          .catch(err => {
            this.isRecording = false;
            return Promise.reject(err);
          });
      },
      recordTimer() {
        let self = this;
        return new BPromise(function(resolve, reject) {
          self.recordStartCounter = 3;
          $('#narrateStartCountdown strong').html(self.recordStartCounter);
          $('body').addClass('modal-open');
          $('#narrateStartCountdown').show();
          let timer = setInterval(function() {
            --self.recordStartCounter;
            if (self.recordStartCounter <= 0) {
              clearTimeout(timer)
              $('body').removeClass('modal-open');
              $('#narrateStartCountdown').hide();
              resolve()
            } else {
              //console.log(self.recordStartCounter);
              $('#narrateStartCountdown strong').html(self.recordStartCounter);
            }
          }, 1000);
        });
      },
      stopRecording(partIdx, reRecordPosition, start_next = false) {
        let self = this;
        this.isRecording = false;
        if (!this.isSplittedBlock) {
          partIdx = null;
          this.isUpdating = true;
        }
        return new Promise((resolve, reject) => {
          this.recorder.stopRecording(function(audioUrl) {
            this.getDataURL(function(dataURL) {
              if (start_next) {
                self.stopRecordingAndNext(partIdx);
              }
              self.saveNarrated({
                'audio': dataURL.split(',').pop(),
                'position': reRecordPosition,
                'isTemp': false,
                'blockid': self.block.blockid,
                'partIdx': partIdx
              })
                .then(response => {
                  self.isUpdating = false;
                  if (response.status == 200) {
                    //self.blockAudio.map = response.data.content;
                    self.$root.$emit('bookBlocksUpdates', {blocks: [response.data]});
                    //self.block.setContent(response.data.content);
                    //self.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
                    //self.blockAudio.src = self.block.getAudiosrc('m4a');
                    //self.blockAudio.map = self.block.content;
                    //self.isAudioChanged = true;
                  }
                  self.reRecordPosition = false;
                  resolve();
                })
                .catch(err => {
                  self.reRecordPosition = false;
                  self.isUpdating = false;
                  reject(err);
                });
            });
          });
        });
      },
      cancelRecording() {
        if (this.recorder) {
          this.isRecording = false;
          this.isRecordingPaused = false;
          this.recorder.stopRecording(() => {

          });
        }
      },
      doReAlign(footnoteIdx = null) {
        if ((this.block.audiosrc) || (typeof footnoteIdx !== 'undefined' && footnoteIdx !== null && this.audioEditFootnote.footnote)) {
        let api_url = this.API_URL + 'book/block/' + this.block._id + '/realign';
        let api = this.$store.state.auth.getHttp();
        let formData = new FormData();
        if (footnoteIdx !== null){
          api_url = this.API_URL + 'book/block/' + this.block._id + '/footnote/' + footnoteIdx + '/realign'
          formData.append('footnote_idx', footnoteIdx);
          formData.append('audio', [this.block.getAudiosrcFootnote(footnoteIdx, false, false)]);
        } else {
          formData.append('audio', [this.block.getAudiosrc(false, false)]);
        }
        this.isUpdating = true;
        return api.post(api_url, formData, {})
        .then(response => {
          this.isUpdating = false;
          if (response.status == 200 && response.data && response.data.audiosrc) {
            if (footnoteIdx === null) {
              this.block.setAudiosrc(response.data.audiosrc, response.data.audiosrc_ver);
              this.blockAudio.src = this.block.getAudiosrc('m4a');
              this.blockAudio.map = response.data.content;
              this.block.manual_boundaries = response.data.manual_boundaries || [];
            } else {
              this.block.setContentFootnote(footnoteIdx, response.data.content);
              this.block.setAudiosrcFootnote(footnoteIdx, response.data.audiosrc, response.data.audiosrc_ver);
              if (this.audioEditFootnote && this.audioEditFootnote.footnote) {
                this.audioEditFootnote.footnote.manual_boundaries = response.data.manual_boundaries || [];
              }
            }
            this.$store.commit('set_storeList', new BookBlock(response.data));
            if (this.isAudioEditing) {
              this.$root.$emit('for-audioeditor:reload-text', response.data.content, response.data);
            }
          } else {
            this.$root.$emit('for-audioeditor:set-process-run', false);
            this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
          }
          this.reRecordPosition = false;
          if (this.isAudioEditing) {
            this.$root.$emit('for-audioeditor:set-process-run', false);
            //this.$root.$emit('for-audioeditor:select', this.block.blockid);
          }
          return BPromise.resolve();
        })
        .catch(err => {
          this.reRecordPosition = false;
          this.isUpdating = false;
          this.$root.$emit('for-audioeditor:set-process-run', false);
          this.$root.$emit('set-error-alert', 'Failed to apply your correction. Please try again.')
          return BPromise.reject();
        });
        } else {
          if (this.isAudioEditing) {
            this.$root.$emit('for-audioeditor:set-process-run', false);
          }
          return BPromise.reject();
        }
      },
      stopRecordingAndNext(blockPartIdx) {
        this.$emit('stopRecordingAndNext', this.block, blockPartIdx);
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
                if (this.$refs.blocks && this.$refs.blocks[0] && this.$refs.blocks[0].$refs && this.$refs.blocks[0].$refs.blockDescription) {
                  this.$refs.blocks[0].initEditor();
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
      showFootnoteAudioEditor(footnote, ftnIdx) {
        this.FtnAudio.isEditing = true;
        this.FtnAudio.map = footnote.content;
        if (this.FtnAudio.isChanged) {
          this.discardFtnAudio();
        }

        //this.$root.$emit('for-audioeditor:load-and-play', this.block.getAudiosrcFootnote(ftnIdx, 'm4a', true), this.FtnAudio.map, `${this.block._id}_${ftnIdx}`);

        //$('nav.fixed-bottom').removeClass('hidden');
        this.audioEditFootnote.footnote = footnote;
        this.showAudioEditor(ftnIdx, footnote);
        this.isAudioEditing = true;
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
        this.check_id = footnoteIdx !== null ? this.block._id + '_' + footnoteIdx : this.block._id;
        this.audioEditorEventsOff();


        Vue.nextTick(() => {
          let audiosrc = footnoteIdx !== null ? this.block.getAudiosrcFootnote(footnoteIdx, 'm4a', true) : this.blockAudio.src;
          let text = footnote ? footnote.content : this.blockAudio.map;
          let loadBlock = footnoteIdx !== null ? {_id: this.check_id, voicework: footnote ? footnote.voicework : 'tts', manual_boundaries: footnote ? footnote.manual_boundaries || [] : []} : this.block;
          this.$root.$emit('for-audioeditor:load-and-play', audiosrc, text, loadBlock);

          let self = this;
          this.audioEditorEventsOn();
        });
      },

      //-- Events -- { --//
      evFromAudioeditorClosed(blockId) {

        if (blockId === this.block._id || blockId === this.block._id + '_' + this.footnoteIdx) {
          this.isAudioEditing = false;
          if (this.isAudioChanged) {
            this.discardAudioEdit(this.footnoteIdx, false);
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
          if (this.footnoteIdx !== null) {
            let ref = this.$refs['footnoteContent_' + this.footnoteIdx];
            if (ref) {
              ref = ref[0];
            }
            if (ref && ref.querySelectorAll) {
              let manual_boundaries = this.audioEditFootnote.footnote.manual_boundaries || [];
              ref.querySelectorAll('[data-map]').forEach(_w => {
                if ($(_w).attr('data-map') && $(_w).attr('data-map').length) {
                  let _m = map.shift();
                  if (_m) {
                    let w_map = _m.join();
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
              this.audioEditFootnote.footnote.content = ref.innerHTML;
              this.audioEditFootnote.footnote.manual_boundaries = manual_boundaries;
              this.$root.$emit('for-audioeditor:reload-text', this.audioEditFootnote.footnote.content, this.audioEditFootnote.footnote);
              this.pushChange('footnotes');
              this.pushChange('content_footnote');
            }
          } else {
            if (this.$refs.blockContent && this.$refs.blockContent.querySelectorAll) {
              let manual_boundaries = this.block.manual_boundaries || [];
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
              this.block.manual_boundaries = manual_boundaries;
              this.$root.$emit('for-audioeditor:reload-text', this.$refs.blockContent.innerHTML, this.block);
              this.block.content = this.$refs.blockContent.innerHTML;
              this.blockAudio.map = this.block.content;
              //this.pushChange('content');
            }
          }
        }
        this.isAudioChanged = true;
      },
      evFromAudioeditorSaveAndRealign (blockId, check_realign = true, realign = false) {
        if (blockId == this.check_id) {
          this.audStop();
          //this.doReAlign(this.footnoteIdx)
            //.then(() => {
              this.assembleBlockAudioEdit(this.footnoteIdx, true, false);
              //this.flushChanges();
              //this.isChanged = false;
              this.isAudioChanged = false;
            //});
        }
      },
      evFromAudioeditorCut (blockId, start, end) {
        if (blockId == this.check_id) {
          this.audStop();
          this._audDeletePart(start, end, this.footnoteIdx);
        }
      },
      evFromAudioeditorSave (blockId) {
        if (blockId == this.check_id) {
          this.audStop();
          this.assembleBlockAudioEdit(this.footnoteIdx, false, false);
          //this.flushChanges();
          //this.isChanged = false;
          this.isAudioChanged = false;
        }
      },
      evFromAudioeditorInsertSilence (blockId, position, length) {
        if (blockId == this.check_id) {
          this.audStop();
          this.insertSilence(position, length, this.footnoteIdx);
        }
      },
      evFromAudioeditorUndo (blockId, audio, text, isModified) {
        if (blockId == this.check_id) {
          this.audStop();
          if (this.footnoteIdx === null) {
            this.block.undoContent();
            this.block.undoAudiosrc();
            this.blockAudio.map = this.block.content;
            this.blockAudio.src = this.block.getAudiosrc('m4a');
            this.block.undoManualBoundaries();
            this.isAudioChanged = isModified;
          } else {
            //this.audioEditFootnote.footnote.content = text;
            //this.block.setAudiosrcFootnote(footnoteIdx, audio);
            //this.audioEditFootnote.isAudioChanged = isModified;
            this.block.undoContentFootnote(this.footnoteIdx);
            this.block.undoAudiosrcFootnote(this.footnoteIdx);
            this.block.undoManualBoundariesFootnote(this.footnoteIdx);
            this.$root.$emit('for-audioeditor:load', this.block.getAudiosrcFootnote(this.footnoteIdx, 'm4a'), this.audioEditFootnote.footnote.content, false, Object.assign({_id: this.check_id}, this.audioEditFootnote.footnote));
          }
        }
      },
      evFromAudioeditorDiscard (blockId) {
        if (blockId == this.check_id) {
          this.audStop();
          this.discardAudioEdit(this.footnoteIdx);
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
        //this.$root.$on('from-audioeditor:word-realign', this.evFromAudioeditorWordRealign);
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
        if (!this.$refs.blocks || !this.$refs.blocks[0]) {
          return Promise.reject();
        }
        let formData = new FormData();
        formData.append('illustration', this.$refs.blocks[0].$refs.illustrationInput.file, this.$refs.blocks[0].$refs.illustrationInput.file.name);
        formData.append('block', JSON.stringify({'description': this.$refs.blocks[0].$refs.blockDescription.innerHTML}));
        let api = this.$store.state.auth.getHttp()
        let api_url = this.API_URL + 'book/block/' + this.block.blockid + '/image';

        this.isSaving = true;
        api.post(api_url, formData, {}).then((response) => {
          this.isSaving = false;
          if (response.status===200) {
            if (this.isCompleted) {
              this.tc_loadBookTask();
              this.getCurrentJobInfo();
            }
            // hide modal after one second
            this.$refs.blocks[0].$refs.illustrationInput.removeImage();
            this.$emit('blockUpdated', this.block._id);
            //let offset = document.getElementById(self.block._id).getBoundingClientRect()
            //window.scrollTo(0, window.pageYOffset + offset.top);
            this.isIllustrationChanged = false;
            this.isChanged = false;
            this.block.isIllustrationChanged = false;
            this.block.isChanged = false;
            this.$refs.blocks[0].isIllustrationChanged = false;
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
          this.isSaving = false;
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
        if (this.block && !this.tc_isShowEdit(this.block._id)) {
          return false;
        }
        let checked;
        if (ev === true || ev === false) checked = ev;
        else checked = ev.target && ev.target.checked;

        let shiftKey = ev.shiftKey||ev.ctrlKey||false;
        if (ev.shiftKey) {
          if (this.selectionStart && this.selectionStart != this.block._id) {
            document.getSelection().removeAllRanges();
          }
        }
        //this.blockO.checked = checked;
        this.$emit('setRangeSelection', this.blockO, type, checked, shiftKey);
      },
      updateVoicework() {
        if (!this.voiceworkChange) {
          return false;
        }
        this.voiceworkUpdating = true;
        let api_url = this.API_URL + 'book/block/' + this.block._uRid + '/set_voicework';
        let api = this.$store.state.auth.getHttp();
        return api.post(api_url, {
          voicework: this.voiceworkChange,
          updateType: this.voiceworkUpdateType
        }, {})
          .then(response => {
            this.voiceworkUpdating = false;
            if (this.isCompleted) {
              this.tc_loadBookTask();
            }
            //if (this.currentJobInfo && this.currentJobInfo.published) {
              //this.updateBookVersion({major: true});
            //}
            this.getCurrentJobInfo();
            if (response.status == 200) {
              this.$root.$emit('from-bookblockview:voicework-type-changed');
              this.getAlignCount();
              if (response && response.data) {
                //response.data.updField = 'voicework';
                this.$root.$emit('bookBlocksUpdates', response.data);
                this.block.voicework = this.voiceworkChange;
                //this.setCurrentBookBlocksLeft(this.block.bookid);
              }
            }
            this.voiceworkChange = false;
          })
          .catch(err => {
            this.voiceworkUpdating = false;
            this.voiceworkChange = false;
          });
      },
      scrollToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },
      selectLangSubmit(ev){
        this.block.language = ev.target.value;
        this.setChanged(true, 'language');
        this.$refs.blockMenu.close();
      },
      setNumVal: _.debounce(function(ev){
        let val = ev.target.value;
        //if (val && this.$refs.parnumRef) this.$refs.parnumRef.innerText = val;
        this.putNumBlockO({
          bookId: this.block.bookid,
          rid: this.blockO.rid,
          type: this.block.type,
          secnum: this.blockO.secnum,
          parnum: this.blockO.parnum,
          isManual: true,
        }).then((blocks)=>{
          //console.log('setNumVal then', blocks[0]);
          if (['header', 'title'].indexOf(this.block.type) !== -1) {
            this.loadBookToc({bookId: this.block.bookid, isWait: true});
          }
          this.updateBookVersion({major: true});
        });
      }, 1000),

      setSecnumHidden() {
        this.block.secHide = !this.block.secHide;
        this.putBlockPart({block: this.block, field: 'secHide'}).then(()=>{});
      },

      allowVoiceworkChange() {
        if (this.hasLockedPart) {
          return false;
        }
        return this.block && this.tc_allowVoiceworkChange(this.block);
      },
      pushChange(change) {
        if (this.changes.indexOf(change) === -1) {
          this.changes.push(change);
          this.isChanged = true;
        }
      },
      flushChanges() {
        this.changes = [];
      },
      hasChange(change) {
        return this.changes && this.changes.indexOf(change) !== -1;
      },
      unsetChange(change) {
        let index = this.changes.indexOf(change);
        if (index !== -1) {
          this.changes.splice(index, 1);
        }
        if (this.changes.length === 0) {
          this.isChanged = false;
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
              this.$root.$emit('for-audioeditor:select', id, startRange[0], endRange[0] + endRange[1]);
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
        if (!this.isSplittedBlock && this.$refs.blocks && this.$refs.blocks[0] && this.$refs.blocks[0].$refs.blockContent) {
          this.block.content = this.$refs.blocks[0].$refs.blockContent.innerHTML.replace(/(<[^>]+)(selected)/g, '$1');
          this.block.content = this.block.content.replace(/(<[^>]+)(audio-highlight)/g, '$1');
        }
        if (this.block.footnotes && this.block.footnotes.length) {
          this.block.footnotes.forEach((footnote, footnoteIdx)=>{
            let ref = this.$refs['footnoteContent_' + footnoteIdx];
            if (ref && ref[0]) {
              this.block.footnotes[footnoteIdx].content = ref[0].innerHTML;
            }
          });
        }
      },
      spotCheck: function() {
        let length = 3;
        if (this.player && this.player.audio_element) {
          let menuHeight = $('div.top-menu-wrapper').height() + $('div.toolbar').height();
          let blockOffset =this.$refs.viewBlock.offsetTop;
          if (menuHeight > blockOffset) {
            this.$root.$emit('for-bookedit:scroll-to-block', this.block._id);
          }
          let w = $('#content-'+this.block._id + '-part-0 w[data-map]').last();
          if (w.length > 0) {
            w = w[0];
          }
          if (!w || !w.dataset || !w.dataset.map) {
            return;
          }
          let map = w.dataset.map.split(',');
          map[0] = parseInt(map[0]);
          map[1] = parseInt(map[1]);
          if (map[0] + map[1] < (2 * length + 1) * 1000) {
            this.player.playBlock('content-' + this.block._id + '-part-0');
          } else {
            //this.player.audio_element.onended = () => {
              //console.log('ENDED')
            //};

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
          }

        }
      },
      refreshBlockAudio: function(map = true, src = true) {
        if (this.block) {
          if (map) {
            this.blockAudio.map = this.block.content;
          }
          if (src) {
            this.blockAudio.src = this.block.getAudiosrc('m4a');
          }
        }
      },
      setClasses: function(classes) {
        if (this.block) {
          this.$forceUpdate();
          this.pushChange('classes');
        }
      },
      getFtnLang: function(ftnLang) {
        if (ftnLang && ftnLang.length) {
          return ftnLang;
        } else {
          return this.meta.language;
        }
      },
      isPartAudioChanged(part_idx) {
        let ref = this.$refs['blocks'][part_idx];
        return ref && ref.isAudioChanged;
      },
      onPartChanges(val, set = true) {
        /*if (val) {
          this.isChanged = true;
        } else {

        }*/
        if (set) {
          this.pushChange(val);
        } else {
          this.unsetChange(val);
        }
        if (val === 'illustration') {
          this.isIllustrationChanged = set;
        } else if (val === 'audio') {
          this.isAudioChanged = set;
        }
      },
      partAudioComplete(partIdx) {
        if (this.block.parts && this.block.parts[partIdx + 1]) {
          let ref = this.$refs.blocks[partIdx + 1];
          if (ref) {
            ref.audPlay();
          }
        }
      },
      onIsAudioEditing(val) {
        this.isAudioEditing = val;
      },
      onIsAudioChanged(val) {
        this.isAudioChanged = val;
      }
  },
  watch: {
      'isLocked': {
        handler(val) {
          //console.log('IS LOCKED', val, this.block)
          if (this.block.audiosrc) {
            this.blockAudio.src = this.block.getAudiosrc('m4a');
          }
          if (val === false) {
            this.$parent.refreshTmpl();
            if (this.isCompleted) {
              this.tc_loadBookTask();
              this.getCurrentJobInfo();
            }
          }
        }
      },
      'hasLock': {
        handler(val) {
          if (!val) {
            if (this.isAudioEditing && (this.check_id !== null || this.footnoteIdx !== null)) {
              //this.$root.$emit('for-audioeditor:set-process-run', false);
              if (this.check_id === this.block.blockid) {
                this.refreshBlockAudio(!this.isChanged);
                this.showAudioEditor();
              } else {
                let ftn = this.block.footnotes[this.footnoteIdx];
                this.showFootnoteAudioEditor(ftn, this.footnoteIdx);
              }
            } else if (!this.isSplittedBlock) {
              if (this.$refs.blocks && this.$refs.blocks[0]) {
                if (this.$refs.blocks[0].isAudioEditing) {
                  Vue.nextTick(() => {
                    this.$refs.blocks[0].refreshBlockAudio();
                    this.$refs.blocks[0].showAudioEditor();
                  })
                }
              }
            }
          }

        }
      },
      'block.isUpdated' (newVal, oldVal) {
        if (newVal===true) {
          this.isUpdated = true;
          this.block.isUpdated = false;
          setTimeout(() => {
            this.isUpdated = false;
          }, 2000);
        }
      },
      'block._id' (newVal) {
        //this.isUpdated = false;
      },
      'block._rev' (newVal, oldVal) {
        //console.log('block._rev: ', this.block._rev, 'newVal: ', newVal, 'oldVal: ', oldVal);
        if (oldVal) {
          this.isUpdated = true;
          setTimeout(() => {
            this.isUpdated = false;
          }, 2000);
        }
        if (!this.block) {
          return;
        }
        if (newVal !== this.block._rev)
        {
          if (this.block.illustration) {
            this.block.illustration = this.block.illustration.split('?').shift() + '?' + Date.now()
          }
          this.blockAudio = {'map': this.block.content, 'src': this.block.getAudiosrc('m4a')};
          if (this.$refs.blockContent) {
            this.addContentListeners();
          }
        } else {
          this.blockAudio = {
            'src': this.block.getAudiosrc('m4a'),
            'map': this.block.content
          };
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
      'block.footnotes': {
        handler: function (val, oldVal) {
          if (this.block && this.block.footnotes && this.block.footnotes.length) {
            this.block.footnotes.forEach((footnote, footnoteIdx)=>{
              if (footnote.audiosrc && !this.FtnAudio.player) {
                this.initFootnotePlayer(this.FtnAudio);
                return true;
              }
            });
          }
        },
        deep: true
      },
      'blockAudio.map' (newVal, oldVal) {

      },
      'isCompleted': {
        handler(val, oldVal) {
          Vue.nextTick(() => {
            this.updateFlagStatus(this.block._id);
          });
        }
      },
      'voiceworkChange': {
        handler(val) {
          if (val === false) {
            this.hideModal('voicework-change');
          }
        }
      },
      'isChanged' : {
        handler(val) {
          if (val === false) {
            this.flushChanges();
            if (this.$refs.blocks) {
              this.blockParts.forEach((part, partIdx) => {
                this.$refs.blocks[partIdx].isChanged = false;
              });
            }
          }
          this.block.isChanged = val;
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
          this.block.isAudioChanged = val;
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
      'block.content': {
        handler(val) {
          if (this.isChanged && val !== this.$refs.blockContent.innerHTML) {
            this.block.content = this.$refs.blockContent.innerHTML;
          }
          this.refreshBlockAudio(!(this.isChanged || this.isAudioChanged || this.isIllustrationChanged));
          Vue.nextTick(() => {
            if (this.$refs.blockContent) {
              this.addContentListeners();
            }
          });
        }
      },
      'blockReindexProcess': {
        handler(val, oldVal) {
          if (this.deletePending && oldVal && !val) {
            this.deleteBlock();
          }
        }
      },
      'block.flags': {
        handler(val) {
          if (this.isCompleted) {
            Vue.nextTick(() => {
              if (this.$refs.blockContent) {
                this.$refs.blockContent.querySelectorAll('[data-flag]').forEach((flag)=>{
                  flag.addEventListener('click', this.handleFlagClick);
                });
              }
            });
            this.updateFlagStatus(this.block._id);
          }
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
      'block.audiosrc': {
        handler(val) {
          this.refreshBlockAudio(!(this.isChanged || this.isAudioChanged || this.isIllustrationChanged));
        }
      },
      'isSaving': {
        handler(val) {
          if (!val && this.$refs.blocks) {
            let ref = this.$refs.blocks.find(rb => {
              return rb.$refs && rb.$refs.blockFlagPopup && rb.flagsSel;
            });
            if (!ref && this.flagsSel && this.flagsSel._id === this.block.blockid && this.$refs.blockFlagPopup) {
              ref = this;
            }
            if (ref) {// reset flag selection on save
              
              ref.flagsSel = this.block.flags.find((flag)=>{
                return flag._id === ref.flagsSel._id;
              });
            }
          }
        }
      }
  }
}
</script>

<style lang='less'>

@variable: 90px;
.ilm-block {
    padding: 0;
    .medium-editor-placeholder:after {
      top: -6px;
    }
/*    .content-wrap {
      &.par {
        min-height: 54px;
      }
      &.title {
        min-height: 77.5px;
      }
      &.header {
        min-height: 62.5px;
      }
      &.subhead {
        min-height: 54.5px;
      }
    }*/
    hr {
      position: static;
    }
    &.-marked {
      background-color: rgba(219, 255, 255, 0.5);
    }
}

.table-body {
    display: table;
    width: 100%;

    &.-content {
        margin-bottom: 20px;

        .-hidden {
            visibility: hidden;
        }

        &:hover {
            .-hidden {
                visibility: visible;
            }
        }
        &.editing {
            .-hidden.-audio {
                visibility: visible;
            }
        }

        .-hidden-hover {
          display: block;
          height: 32px;
        }

        &:hover {
          .-hidden-hover {
            display: none;
          }
        }
    }

    .-left {
        float: left;
    }
    .-right {
        float: right;
    }

    &.footnote {
      margin-top: 5px;
      margin-bottom: 10px;

      .table-row {

      }

      .-num {
        padding-right: 5px;
        padding-top: 3px;
      }
      .-text {
        width: 100%;
        background: rgba(51, 122, 183, 0.04);
        padding: 3px;
        height: 21px;
        min-height: 21px;
      }
      .-control {
        padding-left: 10px;

      }
    }
}

.table-cell {
    display: table-cell;

    &.controls-left {
        width: 36px;
        /*padding-left: 8px;*/
        padding-top: 0px;

        &.-check-green {
          /*border-left: 6px solid darkgreen;*/
          /*background-color: lightgreen;*/
          background: linear-gradient(to right, lightgreen , white);
          /*padding-left: 9px;
          width: 48px;*/
        }

        .table-row.parnum-row {
          height: 25px;
        }

        .table-row.check-row {
          height: 25px;
          width: 17px;

         .set-range {
            /*cursor: pointer;*/
            margin: 5px 0 0 1px;
            .fa {
              font-size: 20px;
            }
          }

          .fa {
            display: block;
            margin: 5px 0 0 2px;
            cursor: pointer;
          }
        }

        .-hidden {
            visibility: hidden;
        }

        &:hover {
            .-hidden {
                visibility: visible;
            }
        }

        .-hidden-hover {
            display: block;
        }

        &:hover {
            .-hidden-hover {
                display: none;
            }
        }

        .-hidden-block {
            display: none;
        }

        &:hover {
            .-hidden-block {
                display: block;
            }
        }

        .parnum {
          font-size: 1.1em;
          font-family: serif;
          margin-top: 1px;

          &.-bold {
            font-weight: bold;
          }
          &.-auto {
            letter-spacing: -1px;
            margin-left: -6px;
          }
        }
        .secnum {
          font-size: 15px;
          font-family: serif;
          padding: 0;
          width: 38px;

          margin-left: -3px;
          margin-top: -1px;
/*          &.-hidden {
            display: none;
            &:hover {
              display: block;
            }
          }*/
        }
    }

    &.controls-right {
        width: 20px;
    }

    &.completed {
      background: #EFEFEF;
      border-radius: 7px;
      padding: 0;
    }

}
.table-row {
    display: table-row;
    &.-relative {
        position: relative;
    }
    &.controls-top {
         i, select {
            margin-right: 15px;
         }
         label {
            margin-bottom: 0;
            font-weight: normal;
         }
         select {
            border: none;
         }
    }

    &.controls-bottom {
        height: 24px;
        span {
          margin-right: 15px;
          cursor: pointer;
          color: gray;
          &:hover {
            color: #303030;
            .fa, .glyphicon, {
              color: #303030;
            }
          }
        }
        span.-disabled {
          color: lightgray;
          .fa, .glyphicon, {
            color: lightgray;
          }
          &:hover {
            color: lightgray;
            .fa, .glyphicon, {
              color: lightgray;
            }
          }
        }
        .save-block {
          cursor: pointer;
          border: 1px solid silver;
          border-radius: 3px;
          padding: 1px 5px;
          margin-right: 10px;
          background: rgba(204, 255, 217, 0.5);
          &:hover {
              background: rgba(204, 255, 217, 0.9);
          }

          &.-disabled {
/*                cursor: not-allowed;
              &:hover {
                  background: rgba(100, 100, 100, 0.2);
              }*/
              /*visibility: hidden;*/
              display: none;
          }
          .fa-save {
            color: green;
          }
          &.approve-waiting {
            color: gray;
            cursor: not-allowed;
          }
        }
    }

    .content-wrap {
      margin: 6px auto 4px auto;
      /*padding: 6px 11px;*/
      /*padding: 11px;*/
      border-radius: 8px;
      box-shadow: none;
      transition: box-shadow 900ms;

      &.-hover:hover {
          border: 1px solid silver;
          /*padding: 5px 10px;*/
          padding: 10px;
          background: rgba(219, 232, 255, .3);
      }
      &.-focus:focus {
          outline: none;
          /*border-color: #9ecaed;*/
          box-shadow: 0 0 10px #9ecaed;
      }
      &.checked {
          outline: none;
          border-color: #9ecaed;
          box-shadow: 0 0 10px #9ecaed;
      }
      &.updated {
          box-shadow: 0 0 10px rgba(56, 171, 53, 0.7);
          transition: box-shadow 200ms;
      }
      &.par {
        min-height: 50px;
      }

    }

    .hr.checked {
          outline: none;
          border-color: #9ecaed;
          box-shadow: 0 0 10px #9ecaed;
      }

    &.content-description {
        line-height: 24pt;
        .content-wrap-desc {
          p {
            margin: 0;
          }
        }
    }

    .content-wrap-footn {
        p {
          margin: 0;
        }
    }

    &.ilm-block {
      .content-wrap {
        &.header, &.subhead {
          margin: 4px;
        }
      }
    }

    .illustration-block {
      img {
        border: solid grey 2px;
        /*max-height: 85vh;*/
        padding: 4px;
      }
      .fa.fa-eye {
        margin-right: 6px;
      }
      .fa.fa-undo {
        margin-right: 7px;
        margin-left: 2px;
      }
      &.checked {
        outline: none;
        border-color: #9ecaed;
        box-shadow: 0 0 10px #9ecaed;
      }
    }
}

.table-row-flex {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;

    &.controls-top {
      width: 100%;
      height: 26px;
      position: relative;

      .par-ctrl {
        width: 440px;
        /*background: green;*/

        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-start;

        &.-audio {
          width: 65px;
          justify-content: space-between;
          margin-right: 50px;
        }
        &.-par-num {
          width: 180px;

          label.par-num {
            padding-left: 12px;
            position: relative;
            top: 2px;
            font-size: 18px;
            font-style: italic;

            &.has-num:before {
              content: '\0023';/*'\2116';*/
              font-size: smaller;
              padding-right: 10px;
            }
            &.hide-from {
              opacity: 0;
            }
          }
        }

        .par-ctrl-divider {
          width: 10px;
        }

        label {
          display: block;
          margin-bottom: 0px;
          padding-left: 4px;
          line-height: 20px;
          height: 20px;
          font-weight: normal;
        }
        select {
          /*border: none;*/
          border: 1px solid lightgray;
        }

        .parnum-row {
          width: 120px;
          height: 20px;
          position: relative;

            &.-locked:after {
              font-family: 'FontAwesome';
              content: "\f023";
              color: gray;
              position: absolute;
              left: 105px;
              top: 0px;
              /*&:hover {
                content: "\f09c";
              }*/
            }

          input.num {
            width: 120px;
            height: 20px;
            padding-left: 3px;
          }
        }

        .fa {
          cursor: default;
        }
        .fa-lock, .fa-unlock {
          height: 16px;
          line-height: 18px;
          &.-invisible {
            color: transparent;
          }
        }

        .block-menu {
          /*display: inline-block;
          vertical-align: bottom;*/
          /*position: relative;*/
          /*width: 40px;*/
          height: 20px;
          .fa, .glyphicon {
            /*margin-right: 5px;*/
            &.menu-preloader {
              background: url(/static/preloader-snake-transparent-small.gif);
              width: 18px;
              height: 16px;
              display: inline-block;
              background-repeat: no-repeat;
              text-align: center;
              background-position: 0 0;
              background-size: 83%;
              margin-bottom: -3px;
              margin-right: -1px;
            }
          }
          .disabled {
            color: gray;
          }
          select {
            color: black;
          }

        }
      }
    }
}

.fa, .glyphicon {
    cursor: pointer;
    color: gray;
    font-size: 18px;
    position: static;
}

.medium-editor-toolbar .fa {
    color: #FFFFFF;
}

.fa:hover, .glyphicon:hover {
    color: #303030;
}

.par-ctrl, .controls-top {
    width: auto;
    .fa-paragraph, .fa-header {
        margin-left: 4px;
        &.-active {
          color: #303030;
        }
    }
    .glyphicon-volume-up, .glyphicon-volume-off {
        margin-left: 3px;
     }
    .glyphicon-menu-hamburger {
        font-size: 20px;
        top: 5px;
    }
    .-audio {
        width: 160px;
        .fa {
            font-size: 18px;
        }
    }
    i.fa-volume-off {
        font-size: 27px;
        /*margin-right: 5px;*/
    }
    label {
      select, span {
          display: inline-block;
          vertical-align: super;
      }
    }
}

  /* A tricky way to create a lightweight highlight effect */
  .content-wrap[data-audiosrc].playing,
  .content-wrap-footn[data-audiosrc].playing {
      w[data-map] {
        background: linear-gradient(
            transparent,
            transparent 50%,
            rgba(0,255,0,.3) 55%,
            transparent 70%,
            transparent
        );
        /*cursor: pointer*/
      }

      w:not([data-map]), w.alignment-changed {
        background: linear-gradient(
            transparent,
            transparent 30%,
            rgba(255,0,0,.3) 55%,
            transparent 80%,
            transparent
        );
      }

      [data-idx], [data-pg] {
        w:not([data-map]) {
          background: none;
        }
      }

      /* hover effect to show which word is affected */
      w.audio-highlight {
          border-bottom: 5px solid rgb(226,226,226);
          border-radius: 3px;
      }
      w.audio-trail {
          border-bottom: 5px solid rgb(240,240,240);
          border-radius: 3px;
      }
      /* gap markers -- although CSS content messes up wrapping and is tricky to detect clicks */
      w[data-gap] {margin-right: 52px} /* Make room for marker */
      w[data-gapbefore] {margin-left: 50px} /* Make room marker */
      w[data-gap]:after, w[data-gapbefore]:before {
        cursor: pointer;
        padding: 5px;
        margin: 5px;
        position: absolute;
        width: auto;
        border-radius: .5em;
        border: 1px solid gray;
        background: silver;
        font: 10pt 'FontAwesome';
      }
      w[data-gap]:after {
          content: '\f060\00A0\f1c7';
          margin-left: 4px;
      }
      w[data-gapbefore]:before {
          content: '\f1c7\00A0\f061';
          left: -50px;
      }
      w.audio-highlight, w.selected {
          background: linear-gradient(
              transparent 20%,
              rgba(255,255,0,.8) 55%,
              transparent 80%
          );
      }
      w.audio-trail {
          background: linear-gradient(
              transparent 30%,
              rgba(255,255,0,.4) 55%,
              transparent 70%
          );
      }
  }

  [data-author] {
    color: teal;
  }

  [data-suggestion] {
    background: yellow;
  }

  [data-flag] {
    border-bottom: 2px solid red;
    pointer-events: none;
    &:before {
      pointer-events: all;
      /*content: "\F024";*/
      content: "\e034";
      /*font-family: 'FontAwesome';*/
      font-family: 'Glyphicons Halflings';
      color: red;
      cursor: pointer;
      display: inline-block;
      margin-right: 1px;
      vertical-align: middle;
    }

    &[data-status="open"] {
      border-bottom: 2px solid red;
      &:before {
        color: red;
      }
    }
    &[data-status="resolved"] {
      border-bottom: 2px solid green;
      &:before {
        color: green;
      }
    }
    &[data-status="hidden"] {
      border-bottom: 2px solid gray;
      &:before {
        color: gray;
      }
    }
  }
  .glyphicon-flag.flag-disabled {
    color: lightgray;
    &:before {
      color: lightgray;
    }
  }

  .hide-archive {
    [data-flag] {
      &[data-status="hidden"] {
        border-bottom: none;
        &:before {
          content: '';
        }
      }
    }
  }

  i[data-flag] {
    &[data-status] {
      border-bottom: none;
    }
  }

  .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
      left: 50%;
      top: 30px;
      position: absolute;
  }
  .preloader-container {
    position: relative;
  }
  .empty-control {
    width: 22px; display: inline-block;
  }
  .menu-separator {
    width: 100%;
    border-bottom: 1px solid black;
    height: 10px;
  }

  .medium-editor-toolbar-form {

    .medium-editor-toolbar-input {

      &.quote-input {
        position: relative;
        font-size: 16px;
        padding-left: 8px;
        /*line-height: 20px;*/
      }

      &.suggest-input {
        position: relative;
        font-size: 16px;
        padding-left: 8px;
      }
    }

    ul.quotes-list {
      display: flex;
      flex-direction: column;
      margin-top: -4px;
      border: 1px solid #dbdbdb;
      border-radius: 0 0 3px 3px;
      position: absolute;
      width: 100%;
      overflow: hidden;
      z-index: 999999;

      li {
        width: 100%;
        flex-wrap: wrap;
        background: white;
        margin: 0;
        border-bottom: 1px solid #eee;
        color: #363636;
        padding: 7px;
        cursor: pointer;

        &.highlighted {
          background: #f8f8f8
        }
      }
    }
  }

  .drag-uploader {
    /*display: table-row;*/
    .picture-input {
      .preview-container, .picture-preview {
        max-height: 80vh;
        width: auto;
        position: static;
      }
    }
    .save-illustration {
      float: left !important;
      width: 100% !important;
      text-align: center !important;
    }
  }
  .drag-uploader.no-picture {
    /*display: table-row;*/
    .picture-input {
      .preview-container, .picture-preview {
        max-height: 100px;
        width: auto;
        float: left;
        background-color: transparent !important;
        width: 100%;
      }
      .picture-inner {
        top: -90px !important;
        z-index: 0 !important;
        margin-bottom: 0px !important;
        font-size: 15px !important;
      }
    }
  }
  .modal-content {
    .modal-header {
      padding-left: 15px;
      padding-right: 15px;
    }
  }

  .block-html-modal {
    .modal-header {
      width: 100%;
      .modal-title {
        float: left;
        margin-left: 15px;
        width: 80%;
      }
      .modal-close-button {
        float: right;
        margin-right: 15px;
      }
    }
    .modal-body {
      overflow: visible;
    }
    textarea.block-html {
      width: 100%;
      height: 250px;
      resize: vertical;
    }
  }
  .voicework-preloader {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 34px;
      display: inline-block;
      margin: 4px 0px;
      background-repeat: no-repeat;
      text-align: center;
      background-position: center;
  }
  .locked-block-cover {
    width: 100%;
    position: absolute;
    height: 100%;
    background: url(/static/preloader-snake-small.gif);
    background-repeat: no-repeat;
    text-align: center;
    background-position: center;
    background-color: #8080807d;
    z-index: 999;
  }
  .recording-hover-controls {
    position: absolute;
    right: 34px;
    margin-top: -40px;
    background-color: white;
    border-radius: 5px;
    i {
      font-size: 27px;
      margin: 0px 5px;
      color: red;
      &:hover {
        color: #ff7a7a;
      }
    }
  }
  .fa.disabled {
    color: #dddddd;
  }
  .fa.paused {
    color: red;
  }
  .controls-left {
    .fa {
      font-size: 27px;
      margin: 7px 0px;
    }
  }
  .narrate-controls {
    .fa-pause-circle-o {
      color: red;
    }
  }
  .narrate-mode-left {
    width: 44px;
    vertical-align: middle;
  }
  span.check-span {
      position: absolute;
      height: 100%;
  }
  .in-recording {
      height: 100%;
  }

</style>

