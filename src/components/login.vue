<template>
  <div>
  <div class="user-modal-container active">
    <div class="user-modal">

      <!-- Login Form -->
      <div class="form-login" :class="{ 'active': active == 'login' }" id="form-login">
        <h3 class='title'>Login</h3>
        <div class="error-message" v-text="loginError"></div>
        <input type="text" name="user" placeholder="Email or Username" v-model="loginUser">
        <input type="password" name="password" placeholder="Password" v-model="loginPassword"
          @keyup="keycheck"
        >
        <input type="submit" :class="{ 'disabled': !(loginUser && loginPassword) }" @click="user_login" value="Login" />
        <div class="links"> <a @click="active = 'password'">Forgot your password?  <i class="fa fa-arrow-right"></i></a></div>
      </div>

      <!-- Password Reset Request -->
      <div class="form-password" :class="{ 'active': active == 'password' }">
        <h3 class='title'>Request Forgot Password Link</h3>
        <div class="error-message" v-text="passwordError"></div>
        <input type="text" name="email" placeholder="Email" v-model="passwordEmail">
        <input type="submit" :class="{'disabled': !passwordEmail || hasPasswordResetSuccess}" :disabled="hasPasswordResetSuccess" @click="user_passwordreset(passwordEmail)" value='Send Login Link'>
        <div class="links"><a @click="active = 'login'"> <i class="fa fa-arrow-left"></i> Back to Login</a></div>
      </div>
    </div>
  </div>
  <alert v-show="hasPasswordResetError" placement="top" duration="" type="danger" width="400px">
    <span class="icon-info-circled alert-icon-float-left"></span>
    <p>{{passwordResetError}}</p>
  </alert>
  <alert v-show="hasPasswordResetSuccess" placement="top" duration="" type="success" width="400px">
    <span class="icon-info-circled alert-icon-float-left"></span>
    <p>{{passwordResetSuccess}}</p>
  </alert>
</div>
</template>

<script>
import { mapActions } from 'vuex'
import superlogin from 'superlogin-client'
import axios from 'axios'
import { alert } from 'vue-strap'

export default {

  data () {
    return {
      active: 'login',

      // Modal text fields
      loginUser: '',
      loginPassword: '',
      passwordEmail: '',

      // Modal error messages
      loginError: '',
      passwordError: '',
      hasPasswordResetError: false,
      hasPasswordResetSuccess: false,
      passwordResetError: '',
      passwordResetSuccess: '',
      sessionInterval: null
    }
  },

  components: {
    alert
  },

  created () {
    superlogin.configure({
      serverUrl: process.env.ILM_API,
      endpoints: [process.env.ILM_DB],
      providers: [],
      checkExpired: true
    })

    superlogin.removeAllListeners('login');
    // login event
    superlogin.once('login', (session) => {
      if (session && session.expires) {
        if (this.sessionInterval) {
          clearInterval(this.sessionInterval);
        }
        let interval = (session.expires - Date.now()) / 2;
        if ((session.expires - Date.now()) / 2 < 0 || interval < 30000) {
          superlogin.refresh();
        }
        if (interval < 30000) {
          interval = 30000;
        }
        if (interval > 1000 * 60 * 60 * 3) {// 3 hours
          interval = 1000 * 60 * 60 * 3;
        }
        this.sessionInterval = setInterval(() => {
          //console.log(session.token, session.password)
          //console.log(this.$store.state.auth.getSession())
          superlogin.refresh()
            .then(() => {})
            .catch(err => {
              superlogin.logout()
                .then(() => {
                  location.href = '/';
                })
                .catch(() => {
                  location.href = '/';
                });
            });
        }, interval);
        //console.log('SET INTERVAL TO', interval)
      }
      if (session.token) {
        //console.log(session.token, session.password, session)
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + session.token + ':' + session.password;
        this.connectDB(session);
      }
    });

    // logout event
    superlogin.on('logout', (message) => {
      //console.log('logout?');
      if (this.sessionInterval) {
        clearInterval(this.sessionInterval);
      }
      this.disconnectDB();
      location.href = '/';
    })
  },

  methods: {
    ...mapActions([
      'destroyDB', 'connectDB', 'disconnectDB'
    ]),

    user_login () {
      if (!(this.loginUser && this.loginPassword)) {
        this.loginError = 'Both Password and Username are required'
        return
      }

      console.log('user_login');

      this.destroyDB()
      .then(()=>{
        console.log('do login');
        superlogin.login({
          username: this.loginUser,
          password: this.loginPassword
        }).then(result=> {
          if (!superlogin.confirmRole('admin') && !superlogin.confirmRole('librarian') && !superlogin.confirmRole('bookkeeper')){
            console.log(superlogin.confirmRole('admin'), superlogin.confirmRole('librarian'), superlogin.confirmRole('bookkeeper'));
            this.$router.push('assignments');
          }
        })
        .catch(error => {
          this.loginError = error.message
        })
      })

    },
    user_passwordreset (email) {
      var self = this
      if (email.length == 0){
        self.hasPasswordResetError = true
        self.passwordResetError = 'Please enter email to send you a password reset link'
        setTimeout(function(){self.hasPasswordResetError = false}, 5000)
      } else {
        if (!/\S+@\S+\.\S+/.test(email)) {
          self.hasPasswordResetError = true
          self.passwordResetError = 'Incorrect email format'
          setTimeout(function(){self.hasPasswordResetError = false}, 5000)
        } else {
          axios.post(process.env.ILM_API + '/api/v1/new-password', {'email': email}).then(function(response){
            console.log(response)
            if (response.data.ok === true) {
              //self.active = 'login'
              self.hasPasswordResetSuccess = true
              self.passwordResetSuccess = 'Link to reset password has been sent to your email'
              setTimeout(function(){self.hasPasswordResetSuccess = false}, 5000)
            } else {
            }
          })
          .catch(function(e){
            self.hasPasswordResetError = true
            //self.passwordResetError = e.response.data.message
            self.passwordResetError = 'ILM account for this email is not found'
            setTimeout(function(){self.hasPasswordResetError = false}, 5000)
          })
        }
      }
    },
    keycheck (event) {
      if (event.key === 'Enter') this.user_login()
    }

  }

}
</script>


<style scoped>
.user-modal-container * {
  box-sizing: border-box;
}

.user-modal-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  visibility: hidden;
  cursor: pointer;
  overflow-y: auto;
  z-index: 3;
  font-family: 'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif';
  font-size: 14px;
  background-color: rgba(17, 17, 17, .9);
  -webkit-transition: all 0.25s linear;
  -moz-transition: all 0.25s linear;
  -o-transition: all 0.25s linear;
  -ms-transition: all 0.25s linear;
  transition: all 0.25s linear;
}

.user-modal-container.active {
  opacity: 1;
  visibility: visible;
}

.user-modal-container .user-modal {
  position: relative;
  margin: 50px auto;
  width: 90%;
  max-width: 500px;
  background-color: #f6f6f6;
  cursor: initial;
}

.user-modal-container .form-login,
.user-modal-container .form-register,
.user-modal-container .form-password {
  padding: 5px 25px 25px;
  display: none;
}

.user-modal-container .form-login.active,
.user-modal-container .form-register.active,
.user-modal-container .form-password.active {
  display: block;
}

.user-modal-container ul.form-switcher {
  margin: 0;
  padding: 0;
}

.user-modal-container ul.form-switcher li {
  list-style: none;
  display: inline-block;
  width: 50%;
  float: left;
  margin: 0;
}

.user-modal-container ul.form-switcher li a {
  width: 100%;
  display: block;
  height: 50px;
  line-height: 50px;
  color: #666666;
  background-color: #dddddd;
  text-align: center;
}

.user-modal-container ul.form-switcher li a.active {
  color: #000000;
  background-color: #f6f6f6;
}

.user-modal-container input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #eeeeee;
}

.user-modal-container input[type="submit"] {
  color: #f6f6f6;
  border: 0;
  margin-bottom: 0;
  background-color: #3fb67b;
  cursor: pointer;
}

.user-modal-container input[type="submit"]:hover {
  background-color: #3aa771;
}

.user-modal-container input[type="submit"]:active {
  background-color: #379d6b;
}

.user-modal-container .links {
  text-align: center;
  padding-top: 25px;
}

.user-modal-container .links a {
  color: #3fb67b; cursor: pointer;
}

.user-modal-container input[type="submit"].disabled {
  background-color: #98d6b7;
}

a.switchlink {cursor: pointer;}
a.switchlink.active {cursor: default;}
a.switchlink.active:hover {text-decoration: none;}

.error-message {color: red; margin: .5em;
  border-radius: 5px;
  text-shadow: -1px -1px 10px rgba(255, 255, 0, 1);
}

.title {margin-bottom: 1em; margin-top:.75em;}

</style>
