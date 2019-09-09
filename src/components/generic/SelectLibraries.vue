<template>
  <v-select
    :options="userLibraryList"
    options-label="name"
    options-value="id"
    v-model="selectedValue"
    name="user_libraries[]"
    multiple
    :placeholder="'Define Library'"
    :disabled="isDisabled"
  ></v-select>
</template>
<script>
  import { select } from 'vue-strap';
  import { mapGetters } from 'vuex';
  export default {
    data() {
      return {
        selectedValue: [],
        options: []
      }
    },
    name: 'SelectLibraries',
    components: {
      'v-select': select
    },
    props: ['selected', 'isDisabled'],
    computed: {
      ...mapGetters(['userLibraryList'])
    },
    mounted() {
      this.selectedValue = this.selected;
    },
    watch: {
      selectedValue: {
        handler(val) {
          this.$emit('select', val);
        }
      }
    }
  }
</script>
<style></style>