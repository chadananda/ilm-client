<template>
  <div class="ilm-file-upload">
    <input
      class="ilm-file-upload__input"
      :id="id"
      type="file"
      :accept="accept"
      :name="name"
      :multiple="false"
      tabindex="0"
      :disabled="disabled"
      @change="onChange($event.target.files[0])"
      @drop.stop.prevent="onFileDrop($event.dataTransfer.files[0])"
    />
    <slot></slot>
  </div>
</template>

<script>
  export default {
    name: 'UploadFile',
    data () {
      return {
        tempURL: ''
      }
    },
    props: ['id', 'name', 'accept', 'disabled', 'toBase64'],
    methods: {
      onChange(file){
        let objectURL = this.tempURL = URL.createObjectURL(file);

        if(this.toBase64){
            this.getBase64(file).then(res => {
              this.$emit('input', { file: res, objectURL })
            });
        } else {
          this.$emit('input', { file, objectURL })
        }
      },
      onFileDrop (files) {
        this.onChange(files)
      },
      getBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }
    },
    beforeDestroy() {
      if (this.tempURL) {
        URL.revokeObjectURL(this.tempURL);
      }
    },
  }
</script>

<style scoped lang="less">
  .ilm-file-upload {
    * {
      cursor: pointer;
    }
    &__input {
      width: 100%;
      height: 100%;
      opacity: 0;
      overflow: hidden;
      position: absolute;
    }
  }
</style>
