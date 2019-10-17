<template>
  <div ref="menu"
    class="flag-popup"
    tabindex="-1"
    v-bind:class="{ '-under': under, '-over': !under }"
    v-bind:style="{ visibility: viewMenu?'visible':'hidden', top:top, left:left }">
    <!--@blur="close"
    @mouseleave="close"
    @click="close">-->

    <a v-if="isHideArchFlags && countArchParts > 0"
      href="#" class="flag-control -show-hidden -left"
      @click.prevent="toggleHideArchParts">
      -- <span v-if="isHideArchParts">Show</span><span v-else>Hide</span> {{countArchParts}} archived flag<span v-if="countArchParts != 1">s</span> --</a>

    <a href="#" class="flag-control -close -right"
      @click.prevent="close">
      <i class="fa fa-window-close" aria-hidden="true"></i>
    </a>
    <div class="clearfix"></div>

    <div class="flag-wrapper">
      <ul>
        <slot></slot>
      </ul>
    </div>


  </div>
  <!--<div ref="menu"-->
</template>

<script>
import Vue from 'vue';

  export default {
    name: 'block-flag-popup',
    props: [
        'canDeleteFlagPart',
        'delFlagPart',
        'resolveFlagPart',
        'reopenFlagPart',
        'isHideArchFlags',
        'isHideArchParts',
        'toggleHideArchParts',
        'countArchParts'
    ],
    data() {
      return {
          viewMenu: false,
          top: '0px',
          left: '0px',
          under: true,
          flagId: false,
          lastEvent: false
        }
     },
    methods: {
        setMenu: function(ev) {

            let dir = this.$refs.menu.getAttribute('dir') || 'top';
            //let rect = ev.target.getBoundingClientRect();
            //console.log('ev.clientY', ev.clientY, 'ev.target.offsetTop', ev.target.offsetTop, 'this.$refs.menu.offsetHeight', this.$refs.menu.offsetHeight);
            //console.log('ev.clientX', ev.clientX, 'ev.target.offsetLeft', ev.target.offsetLeft, 'this.$refs.menu.offsetWidth', this.$refs.menu.offsetWidth);
            //console.log('ev.target', ev.target);

            switch(dir) {
              case 'top' :
              {
                  let top = ev.layerY;
                  if (ev.clientY - this.$refs.menu.offsetHeight < 0 + 120) {
                      this.under = false;
                      //top = rect.bottom + window.scrollY + 0 + 'px';
                      top = parseFloat(ev.target.offsetTop) + ev.target.offsetHeight;

                  } else {
                      this.under = true;
                      //top = rect.top + window.scrollY - this.$refs.menu.offsetHeight - 5;
                      top = parseFloat(ev.target.offsetTop) - this.$refs.menu.offsetHeight;
                  }

                  let left = ev.target.offsetLeft - 115;//(target.offsetLeft - 120);
                  if (left + this.$refs.menu.offsetWidth > window.innerWidth) {
                    left = window.innerWidth - this.$refs.menu.offsetWidth - 20;
                  }
                  else if (left < 0) {
                    left = 50;
                  }

                  //console.log('top', top, 'left', left);
                  this.top = top + 'px';
                  this.left = left + 'px';

               }
              break;
              default : // case bottom
              {
                  this.top = 0 + 'px';
                  this.left = 0 + 'px';
              }
              break;
          };

        },

        close: function() {
          this.viewMenu = false;
          this.top = 0 + 'px';
          this.left = 0 + 'px';
        },

        open: function(ev, flagId) {
          if (ev.preventDefault) ev.preventDefault();
          this.$root.$emit('closeFlagPopup', flagId);

          if (this.viewMenu == true && flagId === this.flagId) return this.close();

          this.lastEvent = ev;
          this.flagId = flagId;
          this.viewMenu = true;
          //this.setMenu(ev.clientX, ev.clientY, ev.target);
          //this.setMenu(ev);
          //console.log('open');
          Vue.nextTick(function() {
            //this.setMenu(ev.clientX, ev.clientY, ev.target);
            this.setMenu(ev);
          }.bind(this));

        },

        reset: function() {
          let ev = this.lastEvent;
          //this.setMenu(ev.clientX, ev.clientY, ev.target);
          this.setMenu(ev);

          Vue.nextTick(function() {
           // this.setMenu(ev.clientX, ev.clientY, ev.target);
            this.setMenu(ev);
          }.bind(this));
        },

        scrollBottom: function() {
          let scrollEl = this.$refs.menu.querySelector('.flag-wrapper');
          Vue.nextTick(function() {
            scrollEl.scrollTop = scrollEl.scrollHeight;
          });
        }
    },
    mounted: function() {
      this.$root.$on('closeFlagPopup', (flagId)=>{
        if (flagId !== this.flagId) this.close();
      });
      this.$root.$on('closeBlockMenu', ()=>{
        this.close();
      });
      this.$root.$on('closeBlockContextMenu', ()=>{
        this.close();
      });
    }
  }
</script>

<style lang='less' scoped>

.flag-popup{
    background: #FAFAFA;
    border: 1px solid #BDBDBD;
    box-shadow: 0 2px 2px 0 rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);

    position: absolute;
    z-index: 999999;
    outline: none;

    margin: 0;
    padding: 0;
    /*padding: 5px 10px;*/
    font-size: 16px;
    width: 340px;
    text-align: left;
    max-height: 358px;
    overflow-y: hidden;

    .flag-wrapper {
      max-height: 292px;
      overflow:auto;
      overflow-x:hidden;
      padding: 5px 10px;
      padding-top: 0;
    }

    ::-webkit-scrollbar {
      -webkit-appearance: none;
      width: 10px;
    }

    ::-webkit-scrollbar-button {
    }

    ::-webkit-scrollbar-thumb {
      border-radius: 5px;
      background-color: rgba(0,0,0,.5);
      -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);
    }

    &.-over::before, &.-under::after {
      content: "";
      position: absolute;
      width: 0;
      height: 0;
      box-sizing: border-box;
      transform-origin: 0 0;

    }

    &.-under::after {
      left: 120px;
      transform: rotate(-45deg);
      border: 6px solid black;
      border-color: transparent transparent #FAFAFA #FAFAFA;
      bottom: -12px;
      box-shadow: -2px 2px 2px 0 rgba(0, 0, 0, 0.25);
    }

    &.-over::before {
      left: 131px;
      transform: rotate(135deg);
      border: 6px solid black;
      border-color: transparent transparent #FAFAFA #FAFAFA;
      top: 1px;
      box-shadow: -2px 2px 2px 0 rgba(0, 0, 0, 0.15);
    }
}

.flag-popup {

  textarea {
    resize: none;
  }

  ul {
    display: block;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin: 0;
    margin-bottom: 8px;
    cursor: default;

    &.separator {
      border-bottom: 1px solid #E0E0E0;
      padding: 0;
    }

    &:last-child {
      border-bottom: none;
    }

    .flag-header {
      font-size: 22px;

      .flag-date {
        font-size: 16px;
      }
    }

    .flag-content {
      font-size: 14px;
      margin-bottom: 5px;
    }

    .flag-control {
      cursor: pointer;
      font-size: 16px;
      /*line-height: 32px;*/

      &.-close {
        margin: 5px 10px;
      }

      &.-left {
        margin-right: 5px;
      }

      &.-top {
        margin-top: 7px;
      }
    }

    p.flag-comment {
      margin-bottom: 5px;
    }

    .glyphicon {
      &.flag-resolved {
        color: green;
        margin-right: 5px;
      }
      &.flag-open {
        color: red;
        margin-right: 5px;
      }
      &.flag-hidden {
        color: grey;
        margin-right: 5px;
      }
    }
  }

  .flag-comment {
    width: 100%;
  }

  .flag-control {
    cursor: pointer;
    font-size: 16px;
    /*line-height: 32px;*/

    &.-close {
      margin-right: 8px;
      margin-top: 5px;
      margin-bottom: 3px;
      line-height: 18px;
    }

    &.-left {
      margin-right: 8px;
    }

    &.-show-hidden {
      margin-left: 10px;
      margin-top: 0px;
      line-height: 24px;
      color: gray;
    }
  }
}

/*.flag-popup li:hover {
    background: #1E88E5;
    color: #FAFAFA;
}*/

</style>
