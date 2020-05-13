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
        isBinary: false
      }
    },
    props: ['id', 'name', 'accept', 'disabled'],
    methods: {
      onChange(files){
          this.$emit('input', files)
      },
      onFileDrop (files) {
        this.onChange(files)
      },
    }
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
