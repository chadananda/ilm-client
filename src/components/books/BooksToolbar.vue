<template>
<div class="toolbar">

  <h3><img src='/static/bookstack_crop.svg' class='bookstack'/>
    {{ bookCount() }} Book{{ (bookCount()===1 ? '':'s')}}
  </h3>

  <div class="pull-right">
  <!-- Edit Button -->
  <button v-if="hasBookSelected()"
    @click='displayBook' class='btn btn-default'>
    <i class="fa fa-pencil fa-lg"></i>  Display Book
  </button>  &nbsp;

  <!-- Meta Filter -->
  <input type="text" @keyup="booksFilterChange" class="form-control" placeholder="Filter"></input> &nbsp;

  <template v-if="adminOrLibrarian">
    <select @change="booksTypeChange" v-model="bookFilters.jobStatus">
      <option value="">Not filtered</option>
      <option value="active">Active</option>
      <option value="archived">Archived</option>
      <option value="completed">Completed</option>
      <option value="suspended">Suspended</option>
    </select> &nbsp;
  </template>

  <!-- Language Dropdown -->
  <select @change="booksLanguageChange">
    <option value="">Any language</option>
    <option v-for="(name, code) in languages" :value="code">{{name}}</option>
  </select>

  <button v-if='hasBookSelected()' class='btn btn-default btn-meta' @click='toggleMetaVisible'><i :class="[metaVisible ? 'fa-chevron-right': 'fa-chevron-left', 'fa fa-lg collapsebtn']" aria-hidden="true"></i>Details</button>

  </div>

  <!-- Import Books Modal Popup -->
  <BookImport v-if="showImportBooksModal"
  @close_modal="importBooksModalClose" />

</div>
</template>

<script>
import { mapGetters } from 'vuex'
import BookImport from './BookImport'
import { Languages } from "../../mixins/lang_config.js"

export default {

  name: 'toolbar',

  components: {
    BookImport
  },

  data () {
    return {
      filterStr: '',
      showImportBooksModal: false,
      languages: Languages
    }
  },

  props: [
    'hasBookSelected',
    'toggleMetaVisible',
    'metaVisible'
  ],

  computed: mapGetters([
    'isLoggedIn',
    'isAdmin',
    'isEditor',
    'isLibrarian',
    'allowBookEditMode',
    'allBooks',
    'adminOrLibrarian',
    'bookFilters'
  ]),

  methods: {
    booksFilterChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {filter: el.target.value})
    },
    booksLanguageChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {language: el.target.value})
      // console.log("language: "+el.target.value)
    },
    booksTypeChange (el) {
      this.$store.commit('SET_CURRENTBOOK_FILTER', {jobStatus: el.target.value})
    },
    bookCount () {
      if (this.allBooks && this.allBooks.length) {
        let filtered = this.allBooks
                .filter(m => !m.collection_id)
                .filter(m => m.importStatus);
        return filtered.length;
      } else {
        return 0;
      }
    },
    displayBook () {
      this.$router.push('/books/' + this.$store.state.currentBookMeta.bookid + '/display')
    },
    importBook () {
      console.log('event ok')
      this.showImportBooksModal = true
    },
    importBooksModalClose(uploaded) {
      this.showImportBooksModal=false
      this.$emit('import_finished', uploaded)
    }
  }
}
</script>


<style lang="less" scoped>


h3 {
  margin: 0;
  padding-top: 0;
  display: inline-block;
}

select {
  padding: 3px; height: 34px;
}

input.form-control {
  height: 34px;
}

.btn {
  margin-right: .5em;
  vertical-align: top;

  &.btn-meta {
     margin-left: 40px;
    &:focus {
      background: rgb(255, 255, 255);
      border-color: rgb(204, 204, 204);
    }
    .collapsebtn {
      margin-right: 5px;
    }
  }
}


button:hover {
  color: darkgreen;
  background: #F0FFF0
}

img.bookstack {
  width: 30px;
  opacity: .75
}

input {width: 8em}

.form-control {display: inline}

</style>
