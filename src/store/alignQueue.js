
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(process.env.LIVE_QUERY_URL);

class AlignQueue {
  constructor(store) {
    this.bookid = null;
    this.store = store;
  }
  
  startWatch(bookid, callback) {
    this.bookid = bookid;
    
    let api_url = process.env.ILM_API + '/api/v1/align_queue/' + this.bookid;
    axios.get(api_url, {})
      .then(response => {
        if (response.status == 200) {
          //this.store.commit('set_aligning_blocks', response.data);
          callback.call(this, response.data);
        }
        socket.emit('start-watch', {class: 'alignQueue', params: {bookid: this.bookid}});
        return Promise.resolve();
      })
      .catch(err => Promise.reject(err));
    
    socket.on('data-change', (data) => {
      //console.log(data);
      callback.call(this, data);
    });
  }
  
  stopWatch() {
    if (socket.connected) {
      socket.disconnect();
    }
  }
  
  setAligningBlocks(blocks) {
    let oldBlocks = this.store.state.aligningBlocks;
    let checks = [];
    if (oldBlocks.length > 0) {
      oldBlocks.forEach(b => {
        let _b = blocks.find(bb => bb._id == b._id);
        if (!_b) {
          let blockStore = this.store.state.storeList.get(b._id);
          if (blockStore) {
            //blockStore.content+=' realigned';
            checks.push(this.store.getBlock(b._id)
              .then(block => {
                blockStore._rev = block._rev;
                blockStore.content = block.content;
                blockStore.setAudiosrc(block.audiosrc, block.audiosrc_ver);
                if (blockStore.footnotes && blockStore.footnotes.length > 0 &&
                        block.footnotes && block.footnotes.length > 0) {
                  block.footnotes.forEach((f, idx) => {
                    if (f.audiosrc && blockStore.footnotes[idx]) {
                      blockStore.setAudiosrcFootnote(idx, f.audiosrc, f.audiosrc_ver);
                      blockStore.setContentFootnote(idx, f.content);
                    }
                  });
                }
                return Promise.resolve();
              })
              .catch(err => {
                console.log(err);
                return Promise.resolve();
              })
            );
          }
        }
      });
    }
    Promise.all(checks)
      .then(() => {
        if (oldBlocks.length != blocks.length) {
          this.store.getAudioBook();
        }
        this.store.commit('set_aligning_blocks', blocks);
        if (checks.length > 0) {
          this.store._setNotMarkedAsDoneBlocksCounter();
          this.store.recountApprovedInRange();
        }
      })
  }
}
export {
  AlignQueue
}