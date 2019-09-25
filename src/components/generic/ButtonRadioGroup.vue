<template>
  <div class="btn-group" role='group'>
    <button type="button" v-for="(val, key) in values" @click="changeSelectVal(key)"
      :class="[selected==key ? 'btn-primary' : 'btn-default', 'btn']"
      >{{ val }}</button>
  </div>
</template>

<script>
  /* usage:
    <ButtonRadioGroup :values="colors" :selected.sync="color" default="green"></ButtonRadioGroup>
    colors: obj, selected.sync: string var, default: string
    :class="[selectedVal==key ? 'btn-primary' : 'btn-default', 'btn']"
  */
  export default {
    data () {
      return {
        selected: false
      }
    },
    props: ['values', /*'selected',*/ 'default', 'onChange'],
    methods: {
      changeSelectVal: function(val) {
        this.selected = val;
        this.$emit('onChange', val);
      }
    },
    created: function() {
      if (!this.selected && this.default) this.selected = this.default;
    }
  }
</script>


<style scoped>
  .btn {
     outline: none !important;
  }

  .btn-group {
    display: flex;
  }
</style>
