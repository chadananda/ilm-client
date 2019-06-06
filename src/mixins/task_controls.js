import axios from 'axios'
        import api_config from './api_config.js'
        import access from './access.js';
import {mapGetters} from 'vuex';

export default {
  data() {
    return {
      tc_test: 'Test property'
    }
  },
  mounted() {

  },
  mixins: [api_config, access],
  methods: {

    tc_hasTask(type) {
      return this.$store.state.tc_currentBookTasks.assignments && this.$store.state.tc_currentBookTasks.assignments.indexOf(type) !== -1;
    },
    tc_getTask(type) {
      let task = this.$store.state.tc_currentBookTasks.tasks.find((t) => {
        return t.type == type
      })
      return task ? task : {}
    },
    tc_getBlockTask(blockid) {
      let tasks = this.$store.state.tc_currentBookTasks.tasks.find((t) => {
        return t.blockid == blockid;
      })
      if (tasks && tasks.isArray)
        return tasks[0];
      return tasks;
    },
    tc_isShowRejectBlockAction(blockid) {
      return this.tc_hasTask('content_approve') && this.$store.state.tc_currentBookTasks.rejected_blocks.content.indexOf(blockid) === -1;
    },
    tc_isShowCorrectBlockAction(blockid) {
      return this.$store.state.tc_tasksByBlock[blockid] && this.$store.state.tc_tasksByBlock[blockid].type == 6
    },
    tc_isShowEdit(blockid) {
      if (this.adminOrLibrarian) {
        return true;
      }
      if (this._is('editor', true)) {
        return this.currentJobInfo.workflow.status === 'active';
      }
      return false;
    },
    tc_isCompleted(block) {
      if (this.tc_getBlockTask(block._id) || this.tc_getBlockTaskOtherRole(block._id)) {
        return false;
      }
      if (this.adminOrLibrarian) {
        let flags_summary = block.calcFlagsSummary();
        if (flags_summary && flags_summary.stat === 'open' && flags_summary.dir === 'narrator') {
          return false;
        }
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        if (this.currentJobInfo.text_cleanup) {
          return false;
        }
        if (this.currentJobInfo.mastering && block.status) {
          return block.status.stage !== 'audio_mastering';
        }
        return !this.tc_getBlockTask(block._id) && !this.tc_getBlockTaskOtherRole(block._id);
      }
      return true;
    },
    tc_enableMarkAsDone(block) {
      if (this.tc_getBlockTask(block._id) || this.tc_getBlockTaskOtherRole(block._id)) {
        return false;
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        return this.currentJobInfo.text_cleanup || this.currentJobInfo.mastering;
      }
      return false;
    },
    tc_isSpotCheckDisabled(block) {
      if (!block.audiosrc || (!this._is('editor', true) && !this.adminOrLibrarian)) {
        return true;
      }
      if (block.isAudioChanged) {
        return false;
      }
      if (this.tc_getBlockTask(block._id)) {
        return false;
      }
      if ((this.currentJobInfo.text_cleanup || (this.currentJobInfo.mastering && block.status && block.status.stage === 'audio_mastering')) && !block.markedAsDone) {
        return false;
      }
      if (this.adminOrLibrarian) {
        let canResolveTask = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.blockid == block._id;
        });
        if (canResolveTask) {
          return false;
        }
      }
      return true;
    },
    tc_allowVoiceworkChange(block) {
      if (block.type == 'illustration' || block.type == 'hr' || (!this._is('editor', true) && !this.adminOrLibrarian)) {
        return false;
      }
      if (this.currentJobInfo.text_cleanup && (this._is('editor', true) || this.adminOrLibrarian)) {
        return true;
      }
      if (this.currentJobInfo.workflow.status === 'active' || this.adminOrLibrarian) {
        return true;
      }
      return false;
    },
    tc_allowEditingComplete() {
      if (this._is('editor', true) || this.adminOrLibrarian) {
        return this.currentJobInfo.text_cleanup;
      }
      return false;
    },
    tc_allowFinishMastering() {
      if (this._is('editor', true) || this.adminOrLibrarian) {
        return this.currentJobInfo.mastering;
      }
      return false;
    },
    tc_allowFinishPublished() {
      if (this.currentJobInfo.mastering || this.currentJobInfo.proofing || this.currentJobInfo.text_cleanup) {
        return false;
      }
      if (this.adminOrLibrarian && this.currentJobInfo.can_resolve_tasks) {
        let t = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.type === 'approve-published-book';
        })
        if (!t) {
          return false;
        }
        return this.currentJobInfo.can_resolve_tasks.length === 1 && this.tc_currentBookTasks.tasks.length == 0 ? true : false;
      }
      return false;
    },
    tc_allowToggleMetaMastering() {
      return this._is('editor', true) || this.adminOrLibrarian;
    },
    tc_createApproveModifiedBlock(blockid) {
      if (!this.currentJobInfo.text_cleanup && !this.currentJobInfo.mastering &&
              !this.tc_getBlockTask(blockid) && this._is('editor', true)) {
        return true;
      }
      if (this.adminOrLibrarian && !this.currentJobInfo.text_cleanup && !this.currentJobInfo.mastering && !this.tc_getBlockTask(blockid)) {
        return true;
      }
      return false;
    },
    tc_createApproveRevokedBlock(blockid) {
      if (this._is('proofer', true)) {
        return !this.tc_getBlockTask(blockid);
      }
      return false;
    },
    tc_canResolveFlagPart(part) {
      let result = false;
      if (!this._is('editor', true) && !this._is('narrator', true) && !this._is('proofer', true) && !this.adminOrLibrarian) {
        return false;
      }
      if (part.creator === this.auth.getSession().user_id) {
        result = true;
        /*if (part.comments.length) part.comments.forEach((comment)=>{
         if (comment.creator !== part.creator) result = false;
         });*/
      } else if (part.creator_role && this._is(part.creator_role, true)) {
        return true;
      } else {
        if (this._is(part.type, true) && this.tc_getBlockTask(this.block._id)) {
          result = true;
        }
        if (!result && part.type === 'narrator' && (this._is('editor', true) || this.adminOrLibrarian)) {
          result = true;
        }
        if (!result && part.type === 'editor' && this.adminOrLibrarian) {
          result = true;
        }
      }
      return result;
    },
    tc_allowAdminFlagging(block, flagType = false) {
      if (block && this.adminOrLibrarian && (!flagType || flagType === 'narrator')) {
        if (block && block.status) {
          return block.status.assignee === 'proofer' && block.status.proofed === false && block.status.stage === 'audio_integration';
        }
      }
      return false;
    },
    tc_showBlockNarrate(block_id) {
      if (!this.$store.state.tc_tasksByBlock[block_id]) {
        return false;
      }
      return this.$store.state.tc_tasksByBlock[block_id].find(t => {
        return ['narrate-block', 'fix-block-narration'].indexOf(t.type) !== -1;
      });
    },
    tc_hasBlockTask(block_id, type) {
      if (this.adminOrLibrarian) {
        if (this.currentJobInfo.workflow.status !== 'active') {
          if (this.currentJobInfo.can_resolve_tasks) {
            let task = this.currentJobInfo.can_resolve_tasks.find(t => {
              return t.blockid === block_id && t.type === type;
            });
            if (task) {
              return true;
            }
          }
        }
      }
      if (!this.$store.state.tc_tasksByBlock[block_id]) {
        return false;
      }
      return this.$store.state.tc_tasksByBlock[block_id].find(t => {
        return t.type === type;
      });
    },
    tc_getBlockTaskOtherRole(blockid) {
      let tasks = false;
      if (this.$store.state.tc_currentBookTasks.can_resolve_tasks) {
        tasks = this.$store.state.tc_currentBookTasks.can_resolve_tasks.find((t) => {
          return t.blockid == blockid;
        })
      }
      if (!tasks && this.currentJobInfo.can_resolve_tasks) {
        tasks = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.blockid == blockid;
        });
      }
      //if (tasks && tasks.isArray) return tasks[0];
      return tasks;
    },
    tc_showBlockAudioEdit(blockid) {
      if (this._is('editor', true) && this.currentJobInfo.workflow.status === 'active') {
        return true;
      }
      if (this.adminOrLibrarian) {
        return true;
      }
      //if (!this.$store.state.tc_tasksByBlock[blockid]) {
      //return false;
      //}
      let taskByType = this.$store.state.tc_tasksByBlock[blockid] ? this.$store.state.tc_tasksByBlock[blockid].find(t => {
        return ['narrate-block', 'fix-block-narration', 'fix-block-text', 'approve-new-block', 'approve-modified-block', 'approve-published-block', 'approve-new-published-block'].indexOf(t.type) !== -1;
      }) : false;
      if (taskByType) {
        return true;
      }
      if (this.adminOrLibrarian) {
        let canResolveTask = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.blockid == blockid;
        });
        if (canResolveTask) {
          return true;
        }
      }
      return false;
    },
    tc_isProofreadUnassigned() {
      return this.currentJobInfo.is_proofread_unassigned;
    },
    tc_blocksToApproveCount() {
      if (this.tc_allowEditingComplete() || this.tc_allowFinishMastering()) {
        if (this.tc_allowEditingComplete()) {
          return this.currentBookCounters.not_marked_blocks;
        }
        if (this.tc_allowFinishMastering()) {
          if (this.currentBookCounters.not_proofed_audio_blocks === 0) {
            return 0;
          } else {
            return this.currentBookCounters.not_marked_blocks;
          }
        }
      } else {
        let count = this.tc_currentBookTasks.tasks.length;
        let can_approve_count = 0
        if (this.currentJobInfo && this.currentJobInfo.can_resolve_tasks) {
          can_approve_count = this.currentJobInfo.can_resolve_tasks.filter(t => {
            return typeof t.blockid !== 'undefined' && t.blockid;
          });
        }
        count += can_approve_count ? can_approve_count.length : 0;
        return count;
      }
    },
    tc_allowMetadataEdit() {
      if (this.adminOrLibrarian || this._is('editor', true)) {
        return true;
      }
      return false;
    },
    tc_displayAudiointegrationTab() {
      if ([
        'CollectionBookEditDisplay',
        'BookEditDisplay',
        'BooksGrid',
        'CollectionBook'
      ].indexOf(this.$route.name) !== -1) {
        return false;
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        return true;
      }
      return false;
    },
    tc_displayStylesTab() {
      if ([
        'CollectionBookEditDisplay',
        'BookEditDisplay',
        'BooksGrid',
        'CollectionBook'
      ].indexOf(this.$route.name) !== -1) {
        return false;
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        return true;
      }
      return false;
    },
    tc_allowMetadataActions() {
      if ([
        'CollectionBookEditDisplay',
        'BookEditDisplay',
        'BooksGrid',
        'CollectionBook'
      ].indexOf(this.$route.name) !== -1) {
        return false;
      }
      return true;
    },
    tc_notMarkedBlocksCount() {
      if (!this._is('editor', true) && !this.adminOrLibrarian) {
        return null;
      }
      let task = null;
      if (this.currentJobInfo.text_cleanup || this.currentJobInfo.mastering) {
        let target_type = this.currentJobInfo.text_cleanup ? 'text-cleanup' : 'master-audio';
        let editor = this.currentJobInfo.tasks_counter.find(tc => {
          return tc.key === 'editor';
        });
        if (editor && editor.data && editor.data.tasks && Array.isArray(editor.data.tasks)) {
          task = editor.data.tasks.find(t => {
            return t.type === target_type;
          })
        }
      }
      if (task) {
        return parseInt(task.count);
      } else {
        return null;
      }
    }
  },
  computed: {
    ...mapGetters(['currentBookMeta', 'adminOrLibrarian', 'currentJobInfo'])
  }
}
