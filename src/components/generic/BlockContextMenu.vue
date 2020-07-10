<template>
<ul ref="menu"
    v-if="viewMenu"
    class="click-menu"
    tabindex="-1"
    :style="{ top, left }"
    @click="close">
    <!--@blur="close"-->
    <slot></slot>

</ul>
</template>

<script>

  export default {
    name: 'block-context-menu',
    data() {
      return {
            viewMenu: false,
            top: '0px',
            left: '0px'
        }
     },
    methods: {

        setMenu(x, y, container) {
          let menuWidth = this.$refs.menu.offsetWidth;
          let containerWidth = container.offsetWidth;

            if (x + menuWidth > containerWidth) {
              //show menu on the left-bottom of cursor position
              x = x - menuWidth;
            }
            this.left = x + 'px';
            this.top = y + 'px';
        },

        close() {
           this.viewMenu = false;
            this.$emit('close');
        },

        open(ev, container = ev.target, offsetX =0, offsetY = 0) {
            this.$root.$emit('closeBlockContextMenu');
            let coords = {};

            coords.x = ev.clientX - offsetX;
            coords.y = ev.layerY - offsetY;

            this.setMenu(coords.x, coords.y, container);
            this.viewMenu = true;
        },
    },
    mounted: function() {
      this.$root.$on('closeBlockContextMenu', ()=>{
        if(this.viewMenu) this.close();
      });
      this.$root.$on('closeBlockMenu', ()=>{
        if(this.viewMenu) this.close();
      });
      this.$root.$on('closeFlagPopup', ()=>{
        if(this.viewMenu) this.close();
      });
    }
  }
</script>

<style lang='less' scoped>

.click-menu{
    background: #FAFAFA;
    border: 1px solid #BDBDBD;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);
    display: block;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 250px;
    z-index: 999999;
    outline: none;

    &:empty {
      border: none;
    }
    li {
     margin: 0;
     padding: 5px 10px;
     cursor: default;

     &.separator {
       border-bottom: 1px solid #E0E0E0;
       padding: 0;
     }
     &:last-child {
       border-bottom: none;
     }
     &:hover {
       background: #1E88E5;
       color: #FAFAFA;
     }
   }
}
</style>
