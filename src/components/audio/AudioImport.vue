<template>
  <div>
  <modal name="import-audio" :resizeable="false" :clickToClose="false" height="auto">
    
          <div class="modal-header">

            <slot name="header">
              <div class="header-title">
                <label class="header-h"><img src='/static/audiostack.png' class='audio-logo'></label>
                <h3 class="header-h">Import New Audiobook</h3></div>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close')" v-if="!isUploading">
                <i class="fa fa-times-circle-o" aria-hidden="true"></i>
                </button>

            </slot>
          </div>
          <div class="modal-body">

          <form id="audio_select" v-show="!isUploading" enctype="multipart/form-data" @submit.prevent>

          <div class="modal-body clearfix">



            <slot name="body">

            <img class="bookcover" :src="book.coverimg" />
            <h3 class="booktitle"> For: <i>{{book.title}}</i></h3>
            <h4 class="bookauthor"> by {{book.author.join(',')}} </h4>

                
                <div v-if="audiobook._id && allowDownload" class="col-sm-12">
                  <h3>
                  Original audio
                  </h3>
                  <div class="col-sm-12">
                    <h4>Uploaded by {{audiobook.creator}} at {{dateFormated(audiobook.createdAt, 'd F')}}</h4>
                  </div>
                  <div class="col-sm-8">
                    <h5>{{audiobook.importFiles.length}} files total</h5>
                  </div>
                  <div class="col-sm-4">
                    <!-- <a class="download-audio-link" :href="SERVER_URL + audiobook.url"><i class="fa fa-download"></i>Download</a> -->
                    <a class="download-audio-link" :href="API_URL + 'books/' + book.bookid + '/audiobooks/' + audiobook._id + '/download'" target="blank"><i class="fa fa-download"></i>Download</a>
                  </div>
                </div>
                
                <br><br><br>

                <h4> Book Audio File </h4>

                <div class="col-sm-12">
                  <div class="col-sm-7">
                    <div class="input-group">
                      <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                      <input type="text" class="form-control" placeholder="URL" v-model="audioURL" />
                    </div>
                  </div>
                  <div class="col-sm-5">
                    or &nbsp;&nbsp;&nbsp;
                    <dropzone id="audio-dropzone" ref="uploadDropzone" 
                      :options="dropzoneOptions" 
                      @vdropzone-file-added="onAudioFileChange"
                      @vdropzone-total-upload-progress="onUploadProgress"
                      @vdropzone-success="onUploadSuccess"
                      @vdropzone-complete="onUploadComplete"
                      @vdropzone-error="onUploadError"
                      @vdropzone-queue-complete="onUploadFinished">
                      Browse
                  </dropzone>
                  </div>
                  <span class="help-block"> &nbsp; &nbsp; Audio file, ZIP files or playlist </span>
                  <span v-if="$refs.upload">
                  {{$refs.upload.uploaded}}
                  </span>
                  <span><input type="checkbox" id="checkbox" v-model="autoAlign"> Align automatically </span>
                </div>

                <br><br><br><br>
                
                <ul id="audioFiles">
                  <li v-for="file in audioFiles">
                    {{ file.name }} - {{ humanFileSize(file.size, true) }}
                  </li>
               </ul>
                <button class="btn btn-primary modal-default-button" @click="onFormSubmit"
                :class="{disabled : saveDisabled}">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Audio
                </button>

            </slot>

          </div>

          </form>
          <div id='uploadingMsg' v-show='isUploading'>
             <h2>{{uploadProgress}}&nbsp;<i v-if='!uploadFinished' class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i></h2>
             <ul id="audioFiles" v-if="!uploadFinished">
                <li v-for="file in audioFiles">
                  {{ file.name }} - {{ file.progress ? file.progress : 0 }}%
                </li>
             </ul>
            <div v-for="err in uploadErrors" class="upload-error">{{err.error}}</div>
            <div v-if="uploadFinished">
              <button class="btn btn-default" v-on:click="$emit('closeOk')">OK</button>
            </div>
          </div>
          </div>
  </modal>
    <modal name="duplicate-files-warning" :resizeable="false" :clickToClose="false" height="auto">
        <div class="modal-header"></div>
        <div class="modal-body">
          <div v-if="uploadFilesDuplicates[0]">
            {{uploadFilesDuplicates[0].name}} already exists. Do you want to replace it?
          </div>
        </div>
        <!-- custom buttons -->
        <div class="modal-footer">
          <button type="button" class="btn btn-default" @click="cancelDuplicateAudio()">Cancel</button>
          <button type="button" class="btn btn-confirm" @click="replaceDuplicateAudio()">Replace</button>
        </div>
      </modal>
  </div>

</template>


<script>
import Vue from 'vue'
import api_config from '../../mixins/api_config.js'
import {dateFormat} from '../../filters';
import v_modal from 'vue-js-modal';
import dropzone from 'vue2-dropzone';
import {mapGetters, mapActions} from 'vuex';
Vue.use(v_modal, { dialog: true, dynamic: true });

export default {
  data() {
    return {
      isUploading: false,
      uploadFiles: 0,
      uploadProgress: "Uploading Files...",
      audioURL: '',
      audioFiles: [],
      autoAlign: false,

      file_name_book : '',
      file_name_audio : '',
      flag_book_browse : false,
      flag_audio_browse : false,
      type_book : '',
      auth: this.$store.state.auth,
      uploadFinished: false,
      formData: new FormData(),
      uploadFilesDuplicates: [],
      confirmedDuplicates: [],
      uploadErrors: [],
      dropzoneOptions: {
        url: this.API_URL + 'books/' + this.book.bookid + '/audiobooks/chunk', 
        chunking: true, 
        chunkSize: 1024 * 1024, 
        autoProcessQueue: false, 
        createImageThumbnails: false, 
        headers: {'Authorization': 'Bearer ' + this.$store.getters.auth.getSession().token + ':' + this.$store.getters.auth.getSession().password}, 
        dictDefaultMessage: '<label class="btn btn-default" for="start-file-choose"><i class="fa fa-folder-open-o" aria-hidden=\"true\" id=\"start-file-choose\"></i>&nbsp;Browse&hellip;</label>',
        forceChunking: true,
        maxFilesize: 1024 * 1024 * 10
      },
      choosingFile: false
    }
  },
  mounted: function () {
    this.dropzoneOptions.url = this.API_URL + 'books/' + this.book.bookid + '/audiobooks/chunk';
    this.dropzoneOptions.headers = {'Authorization': 'Bearer ' + this.$store.getters.auth.getSession().token + ':' + this.$store.getters.auth.getSession().password};
    this.showModal('import-audio');
  },
  components: {
    Vue, dropzone
  },
  mixins: [api_config],
  props: {
    'book': {
      type: Object,
      default: {}
    },
    'multiple': {
      type: Boolean,
      default: true
    },
    'importTask': {
      type: Object,
      default: () => {return {}}
    },
    'allowDownload': {
      type: Boolean,
      default: true
    }
  },
  computed: {
    currentBook: function () {
      return this.$store.getters.currentBook
    },
    saveDisabled: function() {
      return (this.uploadFiles === 0 && this.audioURL.length == 0)
    },
    ...mapGetters({
      audiobook: 'currentAudiobook'
    })
  },
  methods: {
    formReset(){
      this.isUploading= false
      this.audioURL= ''
      // clear formData
      let entries = this.formData.entries()
      for(let pair of entries) this.formData.delete(pair[0])
      this.uploadFiles = 0
    },

    onAudioFileChange (file) {
      //console.log(arguments);
      //return;
      //let fieldName = e.target.name
      let fileList = [file];//e.target.files || e.dataTransfer.files//e.file
      if (!this.multiple) {
        this.audioFiles = [];
        this.formData = new FormData();
      }
      for(let file of fileList) {
          let exist = false;
          if (this.audiobook._id && this.audiobook.importFiles) {
            exist = this.audiobook.importFiles.find(_f => {
              return _f.origName == file.name || _f.group_id === file.name;
            });
          }
          this.addFileToUpload(file);
          /*
          if (exist) {
            //this.uploadFilesDuplicates.push(file);
          } else {
            let existInCurrent = this.audioFiles.find(_f => {
              return _f.name == file.name;
            })
            if (!existInCurrent) {
              this.addFileToUpload(file);
            }
          }
          */
      }
      
      /*Array
        .from(Array(fileList.length).keys())
        .map(x => {
          this.formData.append(fieldName, fileList[x], fileList[x].name);
          //console.log('Field name: ', fieldName)
          this.uploadFiles++
        });*/
    },
    addFileToUpload(file) {
      this.audioFiles.push({name: file.name, size: file.size});
      this.formData.append('audio_import', file, file.name);
      this.uploadFiles++
    },

    onFormSubmit () {
      if (this.saveDisabled) {
        return '';
      }
      this.uploadFinished = false;
      this.isUploading = true;
      if (this.audioFiles.length === 0 && this.audioURL) {
        this.onUploadFinished();
      } else {
        this.$refs.uploadDropzone.processQueue();
      }

    },
    humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if(Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si
            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+' '+units[u];
    },
    closeForm() {
      let self = this
      setTimeout(function(){ self.formReset(); self.$emit('close');  }, 1000)
    },
    dateFormated(date, format) {
      return dateFormat(date, format)
    },
    cancelDuplicateAudio() {
      let file = this.uploadFilesDuplicates.shift();
      //console.log(file, this.$refs.uploadDropzone.getQueuedFiles(), this.$refs.uploadDropzone)
      this.$refs.uploadDropzone.removeFile(file);
      //console.log(this.$refs.uploadDropzone.getQueuedFiles());
    },
    replaceDuplicateAudio() {
      this.addFileToUpload(this.uploadFilesDuplicates.shift());
    },
    showModal(name) {
      this.$modal.show(name);
    },
    hideModal(name) {
      this.$modal.hide(name);
    },
    onUploadProgress() {
      //console.log(arguments)
      let total = 0;
      this.$refs.uploadDropzone.getUploadingFiles().forEach(f => {
        let processed = 0;
        f.upload.chunks.forEach(c => {
          if (c.status === 'success') {
            processed++;
          }
        });
        processed = Math.round(processed * 100 / f.upload.totalChunkCount);
        //console.log(f.name + ' ' + f.upload.progress, f.status, processed, f);
        let af = this.audioFiles.find(_af => _af.name === f.name);
        if (af) {
          af.progress = processed;
          af.uuid = f.upload.uuid;
          total+= processed;
        } else {
          
        }
      });
      this.audioFiles.forEach(af => {
        if (af.progress === 100) {
          total+=100;
        }
      });
      this.uploadProgress = Math.round(total / this.audioFiles.length) + '%';
    },
    onUploadFinished() {
      //console.log(arguments)
      //this.uploadFinished = true;
      //this.isUploading = false;
      let toUpload = {
        files: []
      };
      this.audioFiles.forEach(af => {
        if (af.ready === true) {
          toUpload.files.push(af);
        }
      });
      let api_url = this.API_URL + 'books/' + this.book.bookid + '/audiobooks/chunks';
      let api = this.$store.state.auth.getHttp()
      if (this.audioURL.length) toUpload.url = this.audioURL;

      //this.isUploading = true
      if (!this.audiobook._id) {
        // first upload by editor
        api.post(api_url, toUpload, {}).then((response) => {
          if (response.status===200) {
            this.uploadFinished = true
            this.uploadProgress = ''
            this.uploadErrors = [];
            if (response.data.audio && typeof response.data.audio._id !== 'undefined') {
              this.uploadProgress = response.data.newFilesCount + " Audiofiles processing"
              this.$emit('audiofilesUploaded');
            }
            if (response.data.errors) {
              if (Array.isArray(response.data.errors)) {
                this.uploadErrors = response.data.errors;
              }
            }
            if (response.data.audio && typeof response.data.audio._id !== 'undefined') {
              api.put(this.API_URL + 'task/' + this.book.bookid + '/audio_imported', {})
                .then((link_response) => {
                  //vm.closeForm(response)
                  this.tc_loadBookTask(this.book.bookid);
                })
                .catch((err) => {
                  //vm.closeForm(response)
                })
            } else {
              //vm.closeForm(response)
            }
          } else {
            // not sure what we should be doing here
            this.formReset()
          }
        }).catch((err) => {
          console.log('error: '+ err)
          this.formReset()
          setTimeout(() => { this.$emit('close') }, 1000)
        });
      } else {
        // upload updated file by engineer or another file by editor
        //vm.audiobook.importFiles = [];
        //this.formData.append('audiobook', JSON.stringify(vm.audiobook));
        toUpload.autoAlign = this.autoAlign;
        api.post(api_url + '/' + this.audiobook._id, toUpload, {}).then((response) => {
          if (response.status===200) {
            // hide modal after one second
            this.uploadFinished = true
            this.uploadProgress = ''
            this.uploadErrors = []
            if (response.data.audio && typeof response.data.audio._id !== 'undefined') {
              this.uploadProgress = response.data.newFilesCount + " Audiofiles processing"
              //this.$emit('audiofilesUploaded', response.data.audio);
              this.getAudioBook();
              if (this.importTask._id) {
                api.put(this.API_URL + 'task/' + this.importTask._id + '/audio_imported', {})
                  .then((link_response) => {

                  })
                  .catch((err) => {

                  })
              } else {

              }
            }
            if (response.data.errors) {
              if (Array.isArray(response.data.errors)) {
                this.uploadErrors = response.data.errors;
              }
            }
          } else {
            // not sure what we should be doing here
            this.formReset()
          }
        }).catch((err) => {
          console.log('error: '+ err)
          this.formReset()
          setTimeout(() => { this.$emit('close') }, 1000)
        });
      }
    },
    onUploadSuccess() {
    },
    onUploadComplete(file) {
      let f = this.audioFiles.find(af => af.name === file.name);
      if (f) {
        f.ready = file.status === 'success';
        f.progress = 100;
      }
    },
    onUploadError() {
      console.log(arguments);
    },
    ...mapActions(['getAudioBook', 'tc_loadBookTask'])

  },
  watch: {
    'uploadFilesDuplicates.length': {
      handler(val, oldVal) {
        if (val !== 0 && oldVal === 0) {
          this.showModal('duplicate-files-warning');
        } else if (val === 0 && oldVal !== 0) {
          this.hideModal('duplicate-files-warning');
        }
      }
    }
  }
}
</script>


<style scoped>

div.coverimg {
    width: 80px;
    padding:0; padding-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    padding-bottom: 10px;}
  img.coverimg {
    max-width: 60px;
  }
  .author,  h4.title {margin: 0; padding-bottom: 10px; }
  .subtitle {margin-top:0;}

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 500px;
  margin: 0px auto;
  padding: 0px 0px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #2e6da4;
   /*#42b983;*/
}

.modal-header {
  padding-left: 0px;
  padding-right: 0px;
  padding-bottom:5px;
}

.audio-logo {
  /*width:50px;
  height:50px;*/
}

.modal-body {
  margin: 0px 0;
}

.modal-footer {

}

.modal-default-button {
  float: right;
}

.import-title {
  padding-left: 10px;
  padding-right:10px;
  border-bottom : solid 1px lightgrey;
  margin-bottom : 10px;
}

.file_open {
  opacity: 0;
  position: absolute;
  top: 5px;
  left: -80px;
  cursor:pointer;
}

#btn_open {
  cursor: pointer;
}

.header-title {
  padding-left: 10px;
  display: inline;
}

.header-h {
  display: inline;
  position: relative;
  width: 60px; height: 50px;
}

.header-h img {
  padding-bottom: 10px;
  postion: absolute !important;
  top:0; left: 0;
  width: 40px;
}

.info-field {
  padding: 10px;
}

.dropbox {
  border: solid 1px lightgrey;
  width: 100%;
  height: 100px;
}


/* after visibility */
.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}


.fa:hover {
  color: inherit;
}

button.close i.fa {font-size: 18pt; padding-right: .5em;}
.booktitle {font-family: times; padding-top:0; margin-top:0;}
.bookauthor {font-family: times; color: gray; text-indent: 2.5em}
.bookcover {float: right; max-width: 100px; max-height: 140px;
  border-radius: 2px; margin: 10px;
  box-shadow: 0px 1px 3px 2px rgba(100,100,100,.25);
  padding-top:0; margin-top:0;
}

#uploadingMsg {text-align: center; padding-bottom: 1em;}
#uploadingMsg h2 i {font-size: 24pt; color: silver}

.download-audio-link {
    display: inline-block;
    background-color: #9fc5f8;
    padding: 10px;
    color: white;
}
#audioFiles {
  max-height: 80px;
  overflow-y: scroll;
}

.upload-error {
    font-size: 20px;
    color: red;
}

</style>
<style>
.dz-preview.dz-file-preview {
  display: none;
}
.vue-dropzone.dropzone.dz-clickable {
    display: inline-block;
}
</style>
