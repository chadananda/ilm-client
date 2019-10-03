<template>
  <div :class="['ilm-global-style ilm-book-styles container-fluid', metaStyles]">
    <!--<BookDisplayHeader  @scroll="onScroll" v-hotkey="keymap"/>-->
    <!--<BookTOC />-->
<!--    <template v-for="(blockRid, listIdx) in parlistO.rIdsArray()">

      <book-block-display
        ref="viewBlocks"
        :blockRid = "blockRid"
        :blockO = "parlistO.getBlockByRid(blockRid)"
        :fntCounter = "fntCounter"
        :lang = "meta.language"
        :loaded = "parlistO.getBlockByRid(blockRid) && parlistO.getBlockByRid(blockRid).loaded"
      ></book-block-display>

    </template>-->

    <SvelteBookDisplayInVue
      :number="count"
      :blocks="parlistO.rIdsArray()"
      :parlistO="parlistO"
      :parlist="parlist"
      :lang="meta.language"
      :fntCounter = "fntCounter"
      @magicalclick="handleClick"
      @watch:number="setCount"
    />
    <!--<button @click="handleClick">Increment - {{ count }}</button>-->

  </div>
</template>

<script>
import Vue from 'vue'
import BookDisplayHeader from './BookDisplayHeader'
import BookBlockDisplay   from './BookBlockDisplay';
//import BookTOC from './BookTOC'
import { mapGetters, mapState, mapActions } from 'vuex'
import { BookBlock, setBlockParnum }    from '../../store/bookBlock'

import SvelteBookDisplay from "./BookEdit_Display.svelte";
import toVue from "svelte-adapter/vue";

export default {
  name: 'BookEditDisplay',
  data () {
    return {
      page: 0,
      startId: false,
      fntCounter: 0,
      onScrollEv: false,

      count: 0
    }
  },
  components: {
    BookDisplayHeader, BookBlockDisplay,/*InfiniteLoading,  BookTOC,*/
    SvelteBookDisplayInVue: toVue(SvelteBookDisplay, {}, "div")
  },
  computed: {
      ...mapGetters({
        book: 'currentBook',
        meta: 'currentBookMeta',
        parlist: 'storeList',
        parlistO: 'storeListO'
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
      keymap: function() {
        return {
          // 'esc+ctrl' is OK.
          'ctrl+home': (ev)=>{
            //console.log('ctrl+home');
            let firstRid = this.parlistO.getFirstRid();
            console.log('firstRid', firstRid);
            if (firstRid) {
              let block = this.parlistO.getBlockByRid(firstRid);
              if (block) {
                this.scrollToBlock(block.blockid, true);
              }
            }
          },
          'ctrl+end': (ev)=>{
            //console.log('ctrl+end')
            let lastRid = this.parlistO.getLastRid();
            if (lastRid) {
              let block = this.parlistO.getBlockByRid(lastRid);
              if (block) {
                this.scrollToBlock(block.blockid, true);
              }
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
              this.scrollToBlock(idsArray[jumpIdx], true);
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
              this.scrollToBlock(idsArray[jumpIdx], true);
            }
          },
          'pgup': (ev)=>{
            //console.log('page up');
            ev.preventDefault();
            let prevId = this.parlistO.getInId(this.startId);
            if (prevId && prevId !== this.startId) {
              this.scrollToBlock(prevId, true);
            }
          },
          'pgdn': (ev)=>{
            //console.log('page down');
            ev.preventDefault();
            let nextId = this.parlistO.getOutId(this.startId);
            if (nextId && nextId !== this.startId) {
              this.scrollToBlock(nextId, true);
            }
          },
        }
      }
  },
  methods: {
    ...mapActions([
      'loadBook', 'loadBookBlocks', 'loadPartOfBookBlocks',
      'loopPreparedBlocksChain', 'putNumBlockOBatch', 'setCurrentBookCounters', 'loadBookToc'
    ]),


    handleClick() {
      this.count += 1;
    },
    setCount(n) {
      this.count = n;
    },


    scrollToBlock(blockId, setStartId = false)
    {
      let vBlock = document.getElementById(blockId);
      if (vBlock) {
        if (setStartId) this.startId = blockId;
        vBlock.scrollIntoView();
      }
    },

    onScroll(ev) {
      console.log('onScroll', 'this.onScrollEv', this.onScrollEv);
      if (!this.onScrollEv) {
        //console.time('handleScroll');
        let firstVisibleId = false;
        let visible = false;
        let idsArray = [];
//         for (let blockRef of this.$refs.viewBlocks) {
//           visible = this.checkVisible(blockRef.$refs.viewBlock);
//           if (visible) {
//             if (!firstVisibleId) firstVisibleId = blockRef.blockId;
//             if (this.parlist.has(blockRef.blockId)) {
//               this.parlistO.setLoaded(blockRef.blockId);
//               blockRef.$forceUpdate();
//             }
//             else if (this.parlistO.getBlockByRid(blockRef.blockRid).loaded === false) {
//               this.parlistO.getBlockByRid(blockRef.blockRid).loaded = 'loading';
//               idsArray.push(blockRef.blockId);
//             }
//           }
//         }
//         if (idsArray.length) {
//           //console.log('idsArray', idsArray);
//           this.getBlocks(idsArray)
//           .then((resIdsArray)=>{
//             for (let blockRef of this.$refs.viewBlocks) {
//               if (resIdsArray.indexOf(blockRef.blockId) > -1) {
//                 //blockRef.block = this.parlist.get(blockRef.blockId);
//                 blockRef.$forceUpdate();
//               }
//             }
//           })
//         }
//         //console.log('firstVisibleId', firstVisibleId);
//         if (firstVisibleId !== false && this.$route.params.block !== firstVisibleId) {
//           this.onScrollEv = true;
//           let params = {};
//           for (let p in this.$route.params) {
//             params[p] = this.$route.params[p];
//           }
//           params.block = firstVisibleId;
//           this.$router.push({
//             name: this.$route.name,
//             params: params
//           });
//         }
        //console.timeEnd('handleScroll');
      } else this.onScrollEv = false;
    },

    checkVisible(elm) {
      var rect = elm.getBoundingClientRect();
      var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    },

    getAllBlocks(metaId, startBlock) {
      console.time('getAllBlocks');
      this.loadBookBlocks({bookId: metaId})
      .then((res)=>{
        let scrollId = this.parlistO.idsArray()[0];
        this.parlistO.updateLookupsList(metaId, res);
        console.timeEnd('getAllBlocks');
        console.log('scrollId', scrollId);
        console.log('parlist', this.parlist);
        if (res.blocks && res.blocks.length > 0) {
          res.blocks.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              //if (el.type !== 'par') this.parlistO.setLoaded(el.rid);
            }
            //this.parlistO.setLoaded(el._id);
          });
          console.log('parlist1', this.parlist);
          //this.parlistO.refresh();
//           if (initBlocks.blocks && initBlocks.blocks[0] && initBlocks.meta && initBlocks.blocks[0].rid !== initBlocks.meta.out) {
//             Vue.nextTick(() => {
//               this.handleScroll();
//               this.scrollToBlock(initBlocks.blocks[0].blockid);
//             })
//           }
        }
//         Vue.nextTick(()=>{
//           this.scrollToBlock(scrollId);
//         });
      });
    },
    getBlocks(idsArray) {
      //console.log('getBlocks idsArray', idsArray);
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        let resIdsArray = [];
        if (result && result.rows && result.rows.length > 0) {
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el.blockid)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el.blockid);
              resIdsArray.push(el.blockid);
            } else {
              this.parlistO.setLoaded(el.blockid);
            }
          });
        }
        return Promise.resolve(resIdsArray);
      });
    },
    listenSetNum(bookId, numMask, blockRid) {
      if (bookId) {
        this.putNumBlockOBatch({bookId: bookId, bookNum: numMask, blockRid: blockRid})
        .then((blocks)=>{
//           for (let blockRef of this.$refs.viewBlocks) {
//             //blockRef.blockO = new LookupBlock(this.parlistO.getBlockByRid(blockRef.blockRid));
//             blockRef.$forceUpdate();
//           }
        })
        .catch((err)=>{})
      }
    },
    bookReimported() {
      this.$store.commit('clear_storeList');
      this.$store.commit('clear_storeListO');
      this.$router.push({
        name: 'BookEditDisplay', params: {}
      });
      this.loadBookMounted();
      this.loadBookToc({bookId: this.meta._id, isWait: true});
    },
    loadPreparedBookDown(idsArray) { // mostly first page load

      let startId = idsArray[0] || this.meta.startBlock_id;
      console.log('startId: ', startId);
      //this.freeze('loadBook');
      return this.loopPreparedBlocksChain({ids: idsArray})
      .then((result)=>{
        if (result.rows && result.rows.length > 0) {
          //console.log('loadPreparedBookDown result', result.rows);
          result.rows.forEach((el, idx, arr)=>{
            if (!this.parlist.has(el._id)) {
              let newBlock = new BookBlock(el);
              this.$store.commit('set_storeList', newBlock);
              this.parlistO.setLoaded(el.blockid);
              //this.updateScrollSlider(false);
            }
          });
          if (this.startId === false) {
            this.startId = startId; // first load
            this.parlistO.setStartId(startId);
          }
          //this.unfreeze('loadBook');
          result.blockId = result.rows[result.rows.length-1]._id;
          return Promise.resolve(res);
        } else {
          //this.unfreeze('loadBook');
          return Promise.reject();
        }
      }).catch(err=>{
        //this.unfreeze('loadBook');
        return err;
      });
    },

    loadBookMounted() {
      console.time('loadBookMounted');
      if (this.$route.params.hasOwnProperty('bookid')) {
        let bookid = this.$route.params.bookid;
        if (!this.meta._id || bookid !== this.parlistO.meta.bookid) {
          this.$store.commit('clear_storeList');
          this.$store.commit('clear_storeListO');
          this.loadBook(bookid)
          .then((meta)=>{
            console.log('then meta', meta);

            let startBlock = this.$route.params.block || false;
            this.startId = startBlock;
            let taskType = this.$route.params.task_type || false;

            console.log('startId', this.$route.params.block, this.startId);

            return this.loadPartOfBookBlocks({
              bookId: this.$route.params.bookid,
              block: startBlock,
              taskType: taskType
            }).then((answer)=>{
              this.parlistO.setLookupsList(answer.meta.bookid, answer);
              if (this.startId == false) this.startId = this.parlistO.idsArray()[0];
              this.loopPreparedBlocksChain({ids: this.parlistO.idsArray()})
              .then((result)=>{
                console.log('result', result);
                if (result.rows && result.rows.length > 0) {
                  result.rows.forEach((el, idx, arr)=>{
                    if (!this.parlist.has(el._id)) {
                      let newBlock = new BookBlock(el);
                      this.$store.commit('set_storeList', newBlock);
                      this.parlistO.setLoaded(el.blockid);
                    } else {
                      this.parlistO.setLoaded(el.blockid);
                    }
                  });
                }
//                 for (let blockRef of this.$refs.viewBlocks) {
//                   blockRef.$forceUpdate();
//                 }
                console.timeEnd('loadBookMounted');
                this.getAllBlocks(this.parlistO.meta.bookid, startBlock);
              });
            });
          })
        }
        else {
          if (this.$route.params.block) {
            if (this.$route.params.block!=='unresolved') {
              this.onScrollEv = true;
              this.startId = this.$route.params.block || false;
              this.scrollToBlock(this.$route.params.block);
              //console.timeEnd('loadBookMounted');
            } else {
              this.startId = this.parlistO.idsArray()[0] || false;
            }
          } else {
            this.startId = this.parlistO.idsArray()[0] || false;
          }
        }
      }
    }
  },
  mounted: function() {
      //console.log('mounted');
      this.loadBookMounted();
      this.$root.$on('from-meta-edit:set-num', this.listenSetNum);
      this.$root.$on('book-reimported', this.bookReimported);
      this.$root.$on('for-bookedit:scroll-to-block', this.scrollToBlock);
  },
  beforeDestroy:  function() {
    this.$root.$off('from-meta-edit:set-num', this.listenSetNum);
    this.$root.$off('book-reimported', this.bookReimported);
    this.$root.$off('for-bookedit:scroll-to-block', this.scrollToBlock);
  },
  watch: {
    '$route' (toRoute, fromRoute) {
      //console.log('$route', toRoute, fromRoute, this.onScrollEv);
      if (!this.onScrollEv && toRoute.params.hasOwnProperty('block')) {
        if (toRoute.params.block !== 'unresolved') {
          this.scrollToBlock(toRoute.params.block);
        } else {
          //TODO add method to find unresolved
          this.onScrollEv = true;
          this.$router.push({
            name: 'BookEditDisplay',
            params: { }
          });
        }
      }
      else this.onScrollEv = false;
    }
  },
}
</script>

<style lang="less" scoped>
.container-fluid {
  padding-top: 15px;
  overflow-y: auto;
}
</style>
