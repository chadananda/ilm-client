<template>

  <modal id="userAddModal" effect="fade" @closed="closed" name="add-user-modal" :clickToClose="false" :resizeable="false" height="auto" width="400" >
    <section class="modal-js-dialog">
    <div class="modal-header">
      <button type="button" class="close" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title"><i class="fa fa-user"></i>Add User</h4><i class="fa fa-user user-icon"></i></div>
    </div>
    <div class="modal-body">
      <div v-if="error" class="error-message" v-text="error"></div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-user"></i></span>
          <input type="text" class="form-control" placeholder="Username" v-model="username">
          <div v-if="errors.username" v-for="err in errors.username" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
          <input type="text" class="form-control" placeholder="Real Name" v-model="name">
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-envelope-o"></i></span>
          <input type="text" class="form-control" placeholder="Email" name="email" v-model="email">
          <div v-if="errors.email" v-for="err in errors.email" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
          <input type="password" class="form-control" placeholder="Password" v-model="password">
          <div v-if="errors.password" v-for="err in errors.password" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
          <input type="password" class="form-control" placeholder="Confirm Password" v-model="confirmPassword">
          <div v-if="errors.confirmPassword" v-for="err in errors.confirmPassword" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group"><span class="input-group-addon"></span>
        <select-roles
          :selected="roles"
          @select="val => { roles = val }"
        ></select-roles>
      </div>
      <div class="form-group"><span class="input-group-addon"><i class="fa fa-globe"></i></span>
        <select-languages
          :selected="languages"
          @select="val => { languages = val }"
        ></select-languages>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" type="button" @click="ok">Submit </button>
    </div>
    </section>
  </modal>

</template>

<script>

import Vue from 'vue'
import v_modal from 'vue-js-modal';
Vue.use(v_modal, { dialog: true });
//import { modal } from 'vue-strap'
import SelectRoles from './../generic/SelectRoles'
import SelectLanguages from './../generic/SelectLanguages'
import modalMixin from './../../mixins/modal'

export default {

  name: 'UserAddModal',

  mixins: [modalMixin],

  components: {
//     modal,
    SelectRoles,
    SelectLanguages
  },

  props: {
    show: Boolean
  },

  data () {
    return {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      roles: [],
      languages: [],
      selecteRoles: [],
      selecteLanguages: [],
      errors: {},
      error: ''
    }
  },

  watch: {
    show (val) {
      if (val) {
        this.name = ""
        this.username = ""
        this.email = ""
        this.password = ""
        this.confirmPassword = ""
        this.roles = []
        this.languages = []
        this.errors = {}
        this.error = ''
        this.$modal.show('add-user-modal');
      } else this.$modal.hide('add-user-modal');
    }
  },

  methods: {
    ok () {
      var self = this
      self.errors = {}
      self.error = ''
      let auth = this.$store.state.auth;
      let confirmed = auth.confirmRole('admin');
      let api = auth.getHttp();
      let newUser = {
        name: this.name,
        username: this.username,
        email: this.email,
        password: this.password,
        confirmPassword: this.confirmPassword,
        roles: this.roles,
        languages: this.languages,
      };
      api.post('/api/v1/users', newUser)
        .then(function(response){
          if (response.status == 200) {
            self.$emit('closed', true)
          } else {
            self.errors = response.validationErrors
          }
        })
        .catch(function(error){
          if (error.response && error.response.data) {
            self.errors = error.response.data.validationErrors
          } else {
            self.error = 'Failed'
          }
        });
    },
    cancel () {
      //this.$modal.hide('add-user-modal');
      this.$emit('closed', false)
    }
  }

}
</script>

<style lang="stylus">
#userAddModal
  i
    margin-right: 10px

  .v--modal-box.v--modal
    overflow: visible

  .modal-js-dialog
    width: 400px
    margin: 10px

    .modal-header
      position: relative
      border-bottom: 0 solid #e5e5e5
      width: 370px
      .modal-title
        display: inline-block
        font-size: 18px
        margin-top: 17px
        color: #00d1ff
        text-align: left
        float: left
      .fa.fa-user.user-icon
        font-size: 39px
        border: 1px solid
        width: 50px
        height: 50px
        text-align: center
        border-radius: 100%
        padding: 4px
        position: absolute
        right: 10px
        top: 34px
      .close
        margin-top: -2px

    .modal-body
      margin-top: 20px
      .form-group
        margin-bottom: 10px
        .input-group-addon
          width: 1%
          float: left
          background: 0 0
          border: 0
          font-size: 18px
          vertical-align: middle
          margin-right: 10px;
        .form-control
        select
          display: inline-block
          width: 85%
          margin: 0 10px
        select
          min-width: 134px
          max-width: 100%
          border-radius: 0
          padding: 5px
          border: 1px solid #efecec!important
          height: 31px
          color: #333
          margin: 0 10px
        .form-control
          min-width: 312px
          .btn-content
            margin: 2px 0
    .modal-footer
      width: 370px

.error-message {
  color: red; margin: .5em;
  border-radius: 5px;
  text-shadow: -1px -1px 10px rgba(255, 255, 0, 1);
  margin-left: 12%;
}

</style>
