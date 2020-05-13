<template>
  <div class="ilm-upload-image">
    <div class="ilm-upload-image__preview">
      <img v-if="image" :src="image" :height="imgHeight" :width="imgWidth" alt="">
    </div>
    <label :for="id" class="ilm-upload-image__label">
      <UploadFile
        ref="illustrationInput"
        :id="id"
        :name="id"
        accept="image/*"
        @input="onChange"
      />
      <div v-if="!image" class="ilm-upload-image__drop">Click to upload image</div>
      <button v-else class="btn btn-primary ilm-upload-image__change">Change image</button>
    </label>
<!--    <button v-if="getImage(id)" class="btn btn-default ilm-upload-image__remove" @click.stop="removeImage(id)">Remove image</button>-->

  </div>
</template>

<script>
  import UploadFile from './UploadFile'

  const DEFAULT_IMAGE_HEIGHT = 100;
  const DEFAULT_IMAGE_WIDTH = 300;

  import { mapGetters, mapActions } from 'vuex'

  export default {
    name: 'UploadImage',
    components: {
      UploadFile,
    },
    props: {
      value: {
        type: [File,String],
        default: ''
      },
      //blockID or any unique ID
      id: {
        type: String,
        required: true
      },
      height: {
        type: [Number], //in px
        default: DEFAULT_IMAGE_HEIGHT,
      },
      width: {
        type: [Number], //in px
        default: DEFAULT_IMAGE_WIDTH,
      }
    },
    computed:{
      ...mapGetters('uploadImage',{
        getImage: 'image',
        getHeight: 'height',
        getWidth: 'width',
      }),
      imgHeight(){
        return this.getHeight(this.id) || this.height
      },
      imgWidth(){
        return 'auto'//this.getWidth(this.id) || this.width
      },
      image(){
        //get temp image if exists or original image url
          return this.getImage(this.id) || this.value

      },
      key(){
        return `${this.imgHeight}_${this.imgWidth}`
      }
    },
    methods: {
      ...mapActions('uploadImage',['setImage', 'removeImage']),
      onChange(file){
        if(!file){
          return;
        }

          this.createImageNode(file).then(res => {

              this.setImage({
                id: this.id,
                data: {
                  file,
                  height: res.height,
                  width: res.width,
                  objectURL: res.src
                }
              })


            })
            this.$emit('input', true)

      },
      //TODO pmove to helpers
      createImageNode(file = null){
        return new Promise((resolve, reject) => {
          if(!file) {
            return reject();
          }
          let url = URL.createObjectURL(file);
          let img = new Image;
          img.src = url;

          img.onload = () => {
            return resolve(img);
          };
        })
      },
    }
  }
</script>
<style lang="less" scoped>
  .ilm-upload-image{
    position:relative;
    margin: 0 auto;

  &__label {
    position:relative;
    display: block;
  }
    &__change,
    &__remove {
      display: block;
      margin: 0 auto;
    }
    &__drop{
        margin: 2rem auto;
        padding:3rem;
        border: 2px dashed grey;
        text-align: center;
      }
  }
</style>


