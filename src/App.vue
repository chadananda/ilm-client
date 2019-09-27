<template>
  <div id="app">
    <MainMenu v-if="isLoggedIn"></MainMenu>
    <router-view v-if="isLoggedIn"></router-view>
    <Login v-if="!isLoggedIn"></Login>
    <!-- <CanvasAbsolute/> -->
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import MainMenu from './components/MainMenu'
import Login from './components/login'

export default {

  name: 'App',

  components: {
    MainMenu, Login
    // , CanvasAbsolute
  },

  computed: {
      ...mapGetters(['isLoggedIn']),
  },

  watch: {
    '$route' () {
      this.$root.$emit('for-audioeditor:force-close');
      let mode = this.$route.meta && this.$route.meta.mode ? this.$route.meta.mode : null;
      this.$store.commit('set_book_mode', mode);
      if (this.$route.params.hasOwnProperty('bookid')) {
        this.loadBook(this.$route.params.bookid)
      } else {
        this.loadBook(false);
      }
      if (this.$route.params.hasOwnProperty('collectionid')) {
        this.loadCollection(this.$route.params.collectionid);
      } else {
        this.loadCollection(false);
      }
      if (this.$route.params.hasOwnProperty('libraryid')) {
        this.loadLibrary(this.$route.params.libraryid);
      } else {
        this.loadLibrary(false);
      }
    }
  },

  created () {
    let mode = this.$route.meta && this.$route.meta.mode ? this.$route.meta.mode : null;
    this.$store.commit('set_book_mode', mode);
  },

  methods: {
    ...mapActions(['loadBook', 'updateBooksList', 'loadCollection', 'loadLibrary'])
  }
}
</script>

<style lang="less">
  html, body, #app {
    height: 100%;
    min-width: 1060px;
    overflow: hidden;
  }
  #app {
    display:flex;
    flex-direction: column;
  }

  .area-wrapper {
    flex-grow: 2;

/*    display:flex;
    flex-direction: row;*/
    overflow-y:auto;

    padding-top: 0px;

    margin-bottom: 0px;
    padding-bottom: 0px;
  }

</style>
