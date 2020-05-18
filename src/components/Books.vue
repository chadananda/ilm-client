<template>
  <div id='booksarea' :class="bookMode"><!-- v-cloak-->
    <div :class="['content-meta-wrapper', metaVisible ? 'meta-visible' : '']">

      <BookEditToolbar v-if="isEditMode()"
      :toggleMetaVisible="toggleMetaVisible"
      :hasBookSelected="hasBookSelected"
      :metaVisible="metaVisible"/>

      <BooksToolbar v-else-if="listing=='books'"
      @import_finished="bookImportFinished"
      :toggleMetaVisible="toggleMetaVisible"
      :hasBookSelected="hasBookSelected"
      :metaVisible="metaVisible"/>

      <BookReimport v-if="showBookReimport"
        :multiple="false"
        @close_modal="reimportBookClose"
        :bookId="getBookid()" />


      <div class="scroll-wrapper" v-bind:class="'-lang-' + currentBookMeta.language">
        <router-view></router-view>
      </div>

    </div>

    <div class='metaedit' v-if='metaVisible'>
      <book-meta-edit v-if='metaVisible'></book-meta-edit>
    </div>

    <nav :class="['navbar', 'fixed-bottom', 'navbar-light', 'bg-faded', {'hidden': !showAudioeditor()}, audioeditorMode()]" >
      <div v-if="preloader" :class="['audio-process-run', 'preloader-' + preloaderType]"></div>
      <AudioEditor ref="audioEditor"></AudioEditor>
    </nav>

    <v-dialog :clickToClose="false"/>
    <modals-container/>
    <alert v-model="hasErrorAlert" placement="top" :duration="5000" type="danger" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>
      <p>{{errorAlert}}</p>
    </alert>
    <alert v-model="hasAlert" placement="top" :duration="5000" type="info" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>
      <p>{{messageAlert}}</p>
    </alert>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Clipboard from 'v-clipboard'
import BooksToolbar from './books/BooksToolbar'
import BookEditToolbar from './books/BookEditToolbar'
import BookMetaEdit from './books/BookMetaEdit'
import BookEditHtml from './books/BookEdit_HTML'
import BookEditJson from './books/BookEdit_JSON'
import axios from 'axios'
import superlogin from 'superlogin-client'
import api_config from '../mixins/api_config.js'
import AudioEditor from './AudioEditor'
import task_controls from '../mixins/task_controls.js'
import BookReimport from './books/BookReimport'
import Vue from 'vue';
import {alert} from 'vue-strap';
var modal = require('vue-js-modal');

Vue.use(modal, {dialog: true, dynamic: true});
Vue.use(Clipboard)


export default {

  name: 'Books',

  data () {
    return {
      metaVisible: false,
      metaAvailable: false,
      //colCount: 1,
      currentBookid: this.$store.state.currentBookid,
      showBookReimport: false,
      hasErrorAlert: false,
      errorAlert: '',
      hasAlert: false,
      messageAlert: '',
      preloader: false,
      preloaderType: ''
    }
  },

  components: {
    BooksToolbar,
    BookMetaEdit,
    BookEditToolbar,
    axios,
    superlogin,
    AudioEditor,
    BookReimport,
    alert
  },

  computed: {
    ...mapGetters(['bookMode', 'bookEditMode', 'currentBook', 'currentBookMeta', 'currentBookCounters', 'jobStatusError', 'adminOrLibrarian']),
  },

  watch: {
//     '$store.state.route.params' (to, from) {
//       // react to route changes...
//       // this.recountRows()
//     }
    'currentBookMeta': {
      handler(val, old_val) {
        if (this.$route.path.indexOf('/collections') !== 0 && !old_val._id && this.currentBookMeta && this.currentBookMeta.collection_id) {
          if (this.$route) {
            let params = this.$route.params ? this.$route.params : {};
            let meta = this.$route.meta ? this.$route.meta : {};
            let name = 'CollectionBook';
            switch (this.$route.name) {
              case 'BookNarrate':
                name = 'CollectionBookNarrate';
                break;
              case 'BookEdit':
                name = 'CollectionBookEdit';
                break;
              case 'BookEditDisplay':
                name = 'CollectionBookEditDisplay';
                break;
              case 'BookProofread':
                name = 'CollectionBookProofread';
                break;
            }
            params.collectionid = this.currentBookMeta.collection_id;
            this.$router.replace({name: name, params: params, meta: meta});
          } else {
            this.$router.replace({ path: '/collections/' + this.currentBookMeta.collection_id + '/' + this.currentBookMeta.bookid });
          }
        } else if (this.metaVisible && !this.currentBookMeta._id) {
          this.metaVisible = false;
          this.metaAvailable = false;
        }
      }
    },
    'jobStatusError': {
      handler(val) {
        if (val) {
          this.tc_loadBookTask(this.currentBookMeta.bookid);
          this.getCurrentJobInfo();
          this.showModal({
            title: 'Book preparation is stopped. Further modifications are not allowed',
            text: '',
            buttons: [
              {
                title: 'OK',
                handler: () => {
                  this.$store.commit('set_job_status_error', '');
                  if (!this.adminOrLibrarian) {
                    if (this.$route && ['BooksGrid', 'CollectionBook'].indexOf(this.$route.name) !== -1) {
                      this.updateBooksList()
                        .then(() => {
                          switch(this.$route.name) {
                            case 'BooksGrid':
                              this.$router.push('/books');
                              break;
                            case 'CollectionBook':
                              this.$router.push({name: 'Collection', params: {collectionid: this.$route.params.collectionid}});
                              break;
                          }
                          this.hideModal();
                        });
                    } else {
                      this.$router.push({name: 'Assignments'});
                    }
                  } else {
                    this.hideModal();
                    if (this.$route && ['BookNarrate'].indexOf(this.$route.name) !== -1) {
                      this.$router.push({name: 'BookEdit'});
                    }
                  }
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
        }
      }
    },
    errorAlert: {
      handler(val) {
        this.hasErrorAlert = val.length > 0;
      },
      deep: true
    },
    hasErrorAlert: {
      handler(val) {
        if (val === false) {
          this.errorAlert = '';
        }
      },
      deep: true
    },
    messageAlert: {
      handler(val) {
        this.hasAlert = val.length > 0;
      },
      deep: true
    },
    hasAlert: {
      handler(val) {
        if (val === false) {
          this.messageAlert = '';
        }
      },
      deep: true
    }
  },
  mixins: [api_config, task_controls],
  props: ['listing'],

  mounted() {
        // load intial book
        // this.$router.replace({ path: '/books/' + this.$route.params.bookid })
        if (this.$route.params.hasOwnProperty('bookid')) {
          if (!this.currentBookMeta._id || this.currentBookMeta._id != this.$route.params.bookid) {
            this.loadBook(this.$route.params.bookid);
          }
        }

        this.$root.$on('show-modal', (params) => {this.showModal(params)})
        this.$root.$on('hide-modal', () => {this.hideModal()})
        this.$root.$on('book-reimport-modal', this.evOnReimportModal);
        this.$root.$on('set-error-alert', this.setErrorAlert);
        this.$root.$on('set-alert', this.setAlert);
        this.$root.$on('preloader-toggle', this.onPreloaderToggle);

//         this.loadTTSVoices();
  },

  methods: {

    toggleMetaVisible () {
      let id = this.$store.state.currentBookid
      this.metaAvailable = id
      this.metaVisible = !this.metaVisible
      if (!this.metaAvailable) this.metaVisible = false;

      Vue.nextTick(()=>{
        this.$root.$emit('from-toolbar:toggle-meta');
      })

    },
    hasBookSelected () {
      return !!this.currentBookMeta.bookid
    },
    isEditMode () {
      return this.$route.matched.some(record => {
        return ['edit', 'narrate', 'proofread'].indexOf(record.meta.mode) !== -1;
      })
    },
//     recountRows () {
//       let count = 1
//       if (this.hasBookSelected()) count++
//       if (this.metaVisible) count++
//       this.colCount = count
//     },
    bookImportFinished(result) {

    },

    showAudioeditor() {
      return this.$refs.audioEditor && !this.$refs.audioEditor.isEmpty();
    },
    audioeditorMode() {
      return '-mode-' + (this.$refs.audioEditor ? this.$refs.audioEditor.mode : '');
    },

    showModal(params) {
      this.$modal.show('dialog', params);
    },
    hideModal() {
      this.$modal.hide('dialog');
    },
    reimportBookClose() {
      this.showBookReimport = false;
    },
    evOnReimportModal() {
      if (this.tc_allowEditingComplete()) {
        this.showBookReimport = true;
      }
    },
    getBookid() {
      return this.$store.state.currentBookid
    },
    setErrorAlert(message) {
      this.errorAlert = message;
    },
    setAlert(message) {
      this.messageAlert = message;
    },
    onPreloaderToggle(state, type) {
      if (state) {
        this.preloader = true;
        this.preloaderType = type;
      } else {
        this.preloader = false;
        this.preloaderType = '';
      }
    },

    ...mapActions(['loadBook', 'updateBooksList', 'loadTTSVoices', 'setBlockSelection', 'tc_loadBookTask', 'getCurrentJobInfo'])
  },

  destroyed: function () {
    this.$root.$off('from-bookedit:set-selection', this.listenRangeSelection);
    this.$root.$off('book-reimport-modal', this.evOnReimportModal);
    this.$root.$off('set-error-alert', this.setErrorAlert);
    this.$root.$off('set-alert', this.setAlert);
    this.$root.$off('preloader-toggle', this.onPreloaderToggle);
  }
}
</script>

<style lang='less' src='./books/css/ilm_base.less' scope></style>

<style lang="less">

.modal-dialog {
  margin: 105px auto;
}

#booksarea {
  margin: 0;
  padding:0;
/*  height: 100%;
  padding-top: 43px;*/

  flex-grow: 2;
  display:flex;
  flex-direction: row;
  overflow-y:auto;
  &.narrate {
    overflow-x: auto;
  }

  .metaedit {
    /*flex-grow: 1;
    min-width: 445px;
    max-width: 27%;*/
    width: 445px;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .content-meta-wrapper {
    flex-grow: 2;
    display:flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    .narrate& {
      min-width: 860px;
    }
    .edit& {
      min-width: 700px;
    }

    .toolbar {
      min-height: 36px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      flex-shrink: 0;
      align-items: center;
      box-shadow: 0px 2px 3px 0px rgba(178, 191, 224, 0.53);
      padding-left: 4px;
      margin-bottom: 3px;

      .pull-right {
        min-width: 460px;
        text-align: right;
      }
      .title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .scroll-wrapper {
      flex-grow: 2;
      display: flex;
      flex-direction: row;
      overflow-y: hidden;

      .container-fluid {
        width: 100%;
        overflow-x: hidden;
      }
    }
  }
}


// for book settings:
.-lang-fa, .-lang-ar {
  .ilm-block, /*.content-wrap-footn*/ {
    direction: rtl;
  }

   .-langftn-undefined,
   .-langftn-ar,
   .-langftn-fa  {
     direction: rtl;
   }

}


.-lang-false,
.-lang-en,
.-lang-de,
.-lang-da,
.-lang-cy,
.-lang-es,
.-lang-fr,
.-lang-is,
.-lang-it,
.-lang-ko,
.-lang-ja,
.-lang-nb,
.-lang-nl,
.-lang-pl,
.-lang-pt,
.-lang-ro,
.-lang-ru,
.-lang-sv,
.-lang-tr  {
   .-langftn-undefined   {
     direction: ltr;
   }
}

// for block settings:
.-langblock-en,
.-langblock-de,
.-langblock-da,
.-langblock-cy,
.-langblock-es,
.-langblock-fr,
.-langblock-is,
.-langblock-it,
.-langblock-ko,
.-langblock-ja,
.-langblock-nb,
.-langblock-nl,
.-langblock-pl,
.-langblock-pt,
.-langblock-ro,
.-langblock-ru,
.-langblock-sv,
.-langblock-tr  {
  .ilm-block, .recording-text {
    direction: ltr;
  }
  &.ilm-block {
    direction: ltr;
  }
}
/* Edit mode */
.-langblock-ar,
.-langblock-fa  {
  .ilm-block, .recording-text {
    direction: rtl;
    .content-wrap, .content-wrap-preview, .content-wrap-desc {
      font-family: 'Times New Roman', 'Liberation Serif';
      &.title {
        font-family: 'Times New Roman', 'Liberation Serif';
      }
      &.header {
        &.h1, &.h2, &.h3, &.h4, &.h5 {
          font-family: 'Times New Roman', 'Liberation Serif';
        }
      }
    }
  }
}
/* Display mode */
.-langblock-ar,
.-langblock-fa {
  &.ilm-block, {
    direction: rtl;
  }
}

// for footnote settings:
.-langftn-en,
.-langftn-de,
.-langftn-da,
.-langftn-cy,
.-langftn-es,
.-langftn-fr,
.-langftn-is,
.-langftn-it,
.-langftn-ko,
.-langftn-ja,
.-langftn-nb,
.-langftn-nl,
.-langftn-pl,
.-langftn-pt,
.-langftn-ro,
.-langftn-ru,
.-langftn-sv,
.-langftn-tr  {
  direction: ltr;
}

.-langftn-ar,
.-langftn-fa  {
  direction: rtl;
  font-family: 'Times New Roman', 'Liberation Serif';
}

.alert.top {
  top: 120px;
  p {
    text-align: center;
  }
}
.audio-process-run {

  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 99999;
  background-color: #0000006b;
  background-repeat: no-repeat;
  background-position: center;
  &.preloader-editing-audio {
    background-image: url(/static/preloader-editing-audio.gif);
  }
  &.preloader-save {
    background-image: url(/static/preloader-save.gif);
  }
  &.preloader-align {
    background-image: url(/static/preloader-align.gif);
  }
  &.preloader-loading {
    background-image: url(/static/preloader-loading.gif);
  }
}
.content-process-run {
  height: 150px;
  width: 100%;
  background-repeat: no-repeat;
  background-position: center;

  &.locked-block-cover {
    width: 100%;
    position: absolute;
    height: 100%;
    background-color: #0000006b;
  }
  &.preloader-loading {
    background-image: url(/static/preloader-loading.gif);
  }
  &.preloader-save {
    background-image: url(/static/preloader-save.gif);
  }
  &.preloader-editing-audio {
    background-image: url(/static/preloader-editing-audio.gif);
  }
  &.preloader-align {
    background-image: url(/static/preloader-align.gif);
  }
  &.preloader-audio-positioning {
    background-image: url(/static/preloader-audio-positioning.gif);
  }
}

</style>
