import axios from 'axios'
        import api_config from './api_config.js'
        import access from './access.js';
import {mapGetters} from 'vuex';

export default {
  data() {
    return {
        tc_test: 'Test property',
        editor_tasks: ['fix-block-text', 'approve-new-block', 'approve-modified-block', 'approve-new-published-block', 'approve-published-block', 'text-cleanup', 'master-audio', 'approve-trimming'],
        narrator_tasks: ['narrate-block', 'fix-block-narration', 'approve-re-narration'],
        proofer_tasks: ['approve-block', 'approve-revoked-block'],
        editor_resolve_tasks: ['fix-block-narration']
    }
  },
  mounted() {
  },
  mixins: [api_config, access],
  methods: {
    tc_hasTask(type) {
      return this.tc_currentBookTasks.assignments && this.tc_currentBookTasks.assignments.indexOf(type) !== -1;
    },
    tc_getTask(type) {
      let task = this.tc_currentBookTasks.tasks.find((t) => {
        return t.type == type
      })
      return task ? task : {}
    },
    tc_getBlockTask(blockid, mode = null) {
      let task = this.tc_tasksByBlock[blockid];
      if (task && mode) {
        switch(mode) {
          case 'edit':
            if (this.editor_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
          case 'narrate':
            if (this.narrator_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
          case 'proofread':
            if (this.proofer_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
        }
      }
      return task;
    },
    tc_isShowEdit(blockid) {
      if (this.adminOrLibrarian || this.adminOrProofer) {
        return true;
      }
      if (this._is('editor', true)) {
        return this.currentJobInfo.workflow.status === 'active';
      }
      return false;
    },
    tc_isCompleted(block) {
      let block_task = this.tc_getBlockTask(block.blockid);
      //if (!block_task) {
        //block_task = this.tc_getBlockTaskOtherRole(block.blockid);
      //}
      if (block_task) {
        switch (this.bookMode) {
          case 'proofread':
            return this.proofer_tasks.indexOf(block_task.type) === -1;
            break;
          case 'edit':
            return this.editor_tasks.indexOf(block_task.type) === -1 && this.editor_resolve_tasks.indexOf(block_task.type) === -1;
            break;
          case 'narrate':
            return this.narrator_tasks.indexOf(block_task.type) === -1;
            break;
        }
      }
      if (this.adminOrLibrarian) {
        let flags_summary = block.calcFlagsSummary();
        if (flags_summary && flags_summary.stat === 'open' && flags_summary.dir === 'narrator') {
          return false;
        }
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        if (this.currentJobInfo.text_cleanup) {
          return this.bookMode === 'edit' ? false : true;
        }
        if (this.currentJobInfo.mastering && block.status) {
          return block.status.stage !== 'audio_mastering' || this.bookMode !== 'edit';
        }
        return !block_task;
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
      if (block.voicework === 'narration' && !this.currentJobInfo.text_cleanup && !(this.currentJobInfo.mastering || this.currentJobInfo.mastering_complete)) {
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
    tc_allowVoiceworShow(block) {
      return block.type != 'illustration' && block.type != 'hr';
    },
    tc_allowVoiceworkChange(block) {
      if (!this._is('editor', true) && !this.adminOrLibrarian) {
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
    tc_canResolveFlagPart(part, block) {
      let result = false;
      if (!this._is('editor', true) && !this._is('narrator', true) && !this._is('proofer', true) && !this.adminOrLibrarian) {
        return false;
      }
      if (this._is('narrator') && this.bookMode === 'narrate' && block.voicework !== 'narration') {
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
        if (this._is(part.type, true) && this.tc_getBlockTask(this.block._id, this.bookMode)) {
          result = true;
        }
        if (!result && part.type === 'narrator' && (this._is('editor', true) || this.adminOrLibrarian) && this.bookMode === 'edit') {
          result = true;
        }
        if (!result && part.type === 'editor' && this.adminOrLibrarian && this.bookMode === 'edit') {
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
    tc_showBlockNarrate(block, blockPart = null) {
      if (this.bookMode === 'narrate' && block.voicework === 'narration' && this._is('narrator', true)) {
        if (this.currentJobInfo.mastering) {
          return false;
        }
        return true;
      }
      return false;
    },
    tc_isNarrationEnabled(blockid) {
      return this.tc_getBlockTask(blockid, 'narrate');
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
      if (!this.tc_tasksByBlock[block_id]) {
        return false;
      }
      return this.tc_tasksByBlock[block_id].type === type;
    },
    tc_displayAudiointegrationTab() {
      if (this.bookMode !== 'edit' || [
        'BookEdit', 'CollectionBookEdit'
      ].indexOf(this.$route.name) === -1) {
        return false;
      }
      if (this.adminOrLibrarian || this._is('editor', true)) {
        return true;
      }
      return false;
    },
    tc_displayStylesTab() {
      if ( ['edit', 'proofread'].indexOf(this.bookMode) === -1 || ['BookEdit', 'CollectionBookEdit',"BookProofread"].indexOf(this.$route.name) === -1) {
        return false;
      }
      if (this.adminOrLibrarian || this.adminOrProofer || this._is('editor', true)) {
        return true;
      }
      return false;
    },
    tc_getBlockTaskOtherRole(blockid, mode = null) {
      let task = false;
      if (this.tc_currentBookTasks.can_resolve_tasks) {
        task = this.tc_currentBookTasks.can_resolve_tasks.find((t) => {
          return t.blockid == blockid;
        })
      }
      if (!task && this.currentJobInfo.can_resolve_tasks) {
        task = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.blockid == blockid;
        });
      }
      if (task && mode) {
        switch(mode) {
          case 'edit':
            if (this.editor_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
          case 'narrate':
            if (this.narrator_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
          case 'proofread':
            if (this.proofer_tasks.indexOf(task.type) === -1) {
              return false;
            }
            break;
        }
      }
      //if (tasks && tasks.isArray) return tasks[0];
      return task;
    },
    tc_showBlockAudioEdit(block, blockPart) {
      if (!blockPart.audiosrc) {
        return false;
      }
      if (this.bookMode === 'narrate') {
        if (block.voicework !== 'narration') {
          return false;
        }
        if (blockPart.audiosrc) {
          return !this.currentJobInfo.mastering ? true : false;
        }
        return false;
      }
      if (this._is('editor', true) && this.currentJobInfo.workflow.status === 'active') {
        return true;
      }
      if (this.adminOrLibrarian) {
        return true;
      }
      //if (!this.$store.state.tc_tasksByBlock[blockid]) {
      //return false;
      //}

      let taskByType = this.tc_tasksByBlock[block.blockid] ? ['narrate-block', 'fix-block-narration', 'fix-block-text', 'approve-new-block', 'approve-modified-block', 'approve-published-block', 'approve-new-published-block'].indexOf(this.tc_tasksByBlock[block.blockid].type) !== -1 : false;

      if (taskByType) {
        return true;
      }
      if (this.adminOrLibrarian) {
        let canResolveTask = this.currentJobInfo.can_resolve_tasks.find(t => {
          return t.blockid == block.blockid;
        });
        if (canResolveTask) {
          return true;
        }
      }
      return false;
    },
    tc_isProofreadUnassigned(block) {
      if (!this.currentJobInfo.is_proofread_unassigned) {
        return false;
      }
      return this.currentJobInfo.locked_blocks.proofer.indexOf(block.blockid) === -1;
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
    },
    tc_hasExecutorTasks(role) {
      if (this.currentJobInfo &&
              this.currentJobInfo.tasks_counter &&
              this.currentJobInfo.executors &&
              (this.currentJobInfo.executors[role] === this.$store.state.auth.getSession().user_id ||
              (this.adminOrLibrarian && role === 'editor'))) {
        let proofread = this.currentJobInfo.tasks_counter.find(tc => {
          return tc.key === role;
        });
        if (proofread && proofread.data) {
          return proofread.data.tasks && proofread.data.tasks.length > 0 ? true : false;
        }
      }
      return false;
    },
    tc_showEditTab() {
      return (this._is('editor', true) || this.adminOrLibrarian) && this.tc_hasExecutorTasks('editor');
    },
    tc_showNarrateTab() {
      return this._is('narrator', true) && this.tc_hasExecutorTasks('narrator') && this.currentJobInfo.workflow.status === 'active';
    },
    tc_showProofreadTab() {
      return this._is('proofer', true) && this.tc_hasExecutorTasks('proofer') && this.currentJobInfo.workflow.status === 'active';
    },
    tc_isApproveDisabled(block, mode) {
      let task = this.tc_getBlockTask(block.blockid);
      if (!task) {
        task = this.tc_getBlockTaskOtherRole(block.blockid);
      }
      if (!task) {
        return true;
      }
      switch (mode) {
        case 'edit':
          if (this.editor_tasks.indexOf(task.type) === -1 && this.editor_resolve_tasks.indexOf(task.type) === -1) {
            return true;
          }
          if (['tts', 'audio_file'].indexOf(block.voicework) !== -1 && !block.hasCompleteAudio()) {//check complete audio on all subblocks
            return true;
          }
          /*if (block.footnotes && Array.isArray(block.footnotes)) {
            let notAlignedFootnote = block.footnotes.find(f => {
              return !f.audiosrc && f.voicework === 'tts';
            });
            if (notAlignedFootnote) {
              return true;
            }
          }*/
          break;
        case 'narrate':
          if (this.narrator_tasks.indexOf(task.type) === -1) {
            return true;
          }

          if (['narration'].indexOf(block.voicework) !== -1 && !block.hasCompleteAudio()) {//check complete audio on all subblocks
            return true;
          }
          break;
        case 'proofread':
          if (this.proofer_tasks.indexOf(task.type) === -1 || (!block.audiosrc && block.voicework !== 'no_audio')) {
            return true;
          }
          break;
      }
      let flags_summary = this.block.calcFlagsSummary();
      if (flags_summary) {
        if (flags_summary.stat === 'resolved') {
          return false;
        }
        switch (mode) {
          case 'edit':
            if (flags_summary.dir === 'narrator') {
              if (this.editor_tasks.indexOf(task.type) !== -1) {
                return true;
              }
              return this.editor_resolve_tasks.indexOf(task.type) === -1 ? false : true;
            }
            if (flags_summary.dir === 'proofer') {
              return false;
            }
            break;
          case 'narrate':
            if (flags_summary.dir === 'editor') {
              return true;
            }
            if (flags_summary.dir === 'proofer') {
              return false;
            }
            break;
          case 'proofread':
            if (flags_summary.dir === 'proofer') {
              return false;
            }
            break;
        }
      }
      return true;
    },
    tc_isNeedWorkDisabled(block, mode) {
      let task = this.tc_getBlockTask(block.blockid);
      //if (!task) {
        //task = this.tc_getBlockTaskOtherRole(block.blockid);
      //}
      if (!task) {
        return true;
      }
      switch (mode) {
        case 'edit':
          if (this.editor_tasks.indexOf(task.type) === -1) {
            return true;
          }
          break;
        case 'narrate':
          if (this.narrator_tasks.indexOf(task.type) === -1) {
            return true;
          }
          break;
        case 'proofread':
          if (this.proofer_tasks.indexOf(task.type) === -1) {
            return true;
          }
          break;
      }
      let flags_summary = this.block.calcFlagsSummary();
      if (flags_summary) {
        if (flags_summary.stat === 'resolved') {
          return true;
        }
        switch (mode) {
          case 'edit':
            if (flags_summary.dir === 'narrator') {
              if (block.voicework !== 'narration') {
                return true;
              }
              return this.editor_resolve_tasks.indexOf(task.type) === -1 ? false : true;
            }
            break;
          case 'narrate':
            if (flags_summary.dir === 'editor') {
              return false;
            }
            break;
          case 'proofread':
            return flags_summary.dir === 'proofer' ? true : false;
        }
      }
      return true;
    },
    tc_getTaskMode(task) {
      if (this.narrator_tasks.indexOf(task.type) !== -1) {
        return 'narrate';
      } else if (this.editor_tasks.indexOf(task.type) !== -1) {
        return 'edit';
      } else if (this.proofer_tasks.indexOf(task.type) !== -1) {
        return 'proofread';
      }
      return 'display';
    },
    tc_getTaskUrl(task, job) {
      let mode = this.tc_getTaskMode(task);
      let url = job.collection_id ? '/collections/' + job.collection_id + '/' + task.bookid + '/' + mode : '/books/' + task.bookid + '/' + mode;
      if (task.blockid) {
        return url + '/' + task.blockid;
      }
      switch(task.type) {
        default : {
          return url + '/unresolved/' + task.type;
        } break;
      };
      return '';
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
    tc_isNarrateUnassigned(block) {
      if (block.voicework === 'narration' && this.bookMode === 'narrate') {
        return this.currentJobInfo.is_narrate_unassiged;
      }
      return false;
    },
    tc_allowNarrateUnassigned(block) {
      if (this.bookMode !== 'narrate') {
        return true;
      }
      if (!this.currentJobInfo.is_narrate_unassiged) {
        return false;
      }
      if (this.tc_getBlockTask(block.blockid, 'narrate')) {
        return true;
      }
      let user_id = this.auth.getSession().user_id;
      let flags = Array.isArray(block.flags) ? block.flags.filter(flag => {
        return Array.isArray(flag.parts) && !flag.isNew ? flag.parts.find(p => {
          let isCreator = p.creator_role ? p.creator_role === 'narrator' : p.creator === user_id;
          return !isCreator && p.status === 'open' && !p.isReopen;
        }) : false;
      }) : [];
      if (flags.length > 0) {
        return false;
      }
      return true;
    }
  },
  computed: {
    ...mapGetters(['currentBookMeta', 'adminOrLibrarian', 'adminOrProofer', 'currentJobInfo', 'bookMode', 'tc_currentBookTasks', 'tc_tasksByBlock'])
  }
}
