<template>
  <div class="area-wrapper">

  <vue-tabs>
    <v-tab title="My Tasks" :beforeChange="onTabChange">
      <div class="table toolbar">
        <div class="tr">
          <div class='td'>
            <h3><i class="fa fa-arrow-circle-o-right"></i>&nbsp;{{tasks.total}} Current tasks in your Queue</h3>
          </div>
          <div class='td'>
            <button @click='taskAddModalActive = true' class='btn btn-default' v-if="isAdmin || isLibrarian">
              <i class="fa fa-plus"></i>&nbsp;New Job
            </button>
          </div>
        </div>
      </div>
      <task-add-modal
        :show="taskAddModalActive"
        @closed="taskAddModalClose">

      </task-add-modal>
      <!-- Import Books Modal Popup -->
      <BookImport v-if="show_import_book_modal" :multiple="false" @close_modal="importBookClose"
                  :importTaskId="import_book_task_id"
                  :bookId="import_book_id" />
      <AudioImport v-if="show_import_audio_modal" @closeOk="importAudioClose" @close="importAudioClose"
                  :book="import_book"
                  :importTask="import_audio_task"
                  :audiobook="task_audiobook"
                  :multiple="audio_import_multiple"/>

      <div class="overflow-wrapper">

      <div class="table tasks-box">
      <section v-for="job in tasks.list"><!-- tc_userTasks -->
      <template v-if="job.total > 0">
        <div class="tr">
          <div class="td task-type">
            <h2><i class="fa fa-book" data-toggle="tooltip" v-bind:title="job.description"></i>&nbsp;{{job.title}}&nbsp;({{job.total}})<span class="hidden">{{job.bookid}}</span>&nbsp;<i :class="[job.tasksVisible ? 'fa-chevron-up' : 'fa-chevron-down' , 'fa collapsebtn']" aria-hidden="true" @click='job.tasksVisible = !job.tasksVisible'></i></h2>
          </div>
          <!--<div class="td"></div>-->
        </div>
        <transition-group name="fade">
        <div v-if="job.tasksVisible" :key="job.title">
          <div v-for="task in job.tasks" class="tr subtasks-box" :key="task._id">
            <div class="task-title-box td">
              <h4>({{task.count}})&nbsp;{{task.title}}</h4>
            </div>

            <div class="subtask-items-box td">
              <div class="subtask-item-box">
                <div v-if="task.type == 'import-book'">
                  <button class="btn btn-default" v-if="job.status == 'import_text'" v-on:click="importBook(task)">
                    <i class="fa fa-pencil"></i>Import book "{{job.title}}"
                  </button>
                  <button class="btn btn-default" v-if="job.status == 'staging'" v-on:click="importAudio(task, job.meta)">
                    <i class="fa fa-file-audio-o"></i>Import audio
                  </button>
                </div>
                <router-link v-else :to="tc_getTaskUrl(task, job)"><a>{{job.bookid}}&nbsp;<i class="fa fa-arrow-circle-o-right"></i></a></router-link>
              </div>
            </div>
          </div>
        </div>
        </transition-group>
      </template>
      <!--<template v-if="job.tasks.length">-->
      </section>
      <!--<section v-for="job in tasks.list">-->
      </div>
      <!--<div class="table  tasks-box">-->

      </div>
      <!--<div class="overflow-wrapper">-->
    </v-tab>
    <v-tab title="Work History">
    <div class="overflow-wrapper">
      <TaskHistory :current_user="true"></TaskHistory>
    </div>
    <!--<div class="overflow-wrapper">-->
    </v-tab>
    <v-tab v-if="isAdmin" title="Total work history">
    <div class="overflow-wrapper">
      <TaskHistory :current_user="false"></TaskHistory>
    </div>
    <!--<div class="overflow-wrapper">-->
    </v-tab>
  </vue-tabs>


  </div>
  <!--<div class="area-wrapper">-->
</template>

<script>
import { VueTabs, VTab } from 'vue-nav-tabs'
import axios from 'axios'
import TaskAddModal from './tasks/TaskAddModal'
import TaskHistory from './tasks/TaskHistory'
import superlogin from 'superlogin-client'
import BookImport from './books/BookImport'
import AudioImport from './audio/AudioImport'
import { mapGetters, mapActions } from 'vuex'
import api_config from '../mixins/api_config.js';
import task_controls from '../mixins/task_controls.js';
var BPromise = require('bluebird');

export default {
  data () {
    return {
      msg: 'Assignments',
      taskAddModalActive: false,
      tasks: {
        list: [],
        total: 0
      },
      show_import_book_modal: false,
      show_import_audio_modal: false,
      import_book_task_id: '',
      import_audio_task: {},
      import_book_id: '',
      import_book: {},
      task_audiobook: {},
      audio_import_multiple: true
    }
  },

  mixins: [api_config, task_controls],

  components: {
    VueTabs,
    VTab,
    TaskAddModal,
    BookImport,
    TaskHistory,
    AudioImport
  },

  computed: mapGetters([
    'isAdmin',
    'isLibrarian',
    'tc_userTasks',
    'taskTypes'
  ]),

  watch: {
    'tc_userTasks': {
      handler(val) {
        this.parseTasks();
      },
      deep: true
    }
  },

  mounted() {
    var self = this
    self.parseTasks();
  },

  methods: {
    parseTasks() {
      let tasks_formatted = {total: 0, list: []};
      let list_priority = [[],[],[],[]];
      let priority_secondary = 0;

      let priorityTasks = ['fix-block-text', 'fix-block-narration', 'approve-modified-block', 'approve-new-block', 'approve-re-narration', 'approve-revoked-block']   // https://isddesign.atlassian.net/wiki/spaces/ILM/pages/2830827547/Assignments+page

      let jobs = Object.assign({}, this.tc_userTasks.list);
      for (let jobId in jobs) {
        priority_secondary = 0;

        jobs[jobId] = Object.assign({}, this.tc_userTasks.list[jobId]);

        jobs[jobId].total = jobs[jobId].tasks.length;
        tasks_formatted.total += jobs[jobId].total;
        //jobs[jobId].tasksVisible = false;
        jobs[jobId].tasksVisible = true;

        if (this.isAdmin || this.isLibrarian){
            jobs[jobId].tasksVisible = false;
        } else {
            jobs[jobId].tasksVisible = true;
        }

        let tasks_list = [];
        let priority = list_priority.length;
        for (let _t in this.tc_userTasks.list[jobId].tasks) {
          tasks_list.push(Object.assign({}, this.tc_userTasks.list[jobId].tasks[_t]));
          //detect priority:
          if (priorityTasks.includes(this.tc_userTasks.list[jobId].tasks[_t].type)){
            priority = 1;
            priority_secondary++;
          } else if (this.tc_userTasks.list[jobId].tasks[_t].type == 'text-cleanup'){
            priority = 2;
            priority_secondary = this.tc_userTasks.list[jobId].tasks[_t].updated_at || 0;
          } else if (jobs[jobId].type == 'with-audio') {
            priority = 3;
            priority_secondary = jobs[jobId].total;
          } else {
            priority = 4;
            priority_secondary = jobs[jobId].total;
          }
        
        }
        jobs[jobId].tasks = Object.assign({}, this.tc_userTasks.list[jobId].tasks);
        jobs[jobId].tasks = tasks_list.reduce((acc, val)=>{
          let key = 'type_'+val.type;
          if (acc.hasOwnProperty(key)) acc[key].count ++;
          else {
            if (this.taskTypes.tasks) {
                val.title = this.taskTypes.tasks.find((s_type) => {
                    return s_type._id == val.type
                }).title;
              } else {
                val.title = '';
              }
              acc[key] = {count:1, ...val};
          }
          return  acc;
        }, {} );

        for (let i = 0; i < list_priority.length; i ++ ){
          if (priority == i )
            list_priority[i].push([jobs[jobId], priority_secondary]);
        }

      }

      for (let i = 0; i < list_priority.length; i ++ ){
        list_priority[i].sort((a, b) => a[1] > b[1] ? -1 : (a[1] < b[1] ? 1 : 0))
      }

      for (let i = 0; i < list_priority.length; i ++ ){
        list_priority[i].forEach(element => tasks_formatted.list.push(element[0]));

      }

      this.tasks = tasks_formatted;
    },
    taskAddModalClose(create) {
      this.taskAddModalActive = false
      if (create) {
        this.$store.dispatch('tc_loadBookTask')
        //this.getTasks()
      }
    },
    importBook(task) {
      this.import_book_task_id = task.id
      this.import_book_id = task.bookid
      this.show_import_book_modal = true
    },
    importAudio(task, book_meta) {
      this.import_book = book_meta
      this.import_audio_task = task
      this.show_import_audio_modal = true
      this.audio_import_multiple = true
      this.task_audiobook = {}
    },
    importExportAudio(task, book_meta, book_audio) {
      this.import_book = book_meta
      this.import_audio_task = task
      this.show_import_audio_modal = true
      this.audio_import_multiple = false
      this.task_audiobook = book_audio || {}
    },
    importBookClose(response) {
      if (response) {
        this.$store.dispatch('tc_loadBookTask')
        this.$router.replace({ path: '/books/' + this.import_book_id })
        return
      }
      let self = this
      self.show_import_book_modal = false
      //console.log(response)
      //self.getTasks()
      self.$store.dispatch('tc_loadBookTask')
      self.import_book_task_id = ''
    },
    importAudioClose(response) {
      this.show_import_audio_modal = false
      this.import_book = {}
      this.import_audio_task = {};
      this.import_book_id = ''
      this.task_audiobook = {}
      //this.getTasks()
      //this.$store.dispatch('tc_loadBookTask')
    },
    onTabChange() {
      return true
    },

    ...mapActions([
        'getBookMeta', 'getAudioBook'
    ])
  }
}
</script>


<style lang="less">

.area-wrapper {

  .vue-tabs {
    height: 100%;
    width: 100%;

    .tab-content {
      height: 100%;

      .tab-container {
        height: 100%;

          .toolbar {
            margin-bottom: 0;
          }

          .overflow-wrapper {
            height: 93%;
            overflow: auto;
            margin-top: 2px;
            margin-bottom: 45px;
          }
      }
    }
  }


}
</style>
<style lang="less" scoped>

.fa {
    margin-right: 8px;
    position: relative;
    top: 1px;
}

.toolbar {
   width: 100%;
   position: relative;
   padding-left: .25em;
   padding-right: .25em;
   box-shadow: 0px 0px 3px 2px rgba(178, 191, 224, 0.53);
   padding: 5px;
 }
.toolbar td {
   text-align: left;
   padding-top:0; margin-top:0;
 }
.toolbar td.right {
  text-align: right;
  position: inline;
  padding-top: 11px;
  float: right;
  padding-right: 10px;
}
.toolbar h3 {
  margin: 0px;
}
.toolbar h3 i.fa {
  font-size: 30px;
}
.table {
  display: table;
  /*border-spacing: 15px;*/
  padding: 0;
}
.tr {
  display: table-row;
}
.td {
  display: table-cell;
  vertical-align: middle;
  white-space: nowrap;
  padding: 5px;
  &.task-title-box {
      width: 500px;
  }
}
.tasks-box {
  width: 100%;
  padding-left: 35px;
}

.task-type.td {
  width: 550px;
}
.subtask-title-box {
  padding: 5px 25px 5px 5px;
  width: 5em;
}
.subtask-items-box {

}
.subtask-item-box {
  padding: 5px 10px;
}
.tasks-box .task-type i.fa.fa-book{
  font-size: 35px;
  margin-left: -35px;
}
.subtasks-box:nth-of-type(even) {
  background-color: #f9f9f9;
}

.collapsebtn {
    width: 30px; height: 30px;
    display: inline-block;
    background: white;
    padding: 5px;
    border: .5px solid rgb(204, 212, 226);
    border-radius: 25px;
    box-shadow: 0px 0px 5px 1px rgba(0,0,0,0.2);
    color: rgba(204, 212, 226, 1);
    cursor: pointer;

    &:hover {
      color: green;
    }
}
.subtask-item-box .import-link {
    text-decoration: underline;
    cursor: pointer;
}
</style>
