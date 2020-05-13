import Vue from 'vue'
import {get} from 'lodash'
//imagesMap item
const emptyImg = () => {
  return {
    src: '',
    height: 0,
    width: 0,
  }
}

export default {
  namespaced: true,
  state: {
    imagesMap: {}
  },
  getters: {
    //id === blockID
    image: state => id => state.imagesMap[id]? state.imagesMap[id].objectURL : null,
    height: state => id => state.imagesMap[id]? state.imagesMap[id].height : null,
    width: state => id => state.imagesMap[id]? state.imagesMap[id].width : null,
    file: state => id => state.imagesMap[id]? state.imagesMap[id].file : null,
  },
  mutations: {
    addImage(state, payload){
      state.imagesMap = {
        ...state.imagesMap,
        [payload.id]: payload.data
      }
    },
    updateImage(state, payload){
      state.imagesMap[payload.id] = payload.data;
    },
    removeImage(state, id){
      Vue.delete(state.imagesMap, id);
    },
  },
  actions: {
    setImage({commit, getters}, payload){
      if(!getters.image(payload.id)) {
        commit('addImage', payload)
      }else{
        commit('updateImage', payload)
      }
    },
    removeImage({commit}, payload){
      commit('removeImage', payload);
    },
    // saveImage({commit, getters}, payload){
    // TODO here
    // }, {})


  }

};
