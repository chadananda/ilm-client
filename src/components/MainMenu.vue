<template>
  <div class="top-menu-wrapper">
  <table class="navtable">
    <tr><td class='logo'>
      <router-link to="/"><img src="../assets/ilm-logo.svg"/></router-link>
    </td>
    <td class='menu'>
      <ul class="navlist">

        <router-link to="/assignments" class='presentation' tag='li'
        v-show='!(isAdmin || isBookkeeper || isLibrarian)'><a>Assignments</a><sup>{{tc_userTasks.total}}</sup></router-link>

        <router-link to="/books" tag='li'
        v-show="isAdmin || isEditor || isLibrarian || isProofer || isNarrator"
        ><a>Books</a></router-link>

        <router-link to="/collections" tag="li">
          <a>Collections</a>
        </router-link>

        <router-link to="/users" class='presentation' tag='li'
        v-show="isAdmin || isBookkeeper || isLibrarian"
        ><a>Users</a></router-link>

        <router-link to="/libraries" class='presentation' tag='li'
        v-show="isAdmin || isLibrarian"
        ><a>Libraries</a></router-link>

        <router-link to="/assignments" class='presentation' tag='li'
        v-show="isAdmin || isBookkeeper || isLibrarian"><a>Assignments</a><sup>{{tc_userTasks.total}}</sup></router-link>

        <router-link to="/align" class='presentation' tag='li'
        v-show='isAdmin || isLibrarian'><a>Check alignment</a></router-link>

        <router-link to="/audio_editor" class='presentation' tag='li'
        v-show='isAdmin || isLibrarian'><a>AudioEditor</a></router-link>

     </ul>
    </td>
    <td class='menu right'>
      <ul class="navlist">
          <!-- <router-link class="presentation" to="/help" tag='li'><a>Help</a></router-link></router-link> -->
          <!-- <router-link class="presentation" to="/contact" tag='li'><a>Contact</a></router-link> -->

          <li>Welcome {{$store.state.user.name}}!</li>
          <li v-if="$store.state.isLoggedIn" class="presentation"><a href="#" v-on:click.stop.prevent="$store.state.auth.logout()">Logout</a></li>
      </ul>
    </td></tr>
  </table>
  </div>
</template>



<script>
import access from "../mixins/access.js"
import { mapGetters } from 'vuex'


export default {
  data () {
    return {
      // process: this.$store.state.process
    }
  },
  mixins: [access],
  computed:
    mapGetters (['tc_userTasks'])

}
</script>



<style scoped>
  .top-menu-wrapper {
    /*width: 100%;
    height: 43px;
    position: absolute;
    top: 0px; left: 0px;*/
    min-height: 45px;
    height: 45px;
    box-shadow: inset 0px -2px 3px 0px rgba(178, 191, 224, 0.53);
  }

  /* Navigation Menu Table (Oh yes I did!) */
  table.navtable {
    background: #FFFFFF;
    width: 100%;
    height: 41px;
  }
  .navtable tr {vertical-align: top; font-size: 1.2em; }
  .navtable td {vertical-align: top; text-align: left; /*padding-top: 5px;*/}
  .navtable td.logo {min-width: 20px; width: 20px;}

  .logo img{max-width: 20px; margin:0; margin-top: 2px; position: absolute;}

  .navtable td.menu {padding-left: 10px; padding-top: 2px;}
  .navtable td.right {float: right; padding-right: 5px; padding-top: 2px;}

  /* non-adaptive navigation list */
  .navlist { list-style-type: none; margin:0; padding:0; }
  .navlist li {display: block; overflow: hidden; text-align: center; float:left; padding: 8px;}
  /*.navlist li:hover {background: yellow}*/
  .navlist li.active {background: #eaf1fc}
  .navlist a {color: gray;}
  li.active a {color: black; text-decoration: none;}
  .navlist a:hover { text-decoration: none; }

  li.presentation.roles {font-size: .75em; padding: 1px; margin: 10px; color: gray; font-style: italic; }

</style>
