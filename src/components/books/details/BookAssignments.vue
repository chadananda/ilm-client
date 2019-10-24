<template>
  <div>
    <div class="hidden">({{storeListO.firstVisibleId}})</div>
    <div v-for="counter in tasks_counter">
      <div class="counters-container">
        <div class="counter-executor">
          <span v-if="counter.key == 'editor'">
            <div ><i>Editor:</i> {{counter.data.executor_id}}</div>
            <div style="margin-bottom: 0.5em" v-if="adminOrLibrarian">Change performer: <select v-model="counter.data.executor_id" @change="updateAssignee('editor', counter.data.executor_id)" ><option v-for="user_editor in users['editor']" :value="user_editor._id" v-if="user_editor.isMatchBookLang">{{user_editor.name}} {{user_editor.email}}</option></select></div>
          </span>

          <span v-if="counter.key == 'proofer'">
            <div><i>Proofreader:</i> {{counter.data.executor_id}}</div>
            <div style="margin-bottom: 0.5em" v-if="adminOrLibrarian">Change performer: <select v-model="counter.data.executor_id" @change="updateAssignee('proofer', counter.data.executor_id)"><option v-for="user_proofer in users['proofer']" :value="user_proofer._id"  v-if="user_proofer.isMatchBookLang">{{user_proofer.name}} {{user_proofer.email}}</option></select></div>
          </span>

          <span v-if="counter.key == 'narrator'">
            <div><i>Narrator:</i> {{counter.data.executor_id}}</div>
            <div style="margin-bottom: 0.5em" v-if="adminOrLibrarian">Change performer: <select v-model="counter.data.executor_id" @change="updateAssignee('narrator', counter.data.executor_id)"><option v-for="user_narrator in users['narrator']" :value="user_narrator._id"  v-if="user_narrator.isMatchBookLang">{{user_narrator.name}} {{user_narrator.email}}</option></select></div>
          </span>
        </div>
        <table class="counters" v-if="counter.data.tasks.length > 0">
          <thead>
            <th>Task</th>
            <th>Status</th>
            <th v-if="counter.key == 'editor'">Action</th>
          </thead>
          <tbody>
            <tr v-for="task in counter.data.tasks">
              <td :class="['task-type']">
                <div :class="[{'go-to-block': task.blockid != null && !task.complete}]" v-on:click="goToBlockCheck(task.blockid, counter.key)">
                <template v-if="task.link && !task.complete">
                  <template v-for="link in task.link">
                    <span v-if="link=='audio_dialog'" class="go-to-block" v-on:click="$emit('showModal_audio')">
                      {{task.title}}
                    </span>
                    <span v-else-if="link=='book_dialog'" class="go-to-block" v-on:click="$root.$emit('book-reimport-modal')">
                      {{task.title}}
                    </span>
                  </template>
                </template>
                <template v-else>
                  {{task.title}}
                </template>
                </div>
                <div>
                <template v-if="task.blockid !== null && !task.complete && showTaskNavigation">
                  <i :class="['fa fa-chevron-left', {'disabled': !taskBlockMap.map[task.type] || !taskBlockMap.map[task.type].prev}]" v-on:click="goToPrevious(task.type, counter.key)"></i>
                  <i :class="['fa fa-chevron-right', {'disabled': !taskBlockMap.map[task.type] || !taskBlockMap.map[task.type].next}]" v-on:click="goToNext(task.type, counter.key)"></i>
                </template>
                </div>
              </td>
              <td :class="[{'go-to-block': task.blockid != null && !task.complete}, 'task-counter', '-' + counter.key]" v-on:click="goToBlockCheck(task.blockid, counter.key)">
                <span v-if="task.complete" :class="[{'ready': task.ready}]">Closed</span>
                <span v-else :class="[{'ready': task.ready}]">Open</span>
                <span v-if="!task.complete && typeof task.count !== 'undefined'">({{task.count}})</span>
              </td>
              <td class="task-action" v-if="counter.key == 'editor'">
                <template v-for="action in task.actions">
                  <div v-if="action=='complete_cleanup'">
                    <template v-if="!textCleanupProcess">
                      <button v-if="!task.complete" class="btn btn-primary btn-edit-complete" v-on:click="showSharePrivateBookModal = true" :disabled="!isAllowEditingComplete">Complete</button>
                    </template>
                    <template v-else>
                      <div class="preloader-task"></div>
                    </template>
                  </div>
                  <div v-if="action=='mastering_required'">
                    <div class="btn-switch" @click="toggleMastering()">
                      <i class="fa fa-toggle-on" v-if="!currentBookMeta.masteringRequired"></i>
                      <i class="fa fa-toggle-off" v-else></i>
                      <span class="s-label">&nbsp;Mastered</span>
                    </div>
                  </div>
                  <div v-if="action=='complete_mastering'">
                    <div v-if="!audioMasteringProcess" class="editing-wrapper">
                      <button v-if="!task.complete" class="btn btn-primary btn-edit-complete" v-on:click="showAudioMasteringModal = true" :disabled="!isAllowEditingComplete">Complete</button>
                    </div>
                    <div v-else class="preloader-task"></div>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <modal v-model="showSharePrivateBookModal" effect="fade" ok-text="Complete" cancel-text="Close" title="" @ok="finishTextCleanup()">
      <div v-html="sharePrivateBookMessage"></div>
    </modal>
    <modal v-model="showAudioMasteringModal" effect="fade" ok-text="Complete" cancel-text="Cancel" @ok="finishAudioMastering()">
      <p>Complete mastering?</p>
    </modal>
  </div>
</template>
<script>
  import task_controls from '../../../mixins/task_controls.js';
  import access from '../../../mixins/access.js';
  import { mapGetters, mapActions } from 'vuex';
  import { modal } from 'vue-strap'
  export default {
    name: 'BookAssignments',
    data() {
      return {
        textCleanupProcess: false,
        showSharePrivateBookModal: false,
        audioMasteringProcess: false,
        showAudioMasteringModal: false
      }
    },
    mixins: [access, task_controls],
    props: {
      users: Object
    },
    components: {
      modal
    },
    computed: {
      sharePrivateBookMessage: {
        get() {
          if (this.currentBookCounters.narration_blocks > 0) {
            return 'Complete editing and request narration for ' + this.currentBookCounters.narration_blocks + ' blocks?'
          } else {
            return 'Complete editing?';
          }
        }
      },
      isAllowEditingComplete: {
        get() {
          return this.tc_notMarkedBlocksCount() === 0;
        }
      },
      startBlockId: {
        get() {
          return this.storeListO.firstVisibleId
        },
        cache: false
      },
      showTaskNavigation: {
        get() {
          return this.bookMode !== null;
        },
        cache: false
      },
      ...mapGetters({
        tasks_counter: 'tasks_counter',
        adminOrLibrarian: 'adminOrLibrarian',
        currentBookCounters: 'currentBookCounters',
        currentBookMeta: 'currentBookMeta',
        currentCollectionId: 'currentCollectionId',
        storeListO: 'storeListO',
        taskBlockMap: 'taskBlockMap',
        bookMode: 'bookMode'
      })
    },
    methods: {
      updateAssignee(role, user){
        let api_url = this.API_URL + 'books/' + this.currentBookMeta._id + '/assignee';
        let api = this.$store.state.auth.getHttp();
        return api.post(api_url, {
          bookid: this.currentBookMeta._id,
          role: role,
          user: user
        }, {})
          .then(response => {
            if (response.status == 200) {
               //console.log(this.tasks_counter);
               //this.tasks_counter.forEach(function(el, index) {
               //  console.log(el.key, el.data);
               //  this.tasks_counter[index].data
               //  if el.ket
               //});
            }
          })
          .catch(err => {});
      },
      goToBlock(id) {
        this.$root.$emit('for-bookedit:scroll-to-block', id);
      },

      goToBlockCheck(blockid, role) {
        if (!blockid) {
          return;
        }
        if (this._is(role, true) || (role === 'editor' && this.adminOrLibrarian)) {
          let currentRoute = this.$route && this.$route.name ? this.$route.name : '';
          let params = {params: {bookid: this.currentBookMeta.bookid, block: blockid}};
          switch(role) {
            case 'narrator':
              params.name = this.currentCollectionId ? 'CollectionBookNarrate' : 'BookNarrate';
              break;
            case 'editor':
              params.name = this.currentCollectionId ? 'CollectionBookEdit' : 'BookEdit';
              break;
            case 'proofer':
              params.name = this.currentCollectionId ? 'CollectionBookProofread' : 'BookProofread';
              break;
          }
          if (currentRoute === params.name) {
            return this.goToBlock(blockid);
          } else {
            this.$router.push(params);
          }
        }
      },
      finishTextCleanup() {
        this.textCleanupProcess = true;
        this.showSharePrivateBookModal = false;
        this.completeTextCleanup()
          .then((doc) => {
            this.textCleanupProcess = false;
            if (!doc.data.error) {
              //this.currentBook.private = false;
              this.$root.$emit('set-alert', 'Text cleanup task finished');
            } else {
              this.$root.$emit('set-error-alert', doc.data.error);
            }
          })
          .catch((err) => {
            this.textCleanupProcess = false;
          });
      },
      finishAudioMastering() {
        this.audioMasteringProcess = true;
        this.showAudioMasteringModal = false;
        this.completeAudioMastering()
          .then((doc) => {
            this.audioMasteringProcess = false
            if (!doc.data.error) {
              this.$root.$emit('set-alert', 'Mastering task finished');
            } else {
              this.$root.$emit('set-error-alert', doc.data.error);
            }
          })
          .catch((err) => {
            this.$root.$emit('set-error-alert', err && err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Error in finish mastering');
            this.audioMasteringProcess = false;
          });
      },
      toggleMastering() {
        if (this.tc_allowToggleMetaMastering() && !this.currentJobInfo.mastering && this.currentJobInfo.workflow.status == 'active' && !this.currentBookMeta.isMastered) {
          if (!this.currentBookMeta.masteringRequired) {
            this.$root.$emit('show-modal', {
              title: ``,
              text: `<div class="bottom"><h5>Unmastered audio flow:</h5></div>
<ol>
<li>The book is edited, aligned with unmastered audio and proofread.</li>
<li>The audio from the book is exported, mastered and imported back in ILM.</li>
<li>The book is realigned with the mastered audio and proofread.</li>
</ol>
<div class="bottom">Define the audio as unmastered?</div>`,
              buttons: [
                {
                  title: 'CANCEL',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                  },
                },
                {
                  title: 'OK',
                  handler: () => {
                    this.$root.$emit('hide-modal');
                    this.updateBookMeta({'masteringRequired': !this.currentBookMeta.masteringRequired})
                  },
                  'class': 'btn btn-primary'
                }
              ],
              class: ['align-modal', 'master-switcher-warning']
            });
          } else {
            this.updateBookMeta({'masteringRequired': !this.currentBookMeta.masteringRequired})
          }
        }
      },
      goToPrevious(type, role) {
        if (this.taskBlockMap.map[type] && this.taskBlockMap.map[type].prev) {
          this.goToBlockCheck(this.taskBlockMap.map[type].prev, role);
        }
      },
      goToNext(type, role) {
        if (this.taskBlockMap.map[type] && this.taskBlockMap.map[type].next) {
          this.goToBlockCheck(this.taskBlockMap.map[type].next, role);
        }
      },
      set_taskBlockMapPositions(fromBlockId = null) {
        if (!fromBlockId) {
          fromBlockId = this.storeListO.firstVisibleId;
        }
        if (fromBlockId) {
          //console.log(this.storeListO);
          let start = this.storeListO.listIds.indexOf(fromBlockId);
          //console.log(start)
          for (let type in this.taskBlockMap.map) {//const [type, data] in this.taskBlockMap.map.entries()
            //console.log(type, this.taskBlockMap.map[type])
            this.taskBlockMap.map[type].next = null;
            this.taskBlockMap.map[type].prev = null;
            let found = false;
            let lookup;
            for (let i = start + 1; i < this.storeListO.listObjs.length; ++i) {
              switch (type) {
                case 'text-cleanup':
                  lookup = this.storeListO.lookupList[this.storeListO.listObjs[i].blockRid];
                  if (lookup && lookup.status && lookup.status.stage === 'cleanup' && !lookup.status.marked) {
                    this.taskBlockMap.map[type].next = this.storeListO.listObjs[i].blockId;
                    found = true;
                  }
                  break;
                case 'master-audio':
                  lookup = this.storeListO.lookupList[this.storeListO.listObjs[i].blockRid];
                  if (lookup && lookup.status && lookup.status.stage === 'audio_mastering' && !lookup.status.marked) {
                    this.taskBlockMap.map[type].next = this.storeListO.listObjs[i].blockId;
                    found = true;
                  }
                  break;
                default:
                  let blk = this.taskBlockMap.map[type].blocks.find(b => {
                    return b.blockId === this.storeListO.listObjs[i].blockId
                  });
                  //console.log(type, blk);
                  if (blk) {
                    found = true;
                    this.taskBlockMap.map[type].next = blk.blockId;
                  }
                  break;
              }
              if (found) {
                break;
              }
            }
            found = false;
            for (let i = start - 1; i >= 0; --i) {
              switch (type) {
                case 'text-cleanup':
                  lookup = this.storeListO.lookupList[this.storeListO.listObjs[i].blockRid];
                  if (lookup && lookup.status && lookup.status.stage === 'cleanup' && !lookup.status.marked) {
                    this.taskBlockMap.map[type].prev = this.storeListO.listObjs[i].blockId;
                    found = true;
                  }
                  break;
                case 'master-audio':
                  lookup = this.storeListO.lookupList[this.storeListO.listObjs[i].blockRid];
                  if (lookup && lookup.status && lookup.status.stage === 'audio_mastering' && !lookup.status.marked) {
                    this.taskBlockMap.map[type].prev = this.storeListO.listObjs[i].blockId;
                    found = true;
                  }
                  break;
                default:
                  let blk = this.taskBlockMap.map[type].blocks.find(b => {
                    return b.blockId === this.storeListO.listObjs[i].blockId
                  });
                  if (blk) {
                    found = true;
                    this.taskBlockMap.map[type].prev = blk.blockId;
                  }
                  break;
              }
              if (found) {
                break;
              }
            }
          }
        }
      },
      set_taskBlockMapPositionsFromRoute() {
        if (this.$route && this.$route.name === 'BookEditDisplay' && this.$route.params && this.$route.params.block) {
          this.set_taskBlockMapPositions(this.$route.params.block);
        } else {
          this.set_taskBlockMapPositions();
        }
      },
      ...mapActions(['updateBookMeta', 'completeTextCleanup', 'completeAudioMastering']),
    },
    mounted() {
      this.set_taskBlockMapPositionsFromRoute();
    },
    watch: {
      'startBlockId': {
        handler(val) {
          this.set_taskBlockMapPositions();
        }
      },
      'taskBlockMap.refresh': {
        handler() {
          this.set_taskBlockMapPositions();
        }
      },
      '$route': {
        handler(val) {
          this.set_taskBlockMapPositionsFromRoute();
        }
      }
    }
  }
</script>
<style scoped lang="less">
  .counters-container {
    padding: 2px 5px;
    .counter-executor {
      float: right;
      width: 100%;
      span {
        float: left;
        width: auto;
        padding: 2px 5px;
      }
    }
    table.counters {
      border: 1px solid black;
      width: 94%;
      -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
      -moz-user-select: none; /* Old versions of Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
      user-select: none;
      thead {
        background-color: #c2c2c2;
        th {
          text-align: left;
          padding: 1px 5px;
          border: 1px solid black;
        }
      }
      tr {
        border: 1px solid black;
        &:nth-child(even) {
          background-color: #f2f2f2;
        }
        td {
          text-align: left;
          padding: 1px 5px;
          border: 1px solid black;
          height: 30px;
          span {
            float: none;
            &.ready {
              color: green;
            }
          }
          &.go-to-block {
            cursor: pointer;
          }
          &.task-counter {
            &.-editor {
              width: 80px;
            }
            width: 210px;
          }
          &.task-type {
            .go-to-block, span.go-to-block {
                color: #3187d5;
                text-decoration: underline;
                cursor: pointer;
            }
            div {
                display: inline-block;
            }
            i {
                color: #3187d5;
                &.disabled {
                    color: #dddddd;
                    cursor: default;
                }
            }
          }
          &.task-action {
            width: 105px;
            .btn {
                padding: 3px 12px;
            }
          }
        }
      }
    }
  }
  .preloader-task {
      background: url(/static/preloader-snake-small.gif);
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
      position: absolute;
      background-repeat: no-repeat;
      background-position: center;
      background-color: #8080807d;
  }
  .master-switcher-warning {
    div {
      text-align: center;
    }
  }
</style>
<style lang="less">
  .master-switcher-warning {
    div.bottom {
      text-align: center;
    }
  }
</style>
