<template>
<ul ref="menu"
    class="click-menu"
    tabindex="-1"
    v-bind:style="{ visibility: viewMenu?'visible':'hidden', top:top, left:left }"
    @click="close">
    <!--@blur="close"
    @mouseleave="close"-->
    <slot></slot>
</ul>
</template>

<script>
import Vue from 'vue'

  export default {
    name: 'block-menu',
    props: [
        'update'
    ],
    data() {
      return {
            viewMenu: false,
            top: '0px',
            left: '0px',
            block_Id: false,
        }
     },
    methods: {
        setMenu: function(x, y, target) {
            //console.log('x:', x, 'y:', y);
            //console.log('window.pageYOffset', window.pageYOffset);

            let dir = this.$refs.menu.getAttribute('dir') || 'top';

            switch(dir) {
              case 'top' :
              {   /*(window.pageYOffset<110?110:0) - hack because of layout*/
                  if (y < this.$refs.menu.offsetHeight + (window.pageYOffset<120?120:0)) {
                      this.top = target.offsetHeight + 7 + 'px';
                  } else {
                      this.top = - this.$refs.menu.offsetHeight - 2 + 'px';
                  }
                  this.left = 0 + 'px';
              }
              break;
              default : // case bottom
              {
                  if (window.innerHeight < y + this.$refs.menu.offsetHeight) {
                      this.top = - this.$refs.menu.offsetHeight - 5 + 'px';
                  } else {
                      this.top = target.offsetHeight + 'px';
                  }
                  this.left = 0 + 'px';
              }
              break;
          };

        },

        close: function() {
            this.viewMenu = false;
            this.top = 0 + 'px';
            this.left = 0 + 'px';

            document.removeEventListener('click', this.close);
        },

        open: function(ev, block_Id) {
            ev.preventDefault();
            this.$root.$emit('closeBlockMenu', block_Id);

            if (this.viewMenu) return this.close();
            this.block_Id = block_Id;
            this.viewMenu = true;
            this.setMenu(ev.clientX, ev.clientY, ev.target);
            //this.$refs.menu.focus();

            Vue.nextTick(function() {
                this.setMenu(ev.clientX, ev.clientY, ev.target);
                //this.$refs.menu.focus();
            }.bind(this));

            setTimeout(() => document.addEventListener('click', this.close), 0);
        }
    },
    mounted: function() {
      this.$root.$on('closeBlockMenu', (block_Id)=>{
        if (block_Id !== this.block_Id) this.close();
      });
      this.$root.$on('closeFlagPopup', ()=>{
        this.close();
      });
      this.$root.$on('closeBlockContextMenu', ()=>{
        this.close();
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
}

.click-menu li {

    margin: 0;
    padding: 5px 10px;
    cursor: default;

    &.separator {
        border-bottom: 1px solid #E0E0E0;
        padding: 0;
    }
}

.click-menu li:last-child {
    border-bottom: none;
}

.click-menu li:hover {
    background: #1E88E5;
    color: #FAFAFA;
}
</style>
