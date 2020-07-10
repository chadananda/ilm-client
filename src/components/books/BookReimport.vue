<template>
  <transition name="modal">
    <div class="modal-mask" ><!--@click="$emit('close_modal')"-->
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">
            <div class="header-title">
              <img src='/static/bookstack.svg' class='book-logo'> <h3 class="header-h">Import Book</h3>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
                <i class="fa fa-times-circle-o" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="modal-body clearfix">
          <form id="book_select" enctype="multipart/form-data" @submit.prevent ref="book_select">

            <div class="row">
              <!--<div class="col-sm-5">
                <div class="form-group">
                  <label for="booktype">Book Type:</label>

                  <select :class="['form-control', {'alert alert-warning': errors.bookType}]" id="booktype" v-model="bookType" @change="validate">
                    <option v-for='(type, index) in bookTypes' v-bind:value="index">{{type}}</option>
                  </select>
                  <span v-if="errors.bookType" class="alert alert-warning">{{errors.bookType}}</span>

                </div>
              </div>-->
              <!-- <div class="col-sm-7">
                <div class="input-group">
                  <span class="input-group-addon"><i class="fa fa-globe"></i></span>
                  <input type="text" class="form-control" placeholder="URL" v-model="bookURL"/>
                </div>
              </div> -->
              <div class="col-sm-4 browse-btn">
                <!-- or &nbsp;&nbsp;&nbsp; -->
                <label class='btn btn-default' type="file">
                  <i class="fa fa-folder-open-o" aria-hidden="true"></i> &nbsp; Browse&hellip;

                  <input name="bookFiles" type="file" v-show="false" accept="text/*,application/zip,.docx,.md" multiple="false" @change="onFilesChange($event)">

                </label>
              </div>

              <div class="col-sm-8">
                <div v-if="uploadFile">
                {{ uploadFile.name }} - {{ humanFileSize(uploadFile.size, true) }}
                </div>
              </div>

            </div><!--<div class="row">-->
            <div class="row">
              <div class="col-sm-12" v-show='!hasUploadError'>
                <span class="help-block">Book file or ZIP with files and images, Docx or Markdown with text</span>
              </div>
              <div class="col-sm-12" v-show='hasUploadError'>
                <div class="alert alert-danger">
                  <button type="button" class="close" @click="closeAlert"><span>×</span></button>
                  <i aria-hidden="true" class="fa fa-exclamation-triangle alert-icon-float-left"></i>
                  <div class="alert-text-float-right" v-if="bookUploadCommonError">
                    <p>{{bookUploadCommonError}}.</p>
                  </div>
                  <div class="alert-text-float-right" v-if="bookUploadCheckError.length>0">
                    <p v-for='(errMsg) in bookUploadCheckError' v-html="errMsg+'.'"></p>
                  </div>
                  <div class="clearfix"></div>
                </div>
              </div>
            </div><!--<div class="row">-->

            <div class="row">
              <div class="col-sm-12 pull-right" v-show='!isUploading'>
                <button class="btn btn-primary modal-default-button" @click='onFormSubmit' :class="{disabled : saveDisabled}">
                  <i class="fa fa-plus" aria-hidden="true"></i> &nbsp;  Import Book
                </button>
              </div>
              <div class="col-sm-12" id='uploadingMsg' v-show='isUploading'>
                <h2> {{uploadProgress}}   &nbsp; <i class="fa fa-refresh fa-spin fa-3x fa-fw" aria-hidden="true"></i> </h2>
              </div>
            </div><!--<div class="row">-->

          </form>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>


<script>

  import axios from 'axios'
  import api_config from '../../mixins/api_config.js'

  const API_URL = process.env.ILM_API + '/api/v1/'
  import { mapGetters, mapActions } from 'vuex'

  export default {
    data() {
      return {
        isUploading: false,
        bookType: '',
        bookTypes: {
          gutenberg_html: 'Gutenberg HTML',
          ilm_ocean_html: 'ILM/Ocean HTML',
          gutenberg_zip: 'Gutenberg ZIP',
          ilm_zip: 'ILM ZIP'
        },
        uploadFile: false,
        formData: new FormData(),
        uploadProgress: "Uploading Files...",
        bookUploadCommonError: false,
        bookUploadCheckError: [],
        fileValue: '',
        errors: {},
        errorsMsgKeys: {
          duplicates: '<b>Found duplicates</b>',
          wrongVals: '<b>Found wrong id\'s</b>'
        }
      }
    },
    mixins: [api_config],
    props: {
      bookId: {
        type: String,
        default: false
      }
    },
    components: {
      alert
    },
    mounted() {

    },
    computed: {
      hasUploadError: function() {
        return this.bookUploadCheckError.length > 0 || this.bookUploadCommonError;
      },
      selectedBookType: function () {
        return this.bookTypes[this.bookType];
      },
      saveDisabled: function () {
        //return (!this.bookURL && !this. bookFile);
        //console.log(this.uploadFiles.bookFiles, this.bookURL.length)

        return (this.uploadFile == false)
      },
      ...mapGetters(['liveDB'])
    },
    methods: {
      formReset() {
        this.isUploading = false
        // clear formData
        let entries = this.formData.entries()
        for (let pair of entries) {
          this.formData.delete(pair[0])
        }
        this.$refs.book_select.reset();
        this.uploadFile = false;
      },
      closeAlert() {
        this.bookUploadCommonError = false;
        this.bookUploadCheckError = [];
      },
      onFilesChange(e) {
        this.closeAlert();
        let fileList = e.target.files || e.dataTransfer.files
        this.formData = new FormData();
        this.formData.append('book', fileList[0], fileList[0].name);
        this.uploadFile = fileList[0];
      },

      onFormSubmit() {
        this.closeAlert();
        this.validate();
        if (Object.keys(this.errors).length) {
          return false;
        }
        this.liveDB.onBookReimport();

        this.formData.append('type', this.bookType);

        var config = {
          onUploadProgress: (progressEvent) => {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.uploadProgress = "Uploading Files... " + percentCompleted + "%";
          }
        }

        this.isUploading = true
        this.reimportBook({data: this.formData, config})
          .then((response) => {
          if (response.status === 200) {
            // hide modal after one second
            this.uploadProgress = "Upload Successful"
            this.$root.$emit('book-reimported');
            this.closeForm()
          } else {
            // not sure what we should be doing here
            this.closeForm()
          }
        }).catch((err) => {
          //console.log('reimportBook Err:', err.response)
          if (err.response.data.message && err.response.data.message.length) {
            this.bookUploadCommonError = err.response.data.message;
            setTimeout(() => {
              this.$emit('close_modal')
            }, 5000)
          } else if (Array.isArray(err.response.data)) {
            this.bookUploadCheckError = [];
            err.response.data.forEach((msg)=>{
              if (typeof msg.error == 'object') {
                for (var prop in msg.error) {
                  if (Array.isArray(msg.error[prop]) && msg.error[prop].length) {
                    this.bookUploadCheckError.push(`${this.errorsMsgKeys[prop] ? this.errorsMsgKeys[prop] : prop}: ${(JSON.stringify(msg.error[prop])).split(',').join(', ').replace(/(^\[|\]$)/g, '')}`)
                  }
                }
              } else {
                this.bookUploadCheckError.push(`Error: ${msg.error}`);
              }
              this.bookUploadCheckError.reverse();
            })
          }
          this.formReset()
          /*setTimeout(function () {
            vu_this.$emit('close_modal')
          }, 5000)*/
        });
      },
      closeForm() {
        setTimeout(() => {
          this.formReset()
          this.$emit('close_modal')
        }, 1000)
      },
      humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
          return bytes + ' B';
        }
        var units = si
                ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
                : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
          bytes /= thresh;
          ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
      },
      validate() {
        //if (this.bookType === '') {
        //  this.errors['bookType'] = 'Required';
        //} else {
          this.errors['bookType'] = false;
          delete this.errors['bookType'];
        //}
      },
      ...mapActions(['reimportBook'])
    },
    watch: {

    }
  }
</script>


<style scoped>

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

  .modal-header .header-title {
    width: 100%;
    display: block;
  }

  .modal-header {
    padding-left: 0px;
    padding-right: 0px;
    padding-bottom:5px;
  }

  .book-logo {
    width:50px;
    height:50px;
  }

  .modal-body {
    margin: 0px 0;
  }

  .modal-footer {

  }

  .modal-header .header-title button {
    float: none;
    width: auto;
    right: 0px;
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


  #uploadingMsg {text-align: center; padding-bottom: 1em;}
  #uploadingMsg h2 i {font-size: 24pt; color: silver}

  button.close i.fa {font-size: 18pt; padding-right: .5em;}

  .book-import-list { list-style-type: none; }
  .book-import-list i { padding: 0px 5px 0px 0px; }

  .browse-btn {
    margin-bottom: 18px;
  }

  .help-block {
    margin-top: 0px;
    margin-bottom: 18px;
  }

  .alert-icon-float-left {
    font-size: 40px;
    float: left;
    color: #a94442;
  }

  .alert-text-float-right {
    float: right;
    text-align: left;
    width: 370px;
  }

  .alert .alert-text-float-right p {
    text-align: left;
    margin: 5px 0;
    word-break: break-word;
  }

</style>
