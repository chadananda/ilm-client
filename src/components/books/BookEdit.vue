<template>
<div :class="['content-scroll-wrapper']"
  v-hotkey="keymap" ref="contentScrollWrapRef" v-on:scroll.passive="smoothHandleScroll($event); updatePositions();">

  <div :class="['container-block back ilm-book-styles ilm-global-style', metaStyles]">
      <div class="content-background">
      <div v-for="(viewObj, listIdx) in getListObjs"
        :class="['row content-scroll-item back']"
        :key = "viewObj.blockRid"
        :id="'v-'+ viewObj.blockId"
        :data-rid="viewObj.blockRid">

        <div class='col'>
        <BookBlockPreview
          ref="viewBlocks"
          :blockRid = "viewObj.blockRid"
          :blockId = "viewObj.blockId"
          :blockO = "parlistO.get(viewObj.blockRid)"
          :block = "parlist.get(viewObj.blockId)"
          :mode = "mode"
        ></BookBlockPreview>
        </div>
        <!--<div class='col'>-->

      </div>
      <!--<div class="row"-->
      </div>
      <!--<div class="content-background">-->
  </div>
  <!--<div class="container-block">-->

  <div v-bind:style="{ top: screenTop + 'px', 'margin-top': '-84px' }"
    :class="['container-block front ilm-book-styles ilm-global-style', metaStyles]" >
      <div class="content-background">
      <div class="row content-scroll-item front"
        v-for="(viewObj, blockIdx) in parlistO.idsViewArray()"
        v-bind:id="'s-'+ viewObj.blockId"
        v-bind:key="viewObj.blockId"><!--{{parlistO.getInId(viewObj.blockRid)}} -> {{viewObj.blockId}}{{viewObj.blockRid}} -> {{parlistO.getOutId(viewObj.blockRid)}}-->
        <div class='col' v-if="parlist.has(viewObj.blockId) && parlistO.has(viewObj.blockRid)">
          <BookBlockView ref="blocks"
              :block="parlist.get(viewObj.blockId)"
              :blockO="parlistO.get(viewObj.blockRid)"
              :blockId = "viewObj.blockId"
              :putBlock ="putBlockProxy"
              :getBlock ="getBlockProxy"
              :putBlockPart ="putBlockPartProxy"
              :putBlockO ="putBlockOProxy"
              :putNumBlockO ="putNumBlockOProxy"
              :recorder ="recorder"
              :blockReindexProcess="blockReindexProcess"
              :getBloksUntil="getBloksUntil"
              :allowSetStart="allowSetStart"
              :allowSetEnd="allowSetEnd"
              :prevId="parlistO.getInId(viewObj.blockRid)"
              :mode="mode"
              :putBlockProofread="putBlockProofreadProxy"
              :putBlockNarrate="putBlockNarrateProxy"
              :initRecorder="initRecorder"
              @stopRecordingAndNext="stopRecordingAndNext"
              @insertBefore="insertBlockBefore"
              @insertAfter="insertBlockAfter"
              @deleteBlock="deleteBlock"
              :joinBlocks="joinBlocks"
              @setRangeSelection="setRangeSelection"
              @blockUpdated="blockUpdated"
          /></BookBlockView>
        </div>
        <!--<div class='col'>-->
      </div>
      <!--<div class="row"-->
      </div>
      <!--<div class="content-background">-->

  </div>
  <!--<div class="container-block">   -->

  <div id="narrateStartCountdown" class="modal fade in">
    <div>
      <strong>3</strong>
    </div>
  </div>

</div>
<!--<div class="content-scroll-wrapper">-->
</template>

<script>

import { mapGetters, mapState, mapActions } from 'vuex'
import BookBlockView from './BookBlockView'
import BookBlockPreview   from './BookBlockPreview';
import InfiniteLoading from 'vue-infinite-loading'
import Vue from 'vue'
import access from "../../mixins/access.js"
import taskControls from '../../mixins/task_controls.js'
import mediaStreamRecorder from 'recordrtc'
import api_config from '../../mixins/api_config.js'
import axios from 'axios'
import { BookBlock }    from '../../store/bookBlock';
import { BookBlocks }    from '../../store/bookBlocks';
import _ from 'lodash';
import vueSlider from 'vue-slider-component';

import VueHotkey from 'v-hotkey';
Vue.use(VueHotkey);

const initialTopOffset = 84;

export default {
  data () {
    return {
      page: 0,
      //parlist: new Map(),
      //autoload: true,
      recorder: false,
      recorderStream: null,
      blockOrderChanged: false,
      //isAllLoaded: false,
      selectionStart: {},
      selectionEnd: {},
      parCounter: { pref: 0, prefCnt: 0, curr: 1 },
      blocksListQuery: false,
      blockReindexProcess: false,

      startId: false,
      fntCounter: 0,
      onScrollEv: false,

      screenTop: initialTopOffset,
      scrollPrev: 0,

      scrollBarTop: 0,
      scrollBarBlockHeight: 150,
      scrollBarBlockTimer: null,

      lazyLoaderDir: 'up',
      isNeedUp: true,
      isNeedDown: true,
      scrollToId: null

    }
  },
  props: ['mode'],
  computed: {
      // --- From store --- //
      ...mapGetters({
          book: 'currentBook',
          meta: 'currentBookMeta',
          allBooks: 'allBooks',
          tc_tasksByBlock: 'tc_tasksByBlock',
          isBlocked: 'isBlocked',
          blockers: 'blockers',
          parlist: 'storeList',
          parlistO: 'storeListO',
          blockSelection: 'blockSelection',
          currentJobInfo: 'currentJobInfo',
          audioTasksQueue: 'audioTasksQueue',
          audioTasksQueueBlock: 'audioTasksQueueBlock',
          audioTasksQueueBlockOrPart: 'audioTasksQueueBlockOrPart',
          isAudioEditAligning: 'isAudioEditAligning'
      }),
      metaStyles: function () {
          let result = '';
          if (this.meta.styles) {
            result = [];
            for (let style in this.meta.styles) {
              //console.log('style', style, 'val', this.meta.styles[style]);
              if (this.meta.styles[style].length) result.push(this.meta.styles[style]);
            }
            result = result.join(' ');
          }
          return result;
      },
      getListObjs: { cache: false,
        get: function () {
          return this.parlistO.listObjs;
        }
      },
      keymap: function() {
        return {
          // 'esc+ctrl' is OK.
          'ctrl+home': (ev)=>{
            //console.log('ctrl+home');
            let firstRid = this.parlistO.getFirstRid();
            if (firstRid) {
              let block = this.parlistO.getBlockByRid(firstRid);
              if (block) this.scrollToBlock(block.blockid);
            }
          },
          'ctrl+end': (ev)=>{
            //console.log('ctrl+end')
            let lastRid = this.parlistO.getLastRid();
            if (lastRid) {
              let block = this.parlistO.getBlockByRid(lastRid);
              if (block) this.scrollToBlock(block.blockid);
            }
          },
          'ctrl+up': (ev)=>{
            //console.log('ctrl+up arrow');
            let idsArray = this.parlistO.idsArray();
            let jumpStep = Math.floor(idsArray.length * 0.1);
            let currIdx = idsArray.indexOf(this.startId);
            if (currIdx > -1) {
              let jumpIdx = currIdx - jumpStep;
              if (jumpIdx < 0) jumpIdx = 0;
              this.scrollToBlock(idsArray[jumpIdx]);
            }
          },
          'ctrl+down': (ev)=>{
            //console.log('ctrl+down arrow');
            let idsArray = this.parlistO.idsArray();
            let jumpStep = Math.floor(idsArray.length * 0.1);
            let currIdx = idsArray.indexOf(this.startId);
            if (currIdx > -1) {
              let jumpIdx = currIdx + jumpStep;
              if (jumpIdx > idsArray.length) jumpIdx = idsArray.length -1;
              this.scrollToBlock(idsArray[jumpIdx]);
            }
          },
          'pgup': (ev)=>{
            //console.log('page up');
            ev.preventDefault();
            let prevId = this.parlistO.getInId(this.startId);
            if (prevId && prevId !== this.startId) {
              this.startId = prevId;
              this.scrollToBlock(prevId);
            }
          },
          'pgdn': (ev)=>{
            //console.log('page down');
            ev.preventDefault();
            let nextId = this.parlistO.getOutId(this.startId);
            if (nextId && nextId !== this.startId) {
              this.startId = nextId;
              this.scrollToBlock(nextId);
            }
          },
//           'enter': {
//             keydown: ()=>{console.log('enter+keydown')},
//             keyup: ()=>{console.log('enter+keyup')}
//           }
        }
      }
  },
  mixins: [access, taskControls, api_config],
  components: {
      BookBlockView, BookBlockPreview, vueSlider
  },
  methods: {
    ...mapActions([
    'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
    'loopPreparedBlocksChain', 'putBlockO', 'putNumBlockO',
    'putNumBlockOBatch',

    'searchBlocksChain', 'putBlock', 'getBlock', 'getBlocks', 'putBlockPart', 'setMetaData', 'freeze', 'unfreeze', 'tc_loadBookTask', 'addBlockLock', 'clearBlockLock', 'setBlockSelection', 'recountApprovedInRange', 'loadBookToc', 'setCurrentBookCounters', 'loadBlocksChain', 'getCurrentJobInfo', 'updateBookVersion', 'insertBlock', 'blocksJoin', 'removeBlock', 'putBlockProofread', 'putBlockNarrate', 'getProcessQueue', 'applyTasksQueue', 'saveBlockAudio', 'clearAudioTasks', 'revertAudio', 'discardAudioChanges']),

    test(ev) {
        console.log('test', ev);
    },
    stopWatchLiveQueries(){
      this.$store.state.liveDB.stopWatch('metaV');
      this.$store.state.liveDB.stopWatch('job');
      this.$store.state.liveDB.stopWatch('blockV');
      this.$store.state.liveDB.stopWatch('task');
    },
    refreshTmpl() {
      // a hack to update template
      //Vue.set(this, 'screenTop', this.screenTop + 0.1);
      /*let startId = this.startId;
      this.startId = false;
      this.startId = startId;*/
      //console.log('refreshTmpl');
      //this.parlistO.setStartId(this.startId);
      this.$forceUpdate();
      //this.updateVisibleBlocks();
    },

    refreshPreviewTmpl(idsArray) {
      //console.time('refreshPreviewTmpl');
      //console.log('refreshPreviewTmpl', idsArray);
      if (this.$refs.viewBlocks) {
        this.$refs.viewBlocks.forEach((blockRef, idx)=>{
          if (idsArray.indexOf(blockRef.blockId) > -1) {
            this.parlistO.setLoaded(blockRef.blockRid);
            blockRef.$forceUpdate();
          }
        })

      }
      //console.timeEnd('refreshPreviewTmpl');
    },

    loadBookMeta() {
      let checkMeta = this.parlistO.meta || {};
      checkMeta = checkMeta.bookid || false;
      if (this.$route.params.hasOwnProperty('bookid')) {
        if (!checkMeta || checkMeta!==this.$route.params.bookid || this.$route.params.task_type) {
          this.freeze('loadBookMeta');
          return this.loadBook(this.$route.params.bookid)
          .then((meta)=>{
            //console.log('loadBook then meta', meta);
            this.unfreeze('loadBookMeta');
            let startBlock = this.$route.params.block || false;
            let taskType = this.$route.params.task_type || false;

            return this.loadPartOfBookBlocks({
              bookId: this.$route.params.bookid,
              block: startBlock,
              taskType: taskType
            }).then((answer)=>{
              this.parlistO.setLookupsList(this.meta._id, answer);
              let rIdsArray = this.parlistO.rIdsArray();
              this.isNeedUp = rIdsArray[0];
              this.isNeedDown = rIdsArray[rIdsArray.length-1];
              this.$router.replace({name: this.$route.name, params: {}});
              return Promise.resolve(answer);
            })
          }).catch((err)=>{
            this.unfreeze('loadBookMeta');
            return Promise.reject(err);
          });
        } else {
          this.handleScroll(true);
          return Promise.resolve({ blocks:[] }); // already loaded
        }
      } else return Promise.reject('No bookid');
    },

    lazyLoad(firstId = false, lastId = false)
    {
      //console.log('lazyLoad', this.isNeedUp, this.isNeedDown, this.lazyLoaderDir);
      //console.log('parlist', Array.from(this.parlist.keys()));
      //console.log('lazyLoaderDir1', firstId, lastId);

      this.isNeedUp = firstId || this.isNeedUp;
      this.isNeedDown = lastId || this.isNeedDown;

      //console.log('lazyLoad', this.isNeedUp, this.isNeedDown, this.lazyLoaderDir);

      if (!this.isBlocked && (this.isNeedUp || this.isNeedDown)) {
        switch(this.lazyLoaderDir) {
          case 'down' : {
            this.isNeedDown = this.parlistO.getNextIds(this.isNeedDown, 100);
            //console.log('this.isNeedDown', this.isNeedDown);
            if (this.isNeedDown.length > 0)
            {
              this.getBlocks(this.isNeedDown)
              .then((rows)=>{
                if (rows && rows.length > 0) {
                  rows.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                    }
                    //this.parlistO.setLoaded(el._id);
                  });
                  //this.refreshPreviewTmpl(this.isNeedDown);
                  if (this.isNeedUp) this.lazyLoaderDir = 'up';
                  if (Array.isArray(this.isNeedDown)) this.isNeedDown = this.isNeedDown.pop();
                  //else this.isNeedDown = false;
                  //Vue.nextTick(()=>{
                    //this.lazyLoad();
                  //})
                }
              });
            } else {
              this.isNeedDown = false;
              if (this.isNeedUp) this.lazyLoaderDir = 'up';
              //Vue.nextTick(()=>{
                //this.lazyLoad();
              //})
            }

          } break;
          case 'up' : {
            this.isNeedUp = this.parlistO.getPrevIds(this.isNeedUp, 100);
            //console.log('this.isNeedUp', this.isNeedUp);
            if (this.isNeedUp.length > 0)
            {
              this.getBlocks(this.isNeedUp)
              .then((rows)=>{
                if (rows && rows.length > 0) {
                  rows.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                    }
                    //this.parlistO.setLoaded(el._id);
                  });
                  //this.refreshPreviewTmpl(this.isNeedUp);
                  if (this.isNeedUp) this.lazyLoaderDir = 'down';
                  if (Array.isArray(this.isNeedUp)) this.isNeedUp = this.isNeedUp[0];
                  //Vue.nextTick(()=>{
                    //this.lazyLoad();
                  //})
                }
              });
            } else {
              this.isNeedUp = false;
              if (this.isNeedDown) this.lazyLoaderDir = 'down';
              //Vue.nextTick(()=>{
                //this.lazyLoad();
              //})
            }
          } break;
        };

        //this.lazyLoad();
      };
    },

    loadPreparedBookDown(idsArray) { // mostly first page load

      let startId = idsArray[0] || this.meta.startBlock_id;
      this.freeze('loadBook');
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        if (result.rows && result.rows.length > 0) {
          //console.log('loadPreparedBookDown result', result.rows);
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el.blockid)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el.blockid);
            }
          });
          if (this.startId === false) {
            this.startId = startId; // first load
            this.parlistO.setStartId(startId);
            this.parlistO.setFirstVisibleId(startId);
          }
          this.unfreeze('loadBook');
          result.blockId = result.rows[result.rows.length-1].blockid;
          return Promise.resolve(result);
        } else {
          this.unfreeze('loadBook');
          return Promise.reject();
        }
      }).catch(err=>{
        this.unfreeze('loadBook'); return err;
      });
    },

    loadBookDown(checkRoute = false, startId = false, onPage = 10) {

      //this.freeze('loadBookDown');

      if (checkRoute && this.$route.params.hasOwnProperty('block') && this.$route.params.block) {
          let routeBlockId = this.$route.params.block;

          if (routeBlockId !== 'unresolved' && this.parlist.has(routeBlockId)) {
            this.startId = routeBlockId;
            this.screenTop = initialTopOffset;
            //this.lazyLoad();
            return Promise.resolve(routeBlockId);
            //this.lazyLoad(false, lastId);
          }

          this.freeze('loadBookDown');
          return this.getBloksUntil(routeBlockId, this.$route.params.task_type)
          .then(blockId=>{
            if (routeBlockId == 'unresolved') {
              this.$router.push({name: this.$route.name, params:  {}});
            }
            this.unfreeze('loadBookDown');
            //this.startId = blockId;
            this.scrollToBlock(blockId);
            //this.lazyLoad();
            return Promise.resolve(blockId);
          }).catch(err=>{
            console.log('loadBookDown->getBloksUntil Error:', err);
            this.unfreeze('loadBookDown'); return err;
          });

      } else {
        startId = startId || this.meta.startBlock_id;
        this.freeze('loadBookDown');
        return this.getBlocks(startId, onPage)
        .then(res=>{
          if (this.startId === false) {
            this.startId = startId; // first load
          }
          this.unfreeze('loadBookDown');
          let lastId = res.length ? res[res.length-1]._id : false;
          this.lazyLoad(false, lastId);
          return Promise.resolve(res);
        }).catch(err=>{
          this.unfreeze('loadBookDown'); return err;
        });
      }
    },

    getBloksUntil (startId, task_type = null)
    {
      //console.log('getBloksUntil', startId, task_type);
      //console.log('this.tc_tasksByBlock', this.tc_tasksByBlock);

      return new Promise((resolve, reject)=>{

        if (task_type && task_type !== 'text-cleanup' && task_type !== 'master-audio') {
          if (!Object.keys(this.tc_tasksByBlock).length) {
            return reject();
          }
        }

        if (task_type === 'true') {
          task_type = true;
        }
        if (!task_type && !this._is('editor')) {
          task_type = true;
        }

        let found = false;
        let crossId = /*(startId === 'unresolved') ? this.startId :*/ this.meta.startBlock_id;
        switch(startId) {
          case 'unresolved': {
          if (this.parlist.size > 0) {
            for (var idx=0; idx < this.parlist.size; idx++)
            {
              let block = this.parlist.get(crossId);
              if (!block) break;
              crossId = block.chainid;
              if (this.tc_hasTask('metadata_cleanup') || this.tc_hasTask('audio_mastering'))
              {
                if (!found && !block.markedAsDone && (!block.status || !block.status.proofed))
                {
                  found = block._id;
                }
              } else {
                let task = this.tc_getBlockTask(block._id);
                if (task && (task_type === true || task.type === task_type))
                {
                  found = block._id;
                }
              }
              if (found) break;
            };
          };

          } break;
          default : {
            if (this.parlist.has(startId)) found = startId;
          } break;
        }
        if (found) {
          return resolve(found);
        } else
        { // if there is no such blocks already in parlist

          switch(startId) {
            case 'unresolved': {
              this.loadBlocksChain({
                book_id: this.meta._id,
                startId: this.startId || this.meta.startBlock_id,
                search: {block_type: 'unresolved',  task_type: task_type}
              }).then((result)=>{
                if (result.rows.length > 0)
                {
                  result.rows.forEach((el, idx, arr)=>{
                    let newBlock = new BookBlock(el);
                    //this.parlist.set(newBlock._id, newBlock);
                    this.$store.commit('set_storeList', newBlock);
                  });
                  let lastId = result.rows[result.rows.length-1]._id;
                  this.lazyLoad(result.blockId || this.meta.startBlock_id, lastId);
                  return resolve(result.blockId);
                }
                else {
                  if (this.parlist.has(result.blockId)) return resolve(result.blockId);
                  this.getBlocks(result.blockId)
                  .then((res)=>{
                    let lastId = res.length ? res[res.length-1]._id : false;
                    this.lazyLoad(this.startId || this.meta.startBlock_id, lastId);
                    return resolve(result.blockId);
                  }).catch(err=>{
                    return reject(err);
                  });
                }

              }).catch(err=>{
                return reject(err);
              });
            } break;
            default : {
              this.getBlocks([startId])
              .then((res)=>{
                return resolve(startId);
              }).catch((err)=>{
                return reject(err);
              });
            } break;
          }
        }
      });
    },

    refreshBlock (change) {
      //console.log('refreshBlock', change);
      //console.log('this.$refs.blocks', this.$refs.blocks);
      //console.log('blockers', this.blockers);
        /*if (change.doc.audiosrc) {
          change.doc.audiosrc = process.env.ILM_API + change.doc.audiosrc;
        }*/

        /*if (change.doc.footnotes) change.doc.footnotes.forEach((f, fIdx)=>{
          if (f.audiosrc) {
            f.audiosrc = process.env.ILM_API + f.audiosrc +'?'+ (new Date()).toJSON();
          }*/
      let oldBlock = this.parlist.get(change.doc.blockid);
      let updField = change.updField || false;
      if (oldBlock) {
        if (change.deleted === true) {
          this.parlist.delete(change.doc.blockid);
          this.clearBlockLock({block: change.doc, force: true})
        } else {
          this.clearBlockLock({block: change.doc});
          if (oldBlock.partUpdate) {
            //oldBlock._rev = change.doc._rev;
            this.$store.commit('set_storeList', new BookBlock(oldBlock));
            this.refreshTmpl();
          } else if (updField) {
            oldBlock[updField] = change.doc[updField];
            oldBlock._rev = change.doc._rev;
            this.$store.commit('set_storeList', new BookBlock(oldBlock));
            this.refreshTmpl();
          } else {
            let newBlock = new BookBlock(change.doc);
            let el = this.$children.find(c => {
              return c.$el.id == newBlock.blockid;
            });
            if (el && (el.isChanged || el.isAudioChanged || el.isIllustrationChanged)) {
              if (oldBlock.status && newBlock.status && oldBlock.status.assignee === newBlock.status.assignee) {
                if (oldBlock.voicework != newBlock.voicework) {
                  oldBlock.voicework = newBlock.voicework;
                  oldBlock.audiosrc = newBlock.audiosrc;
                  oldBlock.audiosrc_ver = newBlock.audiosrc_ver;
                  el.refreshBlockAudio(false);
                }
              } else {
                this.$store.commit('set_storeList', newBlock);
              }
            } else {
              this.$store.commit('set_storeList', newBlock);
              this.refreshPreviewTmpl([newBlock.blockid]);
              this.refreshTmpl();
              if (newBlock.type == 'illustration') this.scrollToBlock(newBlock.blockid);
            }
          }
        }
      }
      if (this.$refs.blocks) this.$refs.blocks.forEach(($ref)=>{
        $ref.addContentListeners();
      })
      //this.initRecorder();
      this.recountApprovedInRange();
    },

    hasClass: function(block, cssclass) {
      let list = block.classes.toLowerCase().trim().split(' ');
      return (list.indexOf(cssclass.toLowerCase()) > -1)
    },
    showID: function(block) {
      return ((block.type==='par') && this.hasClass(block, 'parnum'))
    },

    hideParNum: function(block) {
      alert('Removing Paragraph Number'+ block.id)
    },
    showParNum: function(block) {
      alert('Adding Paragraph Number'+ block.id)
    },
    insertBlockBelow: function (block) {
      alert('Inserting new Block after '+block.id)
    },
    editBlockId: function(block) {
      alert('Editing block id '+block.id)
    },

    putBlockProxy: function ([block, realign]) {
      //console.log('putBlockProxy', block);
      return this.putBlock([block, realign])
      .then((updated)=>{
        return this._refreshAfterUpdate(updated);
      })
      .catch((err)=>{})
    },

    putBlockPartProxy: function (blockData, realign = false) {
      //console.log('putBlockPartProxy', blockData);
      return this.putBlockPart([blockData, realign])
      .then((updated)=>{
        this.updateVisibleBlocks();
        this.refreshPreviewTmpl([updated.blockid]);
        this.$store.commit('set_storeList', new BookBlock(updated));
      })
      .catch((err)=>{})
    },

    putBlockOProxy: function (blockData) {
      //console.log('putBlockOProxy', blockData);
      return this.putBlockO(blockData)
      .then((blocks)=>{
        //console.log('putBlockOProxy then');
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
      .catch((err)=>{})
    },

    putBlockProofreadProxy: function(block) {
      return this.putBlockProofread(block)
        .then(response => {
          return this._refreshAfterUpdate(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    putBlockNarrateProxy: function(block) {
      return this.putBlockNarrate(block)
        .then(response => {
          return this._refreshAfterUpdate(response);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    },

    _refreshAfterUpdate(block) {
      this.updateVisibleBlocks();
      this.refreshPreviewTmpl([block.blockid]);
      this.$store.commit('set_storeList', new BookBlock(block));
      //this.parlistO.getBlockByRid(block.id).type = block.type;
      Vue.nextTick(()=>{
        this.$root.$emit('from-block-edit:set-style-switch');
      });
      return Promise.resolve(this.parlist.get(block.blockid));
    },

    putNumBlockOProxy: function (blockData) {
      return this.putNumBlockO(blockData)
      .then((blocks)=>{
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
      .catch((err)=>{})
    },

    putNumBlockOBatchProxy: function (numData) {
      return this.putNumBlockOBatch(numData)
      .then((blocks)=>{
        //console.log('putNumBlockOProxy then');
        this.updateVisibleBlocks();
        return Promise.resolve(blocks)
      })
      .catch((err)=>{})
    },

    getBlockProxy: function (block_id) {
      let oldBlock = this.parlist.get(block_id);
      return this.getBlock(block_id)
      .then((res)=>{
        //this.parlist.set(res._id, new BookBlock(res));
        if (oldBlock) {
          res.checked = oldBlock.checked;
        }
        let block = new BookBlock(res);
        if (Array.isArray(block.parts) && Array.isArray(oldBlock.parts) && block.parts.length === oldBlock.parts.length) {
          oldBlock.parts.forEach((p, pIdx) => {
            block.parts[pIdx].inid = p.inid;
            if (p.isChanged) {
              block.parts[pIdx].isChanged = p.isChanged;
            }
            if (p.isAudioChanged) {
              block.parts[pIdx].isAudioChanged = p.isAudioChanged;
            }
          });
        }
        this.$store.commit('set_storeList', block);
        this.$root.$emit('from-block-edit:set-style');
        this.refreshTmpl();
        return Promise.resolve(block);
      })
      .catch((err)=>{
        console.log(err);
      })
    },

    allowSetStart: function(block_id) {
      if (!this.blockSelection.end._id || block_id == this.blockSelection.end._id) {
        return true;
      }
      let crossId = block_id;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          if (block._id == this.blockSelection.end._id) {
            return true;
          }
          crossId = block.chainid;
        } else break;
      }
      return false;
    },

    allowSetEnd: function(block_id) {
      if (!this.blockSelection.start._id || block_id == this.blockSelection.start._id) {
        return true;
      }
      let crossId = block_id;
      for (var idx=0; idx < this.parlist.size; idx++) {
        let block = this.parlist.get(crossId);
        if (block) {
          if (block._id == this.blockSelection.start._id) {
            return false;
          }
          crossId = block.chainid;
        } else break;
      }
      return true;
    },
    evFromAudioeditorClosedIndicator(blockId) {
        //console.log('evFromAudioeditorClosed bookedit', blockId, this.audioTasksQueue.block);
        if (this.audioTasksQueue.block.blockId === blockId){
            this.audioTasksQueue.block.blockId = null;
        }

      },
    eventKeyDown: function(key) {
        if (key.code==='Escape' || key.keyCode===27) this.$events.emit('currentEditingBlock_id', key);
    },
    onMediaSuccess_msr(stream) {
      if (!this.recorder || (this.recorderStream && !this.recorderStream.active && this.recorderStream.id !== stream.id && stream.active)) {
        this.recorderStream = stream;
        if (this.recorder) {
          this.recorder.destroy()
          this.recorder = null;
        }
        this.recorder = new mediaStreamRecorder(stream, {
          recorderType: mediaStreamRecorder.MediaStreamRecorder,
          mimeType: 'audio/ogg',
          disableLogs: true,
          type: 'audio'
        });
      } else {
        //console.log(this.recorder, this.recorder.getInternalRecorder());
      }
    },
    initRecorder() {
      return new Promise((resolve, reject) => {
        // return resolve();
        if (this._is('narrator', true)) {
          navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              channelCount: 1
            },
            video: false
          })
          .then((stream) => {
            this.onMediaSuccess_msr(stream);
            resolve();
          })
          .catch((e) => {
            //console.log('media error', e);
            reject(e);
          });
          /*navigator.getUserMedia({
            audio: true
          }, (stream) => {
            this.onMediaSuccess_msr(stream);
            resolve();
          }, (e) => {
            //console.log('media error', e);
            reject(e);
          });*/
        } else {
          resolve();
        }
      });
    },
    stopRecordingAndNext(block, blockPartIdx) {
      if (block.parts && block.parts.length - 1 > blockPartIdx) {
        let element = document.getElementById(`${block.blockid}-${blockPartIdx + 1}`);
        if (element) {
          element.scrollIntoView();
          this.$root.$emit('start-narration-part-' + block.blockid + '-part-' + (blockPartIdx + 1));
        }
        return;
      }
      let next = this.findNextBlock(block, 'narrate');
      if (next) {
        this.scrollToBlock(next.blockid);
        this.handleScroll(true);
        Vue.nextTick(()=>{
          this.$root.$emit('start-narration-part-' + next.blockid + '-part-0');
          //el.startRecording();
        });
      }
    },

    findNextBlock(block, task) {
      let next = false;
      let curr = block.blockid;
      do {
        curr = this.parlistO.getOutId(curr);
        if (curr) {
          if (task) {
            switch (task) {
              case 'narrate':
                if (this.tc_isNarrationEnabled(curr)) {
                  next = curr;
                }
                break;
            }
          }
        }
      } while (curr && !next);
      return next ? this.parlist.get(next) : false;
    },

    createEmptyBlock(bookid, block_id) {
      let newBlock = {
        blockid: bookid + '_' + Date.now(),
        //_rev: '1-newrevisionnumber',
        bookid: bookid,
        chainid: block_id,
        tag: 'p',
        type: 'par',
        parnum: '',
        //content: '',
        voicework: 'no_audio',
        status: {
          assignee: 'editor',
          proofed: false
        }
      }
      if (this.currentJobInfo.text_cleanup) {
        newBlock.status['stage'] = 'cleanup';
        newBlock.status['marked'] = false;
        newBlock.voicework = 'audio_file';
      } else {
        newBlock.status['not_process'] = true;
        newBlock.status['marked'] = false;
      }
      newBlock.trimmed_silence = false;

      return new BookBlock(newBlock);
    },

    insertBlockBefore(block, block_Idx) {
      this.freeze('insertBlockBefore');
      let newBlock = this.createEmptyBlock(block.bookid, block._id).clean();
      this.insertBlock({
        blockid: block.blockid,
        direction: 'before',
        newBlock: newBlock
      })
        .then((response)=>{
          //this.setBlockSelection({start: {}, end: {}});
          let b_new = response.data.new_block;
          let b_old = response.data.block;

          let blockO = response.data.new_block;
          if (!this.parlistO.get(blockO.blockid)) {
            this.parlistO.addBlock(blockO);
          }
          if (!this.parlist.get(b_new.blockid)) {// can be already added by syncgronization
            this.$store.commit('set_storeList', new BookBlock(b_new));
          }

//           if (b_old) {
//             this.refreshBlock({doc: b_old, deleted: false});
//           }

          this.putNumBlockOBatchProxy({bookId: block.bookid});

          if (!this.parlistO.getInId(blockO['@rid'])) {
            this.startId = blockO.blockid;
            this.parlistO.setStartId(blockO['@rid']);
            this.parlistO.setFirstVisibleId(blockO['@rid']);
          }
          this.unfreeze('insertBlockBefore');
          this.tc_loadBookTask(block.bookid);
          this.getCurrentJobInfo();
          if (this.tc_hasTask('audio_mastering')) {
            this.setCurrentBookCounters(['not_proofed_audio_blocks']);
          }
          //this.refreshTmpl();
        })
        .catch(err => {
          this.unfreeze('insertBlockBefore');
          return err;
        });
    },

    insertBlockAfter(block, block_Idx) {
      //this.insertBlock(block_id, 'after');
      this.freeze('insertBlockAfter');
      let newBlock = this.createEmptyBlock(block.bookid, block.chainid).clean();
      this.insertBlock({
        blockid: block.blockid,
        direction: 'after',
        newBlock: newBlock
      })
        .then((response)=>{
          //this.setBlockSelection({start: {}, end: {}});
          let b_new = response.data.new_block;
          let b_old = response.data.block;

          let blockO = response.data.new_block;
          if (!this.parlistO.get(blockO.blockid)) {
            this.parlistO.addBlock(blockO);
          }
          if (!this.parlist.get(b_new.blockid)) {// can be already set by synchronization
            this.$store.commit('set_storeList', new BookBlock(b_new));
          }

//           if (b_old) {
//             this.refreshBlock({doc: b_old, deleted: false});
//           }

          this.putNumBlockOBatchProxy({bookId: block.bookid});

          if (!this.parlistO.getOutId(blockO.blockid)) {
            let firstId = this.parlistO.idsViewArray()[0];
            this.startId = this.parlistO.getOutId(firstId);
            this.parlistO.setStartId(this.startId);
            //this.startId = blockO.blockid;
          } //else this.refreshTmpl();
          this.unfreeze('insertBlockAfter');
          this.tc_loadBookTask(block.bookid);
          this.getCurrentJobInfo();
          if (this.tc_hasTask('audio_mastering')) {
            this.setCurrentBookCounters(['not_proofed_audio_blocks']);
          }
          //this.refreshTmpl();
        })
        .catch(err => {
          this.unfreeze('insertBlockAfter');
          return err;
        });
    },
    blockUpdated(blockid) {
      if (this._is('editor', true) && !this.currentJobInfo.text_cleanup && !this.currentJobInfo.mastering && !this.tc_getBlockTask(blockid) && !this.tc_getBlockTaskOtherRole(blockid)) {
        this.createBlockSubtask(blockid, 'approve-modified-block', 'editor');
      } else if (this._is('proofer', true) && !this.tc_getBlockTask(blockid) && !this.tc_getBlockTaskOtherRole(blockid) && !this.currentJobInfo.text_cleanup && !this.currentJobInfo.mastering) {
        this.createBlockSubtask(blockid, 'approve-revoked-block', 'proofer');
      }
    },
    createBlockSubtask(blockid, type, executor) {
      axios.post(this.API_URL + 'task/subtask_by_book', {
        bookid: this.meta._id,
        params: {
          type: type,
          executor: executor,
          blockid: blockid
        }
      })
        .then((response) => {
          this.tc_loadBookTask(this.meta._id);
          this.getCurrentJobInfo();
        })
        .catch((err) => {})
    },

    deleteBlock(block, block_Idx) {
      //console.log('deleteBlock', block._id);
      this.freeze('deleteBlock');
      this.removeBlock(block._id)
      .then((response)=>{
        //this.setBlockSelection({start: {}, end: {}});
        if (response.data) {

          let newStartId = this.parlistO.delBlock(response.data);
          if (newStartId !== this.startId) {
            // in case when first or last block in book was deleted
            this.startId = newStartId;
            this.parlistO.setStartId(newStartId);
          } //else this.refreshTmpl();
          this.parlist.delete(block._id);
          if (this.parlistO.firstVisibleId === block._id) {
            this.parlistO.setFirstVisibleId(this.startId)
          }
        }
        //this.getCurrentJobInfo();

        this.putNumBlockOBatchProxy({bookId: block.bookid})
          .then(() => {
            if (['header', 'title'].indexOf(block.type) !== -1) {
              this.loadBookToc({isWait: true, bookId: block.bookid});
            }
          });

        this.unfreeze('deleteBlock');
        this.updateBookVersion({major: true})
        this.tc_loadBookTask(block.bookid);
        this.getCurrentJobInfo();
        //this.refreshTmpl();
      })
      .catch(err => {
        this.unfreeze('deleteBlock');
        return err;
      });

    },
    joinBlocks(block, block_Idx, direction) {

      switch(direction) {
        case 'previous' : {
          let getPrevBlock = new Promise((resolve, reject) => {
            let _prevId = this.parlistO.getInId(block.blockid);
            let _prev = this.parlist.get(_prevId);
            if (_prev) {
              resolve(_prev);
            } else {
              this.getBlock(_prevId)
                .then(_prev => {
                  resolve(_prev);
                })
                .catch(err => {
                  reject(err);
                });
            }
          });
          return getPrevBlock
          .then((blockBefore)=>{
            //if (!checkArr.includes(block.type) || !checkArr.includes(blockBefore.type)) {


            let elBlock = this.$refs.blocks.find(c => {
              return c.$el.id == block.blockid;
            });
            let elNext = this.$refs.blocks.find(c => {
              return c.$el.id == blockBefore.blockid;
            });
            let isChanged = (elBlock && (elBlock.isChanged || elBlock.hasChangedPart)) || (elNext && (elNext.isChanged || elNext.hasChangedPart));
            if (!isChanged) {
              isChanged = this.parlist.get(block.blockid).getIsAudioChanged() ||
                    this.parlist.get(blockBefore.blockid).getIsAudioChanged() ||
                    (elBlock && elBlock.audioEditFootnote.isAudioChanged) ||
                    (elNext && elNext.audioEditFootnote.isAudioChanged);
            }
            if (isChanged) {
              this.unableToJoinChangedMessage();
              return Promise.reject(new Error('unsaved_changes'));
            }
            else
            {
              if (block.type !== blockBefore.type) {
                this.unableJoinMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              if (!this.parlist.has(blockBefore.blockid)) {
                this.unableJoinMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              if (block.voicework !== blockBefore.voicework) {
                this.unableToJoinVoiceworkMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              this.addBlockLock({block: blockBefore, watch: ['realigned'], type: 'join'})
              this.addBlockLock({block: block, watch: ['realigned'], type: 'join'})
              this.freeze('joinBlocks');
              if ((elBlock && elBlock.getIsAudioEditing()) ||
                      (elNext && elNext.getIsAudioEditing())) {
                this.$root.$emit('for-audioeditor:force-close');
              }
              if (elBlock) {
                elBlock.isAudioChanged = false;
              }
              //elBlock.evFromAudioeditorClosed(block.blockid);
              if (elNext) {
                elNext.isAudioChanged = false;
              }
              //elNext.evFromAudioeditorClosed(blockBefore.blockid);
              if (!elNext) {
                this.scrollToBlock(blockBefore.blockid);
              }
              return this.blocksJoin({
                resultBlock_id: blockBefore.blockid,
                donorBlock_id: block.blockid
              })
              .then((response)=>{
                //this.setBlockSelection({start: {}, end: {}});
                this.clearBlockLock({block: blockBefore, force: true});
                this.clearBlockLock({block: block, force: true});
                if (response.data.ok && response.data.blocks) {
                  response.data.blocks.forEach((res)=>{
                    this.refreshBlock({doc: res, deleted: res.deleted});
                  });
                }
                if (response.data.blocks && response.data.blocks[2]) {
                  this.parlistO.delBlock(response.data.blocks[2]);
                }

                this.putNumBlockOBatchProxy({bookId: block.bookid})
                  .then(() => {
                    if (['header', 'title'].indexOf(block.type) !== -1) {
                      this.loadBookToc({bookId: block.bookid, isWait: true})
                    }
                  });
                this.refreshTmpl();
                this.unfreeze('joinBlocks');
                this.getCurrentJobInfo();
                return Promise.resolve();
              })
              .catch((err)=>{
                this.refreshTmpl();
                this.clearBlockLock({block: blockBefore, force: true});
                this.unfreeze('joinBlocks');
                return Promise.reject(err);
              })
            }
          })
        } break;
        case 'next' : {
          let getNextBlock = new Promise((resolve, reject) => {
            let _nextId = this.parlistO.getOutId(block.blockid);
            let _next = this.parlist.get(_nextId);
            if (_next) {
              resolve(_next);
            } else {
              this.getBlock(_nextId)
                .then(_next => {
                  resolve(_next);
                })
                .catch(err => {
                  reject(err);
                });
            }
          });
          return getNextBlock
          .then((blockAfter)=>{

            let chainId = this.parlistO.getOutId(block.blockid);
            let elBlock = this.$refs.blocks.find(c => {
              return c.$el.id == block.blockid;
            });
            let elNext = this.$refs.blocks.find(c => {
              return c.$el.id == chainId;
            });
            let isChanged = (elBlock && (elBlock.isChanged || elBlock.hasChangedPart)) || (elNext && (elNext.isChanged || elNext.hasChangedPart));
            if (!isChanged) {
              isChanged = this.parlist.get(block.blockid).getIsAudioChanged() ||
                    this.parlist.get(chainId).getIsAudioChanged() ||
                    (elBlock && elBlock.audioEditFootnote.isAudioChanged) ||
                    (elNext && elNext.audioEditFootnote.isAudioChanged);
            }
            if (isChanged) {
              this.unableToJoinChangedMessage();
              return Promise.reject(new Error('unsaved_changes'));
            }
            else
            {
              if (block.type !== blockAfter.type) {
                this.unableJoinMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              if (!this.parlist.has(this.parlistO.getOutId(block.blockid))) {
                this.unableJoinMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              if (block.voicework !== blockAfter.voicework) {
                this.unableToJoinVoiceworkMessage();
                return Promise.reject(new Error('types_missmatch'));
              }
              this.freeze('joinBlocks');
              this.addBlockLock({block: block, watch: ['realigned'], type: 'join'})
              this.addBlockLock({block: blockAfter, watch: ['realigned'], type: 'join'})
              if ((elBlock && elBlock.getIsAudioEditing()) ||
                      (elNext && elNext.getIsAudioEditing())) {
                this.$root.$emit('for-audioeditor:force-close');
              }
              if (elBlock) {
                elBlock.isAudioChanged = false;
              }
              //elBlock.evFromAudioeditorClosed(block.blockid);
              if (elNext) {
                elNext.isAudioChanged = false;
              }
              //elNext.evFromAudioeditorClosed(blockAfter.blockid);
              return this.blocksJoin({
                resultBlock_id: block.blockid,
                donorBlock_id: blockAfter.blockid
              })
              .then((response)=>{
                //this.setBlockSelection({start: {}, end: {}});
                this.clearBlockLock({block: block, force: true});
                this.clearBlockLock({block: blockAfter, force: true});
                if (response.data.ok && response.data.blocks) {
                  response.data.blocks.forEach((res)=>{
                    this.refreshBlock({doc: res, deleted: res.deleted});
                  });
                }
                if (response.data.blocks && response.data.blocks[2]) {
                  this.parlistO.delBlock(response.data.blocks[2]);
                }

                this.putNumBlockOBatchProxy({bookId: block.bookid})
                  .then(() => {
                    if (['header', 'title'].indexOf(block.type) !== -1) {
                      this.loadBookToc({bookId: block.bookid, isWait: true});
                    }
                  });
                //this.refreshTmpl();
                this.unfreeze('joinBlocks');
                this.getCurrentJobInfo();
                return Promise.resolve();
              })
              .catch((err)=>{
                this.refreshTmpl();
                this.clearBlockLock({block: block, force: true});
                this.unfreeze('joinBlocks');
                return Promise.reject(err);
              })
            }
           })
        } break;
      };
    },

    unableJoinMessage() {
      this.$root.$emit('show-modal', {
        title: 'Blocks with different types can\'t be joined',
        text: '',
        buttons: [
          {
            title: 'Close',
            handler: () => {
              this.$root.$emit('hide-modal');
            },
          }
        ],
        class: ['align-modal']
      });
    },

    unableToJoinVoiceworkMessage() {
      this.$root.$emit('show-modal', {
        title: 'Blocks with different voicework type can’t be joined.',
        text: '',
        buttons: [
          {
            title: 'Close',
            handler: () => {
              this.$root.$emit('hide-modal');
            },
          }
        ],
        class: ['align-modal']
      });
    },

    unableToJoinChangedMessage() {
      this.$root.$emit('show-modal', {
        title: 'Unsaved Changes',
        text: 'Blocks have unsaved changes.<br/>Please save or discard your changes before joining.',
        buttons: [
          {
            title: 'Ok',
            handler: () => {
              this.$root.$emit('hide-modal');
            },
            'class': 'btn btn-primary'
          }
        ],
        class: ['align-modal']
      });
    },

    setRangeSelection(block, type, status, shift = false) {
      //console.log('setRangeSelection', block, type, status, shift);
      let newSelection = Object.assign({}, this.blockSelection);

      switch (type) {
        case 'start':
          if (status) {
            if (!this.selectionEnd || !this.selectionEnd._id || this.selectionEnd.index >= block.index) {
              this.selectionStart = block;
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
            this.parlist.forEach((pBlock)=>{
              pBlock.checkedStart = false;
            });
            //$('.set-range-start').prop('checked', false);
            this.parlist.get(this.selectionStart._id).checkedStart = true;
            //$('#' + this.selectionStart._id + ' .set-range-start').prop('checked', true);
          } else {
            this.selectionStart = {};
            this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
          }
          break;
        case 'end':
          if (status) {
            if (!this.selectionStart || !this.selectionStart._id || this.selectionStart.index <= block.index) {
                this.selectionEnd = block;
                this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
              }
              //$('.set-range-end').prop('checked', false);
              this.parlist.forEach((pBlock)=>{
                pBlock.checkedEnd = false;
              });
              //$('#' + this.selectionEnd._id + ' .set-range-end').prop('checked', true);
              this.parlist.get(this.selectionEnd._id).checkedEnd = true;
            } else {
              this.selectionEnd = {};
              this.$root.$emit('from-bookedit:set-selection', this.selectionStart, this.selectionEnd);
            }
          break;
        case 'byOne':
          //console.log('byOne', status, block.rid, 'start:', this.blockSelection.start._id, 'end:', this.blockSelection.end._id);

          let blockSel = {_id: block.blockid};
          this.parlistO.setUnCheckedRange();
          if (status) { // check
            if (shift && this.blockSelection.start._id) {
              let startRId = this.parlistO.getRIdById(this.blockSelection.start._id);
              switch (this.parlistO.compareIndex(startRId, block.rid)) {
                case -1:// block above current selection checked
                  newSelection = this.parlistO.setChecked(startRId, block.rid);
                  break;
                case 1:// block below current selection checked
                  let endRId = this.parlistO.getRIdById(this.blockSelection.end._id);
                  newSelection = this.parlistO.setChecked(block.rid, endRId);
                  break;
                default:
                  break;
              }
            } else {
              newSelection = this.parlistO.setChecked(block.rid);
            }
            //console.log('newSelection', newSelection.start._id, newSelection.end._id);
            this.setBlockSelection(newSelection);
          }
          else { // uncheck
            if (this.blockSelection.start._id && this.blockSelection.end._id && this.blockSelection.start._id !== this.blockSelection.end._id) {
              newSelection = this.parlistO.setChecked(block.rid);
              this.setBlockSelection(newSelection);
            }
            else this.setBlockSelection({start: {}, end: {}});
          }
          break;
      }
      //this.recountApprovedInRange();
    },
    findPrevBlock(blockId) {
      let found, BreakException = {}; // a trick to stop forEach
      try {
        this.parlist.forEach((block, _id)=>{
          if (block.chainid === blockId) {
            found = block;
            throw BreakException;
          }
        });
      } catch (e) {
        if (e !== BreakException) throw e;
        else return found;
      }
      return false;//idsViewArray
    },
    updateVisibleBlocks() {
      if (this.$refs.blocks && this.$refs.blocks.length) {
        this.$refs.blocks.forEach(($ref)=>{
          //$ref.isUpdated = true;
          //$ref.isUpdated = false;
          $ref.$forceUpdate();
        })
      }
    },
    setUnCheckedRange() {
      this.parlistO.setUnCheckedRange()
    },

    smoothScrollContent: _.debounce(function (ev) {
      this.scrollContent(ev);
    }, 50),

    scrollContent(ev, step = 60)
    {
      if (ev.deltaY !== false && ev.hasOwnProperty('preventDefault')) ev.preventDefault();

      if (ev.deltaY < 0 && this.blockers.indexOf('loadBook') >-1) return;
      if (ev.deltaY > 0 && this.blockers.indexOf('loadBook') >-1) return;

      step = (ev.deltaY!==false) ? (ev.deltaY > 0 ? step : -1*step) : 0;

      let idsViewArray = this.parlistO.idsViewArray();
      let lenDomBlocks = idsViewArray.length;
      //if (lenDomBlocks <= 1) return;

      let firstDomBlock = document.getElementById('s-'+idsViewArray[0].blockId);
      if (!firstDomBlock) return;
      let firstDomRect= firstDomBlock.getBoundingClientRect();

      let firstBlock = this.parlistO.getBlockByRid(idsViewArray[0].blockRid);
      let lastBlock = this.parlistO.getBlockByRid(idsViewArray[lenDomBlocks-1].blockRid);

      let topShift = 96;

      if (ev.deltaY < 0) { // scroll UP
        if (firstBlock.in == this.parlistO.meta.rid && firstDomRect.top >= topShift)
        { // if this is a very first block
          // this.screenTop = 0;
          return;
        }

        this.screenTop -= step;

        if (firstDomRect.bottom > 0) {
          let prevBlock = this.parlistO.getBlockByRid(firstBlock.in);
          if (prevBlock) {
            if (this.parlist.has(prevBlock.blockid)) { // already loaded
              this.startId = prevBlock.blockid;
              this.parlistO.setStartId(this.startId);

              Vue.nextTick(() => {
                firstDomBlock = document.getElementById('s-'+this.startId);
                firstDomRect= firstDomBlock.getBoundingClientRect();

                this.screenTop = this.screenTop - firstDomRect.height;

                this.$refs.blocks.forEach(($ref)=>{
                  $ref.addContentListeners();
                })
              });

            } else {
              let idsArray = this.parlistO.getPrevIds(firstBlock.in, 5);
              this.loadPreparedBookDown(idsArray)
              .then(()=>{
                this.startId = prevBlock.blockid;
                this.parlistO.setStartId(this.startId);

                Vue.nextTick(() => {
                  firstDomBlock = document.getElementById('s-'+this.startId);
                  firstDomRect= firstDomBlock.getBoundingClientRect();

                  this.screenTop = this.screenTop - firstDomRect.height;

                  this.$refs.blocks.forEach(($ref)=>{
                    $ref.addContentListeners();
                  })
                });

              }).catch(err=>{
                this.screenTop = initialTopOffset;
                return err;
              });
            }
          }
        }
      } else if (ev.deltaY > 0) { // scroll DOWN

        if (lastBlock.out == this.parlistO.meta.rid) {
          let lastDomBlock = document.getElementById('s-'+idsViewArray[lenDomBlocks-1].blockId);
          let lastDomRect = lastDomBlock.getBoundingClientRect();
          if (lastDomRect.bottom <= topShift + 100) {
            return; //last block reached
          }
        }

        this.screenTop -= step;

        if (firstDomRect.bottom < 0) {
          let nextBlock = this.parlistO.getBlockByRid(lastBlock.out);
          if (nextBlock) {
            if (this.parlist.has(nextBlock.blockid)) { // already loaded

              this.startId = this.parlistO.getBlockByRid(firstBlock.out).blockid;
              this.parlistO.setStartId(this.startId);

              this.screenTop = this.screenTop + firstDomRect.height;

              this.$refs.blocks.forEach(($ref)=>{
                $ref.addContentListeners();
              })
            } else {
              let idsArray = this.parlistO.getNextIds(lastBlock.out, 5);
              this.loadPreparedBookDown(idsArray)
              .then(()=>{

                this.startId = this.parlistO.getBlockByRid(firstBlock.out).blockid;
                this.parlistO.setStartId(this.startId);

                this.screenTop = this.screenTop + firstDomRect.height;

                this.$refs.blocks.forEach(($ref)=>{
                  $ref.addContentListeners();
                })

              }).catch(err=>{
                this.screenTop = initialTopOffset;
                return err;
              });
            }
          }
        }

      } else return;

      var editors = document.getElementsByClassName('medium-editor-toolbar-active');
      if (editors && editors.length) { //move editor toolbar
        editors[0].style.top = editors[0].getBoundingClientRect().top - step +'px';
      }
    },

    scrollToBlock(blockId, blockPartIdx = null)
    {
      //console.log('scrollToBlock', blockId, blockPartIdx);
      let id = 'v-'+ blockId;
      if (blockPartIdx !== null) {
        id+= '-' + blockPartIdx;
      }
      let vBlock = document.getElementById(id);
      if (vBlock) {
        this.parlistO.setFirstVisibleId(blockId);
        let firstId = this.parlistO.idsViewArray()[0];
        if (firstId) {
          firstId = firstId.blockRid;
        }
        this.scrollToId = blockId;
        vBlock.scrollIntoView();
        if (firstId) {
          let i = 0;
          let scrollInterval = setInterval(() => {// force scroll to the element after all visible elements are loaded
            ++i;
            if (i > 10) {
              clearInterval(scrollInterval);
            }
            let newFirstId = this.parlistO.idsViewArray()[0];
            if (newFirstId && newFirstId.blockRid) {
              if (newFirstId.blockRid !== firstId) {
                let loaded = true;
                this.parlistO.idsViewArray().forEach(l => {
                  loaded = !loaded ? false : this.parlistO.getBlockByRid(l.blockRid).loaded;
                });
                if (loaded) {
                  vBlock.scrollIntoView();
                  clearInterval(scrollInterval);
                }
              }
            } else {
              clearInterval(scrollInterval);
            }
          }, 100);
        }
        //this.parlistO.setStartId(blockId)
      }
    },

    scrollToBlockEnd(id) {
//       try {
//         let blockOffset = $('#' + id).offset().top;
//         let firstHeight = $('#content-' + id).height();
//         if (firstHeight + blockOffset > window.innerHeight) {
//           this.screenTop-=firstHeight - 200;
//         }
//       } catch (err) {
//         //this.screenTop -= step;
//         return;
//       }
    },

    listenSetNum(bookId, numMask, blockRid) {
      //console.log('listenSetNum', bookId, numMask);
      if (bookId) {
        this.putNumBlockOBatchProxy({bookId: bookId, bookNum: numMask, blockRid: blockRid})
        .then(() => {
          this.loadBookToc({bookId: this.meta._id, isWait: true});
        });
      } else this.updateVisibleBlocks();
      //this.refreshTmpl();
    },

    checkVisible(elm, viewHeight = false) {
      var rect = elm.getBoundingClientRect();
      if (!viewHeight) viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      return !(rect.bottom < initialTopOffset+30 || rect.top - viewHeight >= 0);
    },

    updatePositions() {
      if (this.$refs.contentScrollWrapRef) {
        let currScroll = this.$refs.contentScrollWrapRef.scrollTop;
        var editors = document.getElementsByClassName('medium-editor-toolbar-active');
        if (editors && editors.length) { //move editor toolbar
          editors[0].style.top = editors[0].getBoundingClientRect().top - (currScroll - this.scrollPrev) +'px';
        }
        this.scrollPrev = currScroll;
      }
    },

    smoothHandleScroll: _.debounce(function (ev) {
      ev.stopPropagation();
      //console.log('smoothHandleScroll', ev);
      this.handleScroll();
    }, 100),

    handleScroll(force = false) {
      if (!this.$refs.viewBlocks || !this.$refs.viewBlocks.length) {
        return false;
      }
      //console.log('handleScroll', (new Date()).toJSON());
      let scrolledBottom = this.$refs.contentScrollWrapRef.offsetHeight + this.$refs.contentScrollWrapRef.scrollTop >= this.$refs.contentScrollWrapRef.scrollHeight;
      this.$store.commit('set_taskBlockMapAllowNext', !scrolledBottom);
      if (!this.onScrollEv) {
        let firstVisible = false;
        let lastVisible = false;
        let fixJump = 'false';
        let loadIdsArray = [];
        let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        //let loadCount = 5;
        let startFrom = this.scrollToId ? this.parlistO.listIds.indexOf(this.scrollToId) : 0;
        this.scrollToId = null;
        for (var i = startFrom; i < this.parlistO.listObjs.length; i++) {
          let blockRef = this.$refs.viewBlocks.find(v => v.blockId === this.parlistO.listObjs[i].blockId);
          let visible = this.checkVisible(blockRef.$refs.viewBlock, viewHeight);
          if (visible) {
            if (!firstVisible) {
              firstVisible = blockRef.blockO;
              this.parlistO.setFirstVisibleId(blockRef.blockId);
            }
            lastVisible =  blockRef.blockO;
            if (this.parlistO.get(blockRef.blockRid).loaded !== true && this.parlist.has(blockRef.blockId)) {
              if (fixJump === 'false') fixJump = 'true';
              this.parlistO.setLoaded(blockRef.blockRid);
              blockRef.$forceUpdate();
            } else {
              if (fixJump === 'true') fixJump = blockRef.blockO;
              if (this.parlistO.get(blockRef.blockRid).loaded === false) {
                this.parlistO.getBlockByRid(blockRef.blockRid).loaded = 'loading';
                loadIdsArray.push(blockRef.blockId);
              }
            }
          /*} else if (firstVisible && loadCount > 0) {
            if (this.parlistO.get(blockRef.blockRid).loaded !== true && this.parlist.has(blockRef.blockId)) {
              loadCount--;
              this.parlistO.setLoaded(blockRef.blockRid);
              blockRef.$forceUpdate();
            }*/
          } else if (firstVisible) break;
        }
        //if (scrolledBottom) {
          //this.parlistO.setFirstVisibleId(this.parlistO.listIds[this.parlistO.listIds.length - 1]);
        //}

        /*if (fixJump !== 'true' && fixJump !== 'false') {
          //this.scrollToBlock(fixJump.blockid);
          this.scrollToBlock(this.parlistO.get(fixJump.in).blockid);
          //return false;
        }*/

        if (loadIdsArray.length) {
          this.getBlocksArr(loadIdsArray)
          .then((resIdsArray)=>{
            for (var i = 0; i < this.$refs.viewBlocks.length; i++) {
              let updCount = 0;
              if (resIdsArray.indexOf(this.$refs.viewBlocks[i].blockId) > -1) {
                //this.parlistO.setLoaded(blockRef.blockO.rid);
                updCount++;
                this.$refs.viewBlocks[i].$forceUpdate();
              }
              if (updCount >= resIdsArray.length) break;
            }
            this.moveEditWrapper(firstVisible, lastVisible, force)
          })
        } else {
          this.moveEditWrapper(firstVisible, lastVisible, force);
        }

//         if (firstVisibleId !== false && this.$route.params.block !== firstVisibleId) {
//           this.onScrollEv = true;
//           this.$router.push({
//             name: 'BookEditDisplay',
//             params: { block: firstVisibleId }
//           });
//         }
     } else this.onScrollEv = false;
      this.parlistO.idsViewArray().forEach(l => {
        let blockRef = this.$refs.viewBlocks.find(v => v.blockId === l.blockId);
        if (this.parlistO.has(l.blockRid) && this.parlist.has(l.blockId)) {
          this.parlistO.setLoaded(l.blockRid);
          if (blockRef) {
            blockRef.$forceUpdate();
          }
        }
      });
    },

    moveEditWrapper(firstVisible, lastVisible, force) {
      if (firstVisible !== false) {
        //if (firstVisible.rid == this.parlistO.getFirstRid()) return;
        //if (lastVisible.rid == this.parlistO.getLastRid()) return;

        let checkUpp = !this.parlistO.isInViewArray(firstVisible.in);
        let checkDown = !this.parlistO.isInViewArray(lastVisible.out);

        if (checkUpp || checkDown || force) {
          this.startId = firstVisible.blockid;
//           let prevId = this.parlistO.getPrevIds(firstVisible.rid, 2);
//           if (prevId.length < 1) prevId = [firstVisible.blockid];
//           prevId = prevId.pop();
          if (this.parlistO.setStartId(firstVisible.blockid)) {
            let firstDomBlock = document.getElementById('v-'+firstVisible.blockid);
            if (firstDomBlock) Vue.nextTick(()=>{
              this.screenTop = firstDomBlock.offsetTop;
            })
          }
        }
      }
    },

    correctEditWrapper() {
      let firstDomBlock = document.getElementById('v-'+this.startId);
      if (firstDomBlock) Vue.nextTick(()=>{
        this.screenTop = firstDomBlock.offsetTop;
      })
    },

    getBlocksArr(idsArray) {
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        let resIdsArray = [];
        if (result.rows && result.rows.length > 0) {
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el.blockid);
              resIdsArray.push(el._id);
            }
          });
        }
        return Promise.resolve(resIdsArray);
      });
    },

    _toggleApproveWaiting(val) {
      this.approveWaiting = val;
    },

    bookReloaded() {
      console.log('BookEdit.vue->bookReloaded');
      this.$store.commit('clear_storeList');
      this.$store.commit('clear_storeListO');
      Vue.nextTick(()=>{
        this.bookReimported();
      })
    },

    bookReimported() {
      this.setBlockSelection({start: {}, end: {}});
      this.scrollToBlock(this.parlistO.idsArray()[0]);
      this.screenTop = initialTopOffset;
      this.startId = false;
      this.refreshTmpl();

      this.$router.push({name: this.$route.name, params: {}});
      this.loadBookMeta() // also handle route params
      .then((initBlocks)=>{
        if (this.meta._id && initBlocks.blocks && initBlocks.blocks.length) {
          this.tc_loadBookTask(this.meta._id)
          .then(()=>{
            this.loadPreparedBookDown(this.parlistO.idsArray(), 10).then(()=>{
              this.startId = this.parlistO.idsArray()[0];
              this.loadBookBlocks({bookId: this.meta._id})
              .then((res)=>{
                this.parlistO.updateLookupsList(this.meta._id, res);
                if (res.blocks && res.blocks.length > 0) {
                  res.blocks.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                      if (el.type !== 'par') this.parlistO.setLoaded(el.rid);
                    }
                    //this.parlistO.setLoaded(el._id);
                  });
                  this.$store.commit('set_taskBlockMap');
                }
                this.loadBookToc({bookId: this.meta._id, isWait: true});
                //this.lazyLoad();
              });
            });
          });
        }
      });
    },

    bookBlocksUpdates(data) {
      let updField = data.updField || false;
      if (Array.isArray(data.blocks)) data.blocks.forEach((res)=>{
        this.refreshBlock({doc: res, deleted: res.deleted || false, updField: updField});
      })
    },
    checkMode() {
      if (this.currentJobInfo.id) {
        let allowed = false;
        switch (this.mode) {
          case 'edit':
            allowed = this.tc_showEditTab();
            break;
          case 'proofread':
            allowed = this.tc_showProofreadTab();
            break;
          case 'narrate':
            allowed = this.tc_showNarrateTab();
            break;
        }
        if (!allowed) {
          // to prevent half book load before detect mode
          this.$store.commit('clear_storeList');
          this.$store.commit('clear_storeListO');

          let params = this.$route.params ? this.$route.params : {};
          this.$router.push({name: params.collectionid ? 'CollectionBookEditDisplay' : 'BookEditDisplay', params: params});
        }
      }
    },
    saveBlockAudioChanges(realign = false, preparedData = false) {
      let blk = this.audioTasksQueueBlock();
      if (blk) {
        //console.log(`saveBlockAudioChanges: `, this.audioTasksQueueBlock)
        //console.log(blk.isChanged);
        this.$root.$emit('for-audioeditor:set-process-run', true, 'save');
        if (blk.getIsSplittedBlock()) {
          blk.parts[this.audioTasksQueue.block.partIdx].isSaving = true;
        } else {
          blk.isSaving = true;
        }
        return this.applyTasksQueue([null])
          .then(() => {
            return this.saveBlockAudio([realign, preparedData])
          })
          .then(response => {
            this.$root.$emit('for-audioeditor:flush');
            let block = this.audioTasksQueueBlock();
            let isSplitted = block.getIsSplittedBlock();
            let refContainer = this._getRefContainer(block);
            if (isSplitted) {
              block.parts[this.audioTasksQueue.block.partIdx].isSaving = false;
              if (!realign) {
                block.isSaving = false;
              }
            } else {
              block.isSaving = false;
            }
            //this.$store.commit('set_storeList', block);
            if (refContainer) {
              //refContainer.showPinnedInText();
              refContainer.reloadBlockPart();
              refContainer.isAudioChanged = false;
              refContainer.$parent.$forceUpdate();
            }
            if (realign) {
              this.$root.$emit('for-audioeditor:set-process-run', true, 'align');
              return Promise.resolve(true);
            } else {
              let part = isSplitted ? response.data.parts[this.audioTasksQueue.block.partIdx] : response.data;
              if (part && !((refContainer && refContainer.hasChange('split_point')) || (refContainer && refContainer.$parent.hasChange && refContainer.$parent.hasChange('split_point')))) {
                part._id = this.audioTasksQueue.block.checkId;
                part.blockid = this.audioTasksQueue.block.blockId;
                part.partIdx = this.audioTasksQueue.block.partIdx;
                this.$root.$emit('for-audioeditor:load',
                  isSplitted ? block.getPartAudiosrc(this.audioTasksQueue.block.partIdx, 'm4a', true) : block.getAudiosrc('m4a', true),
                  isSplitted ? block.getPartContent(this.audioTasksQueue.block.partIdx) : block.content, false, part);
              } else {
                this.$root.$emit('for-audioeditor:force-close');
                if (refContainer && refContainer.hasChange('split_point') && isSplitted) {
                  refContainer.unsetChange('split_point');
                  refContainer.$refs.blockContent.innerHTML = block.getPartContent(this.audioTasksQueue.block.partIdx);
                  //this.$forceUpdate();
                  refContainer.$parent.$forceUpdate();
                }
              }
              return Promise.resolve(part ? true : false);
            }
            /*this.blockAudio.map = this.blockContent();
            this.blockAudio.src = this.blockAudiosrc('m4a');
            if (this.isCompleted) {
              this.tc_loadBookTask();
            }*/
          });
      }
    },
    audioTasksQueueAdded() {
      if (this.audioTasksQueue.log.length > 0) {
        let block = this.audioTasksQueueBlock();
        if (!block) {
          return;
        }
        let task = null;
        let record = this.audioTasksQueue.log[this.audioTasksQueue.log.length - 1];
        //this.audioTasksQueue.running = record;
        let refContainer = this._getRefContainer(block);
        let blockPart = this.audioTasksQueue.block.partIdx === null ? block : block.parts[this.audioTasksQueue.block.partIdx];
        switch (record.type) {
          case 'cut':
          case 'insert_silence':
          case 'erase':
            //let record = this.audioTasksQueue.queue[this.audioTasksQueue.queue.length - 1];
            //console.log(record);
            //console.log(record.wordMap);
            let contentContainer = null;
            if (refContainer && refContainer.$refs.blockContent && refContainer.$refs.blockContent.querySelectorAll) {
              contentContainer = refContainer.$refs.blockContent;
            } else {
              contentContainer = document.createElement('div');// scrolled, container absent, create temporary div
              contentContainer.innerHTML = blockPart.content;
            }
            if (contentContainer) {
              let current_boundaries = blockPart.manual_boundaries ? blockPart.manual_boundaries.slice() : [];
              let w_maps = contentContainer.querySelectorAll('[data-map]');

              let manual_boundaries = [];
              record.wordMap.forEach((m, i) => {
                if (w_maps[i]) {
                  let cMap = w_maps[i].getAttribute('data-map');
                  if (cMap) {
                    cMap = cMap.split(',');
                    cMap[0] = parseInt(cMap[0]);
                    cMap[1] = parseInt(cMap[1]);
                    if (current_boundaries.indexOf(cMap[0]) !== -1 && manual_boundaries.indexOf(cMap[0]) === -1) {
                      if (!(record.type === 'cut' && record.options[0] < cMap[0] && record.options[1] > cMap[0])) {
                        manual_boundaries.push(m[0]);
                      }
                      current_boundaries.splice(current_boundaries.indexOf(cMap[0]), 1);
                    }
                  }
                  w_maps[i].setAttribute('data-map', m.join(','));
                  if (m[1] > 50) {
                    w_maps[i].classList.remove('alignment-changed');
                  }
                }
              });
              current_boundaries.forEach(_m => {
                if (manual_boundaries.indexOf(_m) === -1) {
                  manual_boundaries.push(_m);
                  //console.log(`PUSH ${_m[0]}`);
                }
              });
              manual_boundaries = [...new Set(manual_boundaries)].sort((a, b) => {return a - b;});
              block.setPartManualBoundaries(this.audioTasksQueue.block.partIdx || 0, manual_boundaries.slice());
              if (refContainer) {
                refContainer.blockPart.manual_boundaries = manual_boundaries.slice();
              }
              manual_boundaries = null;
              block.setPartContent(this.audioTasksQueue.block.partIdx || 0, contentContainer.innerHTML);
              block.setPartAudiosrc(this.audioTasksQueue.block.partIdx || 0,
                this.audioTasksQueue.block.partIdx === null ? block.getAudiosrc(null, false) : block.getPartAudiosrc(this.audioTasksQueue.block.partIdx, null, false),
                {});
              if (refContainer) {
                refContainer.blockPart.content = contentContainer.innerHTML;
                refContainer.blockAudio.map = blockPart.content;
                //refContainer.showPinnedInText();
              }
              this.$root.$emit('for-audioeditor:reload-text', contentContainer.innerHTML, blockPart);
            }
            task = Promise.resolve();
            break;
          case 'save-audio':
            task = this.$parent.assembleBlockAudioEdit(...record.options, false)
              .then(response => {
                this.isAudioChanged = false;
                return Promise.resolve(response);
              });
            break;
          case 'save-audio-then-block':
            task = new Promise((resolve, reject) => {
              return this.$parent.assembleBlockAudioEdit(...record.options.concat([{content: this.clearBlockContent()}]))
                .then(() => {
                  return this.$parent.assembleBlockProxy(false, true, [], false);
                })
                .then(() => {
                  this.isAudioChanged = false;
                  return resolve();
                })
                .catch(err => {
                  console.log(err);
                  return reject(err);
                });
            });
            break;
          case 'save-part-then-audio':
            task = new Promise((resolve, reject) => {
              let preparedData = {content: this.clearBlockContent(), audiosrc: this.blockAudiosrc(null, false)};
              delete this.blockPart.audiosrc;
              delete this.blockPart.audiosrc_ver;// temporary remove edited audio link in block, not save it
              return this.assembleBlockProxy(false, false, false)
                .then(() => {
                  return this.assembleBlockPartAudioEdit(...record.options.concat(preparedData));
                })
                .then(() => {
                  return resolve();
                })
                .catch(err => {
                  console.log(err);
                  return reject(err);
                });
            });
            break;
          case 'save-part-audio':
            task = this.assembleBlockPartAudioEdit(...record.options);
            break;
          case 'manual_boundaries':
            task = new Promise((resolve, reject) => {
              let response = this.evFromAudioeditorWordRealign(...record.options);
              response[0] = false;// not needed to reload audio
              return resolve(response);
            });
            break;
          case 'unpin_right':
            task = new Promise((resolve, reject) => {
              let response = this.evFromAudioeditorUnpinRight(...record.options.concat([this.check_id]));
              return resolve();
            });
            break;
          default:
            task = Promise.resolve();
            console.log('Not implemented type', record.type, record);
            break;
        }
        if (block.getIsSplittedBlock()) {
          block.parts[this.audioTasksQueue.block.partIdx].isAudioChanged = true;
        } else {
          block.isAudioChanged = true;
        }
        if (refContainer) {
          refContainer.audStop();
          refContainer.isAudioChanged = true;
          refContainer.$parent.$forceUpdate();
        }
        return task
          .then((response) => {
            //this.audioTasksQueue.running = null;
            if (Array.isArray(response)) {
              this.$root.$emit('for-audioeditor:load-silent', record, ...response);
            }
            if (refContainer) {
              refContainer.blockAudio.map = refContainer.blockContent();
              refContainer.blockAudio.src = refContainer.blockAudiosrc('m4a');
            }
            //this.shiftAudioTask();
          })
          .catch(err => {
            this.audioTasksQueue.running = null;
          });
      }
    },
    evFromAudioeditorWordRealign(map, pinnedIndex, blockId) {
        let response_params = null;
        let block = this.audioTasksQueueBlock();
        if (!block) {
          return;
        }
        let audioQueueBlock = this.audioTasksQueue.block;
        let isBlockPart = audioQueueBlock.partIdx !== null && block.getIsSplittedBlock();
        let blockPart = isBlockPart ? block.parts[audioQueueBlock.partIdx] : block;
        let refContainer = this._getRefContainer(block);
        let contentContainer = null;
        if (refContainer && refContainer.$refs.blockContent && refContainer.$refs.blockContent.querySelectorAll) {
          contentContainer = refContainer.$refs.blockContent;
        } else {
          contentContainer = document.createElement('div');// scrolled, container absent, create temporary div
          contentContainer.innerHTML = blockPart.content;
        }
        if (contentContainer) {
          if (refContainer) {
            refContainer.audStop();
          }
          //console.log('from-audioeditor:word-realign', this.$refs.blockContent.querySelectorAll('[data-map]').length, map.length);
          let current_boundaries = blockPart.manual_boundaries ? blockPart.manual_boundaries.slice() : [];
          let w_maps = contentContainer.querySelectorAll('[data-map]');

          let currentMap = w_maps[map[pinnedIndex].index].getAttribute('data-map').split(',');
          currentMap[0] = parseInt(currentMap[0]);
          currentMap[1] = parseInt(currentMap[1]);

          let manual_boundaries = [map[pinnedIndex].map[0]];
          map.forEach(m => {
            let cMap = w_maps[m.index].getAttribute('data-map');
            if (cMap) {
              cMap = cMap.split(',');
              cMap[0] = parseInt(cMap[0]);
              cMap[1] = parseInt(cMap[1]);
              if (current_boundaries.indexOf(cMap[0]) !== -1 && manual_boundaries.indexOf(cMap[0]) === -1) {
                manual_boundaries.push(m.map[0]);
                current_boundaries.splice(current_boundaries.indexOf(cMap[0]), 1);
              }
            }
            w_maps[m.index].setAttribute('data-map', m.map.join());
            if (m.map[1] > 50) {
              w_maps[m.index].classList.remove('alignment-changed');
            }
          });
          if (currentMap[0] !== map[pinnedIndex].map[0] && manual_boundaries.indexOf(map[pinnedIndex].map[0]) === -1) {
            if (manual_boundaries.indexOf(currentMap[0]) !== -1) {
              manual_boundaries.splice(manual_boundaries.indexOf(currentMap[0]), 1);
            }
            //manual_boundaries.push(_m[0]);
          }
          if (currentMap[0] + currentMap[1] !== map[pinnedIndex].map[0] + map[pinnedIndex].map[1] && manual_boundaries.indexOf(map[pinnedIndex].map[0] + map[pinnedIndex].map[1]) === -1) {
            if (manual_boundaries.indexOf(currentMap[0] + currentMap[1]) !== -1) {
              manual_boundaries.splice(manual_boundaries.indexOf(currentMap[0] + currentMap[1]), 1);
            }
            //manual_boundaries.push(_m[0] + _m[1]);
          }
          current_boundaries.forEach(_m => {
            if (manual_boundaries.indexOf(_m) === -1) {
              manual_boundaries.push(_m);
              //console.log(`PUSH ${_m[0]}`);
            }
          });
          manual_boundaries = [...new Set(manual_boundaries)].sort((a, b) => {return a - b;});
          block.setPartManualBoundaries(isBlockPart ? audioQueueBlock.partIdx : 0, manual_boundaries.slice());
          if (refContainer) {
            refContainer.blockPart.manual_boundaries = manual_boundaries.slice();
          }
          manual_boundaries = null;
          block.setPartContent(isBlockPart ? audioQueueBlock.partIdx : 0, contentContainer.innerHTML);
          block.setPartAudiosrc(isBlockPart ? audioQueueBlock.partIdx : 0,
            isBlockPart ? block.getPartAudiosrc(audioQueueBlock.partIdx, null, false) : block.getAudiosrc(null, false),
            {m4a: isBlockPart ? block.getPartAudiosrc(audioQueueBlock.partIdx, 'm4a', false) : block.getAudiosrc('m4a', false)});
          if (refContainer) {
            refContainer.blockPart.content = contentContainer.innerHTML;
            refContainer.blockAudio.map = refContainer.blockPart.content;
          }
          if (this.audioTasksQueue.log.length === 0) {
            this.$root.$emit('for-audioeditor:reload-text', refContainer.innerHTML, blockPart);
          } else {
            if (isBlockPart) {
              response_params = [block.getPartAudiosrc(audioQueueBlock.partIdx, 'm4a'), block.getPartContent(audioQueueBlock.partIdx), true, Object.assign({_id: audioQueueBlock.checkId}, blockPart)];
            } else {
              response_params = [block.getAudiosrc(null), block.content, true, block];
            }
          }
          //this.pushChange('content');


          //this.blockPart.manual_boundaries = manual_boundaries.slice();
          //this.block.setPartManualBoundaries(this.blockPartIdx, manual_boundaries.slice());
          //this.$root.$emit('for-audioeditor:reload-text', this.$refs.blockContent.innerHTML, this.blockPart);
          //this.blockPart.content = this.$refs.blockContent.innerHTML;
          //this.blockAudio.map = this.$refs.blockContent.innerHTML;
          //this.block.setPartContent(this.blockPartIdx, this.$refs.blockContent.innerHTML);
          if (audioQueueBlock.partIdx !== null) {
            block.parts[audioQueueBlock.partIdx].isAudioChanged = true;
          } else {
            block.isAudioChanged = true;
          }
        }
        return response_params;
      },
      evFromAudioeditorUnpinRight(position, blockId) {
        let response = null;
        let block = this.audioTasksQueueBlock();
        if (!block) {
          return;
        }
        let audioQueueBlock = this.audioTasksQueue.block;
        let isBlockPart = audioQueueBlock.partIdx !== null && block.getIsSplittedBlock();
        let blockPart = isBlockPart ? block.parts[audioQueueBlock.partIdx] : block;
        let refContainer = this._getRefContainer(block);
        if (Array.isArray(blockPart.manual_boundaries) && blockPart.manual_boundaries.length > 0) {
          let oldBoundaries = blockPart.manual_boundaries;
          let new_mb = blockPart.manual_boundaries.filter(mb => {
            return mb <= position;
          });
          block.setPartManualBoundaries(isBlockPart ? audioQueueBlock.partIdx : 0, new_mb);
          blockPart.manual_boundaries = new_mb;
          //this.blockPart.content = this.$refs.blockContent.innerHTML;
          //this.blockAudio.map = this.blockPart.content;
          block.setPartContent(isBlockPart ? audioQueueBlock.partIdx : 0, blockPart.content);
          block.setPartAudiosrc(isBlockPart ? audioQueueBlock.partIdx : 0,
            block.getPartAudiosrc(isBlockPart ? audioQueueBlock.partIdx : 0, null, false),
            {m4a: block.getPartAudiosrc(isBlockPart ? audioQueueBlock.partIdx : 0, 'm4a', false)});
          let changed = oldBoundaries.length > blockPart.manual_boundaries.length ? true : false;
          if (changed) {
            if (refContainer) {
              refContainer.isAudioChanged = true;
            } else {
              blockPart.isAudioChanged = true;
            }
          }
          if (refContainer) {
            refContainer.$parent.$forceUpdate();
          }
          //this.$root.$emit('for-audioeditor:reload-text', this.$refs.blockContent.innerHTML, this.blockPart, changed);
          response = [block.getPartAudiosrc(isBlockPart ? audioQueueBlock.partIdx : 0, 'm4a', true), blockPart.content, true, blockPart];
        }
        return response;
      },
      evFromAudioEditorRevert() {
        let block = this.audioTasksQueueBlock();// storeList block
        let blk = this.audioTasksQueueBlockOrPart();// storeList block or it's part for splitted block
        let queueBlock = this.audioTasksQueue.block;// short block info for audio tasks queue
        if (!block || !blk) {
          return Promise.resolve();
        }
        let refContainer = this._getRefContainer(block);
        //this.clearAudioTasks(true);
        if (blk && blk.audiosrc_original) {// should revert to original audio, otherwise usual discard of changes
          block.isSaving = true;
          return this.revertAudio([block.blockid, queueBlock.partIdx])
            .then((res) => {
              block.isSaving = false;
              block.isAudioChanged = false;
              if (block.getIsSplittedBlock() && block.parts[queueBlock.partIdx]) {
                block.parts[queueBlock.partIdx].isAudioChanged = false;
              }
              //console.log(res.data);
              block.setPartAudiosrc(queueBlock.partIdx || 0, res.data.audiosrc, res.data.audiosrc_ver);
              block.setPartManualBoundaries(queueBlock.partIdx, res.data.manual_boundaries);
              let text = blk.content;
              let loadBlock = blk;
              loadBlock.manual_boundaries = block.getPartManualBoundaries(queueBlock.partIdx || 0);
              loadBlock._id = queueBlock.checkId;
              loadBlock.blockid = block.blockid;
              loadBlock.partIdx = queueBlock.partIdx;
              //this.$root.$emit('for-audioeditor:load', block.getPartAudiosrc(queueBlock.partIdx || 0, 'm4a'), text, false, loadBlock);
              this.$root.$emit('for-audioeditor:set-process-run', true, 'align');
              if (refContainer) {
                refContainer.showPinnedInText();
                refContainer.isAudioChanged = false;
                refContainer.$parent.$forceUpdate();
              }
              return Promise.resolve();
            });
        } else {
          return this.discardAudioEdit(true);
        }
      },
      discardAudioEdit: function(reload = true) {
        let queueBlock = this.audioTasksQueue.block;
        let refContainer = this._getRefContainer(this.audioTasksQueueBlock());
        if (refContainer) {
          refContainer.isUpdating = true;
        }
        return this.discardAudioChanges()
          .then(response => {
            let block = this.audioTasksQueueBlock();
            if (block && response.status === 200 && response.data) {
              if (queueBlock.partIdx !== null) {
                let part = this.audioTasksQueueBlockOrPart();
                part._id = queueBlock.checkId;
                part.blockid = block.blockid;
                part.partIdx = queueBlock.partIdx;
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', block.getPartAudiosrc(queueBlock.partIdx, 'm4a'), block.getPartContent(queueBlock.partIdx), true, part);
                }
              } else {
                if (reload) {
                  this.$root.$emit('for-audioeditor:load', block.getAudiosrc('m4a'), block.content, false, block);
                }
              }
            }
            if (refContainer) {
              refContainer.isUpdating = false;
              if (block) {
                refContainer.blockAudio.map = block.getIsSplittedBlock() ? block.parts[queueBlock.partIdx].content : block.content;
              }
              refContainer.isAudioChanged = false;
              refContainer.$parent.$forceUpdate();
            }
            return Promise.resolve();
          })
          .catch(err => {
            return Promise.reject(err);
          });
      },
      evFromAudioeditorUndo (blockId, audio, text, isModified) {
        let block = this.audioTasksQueueBlock();// block from storeList
        let queueBlock = this.audioTasksQueue.block;// queue block info
        let refContainer = this._getRefContainer(block);
        let isSplitted = block.getIsSplittedBlock();
        if (refContainer) {
          refContainer.audStop();
        }
        //console.log(block.changes, block.isAudioChanged);
        //return;
        /*if (this.isSplittedBlock) {
          //this.$root.$emit('for-audioeditor:load', this.block.getPartAudiosrc(this.blockPartIdx, 'm4a'), this.block.getPartContent(this.blockPartIdx), false, this.blockPart);
        } else {
          //this.blockPart.content = this.block.content;
          //this.blockPart.audiosrc = this.block.audiosrc;
          this.blockPart.manual_boundaries = this.block.manual_boundaries;
          //this.$root.$emit('for-audioeditor:load', this.blockAudiosrc('m4a'), this.block.content, false, this.block);
        }*/
        //this.blockAudio.map = this.blockContent();
        //this.blockAudio.src = this.blockAudiosrc('m4a');
        if (!isSplitted) {
          block.isAudioChanged = isModified;
        } else {
          block.parts[queueBlock.partIdx].isAudioChanged = isModified;
        }
        if (refContainer) {
          if (isSplitted) {
            refContainer.blockAudio.map = block.parts[queueBlock.partIdx].content;
            //console.log(block.parts[queueBlock.partIdx].manual_boundaries.slice());
            refContainer.blockPart.manual_boundaries = block.parts[queueBlock.partIdx].manual_boundaries.slice();
            refContainer.$forceUpdate();
          } else {
            refContainer.blockAudio.map = block.content;
            //console.log(block.parts[queueBlock.partIdx].manual_boundaries.slice());
            refContainer.blockPart.manual_boundaries = block.manual_boundaries.slice();
            refContainer.$parent.$forceUpdate();
          }
          if (!isModified) {
            refContainer.unsetChange('audio');
            refContainer.unsetChange('content');
            refContainer.unsetChange('manual_boundaries');
            refContainer.$parent.isAudioChanged = false;
            /*if (block.getIsSplittedBlock()) {
              refContainer.isAudioChanged = false;
            } else {
              refContainer.$parent.isAudioChanged = false;
            }*/
          }
          refContainer.$parent.$forceUpdate();
        }
      },
      _getRefContainer(block) {
        if (!block) {
          return null;
        }
        let audioQueueBlock = this.audioTasksQueue.block;
        let isBlockPart = audioQueueBlock.partIdx !== null && block.getIsSplittedBlock();
        let refContainer = this.$refs.blocks.find(b => {// Vue component BookBlockView, contains current edited block, may be absent after scroll
          return b.block.blockid === audioQueueBlock.blockId;
        });
        if (refContainer && refContainer.$refs && refContainer.$refs.blocks) {
          refContainer = isBlockPart ? refContainer.$refs.blocks.find(b => {
            return b.blockPartIdx === audioQueueBlock.partIdx;
          }) : refContainer.$refs.blocks[0];// need subblock, container BookBlockPartView
        } else {
          refContainer = null;
        }
        return refContainer;
      },
      evFromAudioeditorClosed(blockId) {
        let block = this.audioTasksQueueBlock();// block from storeList
        let queueBlock = Object.assign({}, this.audioTasksQueue.block);// queue block info
        let part = this.audioTasksQueueBlockOrPart();
        if (!block) {
          return;
        }
        let refContainer = this._getRefContainer(block);
        if (refContainer) {
          refContainer.audStop();
        }
        //this.clearAudioTasks(false);
        if (part.isAudioChanged) {
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
          if (refContainer) {
            if (block.getIsSplittedBlock()) {
              refContainer.isUpdating = true;
            } else {
              refContainer.$parent.isUpdating = true;
            }
          }
          return waitStopRunning
            .then(() => {
              this.discardAudioEdit(false)
                .then(() => {
                  /*this.isAudioChanged = false;
                  this.isChanged = false;
                  this.unsetChange('audio');
                  this.unsetChange('content');
                  this.unsetChange('manual_boundaries');

                  this.blockAudio = {'map': this.blockPart.content, 'src': this.blockAudiosrc('m4a')};
                  this.isUpdating = false;*/
                  part.isAudioChanged = false;
                  if (refContainer) {
                    if (block.getIsSplittedBlock()) {
                      refContainer.isUpdating = false;
                      refContainer.isAudioChanged = false;
                    } else {
                      refContainer.$parent.isUpdating = false;
                      refContainer.$parent.isAudioChanged = false;
                    }
                  }
                  if (queueBlock.blockId === this.audioTasksQueue.block.blockId && queueBlock.partIdx === this.audioTasksQueue.block.partIdx) {
                    this.clearAudioTasks(false);
                  }
                });
              });
        } else {
          this.clearAudioTasks(false);
        }
        //$('nav.fixed-bottom').addClass('hidden');

        //this.$refs.viewBlock.querySelector(`.table-body.-content`).classList.remove('editing');
        //$('#' + this.block._id + ' .table-body.-content').removeClass('editing');
        //this.check_id = null;
        //this.audioEditorEventsOff();

      },
  },
  events: {
      currentEditingBlock_id : function (key) {
          //console.log("keydown: ", key)
      }
  },
  beforeMount: function() {
    if (this.$route.params.hasOwnProperty('bookid')) {
      if (!(this.parlistO.meta && this.parlistO.meta.bookid && this.parlistO.meta.bookid == this.$route.params.bookid)) {
        this.$store.commit('clear_storeList');
        this.$store.commit('clear_storeListO');
      }
    }
  },
  mounted: function() {
      //this.onScrollBookDown();
      //console.log('book mounted', this.meta._id);
      window.onresize = () => {
        this.correctEditWrapper();
      };
      this.checkMode();
      this.loadBookMeta() // also handle route params
      .then((initBlocks)=>{
        this.getProcessQueue();
        if (this.meta._id && initBlocks.blocks && initBlocks.blocks.length) {
          this.tc_loadBookTask()
          .then(()=>{
            this.loadPreparedBookDown(this.parlistO.idsArray())
            .then(()=>{
              this.loadBookBlocks({bookId: this.meta._id})
              .then((res)=>{
                this.parlistO.updateLookupsList(this.meta._id, res);
                //console.log('res.blocks', res.blocks[0]);
                if (res.blocks && res.blocks.length > 0) {
                  res.blocks.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                      if (el.type !== 'par') this.parlistO.setLoaded(el.rid);
                    }
                    //this.parlistO.setLoaded(el._id);
                  });
                  this.$store.commit('set_taskBlockMap');
                  //this.parlistO.refresh();
                  if (initBlocks.blocks && initBlocks.blocks[0] && initBlocks.meta && initBlocks.blocks[0].rid !== initBlocks.meta.out) {
                    Vue.nextTick(() => {
                      this.handleScroll();
                      this.scrollToBlock(initBlocks.blocks[0].blockid);
                    })
                  }
                }

                //this.lazyLoad();
              });
            });
          });
        } else {

          if (this.$route.params.hasOwnProperty('block')) {
            this.scrollToBlock(this.$route.params.block);
            this.$router.replace({name: this.$route.name, params: {}});
            //this.updateVisibleBlocks();
          } else {
            this.$router.replace({name: this.$route.name, params: {block: this.meta.startBlock_id}});// force view update when switching from display mode
          }
        }
      });

      window.addEventListener('keydown', this.eventKeyDown);

      //this.initRecorder();
      window.onscroll = function() {
        $('#narrateStartCountdown').css('top', document.scrollingElement.scrollTop + 'px');
        $('#narrateStartCountdown').css('height', '100%')
      }

      this.$root.$on('book-reimported', this.bookReimported);
      this.$root.$on('book-reloaded', this.bookReloaded);
      this.$root.$on('for-bookedit:scroll-to-block', this.scrollToBlock);
      this.$root.$on('bookBlocksUpdates', this.bookBlocksUpdates);
      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
      this.$root.$on('from-toolbar:toggle-meta', this.correctEditWrapper);
      //this.$root.$on('from-audioeditor:closed', this.evFromAudioeditorClosedIndicator);

      this.$root.$on('from-audioeditor:save', this.saveBlockAudioChanges);
      this.$root.$on('from-audioeditor:revert', this.evFromAudioEditorRevert);
      this.$root.$on('from-audioeditor:undo', this.evFromAudioeditorUndo);
      this.$root.$on('from-audioeditor:closed', this.evFromAudioeditorClosed);


      $('body').on('click', '.medium-editor-toolbar-anchor-preview-inner, .ilm-block a', (e) => {// click on links in blocks
        e.preventDefault();
      });

      //this.$root.$on('for-bookedit:scroll-to-block-end', this.scrollToBlockEnd);
  },

  beforeDestroy:  function() {
    this.stopWatchLiveQueries();
    this.$root.$emit('for-audioeditor:force-close');
    window.removeEventListener('keydown', this.eventKeyDown);
    this.setBlockSelection({start: {}, end: {}});
    this.isNeedUp = false;
    this.isNeedDown = false;
    //console.log('BookEdit beforeDestroy');
    this.$root.$emit('for-audioeditor:force-close');

    this.$root.$off('bookBlocksUpdates', this.bookBlocksUpdates);
    this.$root.$off('for-bookedit:scroll-to-block', this.scrollToBlock);
    this.$root.$off('book-reimported', this.bookReimported);
    this.$root.$off('book-reloaded', this.bookReloaded);
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
    this.$root.$off('from-toolbar:toggle-meta', this.correctEditWrapper);
    this.$root.$off('from-audioeditor:save', this.saveBlockAudioChanges);
    this.$root.$off('from-audioeditor:revert', this.evFromAudioEditorRevert);
    this.$root.$off('from-audioeditor:undo', this.evFromAudioeditorUndo);
    this.$root.$off('from-audioeditor:closed', this.evFromAudioeditorClosed);
  },
  watch: {
    'meta._id': {
      handler(newVal, oldVal) {
        console.log('watch meta._id', newVal, oldVal);
//         if (newVal) {
//           this.tc_loadBookTask()
//           .then(()=>{
//             this.loadBookDown(true)
//             .then(()=>{
//               this.setBlockWatch();
//               //this.loadBookBlocks(newVal);
//             });
//           });
//         }
      }
    },
    'allBooks': {
      handler() {

      }
    },
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute, fromRoute);
      if (toRoute.params.hasOwnProperty('task_type') && toRoute.params.task_type) {
        let taskType = toRoute.params.task_type;
        return this.$store.dispatch('searchBlocksChain', {
            book_id: this.meta._id,
            startId: this.startId || this.meta.startBlock_id,
            search: {block_type: 'unresolved',  task_type: taskType}
          }).then((result)=>{
            if (result.blockId) {
              this.scrollToBlock(result.blockId);
            }
            this.$router.replace({name: this.$route.name, params: {}});
          });
      }
      if (this.$route.params.hasOwnProperty('block') && this.$route.params.block!=='unresolved') {
        this.scrollToBlock(this.$route.params.block);
        this.$router.replace({name: this.$route.name, params: {}});
      }
    },
    'tc_tasksByBlock': {
      handler(val, oldVal) {
        //console.log('tc_tasksByBlock', val, oldVal);
        if (Object.keys(val).length && !Object.keys(oldVal).length) {
          if (
            this.$route.params.hasOwnProperty('block') &&
            this.$route.params.block !== 'unresolved' &&
            !this.parlist.length
          ) {
            this.getBloksUntil(this.$route.params.block, this.$route.params.task_type);
          }
        } else {

        }
      }
    },
    'blockSelection': {
      handler(val) {
        //console.log('blockSelection', 'start:', val.start, 'end:', val.end);
        if (!this.blockSelection.start._id && !this.blockSelection.end._id) {
          this.parlistO.setUnCheckedRange();
        }
      },
      deep: true
    },
    'startId': {
      handler(newVal, oldVal) {

      }
    },
    'mode': {
      handler(val) {
        Vue.nextTick(() => {
          if (this.parlistO.firstVisibleId) {
            this.scrollToBlock(this.parlistO.firstVisibleId);
          }
          this.correctEditWrapper();
        })
      }
    },
    'currentJobInfo.workflow.status': {
      handler(val) {
        if (val && val !== 'active') {
          if (this.mode && this.mode !== 'edit') {
            let params = {};
            if (this.parlistO.firstVisibleId) {
              params.block = this.parlistO.firstVisibleId;
            }
            this.$router.push({ name: 'BookEdit', params: params });
          }
        }
      }
    },
    'currentJobInfo.id': {
      handler(val) {
        if (val) {
          this.checkMode();
        }
      }
    },
    'audioTasksQueue.running': {
      handler(val, oldVal) {
        if (val === null && oldVal !== null) {
          //console.log('STOP RUNNING');
          let log = this.audioTasksQueue.log[this.audioTasksQueue.log.length - 1];
          let block = this.parlist.get(this.audioTasksQueue.block.blockId);
          if (log && this.audioTasksQueue.queue.length === 0 && block) {
            //console.log(log.time, this.audioTasksQueue.time, this.audioTasksQueue);
            if (this.audioTasksQueue.block.partIdx === null) {
              //this.$root.$emit('for-audioeditor:load-silent', log, block.getAudiosrc('m4a'), block.content, true, block);
            } else {
              let _block = block.parts[this.audioTasksQueue.block.partIdx];
              if (_block) {
                //_block._id = this.check_id;
                _block.blockid = block.blockid;
                _block.partIdx = this.audioTasksQueue.block.partIdx;
              }
              //this.$root.$emit('for-audioeditor:load-silent', log, block.getPartAudiosrc(this.audioTasksQueue.block.partIdx, 'm4a'), block.getPartContent(this.audioTasksQueue.block.partIdx), true, _block);
            }
            //setAudioSilent(queue_record, audio, text, saveToHistory = true, block = null) {
          }
        }
      }
    },
    'audioTasksQueue.time': {
      handler(val, oldVal) {
        //console.log(`audioTasksQueue.time: ${val}`, Object.assign({}, this.audioTasksQueue));
        if (oldVal < val) {
          //console.log('START ', this.check_id);
          //console.log('FIRE');
          this.audioTasksQueueAdded();
        }
      },
      deep: true
    },
    'isAudioEditAligning': {
      handler(val) {
        //console.log(`isAudioEditAligning: ${val}`);
        let block = this.audioTasksQueueBlock();// block from storeList
        let queueBlock = this.audioTasksQueue.block;// queue block info
        let part = this.audioTasksQueueBlockOrPart();
        let refContainer = this._getRefContainer(block);
        this.$root.$emit('for-audioeditor:set-process-run', val, 'align');
        if (!val && !refContainer && block) {// block is out of focus, need to reload audio editor
          let loadBlock = Object.assign({}, part);
          loadBlock._id = block.getIsSplittedBlock() ? block.blockid + '-part-' + queueBlock.partIdx : block.blockid;
          loadBlock.blockid = block.blockid;
          loadBlock.partIdx = queueBlock.partIdx;
          this.$root.$emit('for-audioeditor:load-and-play', block.getPartAudiosrc(queueBlock.partIdx, 'm4a'), block.getPartContent(queueBlock.partIdx || 0), loadBlock);
        }
      }
    }
  }
}
</script>
<style lang="less">
  #narrateStartCountdown {
      display: none;
      position: fixed;

      div {
        display: flex;
        align-items: center;
        height: 100%;

        strong {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 100px;
          color: #f2d3d3;
        }

      }
  }
  .infinite-status-prompt {
    margin-bottom: 175px;
  }
  .fixed-bottom {
    /*display: none;*/
    position: fixed;
    /*margin-left: -10px;*/
    width: 99%;
    bottom: 0px;
    border: 1px solid black;
    border-radius: 0px;
    min-height: 205px;
    height: auto;
    margin-bottom: 0px;
    z-index: 990;
    &.-mode-file {
        min-height: 183px;
    }
  }
  a.go-to-block {
    cursor: pointer;
  }

  .content-scroll-wrapper {
    flex-grow: 2;

    display:flex;

    /*position: relative;*/
    overflow-y: auto; /*hidden;*/
    overflow-x: auto;

    &.recording-background {
      /*background-color: rgba(0,0,0,0.5);*/
      overflow: hidden;
      margin-right: 8px;

      div.completed {
        background-color: inherit;
      }

      .content-scroll-item{
        &.front {
          background-color: rgba(0,0,0,0.5);
        }
      }
      .table-body {

        &.-content {

          &:hover {
            .-hidden {
              visibility: hidden;
            }
          }
        }
      }
    }


    .container-block {
      /*padding-top: 15px;*/
      width: 100%;

      &.back {
        margin-right: -50%;
      }
      &.front {
        position: relative;
        top: 0px;
        margin-left: -50%;

        .content-background {
          background: white;
        }
      }
    }

    .content-scroll-item {
      width: 100%;
      margin-right: 0px;
      margin-left: 0px;

      &.front {
        position: relative;
      }
    }
  }

  .infinite-loading-container {
    width: 100%;
    text-align: center;
    margin-left: -15px;
    margin-right: -15px;
    &.-up {
      position: absolute;
    }
    &.-down {
      position: relative;
    }
    [class^=loading-] {
      display: inline-block;
      margin: 0;/*15px */
      width: 28px;
      height: 28px;
      font-size: 28px;
      line-height: 28px;
      border-radius: 50%;
    }
  }

  .loading-default {
    position: relative;
    border: 1px solid #999;
    -webkit-animation: loading-rotating ease 1.5s infinite;
    animation: loading-rotating ease 1.5s infinite;

    // rotate animation
    @keyframes loading-rotating {
      0%{
        transform: rotate(0);
      }
      100%{
        transform: rotate(360deg);
      }
    }

    &:before {
      content: "";
      position: absolute;
      display: block;
      top: 0;
      left: 50%;
      margin-top: -3px;
      margin-left: -3px;
      width: 6px;
      height: 6px;
      background-color: #999;
      border-radius: 50%;
    }
  }
  sg[data-suggestion=""] {
    w {
        background: yellow !important;
    }
  }

  .cancel-align {
      border: 1px solid red;
      border-radius: 8px;
      background-color: white;
      i.fa {
          color: red;
      }
      font-size: 12px;
      padding: 6px 12px;
  }

</style>


<style lang='less'>
.block-preview {

  .in-back {
    visibility: hidden;
    /*opacity: 0.5;*/
    /*border-bottom: 1px red solid;*/
  }

  .preview-container {
    height: 100px;
  }

  .table-row .illustration-block img {
    border: solid white 2px;
    max-width: 100%;
  }

  .content-wrap-desc.description {
    min-height: 30px;
  }

  .content-wrap-preview {
    padding: 10px;
    margin: 6px auto 4px auto;
  }

  .table-row.controls-bottom {
    height: 24px;
  }

  .table-row.controls-top {
    height: 28px;
    &.completed {
      /*height: 20px;*/
    }
  }

  /*.ilm-book-styles.global-ocean*/
  .ilm-block {
    .content-wrap-preview {
      &.js-hidden {
        visibility: hidden;
      }
      &.header {
        margin: 4px;
      }
      &.title {
        margin-top: 6px;
      }
    }
  }

  .content-wrap-footn-preview {
    p {
      margin: 0;
    }
  }

  .table-body.footnote {
    .content-wrap-footn-preview.-text {
      padding-right: 150px;
      &.js-hidden {
        visibility: hidden;
      }
    }
  }
}
.ilm-block {
  &.flag-popup-container {
    padding: 0px;
  }
}

.table-body {
  &.-subblock {
    position: relative;
  }
  &.-mode-narrate {
    position: relative;
    /*.controls-bottom, .controls-top {
      margin: 0px auto;
      display: block;
      .-left {
          padding: 0px 25px;
      }
      .-right {
          margin-right: 0px;
      }
      .par-ctrl.-par-num {
        label.par-num {
            padding-left: 20px;
        }
      }
    }*/
    .controls-bottom {
      margin: 5px auto;
      display: block;
    }
    .-subblock {
      position: relative;
      .-content {
        width: 785px;
        margin-left: auto;
        margin-right: auto;
        @media all and (max-width: 1100px) {
           margin-left: 0;
           margin-right: 0;
        }
        .meta-visible & {
           @media all and (max-width: 1540px) {
              margin-left: 0;
              margin-right: 0;
           }
        }
      }
      .controls-left {
        &.sub-parnum {
          width: 50px;
          min-width: 50px;
          .sub-parnum-main {
            font-size: 24px;
            font-weight: bold;
          }
        }
        &.audio-controls {
          width: 135px;
          min-width: 135px;
          .table-body {
            width: 100px;
            margin: 0px 0px 0px auto;
            .table-cell {
              text-align: right;
              i.fa {
                width: 45px;
                text-align: center;
              }
            }
          }
        }
      }
      .-hidden-subblock {
        visibility: hidden;
      }
      &:hover {
        .-hidden-subblock {
          visibility: visible;
        }
      }
    }
    &:not(.-voicework-narration) {
      .completed {
        background: inherit;
      }
      .content-wrap, .content-wrap-preview, .content-wrap-desc.description {
        color: #bebebe;
        background: inherit;
        &[data-audiosrc] {
          &.playing {
            w {
              background: inherit;
            }
          }
        }
      }
    }
    .controls-bottom {
      display: flex;
      margin-inline-start: 185px;
    }
    .controls-bottom-wrapper {

      width: 650px;
      margin-left: auto;
      margin-right: auto;
      @media all and (max-width: 1100px) {
        margin-left: 0;
        margin-right: 0;
      }
      .meta-visible & {
        @media all and (max-width: 1540px) {
          margin-left: 0;
          margin-right: 0;
        }
      }
    }
    .-subblock {
      .controls-bottom {
        margin-left: 0px;
        margin-right: 0px;
      }
    }

    .controls-left {
      /*height: 123px;*/
    }
    .table-row-flex.controls-top {
      .par-ctrl.-par-num {
        label.par-num {
          font-size: 24px;
          font-style: inherit;
          font-weight: bold;
          padding: 0px;
          &:before {
            content: '';
            padding-right: 0px;
          }
        }
      }
    }
    .content-wrap {
      &.header, &.par, &.title {
        &.-hover:hover {
          border: 1px solid transparent;
          background: inherit;
        }
      }
    }
    [data-author] {
      color: inherit;
      font-style: inherit;
    }
    .hr {
      color: #bebebe;
      filter: opacity(0.5);
    }
  }
}
.medium-toolbar-arrow-over:before {
  border-color: transparent transparent #a6a6a6 !important;;
}
.medium-editor-toolbar-anchor-preview {
  background: #a6a6a6 !important;
}
i.pin {
  background-color: #aaa;
  background-image: linear-gradient(left, hsla(0,0%,100%,.2), hsla(0,0%,0%,.2));
  display: inline-block;
  height: 24px;
  margin: 0px 2px -3px 2px;
  position: relative;
  width: 2px;
  cursor: pointer;
  pointer-events: all;
  &:before {
    background-color: skyBlue;
    background-image: radial-gradient(25% 25%, circle, hsla(0,0%,100%,.2), hsla(0,0%,0%,.2));
    border-radius: 50%;
    content: '';
    left: -4px;
    position: absolute;
    display: inline-block;
    width: 10px;
    height: 10px;
    top: -5px;
  }
}
div.merge-subblocks {
   /*background-image: url(/static/merge-blocks.svg); */
   width: 20px;
   height: 24px;
   /*background-size: 20px; */
   background-repeat: no-repeat;
   background-color: gray;
   -webkit-mask-image: url(/static/merge-blocks.svg);
   mask-image: url(/static/merge-blocks.svg);
   cursor: pointer;
}

</style>
