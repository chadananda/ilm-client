<template>
  <div class="area-wrapper">

    <div class="table toolbar">
      <div class="tr">
        <div class='td'>
          <i class="fa fa-users"></i>
        </div>
        <div class='td'>
          <h4>{{users.length}} Active Users</h4>
        </div>
        <div class='td'>
          <select class="userselect form-control" v-model="filter['enable']" v-on:change="filterChange">
            <option value="" selected="">Show All</option>
            <option value="1">Show Active</option>
            <option value="0">Show Inactive</option>
          </select>
        </div>
        <div class='td auto'></div>
        <div class='td'>
          <!-- <a href="#"><i class="fa fa-calendar-check-o"></i> All Work History</a> -->
          <!-- Edit Button -->
          <button @click='' class='btn btn-default'>
            <i class="fa fa-calendar-check-o"></i>  All Work History
          </button>  &nbsp;
        </div>
        <div class='td'>
          <input type="text" class="form-control" v-model="filterKey" placeholder="Filter">
        </div>
        <div class='td'>
          <!-- <a href="#" @click="userAddModalActive = true"><i class="fa fa-user-plus"></i> New User</a> -->
          <button @click='userAddModalActive = true' class='btn btn-default' v-show="$store.state.isAdmin || $store.state.isBookkeeper">
            <i class="fa fa-user-plus"></i>  New User
          </button>  &nbsp;
        </div>
      </div>
    </div>



    <alert v-show="passwordChanged" placement="top-right" duration="3000" type="success" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>
      <p>Password reset.</p>
    </alert>
    <div class="users-form-wrapper">
    <form class="user-form">
      <div v-for="user in pagedUsers" class="user-form-box">
        <div class="t-box" v-show="$store.state.isAdmin"><span v-on:click="userEditModal(user)"><i class="fa fa-user"></i>{{user.name}}</span></div>
        <div class="t-box" v-show="!$store.state.isAdmin"><span><i class="fa fa-user"></i>{{user.name}}</span></div>
        <div class="t-box"><span>{{user.email}}</span></div>
        <div class="t-box">
          <select-roles
            :selected="user.roles"
            :isDisabled="!$store.state.isAdmin"
            @select="updateUser(user._id, 'roles', $event)"
          ></select-roles>
        </div>
        <div class="t-box">
          <select-languages
            :selected="user.languages || []"
            :isDisabled="!$store.state.isAdmin"
            @select="updateUser(user._id, 'languages', $event)"
          ></select-languages>
        </div>
        <div class="t-box">
          <SelectLibraries
            :selected="user.user_libraries || []"
            :isDisabled="!$store.state.isAdmin"
            @select="updateUser(user._id, 'libraries', $event)"
          ></SelectLibraries>
        </div>
        <div class="t-box"><a href="#" v-on:click="workHistoryModal(user._id)"><span><i class="fa fa-calendar-check-o"></i>Work History</span></a></div>

        <div class="t-box" v-show="$store.state.isAdmin"><a href="#" v-on:click="resetPassword(user.email)"><span><i class="fa fa-unlock"></i>Reset Password</span></a></div>

        <!-- <button @click='' class='btn btn-default t-box'>
          <i class="fa fa-unlock"></i>  Reset Password
        </button>  &nbsp; -->

        <div class="t-box" @click="updateUser(user._id, 'enable', !user.enable)" v-show="$store.state.isAdmin">
          <template v-if="user.enable"><span>Active </span><i class="fa fa-toggle-on"></i></template>
          <template v-else><span>Disabled </span><i class="fa fa-toggle-off"></i></template>
        </div>
        <div class="t-box" v-show="!$store.state.isAdmin" >
          <template v-if="user.enable"><span>Active </span></template>
          <template v-else><span>Disabled </span></template>
        </div>


      </div>
    </form>

    <pagination
      :length="filteredUsers.length"
      :currentPage="currentPage"
      :rowsPerPage="rowsPerPage"
      @goToPage="page => { currentPage = page }"
    ></pagination>

    <user-add-modal
      :show="userAddModalActive"
      @closed="addUserModalClose"
    ></user-add-modal>
    <user-edit-modal
      :show="userEditModalActive"
      :user="currentUser"
      @closed="userEditModalClose"
    ></user-edit-modal>
    <work-history-modal
      :show="workHistoryModalActive"
      @closed="workHistoryModalClose"
      :workHistory="workHistory"
    ></work-history-modal>

    </div>
    <!--users-form-wrapper-->

  </div>
</template>

<script>

import axios from 'axios'
import SelectRoles from './generic/SelectRoles'
import SelectLanguages from './generic/SelectLanguages'
import SelectLibraries from './generic/SelectLibraries'
import UserAddModal from './users/UserAddModal'
import UserEditModal from './users/UserEditModal'
import WorkHistoryModal from './users/WorkHistoryModal'
import Pagination from './generic/Pagination'
import { filteredData, pagedData } from '../filters'
import PouchDB from 'pouchdb'
import superlogin from 'superlogin-client'
import { alert } from 'vue-strap'

const API_ALLUSERS = process.env.ILM_API + '/api/v1/users'

export default {

  name: 'Users',

  components: {
    UserAddModal,
    UserEditModal,
    WorkHistoryModal,
    SelectRoles,
    SelectLanguages,
    SelectLibraries,
    Pagination,
    alert
  },

  data () {
    return {
      users: [],
      currentUser: {},
      filterKey: '',
      currentPage: 0,
      rowsPerPage: 10,
      userAddModalActive: false,
      userEditModalActive: false,
      passwordResetModalActive: false,
      workHistoryModalActive: false,
      filter: {
        'enable': ''
      },
      workHistory: {},
      passwordChanged: false
    }
  },

  computed: {

    pagedUsers (val) {
      return pagedData(this.filteredUsers, this.currentPage, this.rowsPerPage)
    },

    filteredUsers: {
      //cache: false,
      get() {
        if (this.filterKey != ''){
          this.currentPage = 0;
        }
        return filteredData(this.users, this.filterKey, this.filter)
      }
    },

  },
  mounted () {
    var self = this

    self.updateUsersList()
  },

  created () {

  },

  methods: {
    updateUser(user_id, field, new_value) {
      var self = this
      var user = self.users.find(usr => {
        return usr._id == user_id
      })
      if (user && !_.isEqual(user[field], new_value)) {
        var request = {}
        request[field] = new_value
        axios.patch(API_ALLUSERS + '/' + user_id, request).then(response => {

          //if (response.data.ok === true) {
          if (response.status === 200) {
            user[field] = new_value
          }
        })
      }
    },

    updateUsersList() {
      var self = this
      axios.get(API_ALLUSERS)
      .then(response => {
        self.users = response.data
      })
      .catch(err => {
        console.log('Error: ', err);
      })
    },

    addUserModalClose(result) {
      this.userAddModalActive = false
      if (result === true) {
        this.updateUsersList()
      }
    },

    userEditModal(user) {
      this.currentUser = Object.assign({}, user)
      this.userEditModalActive = true
      console.log(this.currentUser, user);
    },

    userEditModalClose(result) {
      this.userEditModalActive = false
      if (result === true) {
        this.updateUsersList()
      }
    },

    filterChange() {
      var tmp = this.filter
      this.filter = null
      this.filter = tmp// trick to force computed value reload since it does not observe object changes
    },

    workHistoryModal(user_id) {
      this.workHistory = {'user_id': user_id}
      this.workHistoryModalActive = true
    },

    workHistoryModalClose() {
      this.workHistory = {}
      this.workHistoryModalActive = false
    },

    resetPassword(email) {
      //console.log({'email': email}, arguments)
      var self = this
      axios.post(process.env.ILM_API + '/api/v1/new-password', {'email': email}).then(function(response){
        if (response.data.ok === true) {
          self.passwordChanged = true
          setTimeout(function(){self.passwordChanged = false}, 5000)
        } else {
        }
      })
      .catch(function(e){
      })
    }
  },

  watch: {

  }

}
</script>


<style lang="less" scoped>

.area-wrapper {

  .users-form-wrapper {
    height: 100%;
    /*overflow: auto;*/
    margin-top: 2px;
    .row {
      margin: 0;
    }
  }

  .toolbar {
    width: 100%;
    height: 38px;
    margin-top: 2px;
    padding-left: 3px;
    box-shadow: 0px 0px 2px 2px rgba(178, 191, 224, 0.53);
  }
  .toolbar td {
    text-align: left;
    padding-top:0; margin-top:0;
  }
  .toolbar td.right {
    text-align: right;
    /*position: inline;*/
    padding-top: 11px;
    float: right;
    padding-right: 10px;
  }

  .table {
    display: table;
    /*border-spacing: 15px;*/
    padding: 0;
    margin-bottom: 0;
  }
  .tr {
  display: table-row;
  }
  .td {
    display: table-cell;
    vertical-align: middle;
    white-space: nowrap;
    /*position: relative;
    top: 50%;
    transform: translateY(-50%);*/
    /*padding: 5px;*/
  }

  .td input.form-control {display: inline-block !important;}

  .tr .td:nth-child(1) {padding-left:10px; width: 4em;}
  .tr .td:nth-child(1) i {font-size: 24pt; color:#555;}
  .tr .td:nth-child(2) {width: 12em;}
  .tr .td:nth-child(2) h4 {font-size: 24px; padding-right: .5em;}
  .tr .td:nth-child(3) {font-size: 18px; width: 8em; line-height: 1.5em}
  .tr .td:nth-child(4) {width: auto; }
  .tr .td:nth-child(5) {width: 10em; text-align: right;}
  .tr .td:nth-child(6) {width: 12em;  }
  .tr .td:nth-child(7) {width: 8em; padding-right: 10px; }

  .user-form-box:nth-of-type(odd) {bakground-color: #f9f9f9}

}
</style>

<style lang="stylus">
.user i
.user-right a
  margin-right: 10px
.user i
  font-size: 18px
.user-right
  text-align: right
.fa
  font-size: 18px

.user
  .container
    width: 100%
    h4
      display: inline-block
      i
        color: #333
    select
    input
      margin: 0 10px
    select
      min-width: 134px
      max-width: 100%
      border-radius: 0
      padding: 5px
      border: 1px solid #efecec!important
      height: 31px
      color: #333

    .fa-user-plus
      margin-left: 5px
      color: #00d1ff

.user-form
  background: #fff
  display: block
  width: 100%
  /*float: left*/
  margin-top: 20px
  .user-form-box
    float: left
    width: 100%
    border-bottom: 1px solid #f2f1f1
    .t-box
      display: inline-block
      min-width: 14%
      float: left
      padding: 10px
      text-align: center
      i
        vertical-align: middle
        margin: 0 5px
      span
        display: inline-block
        margin: 6px 0
      .form-control
        width: 150px
        .btn-content
          margin: 2px 0

</style>
