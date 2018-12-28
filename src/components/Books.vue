<template>
  <div id='booksarea'><!-- v-cloak-->
    <div :class="['content-meta-wrapper', metaVisible ? 'meta-visible' : '']">

      <BookEditToolbar v-if="isEditMode()"
      :toggleMetaVisible="toggleMetaVisible"
      :hasBookSelected="hasBookSelected"
      :metaVisible="metaVisible"/>

      <BooksToolbar v-else
      @import_finished="bookImportFinished"
      :toggleMetaVisible="toggleMetaVisible"
      :hasBookSelected="hasBookSelected"
      :metaVisible="metaVisible"/>

      <div class="scroll-wrapper" v-bind:class="'-lang-' + currentBookMeta.language">
        <router-view></router-view>
      </div>

    </div>

    <div class='metaedit' v-if='metaVisible'>
      <book-meta-edit v-if='metaVisible'></book-meta-edit>
    </div>

    <nav :class="['navbar', 'fixed-bottom', 'navbar-light', 'bg-faded', {'hidden': !showAudioeditor()}, audioeditorMode()]" >
      <AudioEditor ref="audioEditor"></AudioEditor>
    </nav>

    <v-dialog :clickToClose="false"/>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
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
import Vue from 'vue';
var modal = require('vue-js-modal');

Vue.use(modal, {dialog: true});


export default {

  name: 'Books',

  data () {
    return {
      metaVisible: false,
      metaAvailable: false,
      //colCount: 1,
      currentBookid: this.$store.state.currentBookid
    }
  },

  components: {
    BooksToolbar,
    BookMetaEdit,
    BookEditToolbar,
    axios,
    superlogin,
    AudioEditor
  },

  computed: {
    ...mapGetters(['bookEditMode', 'currentBook', 'currentBookMeta', 'currentBookCounters']),
  },

  watch: {
//     '$store.state.route.params' (to, from) {
//       // react to route changes...
//       // this.recountRows()
//     }
    'currentBookMeta': {
      handler(val, old_val) {
        if (!old_val._id && this.currentBookMeta && this.currentBookMeta.collection_id) {
          this.$router.replace({ path: '/collections/' + this.currentBookMeta.collection_id + '/' + this.currentBookMeta.bookid });
        } else if (this.metaVisible && !this.currentBookMeta._id) {
          this.metaVisible = false;
          this.metaAvailable = false;
        }
      }
    }
  },
  mixins: [api_config, task_controls],

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

//         this.loadTTSVoices();
  },

  methods: {

    toggleMetaVisible () {
      let id = this.$store.state.currentBookid
      this.metaAvailable = id
      this.metaVisible = !this.metaVisible
      if (!this.metaAvailable) this.metaVisible = false;
    },
    hasBookSelected () {
      return !!this.currentBook
    },
    isEditMode () {
      return this.$route.matched.some(record => {
        return record.meta.mode === 'edit' || record.meta.mode === 'narrate'
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

    ...mapActions(['loadBook', 'loadTTSVoices', 'setBlockSelection'])
  },

  destroyed: function () {
    this.$root.$off('from-bookedit:set-selection', this.listenRangeSelection);
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

  .metaedit {
    flex-grow: 1;
    min-width: 440px;
    max-width: 27%;
    overflow-y: auto;
  }

  .content-meta-wrapper {
    flex-grow: 2;
    display:flex;
    flex-direction: column;

    &.meta-visible {
      max-width: 73%;
    }

    .toolbar {
      min-height: 36px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0px 2px 3px 0px rgba(178, 191, 224, 0.53);
      padding-left: 4px;
      margin-bottom: 3px;
    }

    .scroll-wrapper {
      flex-grow: 2;
      display: flex;
      flex-direction: row;
      overflow-y: hidden;

      .container-fluid {
        width: 100%;
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
  .ilm-block {
    direction: ltr; 
  }
}

.-langblock-ar,
.-langblock-fa  { 
  .ilm-block {
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
}

</style>
