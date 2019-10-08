<template>
  <div :class="['recording-block', '-langblock-' + lang]">
    <!-- <div class="row"> -->
      <div class="recording-text" v-html="text" ref="recordingText">
        
      </div>
    <!-- </div> -->
    <div class="table-body">
      <div class="table-row">
        <div class="table-cell cancel-recording -left">
          <span class="btn btn-default" @click="_cancelRecording">
            <i class="fa fa-ban"></i>
            Cancel
          </span>
        </div>
        <div class="table-cell">
          <div class="table-row -right">
            <div class="table-cell pause-recording" @click="_pauseRecording" v-if="!isPaused">
              <span class="btn btn-default">
                <i class="fa fa-pause"></i>
                Pause
              </span>
            </div>
            <div class="table-cell resume-recording" @click="_resumeRecording" v-else>
              <span class="btn btn-default">
                <i class="fa fa-play"></i>
                Resume
              </span>
            </div>
            <div class="table-cell save-recording">
              <span class="btn btn-default" @click="_stopRecording()">
                <i class="fa fa-save"></i>
                Save
              </span>
            </div>
            <div class="table-cell save-recording-and-next" @click="_stopRecording(true)">
              <span class="btn btn-primary">
                Save and Next &gt;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        isPaused: false
      }
    },
    props: ['text', 'cancelRecording', 'stopRecording', 'pauseRecording', 'resumeRecording', 'lang'],
    methods: {
      _cancelRecording() {
        this.isPaused = false;
        this.cancelRecording();
        this.$emit('close');
      },
      _stopRecording(start_next = false) {
        this.isPaused = false;
        this.stopRecording(start_next);
        this.$emit('close');
      },
      _pauseRecording() {
        this.isPaused = true;
        this.pauseRecording();
      },
      _resumeRecording() {
        this.isPaused = false;
        this.resumeRecording();
      }
    },
    mounted: function() {
      this.$refs.recordingText.style['max-height'] = window.innerHeight - 100 + 'px';
    }
  }
</script>
<style lang="less">
  .recording-block {
    &.-langblock-fa, &.-langblock-ar {
      .recording-text {
        text-align: justify;
      }
    }
    .recording-text {
      font-size: 17pt;
      padding: 15px 30px;
      font-family: GentiumPlus, serif;
      overflow-y: auto;
    }
    .table-body {
      padding: 20px;
    }
    .cancel-recording {
      color: red;
      .btn.btn-default {
        border-color: red;
        color: red;
      }
      .fa {
        color: red;
      }
    }
    [data-suggestion] {
      background: inherit;
    }
    /*br {
      display: block;
      margin: 15px 0;
      line-height: 24px;
      content: " ";
    }*/
    .part-separator {
      height: 12px;
    }
  }
</style>
