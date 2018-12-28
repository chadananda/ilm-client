<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook" class="sidebar-bookmeta">
      <div class='booktopinfo'>
        <div class='coverimg' @click="bookEditCoverModalActive = true">
          <img height="80" v-if="currentBook.coverimg" v-bind:src="currentBook.coverimg" />
          <div v-else class='coverimg-wrap'></div>
        </div>
        <template v-if="isAdmin">
          <button class="hidden" v-on:click="removeBook()">Remove</button>
        </template>
        <h4 class='title'>{{ currentBook.title }}</h4>
        <h5 class='subtitle' v-if='currentBook.subtitle'>{{ currentBook.subtitle }}</h5>
        <h5 class='author'>{{ currentBook.author && Array.isArray(currentBook.author) ? currentBook.author.join(',') : currentBook.author }},
        <span class="pages">{{ Math.round(currentBook.wordcount / 300) }} pages &nbsp;
        </span></h5>
        <div style='clear: both'> </div>
      </div>

      <div class="row">
      <div class="download-area col-sm-6">
        <!-- <button id="show-modal" @click="downloadBook" class="btn btn-primary btn_download">
          <img src='/static/download.png' class='bookstack'/>
        </button> -->
      </div>
      </div>

      <BookDownload v-if="showModal" @close="showModal = false" />
      <AudioImport v-if="showModal_audio" @close="showModal_audio = false"
        @audiofilesUploaded="getAudioBook"
        :book="currentBook"
        :importTask="importTask"
        :allowDownload="false" />

      <div class="book-listing">
        <div class="row">
          <template v-if="tc_hasTask('metadata_cleanup') || tc_hasTask('audio_mastering')">
            <template v-if="tc_hasTask('metadata_cleanup')">
              <div v-if="!textCleanupProcess" class="editing-wrapper">
                <button class="col-sm-4 btn btn-primary btn-edit-complete" v-on:click="showSharePrivateBookModal = true" :disabled="!isAllowEditingComplete">Editing complete</button>
                <div class="col-sm-8 blocks-counter">
                  <router-link :to="goToUnresolved(true)"><span class="blocks-counter-value">{{blocksToApproveCounter}}</span>Blocks need your approval</router-link>
                </div>
              </div>
              <div v-else class="preloader-small"></div>
            </template>
            <template v-if="tc_hasTask('audio_mastering')">
              <div v-if="currentBookCounters.not_proofed_audio_blocks === 0">
                <div v-if="!audioMasteringProcess" class="editing-wrapper">
                  <div class="col-sm-8 blocks-counter">
                    <span class="blocks-counter-value">0</span>Blocks need your approval
                  </div>
                </div>
              </div>
              <template v-else>
                <div v-if="!audioMasteringProcess" class="editing-wrapper">
                  <button class="col-sm-4 btn btn-primary btn-edit-complete" v-on:click="showAudioMasteringModal = true" :disabled="!isAllowEditingComplete">Mastering complete</button>
                  <div class="col-sm-8 blocks-counter">
                    <router-link :to="goToUnresolved()"><span class="blocks-counter-value">{{blocksToApproveCounter}}</span>Blocks need your approval</router-link>
                  </div>
                </div>
                <div v-else class="preloader-small"></div>
              </template>
            </template>
          </template>
          <template v-else>
            <div class="editing-wrapper">
              <div class="col-sm-8 blocks-counter">
                <router-link :to="goToUnresolved(true)"><span class="blocks-counter-value">{{blocksToApproveCounter}}</span>Blocks need your approval</router-link>
              </div>
            </div>
          </template>
        </div>
        <vue-tabs ref="panelTabs" class="meta-edit-tabs">
          <vue-tab title="TOC" id="book-toc">
            <BookToc ref="bookToc"
              :bookId="currentBook.bookid"
            ></BookToc>
          </vue-tab>
          <vue-tab title="Audio Integration" id="audio-integration">
            <div class="t-box">
              <template>
                <div class="btn-switch" @click="toggleMastering()">
                  <i class="fa fa-toggle-on" v-if="currentBook.masteringRequired"></i>
                  <i class="fa fa-toggle-off" v-else></i>
                  <span class="s-label"> Mastering required</span>
                </div>
              </template>
              <a v-if="!isAllowExportAudio" class="btn btn-primary btn-small btn-export-audio -disabled">
                Export Audio
              </a>
              <button v-else class="btn btn-primary btn-small btn-export-audio" v-on:click="startGenerateAudiofile()">
                Export Audio
              </button>
            </div>
            <div v-if="blockSelection.start._id && blockSelection.end._id" class="t-box block-selection">
              {{alignCounter.countAudio}} audio, {{alignCounter.countTTS}} TTS block in range
              <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> -
              <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
            </div>
            <div v-else class="t-box red-message">Define block range</div>
            <BookAudioIntegration ref="audioIntegration"
                :isActive="activeTabIndex == 1"
                @onTtsSelect="ttsUpdate"
                @uploadAudio="showModal_audio = true"
              ></BookAudioIntegration>
          </vue-tab>
          <vue-tab title="Book Content" id="book-content">
            <fieldset>
              <legend>Book Metadata </legend>
              <table class='properties'>

                <tr class='bookid'>
                  <td>Book Id</td>
                  <td class='disabled'>{{currentBook.bookid}}</td>
                </tr>

                <tr class='title'>
                  <td>Title</td>
                  <td><input v-model='currentBook.title' @input="update('title', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='subtitle'>
                  <td>Subtitle</td>
                  <td><input v-model='currentBook.subtitle' @input="update('subtitle', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='author'>
                  <td>Author</td>
                  <td>
                    <template v-for="(author, i) in currentBook.author" >
                      <input v-model='currentBook.author[i]' @input="update('author', $event)" :disabled="!allowMetadataEdit"><button v-on:click="removeAuthor(i)" :class="{'disabled': i == 0 && currentBook.author.length == 1}" :disabled="!allowMetadataEdit"><i class="fa fa-minus-circle" ></i></button>
                    </template>
                    <button v-on:click="addAuthor" :disabled="!allowMetadataEdit"><i class="fa fa-plus-circle"></i></button>
                  </td>
                </tr>

                <tr class='category'>
                  <td>Category</td>
                  <td>
                    <select class="form-control" v-model='currentBook.category' @change="change('category')" :key="currentBookid" :disabled="!allowMetadataEdit">
                      <option v-for="(value, index) in subjectCategories" :value="value">{{ value }}</option>
                    </select>
                  </td>
                </tr>

                <tr class='language'>
                  <td>Language</td>
                  <td>
                    <select class="form-control" v-model='currentBook.language' @change="change('language')" :key="currentBookid" :disabled="!allowMetadataEdit || currentBookMeta.collection_id">
                      <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                    </select>
                  </td>
                </tr>

<!--                <tr class='sections'>
                  <td>Sections</td>
                  <td><input v-model='currentBook.sectionName' @input="update('sectionName', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>-->

                <tr class='trans'>
                  <td>Translator</td>
                  <td><input v-model='currentBook.translator' @input="update('translator', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='transfrom'>
                  <td>Tr From</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td><input v-model="currentBook.transfrom" @input="update('transfrom', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='collection'>
                  <td>Collection</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td>
                    <select @input="updateCollection($event)" :disabled="!allowMetadataEdit" class="form-control" v-model="currentBook.collection_id">
                      <option v-model="currentBook.collection_id" v-for="c in collectionsList" :value="c._id">{{c.title}}</option>
                    </select>
                  </td>
                </tr>

              </table>
            </fieldset>

          <fieldset class='description brief'>
            <legend>Brief Description </legend>
            <textarea v-model='currentBook.description_short' @input="update('description_short', $event)" :disabled="!allowMetadataEdit"></textarea>
          </fieldset>

          <fieldset class='description long'>
            <legend>Long Description </legend>
            <textarea v-model='currentBook.description' @input="update('description', $event)" :disabled="!allowMetadataEdit"></textarea>
          </fieldset>
          <fieldset class="publish">
            <!-- Fieldset Legend -->
            <template>
              <legend>{{ currentBook.published ? 'Published' : 'Unpublished' }},
              </legend>
              <div>
                Version #{{ currentBook.version ? currentBook.version : '1.0' }}
              </div>
              <div v-if="publicationStatus" >
                Status #{{ publicationStatus }}
              </div>
              <div v-if="currentBook.publishedVersion">Published version {{currentBook.publishedVersion}}</div>
              <div v-if="allowPublishCurrentBook">
                <button disabled class="btn btn-primary" v-if="isPublishingQueue">Already in queue</button>
                <button class="btn btn-primary" v-on:click="publish()" v-if="!isPublishingQueue && !isPublishing">Publish</button>
                <span v-if="isPublishing" class="align-preloader -small"></span>

              </div>
              <button class="btn btn-primary hidden" v-on:click="publishContent()">Publish Content</button>
            </template>

            <!-- Publication Options -->
            <!-- <table class='properties publication'>
              <template v-if="currentBook.importStatus == 'staging'">
                <tr><td rowspan='2'>
                  <button class="btn btn-primary sharebtn" @click="shareBook"> Move book to Library</button>
                </td></tr>
              </template>
              <template v-else>

                <tr><td>Published</td> <td class='published'>
                  <i :class="[currentBook.published ? 'fa-toggle-on' : 'fa-toggle-off', 'fa pubtoggle']"
                    @click='publishedToggle'
                  ></i>
                </td></tr>

                <tr v-if="currentBook.published"><td>Type</td> <td class='pubtype'>
                  <select class="form-control" v-model='currentBook.pubType'>
                    <option v-for="(value, index) in pubTypes" :value="value">{{ value }}</option>
                  </select>
                </td></tr>

                <tr v-if="currentBook.published"><td>Ver. #{{ currentBook.version }}</td> <td class='version'>
                  <button class="btn btn-primary new-version" @click="newVersion"> Save New Version</button>
                </td></tr>

              </template>
            </table> -->
          </fieldset>
          <template v-if="isAdmin || isLibrarian || _is('editor', true)">
            <a v-if="currentBook.published" class="btn btn-default" :href="downloadDemo()" target="_blank">Download demo HTML</a><!-- download :href="'/books/' + currentBook._id + '/edit'" v-on:click="downloadDemo()" -->
          </template>
        </vue-tab>

        <vue-tab title="Styles" :id="'styles-switcher'" :disabled="!allowMetadataEdit">
        <!--<accordion :one-at-atime="true" ref="accordionStyles">

          <panel :is-open="true" header="Selected blocks styles"
            v-bind:key="'block-styles'" ref="panelBlockStyles">-->
            <div class="styles-catalogue">

              <vue-tabs ref="blockTypesTabs" class="block-style-tabs">

                <vue-tab title="Book" :id="'global-styles-switcher'">
                  <fieldset class="block-style-fieldset">
                  <legend>Book styles</legend>
                  <div>
                    <label class="style-label"
                      @click="$event.target.value = ''; update('styles.global', $event)">
                      <i v-if="!currentBook.styles.global || currentBook.styles.global === ''"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    ILM</label>
                  </div>
                  <div>
                    <label class="style-label"
                      @click="$event.target.value = 'global-ocean'; update('styles.global', $event)">
                      <i v-if="currentBook.styles.global === 'global-ocean'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    Ocean</label>
                  </div>
                  <div>
                    <label class="style-label"
                      @click="$event.target.value = 'global-ffa'; update('styles.global', $event)">
                      <i v-if="currentBook.styles.global === 'global-ffa'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      FFA</label>
                  </div>
                  </fieldset>

                  <fieldset class="block-style-fieldset">
                  <legend>Automatic numeration</legend>
                  <div>
                    <label class="style-label"
                      @click="liveUpdate('numeration', 'x')">
                      <i v-if="currentBook.numeration === 'x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x</label>
                  </div>
                  <div>
                    <label class="style-label"
                      @click="liveUpdate('numeration', 'x_x')">
                      <i v-if="currentBook.numeration === 'x_x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x.x</label>
                  </div>
                  <!--<div>
                    <label class="style-label"
                      @click="liveUpdate('numeration', 'auto')">
                      <i v-if="currentBook.numeration === 'auto'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      Autoincrement</label>
                  </div>-->
                  <div>
                    <label class="style-label"
                      @click="liveUpdate('numeration', 'none')">
                      <i v-if="currentBook.numeration === 'none'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      Off</label>
                  </div>
                  </fieldset>

                </vue-tab>

                <vue-tab :title="blockType"
                  :disabled="!(styleTabs.has(blockType))"
                  v-for="(val, blockType) in blockTypes"
                  :id="'block-type-'+blockType" :key="blockType">

                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['header'].indexOf(blockType) > -1">
                    <legend>numeration</legend>
                    <label class="block-style-label"
                      @click="selSecNum(blockType, 'secNum', numProps.get(blockType).get('secNum'))">
                      <template v-if="numProps.get(blockType).get('secNum') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secNum') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Numbered section
                    </label>
                    <label v-if="numProps.get(blockType).get('secNum') === false" class="block-style-label">
                      <i class="fa fa-square-o"></i>
                      Hide from display
                    </label>
                    <label v-else class="block-style-label"
                      @click="selSecNum(blockType, 'secHide', numProps.get(blockType).get('secHide'))">
                      <template v-if="numProps.get(blockType).get('secHide') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secHide') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Hide from display
                    </label>
                  </fieldset>
                  <fieldset v-if="blockType === 'header' && styleTabs.get(blockType)" class="block-style-fieldset block-num-fieldset">
                    <legend>Type</legend>
                    <label v-for="sVal in blockTypes[blockType]['level']"
                          @click="selectStyle(blockType, 'level', sVal)"
                          class="block-style-label"
                          :key="blockType + 'level' + sVal"
                          :id="blockType + 'level' + sVal">

                          <template v-if="styleTabs.get(blockType).get('level').size > 1">
                            <i class="fa fa-dot-circle-o"
                            v-if="styleTabs.get(blockType).get('level').has(sVal.length?sVal:'none')"
                            ></i>
                            <i v-else class="fa fa-circle-o"></i>
                          </template>

                          <template v-else>
                            <i v-if="styleTabs.get(blockType).get('level').has(sVal.length?sVal:'none')"
                            class="fa fa-check-circle-o"></i>
                            <i v-else class="fa fa-circle-o"></i>
                          </template>

                          <template v-if="sVal.length">{{styleValue(blockType, 'level', sVal)}}</template>
                          <template v-else>none</template>
                        </label>
                  </fieldset>

                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['par'].indexOf(blockType) > -1">
                    <legend>numeration</legend>
                    <label class="block-style-label"
                      @click="selSecNum(blockType, 'parNum', numProps.get(blockType).get('parNum'))">
                      <template v-if="numProps.get(blockType).get('parNum') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('parNum') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Numbered
                    </label>
                    <label v-if="numProps.get(blockType).get('parNum') === false" class="block-style-label">
                      <i class="fa fa-square-o"></i>
                      Hide from display
                    </label>
                    <label v-else class="block-style-label"
                      @click="selSecNum(blockType, 'secHide', numProps.get(blockType).get('secHide'))">
                      <template v-if="numProps.get(blockType).get('secHide') == 'mixed'">
                        <i class="fa fa-plus-square-o" aria-hidden="true"></i>
                      </template>
                      <template v-else>
                        <i v-if="numProps.get(blockType).get('secHide') == false" class="fa fa-square-o" aria-hidden="true"></i>
                        <i v-else class="fa fa-check-square-o -checked" aria-hidden="true"></i>
                      </template>
                      Hide from display
                    </label>
                  </fieldset>
                  <i>Please keep defaults unless you have a compelling reason to change them</i>
                  <template v-for="(styleArr, styleKey) in blockTypes[blockType]">

                      <fieldset v-if="styleTabs.has(blockType) && styleTabs.get(blockType).has(styleKey) && styleArr.length && (styleKey !== 'level' || blockType !== 'header')" :key="styleKey" class="block-style-fieldset">
                      <legend>{{styleCaption(blockType, styleKey)}}</legend>

                        <label v-for="sVal in styleArr"
                          @click="selectStyle(blockType, styleKey, sVal)"
                          class="block-style-label"
                          :key="blockType + styleKey.replace(' ', '') + sVal"
                          :id="blockType + styleKey.replace(' ', '') + sVal">

                          <template v-if="styleTabs.get(blockType).get(styleKey).size > 1">
                            <i class="fa fa-dot-circle-o"
                            v-if="styleTabs.get(blockType).get(styleKey).has(sVal.length?sVal:'none')"
                            ></i>
                            <i v-else class="fa fa-circle-o"></i>
                          </template>

                          <template v-else>
                            <i v-if="styleTabs.get(blockType).get(styleKey).has(sVal.length?sVal:'none')"
                            class="fa fa-check-circle-o"></i>
                            <i v-else class="fa fa-circle-o"></i>
                          </template>

                          <template v-if="sVal.length">{{styleValue(blockType, styleKey, sVal)}}</template>
                          <template v-else>none</template>
                        </label>

                      </fieldset>

                  </template>

                </vue-tab>

              </vue-tabs>

            </div>
            <!--<div class="styles-catalogue">-->
          <!--</panel>

          <panel :is-open="false" header="Book styles"
            v-bind:key="'book-styles'" ref="panelBookStyles">

            <div class="styles-catalogue">

              <vue-tabs ref="stylesTabs">

                <vue-tab title="Styles" :id="'global-styles-switcher'">
                  <div>
                    <input type="radio" :id="'gs-default'" :value="''" v-model="currentBook.styles.global" @change="update('styles.global', $event)">
                    <label :for="'gs-default'" class="style-label">ILM</label>
                  </div>
                  <div>
                    <input type="radio" :id="'gs-ocean'" :value="'global-ocean'" v-model="currentBook.styles.global" @change="update('styles.global', $event)">
                    <label :for="'gs-ocean'" class="style-label">Ocean</label>
                  </div>
                  <div>
                    <input type="radio" :id="'gs-ffa'" :value="'global-ffa'" v-model="currentBook.styles.global" @change="update('styles.global', $event)">
                    <label :for="'gs-ffa'" class="style-label">FFA</label>
                  </div>
                </vue-tab>
                <vue-tab title="Fonts" :id="'fonts-styles-switcher'">
                  <div>
                    <input type="radio" :id="'ft-default'" :value="''" v-model="currentBook.styles.font" @change="update('styles.font', $event)">
                    <label :for="'ft-default'" class="style-label">default</label>
                  </div>
                  <div>
                    <input type="radio" :id="'ft-typewriter'" :value="'typewriter'" v-model="currentBook.styles.font" @change="update('styles.font', $event)">
                    <label :for="'ft-typewriter'" class="style-label">typewriter</label>
                  </div>
                  <div>
                    <input type="radio" :id="'ft-monospace'" :value="'monospace'" v-model="currentBook.styles.font" @change="update('styles.font', $event)">
                    <label :for="'ft-monospace'" class="style-label">monospace</label>
                  </div>
                  <div>
                    <input type="radio" :id="'ft-oldbook'" :value="'oldbook'" v-model="currentBook.styles.font" @change="update('styles.font', $event)">
                    <label :for="'ft-oldbook'" class="style-label">oldbook</label>
                  </div>
                </vue-tab>
                <vue-tab title="Align" :id="'align-styles-switcher'">

                  <div v-for="(align, key) in blockTypes.par['align']" >
                    <input type="radio" :id="'pt-'+align" :value="align" v-model="currentBook.styles.align" @change="update('styles.align', $event)">
                    <label :for="'pt-'+align" class="style-label">{{align.length ? align : 'default'}}</label>
                  </div>
                </vue-tab>
                <vue-tab title="Par" :id="'paragraphs-styles-switcher'">
                  <div v-for="(type, key) in blockTypes.par['paragraph type']" >
                    <input type="radio" :id="'pt-'+type" :value="type" v-model="currentBook.styles.parType" @change="update('styles.parType', $event)">
                    <label :for="'pt-'+type" class="style-label">{{type.length ? type : 'default'}}</label>
                  </div>
                </vue-tab>
                <vue-tab title="HR" :id="'hr-styles-switcher'">
                  <div v-for="(size, key) in blockTypes.hr['size']" >
                    <input type="radio" :id="'pt-'+size" :value="(size.length ?'global-hr-':'')+ size" v-model="currentBook.styles.hrSize" @change="update('styles.hrSize', $event)">
                    <label :for="'pt-'+size" class="style-label">{{size.length ? size : 'default'}}</label>
                  </div>
                </vue-tab>

            </vue-tabs>

            </div>
            <!--<div class="styles-catalogue">-->
          <!--</panel>

        </accordion>-->

        </vue-tab>
      </vue-tabs>
      </div>
    </div>

    <book-edit-cover-modal
      :show="bookEditCoverModalActive"
      @closed="bookEditCoverModalActive = false"
      :img="currentBook"
    ></book-edit-cover-modal>

    <alert v-model="hasError" placement="top" type="danger" width="400px" :dismissable="true">
      <span class="icon-ok-circled alert-icon-float-left"></span>

      <p>{{errorMessage}}.</p>
    </alert>

    <alert v-model="hasMessage" placement="top" :duration="3000" type="info" width="400px">
      <span class="icon-ok-circled alert-icon-float-left"></span>

      <p>{{infoMessage}}.</p>
    </alert>

    <modal v-model="showSharePrivateBookModal" effect="fade" ok-text="Complete" cancel-text="Close" title="" @ok="sharePrivateBook()">
      <div v-html="sharePrivateBookMessage"></div>
    </modal>
    <!-- <modal v-model="unlinkCollectionWarning" effect="fade" ok-text="Remove" cancel-text="Cancel" @ok="updateCollection()" @cancel="cancelCollectionUpdate">
      <p>Remove book from collection?</p>
    </modal> -->
    <modal v-model="showAudioMasteringModal" effect="fade" ok-text="Complete" cancel-text="Cancel" @ok="completeAudioMastering()">
      <p>Complete mastering?</p>
    </modal>
    <modal v-model="generatingAudiofile" :backdrop="false" effect="fade">
      <div slot="modal-header" class="modal-header">
        <h4>Export audio</h4>
      </div>
      <div slot="modal-body" class="modal-body download-audiofile">
          <template  v-if="!currentBook.mergedAudiofile">
            <div>Generating audiofile</div>
            <div class="align-preloader"></div>
          </template>
          <div v-else>
            <a class="btn btn-primary" :href="mergedAudiofileLink" target="_blank">Download</a>
          </div>
      </div>
      <div slot="modal-footer" class="modal-footer">
        <a v-if="currentBook.mergedAudiofile" v-on:click="generatingAudiofile = false" class="btn btn-default">Cancel</a>
      </div>
    </modal>

  </div>

</template>

<script>
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import { BlockTypes, BlockTypesAlias } from '../../store/bookBlock'
import superlogin from 'superlogin-client'
import BookDownload from './BookDownload'
import BookEditCoverModal from './BookEditCoverModal'
import BookAudioIntegration from './BookAudioIntegration'
import AudioImport from '../audio/AudioImport'
import BookToc from './BookToc'
import _ from 'lodash'
import PouchDB from 'pouchdb'
import axios from 'axios'
import { alert, modal, accordion, panel } from 'vue-strap'
import task_controls from '../../mixins/task_controls.js'
import api_config from '../../mixins/api_config.js'
import access from '../../mixins/access.js'
import { Languages } from "../../mixins/lang_config.js"
import { VueTabs, VTab } from 'vue-nav-tabs'
var BPromise = require('bluebird');

export default {

  name: 'BookMetaEdit',

  components: {
    BookDownload,
    BookEditCoverModal,
    AudioImport,
    BookToc,
    BookAudioIntegration,
    'vue-tabs': VueTabs,
    'vue-tab': VTab,
    alert,
    modal,
    accordion,
    panel
  },

  data () {
    return {
      pubTypes: [
        'Public', 'Hidden', 'Encumbered', 'Research', 'Private'
      ],
      subjectCategories: [
        'Stories', 'Verse', 'History', 'Ideas', 'Science'
      ],
      styleTitles: {
        'title_style': 'type'
      },
      languages: Languages,
      dirty: {
      },
      visible: true,
      showModal: false,
      showModal_audio: false,
      bookEditCoverModalActive: false,
      currentBook: {},
      cleanupTask: {},
      masteringTask: {},
      importTask: {},
      linkTaskError: '',
      isOwner: false,
      errorMessage: '',//to display validation errors for some cases, e.g. on sharing book
      hasError: false,//has some validation error, e.g. on sharing book
      hasMessage: false,//has some info message
      infoMessage: '',//to display info on action finished
      approveMetadataComment: '',
      showSharePrivateBookModal: false,
      showAudioMasteringModal: false,
      allowMetadataEdit: false,
      textCleanupProcess: false,
      //audiobook: {},
      unlinkCollectionWarning: false,
      blockTypes: BlockTypes,
      audioMasteringProcess: false,
      generatingAudiofile: false,
      audiobookChecker: false,

      // set blocks properties
      styleTabs: new Map(),
      numProps: new Map(),
      activeTabIndex: 0,
      isPublishing: false,
      isPublishingQueue: false,
      publicationStatus: false
    }
  },

  props: [

  ],

  computed: {

    ...mapGetters({
      currentBookid: 'currentBookid',
      currentBookMeta: 'currentBookMeta',
      currentBookFiles: 'currentBookFiles',
      isLibrarian: 'isLibrarian',
      isEditor: 'isEditor',
      isAdmin: 'isAdmin',
      bookCollections: 'bookCollections',
      allowPublishCurrentBook: 'allowPublishCurrentBook',
      currentBookBlocksLeft: 'currentBookBlocksLeft',
      currentBookBlocksLeftId: 'currentBookBlocksLeftId',
      currentBookAudioExportAllowed: 'currentBookAudioExportAllowed',
      currentBookCounters: 'currentBookCounters',
      tc_currentBookTasks: 'tc_currentBookTasks',
      tc_tasksByBlock: 'tc_tasksByBlock',
      storeList: 'storeList',
      storeListO: 'storeListO',
      blockSelection: 'blockSelection',
      alignCounter: 'alignCounter',
      audiobook: 'currentAudiobook'}),
    collectionsList: {
      get() {
        let list = [{'_id': '', 'title' :''}];
        this.bookCollections.forEach(c => {
          if (c.language == this.currentBookMeta.language) {
            list.push(c);
          }
        });
        return list;
      }
    },

    suggestTranslatedId: function () {
      if (this.currentBook) return this.currentBook.bookid.split('-').slice(0, -1).join('-') + '-?'
    },

    isAllowExportAudio: {
      get() {
        if (!this._is('editor')) {
          return false;
        }
        if (this.tc_hasTask('audio_mastering')) {
          return true;
        }
        return false;
      }
    },
    isAllowEditingComplete: {
      get() {
        if (this.tc_hasTask('metadata_cleanup')) {
          if (this.currentBookCounters.not_marked_blocks === 0) {
            return true;
          }
        } else if (this.tc_hasTask('audio_mastering')) {
          if (this.currentBookCounters.not_marked_blocks === 0) {
            return true;
          }
        }
        return false;
      }
    },
    sharePrivateBookMessage: {
      get() {
        if (this.currentBookCounters.narration_blocks > 0) {
          return 'Complete editing and request narration for ' + this.currentBookCounters.narration_blocks + ' blocks?'
        } else {
          return 'Complete editing?';
        }
      }
    },
    mergedAudiofileLink: {
      get() {
        if (this.currentBook.mergedAudiofile) {
          return process.env.ILM_API + this.currentBook.mergedAudiofile
        } else {
          return '';
        }
      }
    },
    blocksToApproveCounter: {
      get() {
        if (this.tc_hasTask('metadata_cleanup') || this.tc_hasTask('audio_mastering')) {
          if (this.tc_hasTask('metadata_cleanup')) {
              return this.currentBookCounters.not_marked_blocks;
          }
          if (this.tc_hasTask('audio_mastering')) {
            if (this.currentBookCounters.not_proofed_audio_blocks === 0) {
              return 0;
            } else {
              return this.currentBookCounters.not_marked_blocks;
            }
          }
        } else {
          return this.tc_currentBookTasks.tasks.length;
        }
      }
    },
    selectionStart() {
      return this.blockSelection.start._id ? this.blockSelection.start._id : false;
    },
    selectionEnd() {
      return this.blockSelection.end._id ? this.blockSelection.end._id : false;
    }
  },

  mixins: [task_controls, api_config, access],

  mounted() {
    //this.allowMetadataEdit = (this.isLibrarian && this.currentBook && this.currentBook.private == false) || this.isEditor || this.isAdmin
    this.allowMetadataEdit = this.isEditor || this.isAdmin
    let self = this;
    //this.loadAudiobook(true)
    this.getAudioBook(this.currentBookid)
      .then(() => {
        if (this.currentAudiobook) {

        }
      });
    this.$root.$on('from-bookblockview:voicework-type-changed', function() {
      self.setCurrentBookCounters(['narration_blocks', 'not_marked_blocks']);
      self.getAudioBook();
    });
    this.setCurrentBookCounters();
    this.$root.$on('from-block-edit:set-style', this.listenSetStyle);

    if (this.selectionStart && this.selectionEnd) {
      this.collectCheckedStyles(this.selectionStart, this.selectionEnd)
    }
    $('body').on('click', '.vue-tabs.meta-edit-tabs li.tab', () => {
      this.activeTabIndex = this.$refs.panelTabs ? this.$refs.panelTabs.activeTabIndex : null;
    });
  },
  beforeDestroy: function () {
    this.$root.$off('uploadAudio');
    this.$root.$off('audiobookUpdated');
    this.$root.$off('from-bookblockview:voicework-type-changed');
    this.$root.$off('book-reimported');
    this.$root.$off('from-block-edit:set-style', this.listenSetStyle);
  },

  watch: {

    currentBookMeta: {
      handler (val) {
        this.init()
      },
      deep: true
    },
    currentBookFiles: {
      handler (val) {
        this.currentBook.coverimg = this.currentBookFiles.coverimg
      },
      deep: true
    },
    errorMessage: {
      handler(val) {
        this.hasError = val.length > 0
      },
      deep: true
    },
    hasError: {
      handler(val) {
        if (val === false) {
          this.errorMessage = ''
        }
      },
      deep: true
    },
    infoMessage: {
      handler(val) {
        this.hasMessage = val.length > 0
      },
      deep: true
    },
    hasMessage: {
      handler(val) {
        if (val === false) {
          this.infoMessage = ''
        }
      },
      deep: true
    },
    currentBookBlocksLeft: {
      handler(val) {

      }
    },
    audiobook: {
      handler(val) {

      },
      deep: true
    },
    'unlinkCollectionWarning': {
      handler(val) {
        if (val === true) {
          this.$root.$emit('show-modal', {
            title: 'Remove book from collection?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.cancelCollectionUpdate();
                },
              },
              {
                title: 'Remove',
                handler: () => {
                  this.updateCollection();
                },
                'class': 'btn btn-primary'
              }
            ],
            class: ['align-modal']
          });
        } else {
          this.$root.$emit('hide-modal');
        }
      }
    },

    'blockSelection.start._id': {
      handler(val, oldVal) {
        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
      }
    },
    'blockSelection.end._id': {
      handler(val, oldVal) {
        if (this.blockSelection.start._id && this.blockSelection.end._id && this.blockSelection.start._id !== this.blockSelection.end._id) {
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
        }
      }
    },
    'currentBook.publicationStatus': {
      handler(val) {
        this.publicationStatus = val;
      }
    },
    'currentBook.isIntheProcessOfPublication': {
      handler(val) {
        console.log(val)
        this.isPublishing = !!val;
      }
    },
    'currentBook.isInTheQueueOfPublication': {
      handler(val) {
        this.isPublishingQueue = !!val;
      }
    }

  },

  created () {
    this.init()
  },

  methods: {

    init () {
      for (let id in this.$store.state.tc_currentBookTasks.tasks) {
        let record = this.$store.state.tc_currentBookTasks.tasks[id]
        if (record.type == 'text-cleanup') {
         this.cleanupTask = record
        } else if (record.type == 'import-book') {
          this.importTask = record
        } else if (record.type === 'master-audio') {
          this.masteringTask = record;
        }
      }
      this.currentBook = Object.assign({}, this.currentBookMeta);
      this.currentBook.coverimg = this.currentBookFiles.coverimg;
      this.isOwner = this.currentBook.owner == superlogin.getSession().user_id;
      if (this.currentBook.author && !Array.isArray(this.currentBook.author)) {
        this.currentBook.author = [this.currentBook.author];
      }
      //this.loadAudiobook();
      /*this.setCurrentBookBlocksLeft(this.currentBook._id)
        .then(() => {

        });*/
    },
    updateCollection(event) {
      if (event && event.target.value) {
        let collectionId = event.target.value;
        let api_url = this.API_URL + 'collection/' + collectionId + '/link_books';
        let api = this.$store.state.auth.getHttp();
        let self = this;
        api.post(api_url, {books_ids: [this.currentBook._id]}, {}).then(function(response){
          self.unlinkCollectionWarning = false;
          if (response.status===200) {
            self.$router.push('/books');
            self.visible = false;
          } else {

          }
        }).catch((err) => {
          self.unlinkCollectionWarning = false;
        });
      } else if (event) {
        this.unlinkCollectionWarning = true;
      } else {
        let collection_id = this.currentBookMeta.collection_id;
        let api_url = this.API_URL + 'collection/' + collection_id + '/unlink_books';
        let api = this.$store.state.auth.getHttp();
        let self = this;
        api.post(api_url, {books_ids: [this.currentBook._id]}, {}).then(function(response){
          self.unlinkCollectionWarning = false;
          if (response.status===200) {
            self.$router.push('/collections/' + collection_id);
          } else {

          }
        }).catch((err) => {
          self.unlinkCollectionWarning = false;
        });
      }
    },

    cancelCollectionUpdate() {
      this.unlinkCollectionWarning = false;
      this.currentBook.collection_id = this.currentBookMeta.collection_id;
    },

    ttsUpdate(key, value) {
      this.liveUpdate(key, value)
    },

    change (key) {
      this.liveUpdate(key, this.currentBook[key])
    },

    update: _.debounce(function (key, event) {
      this.liveUpdate(key, key == 'author' ? this.currentBook.author : event.target.value)
    }, 500),

    liveUpdate (key, value) {
      var keys = key.split('.');
      key = keys[0];
      if (keys.length > 1) {
          this.currentBook[keys[0]][keys[1]] = value;
          value = this.currentBook[keys[0]];
      }
      //console.log('key', key, value);

      var update = {
        [key]: value
      }

      // Batch updates
      if (key === 'language') {
        update.voices = false;
      }

      //console.log('update', update);
      //if (true) return;
      this.freeze('updateBookMeta');
      return this.updateBookMeta({id: this.currentBookid, update: update})
      .then(doc => {
        if (key == 'numeration') {
          this.unfreeze('updateBookMeta');
          this.$root.$emit('from-meta-edit:set-num', this.currentBookid, value);
          //this.$root.$emit('from-book-meta:upd-toc', true);
        }
        //console.log('success DB update: ', doc)
        return this.updateBookVersion({minor: true})
          .then(() => {
            //this.unfreeze('updateBookMeta');
            return BPromise.resolve(doc);
          })
          .catch(err => {
            //console.log(err);
            this.unfreeze('updateBookMeta');
            return BPromise.reject(err);
          });
      }).catch(err => {
        //console.log('error DB pdate: ', err)
        this.unfreeze('updateBookMeta');
        return BPromise.reject(err)
      })
    },

    languageName (code) {
      if (this.languages[code]) return this.languages[code]
    },
    publishedToggle () {
      this.currentBook.published = !this.currentBook.published
    },
    shareBook () {
      if (confirm('This will share the book with the entire library. Usually this is done after rudimentary formatting and text cleanup. Are you sure it is ready?')) {
        this.currentBook.published = 'false'
        this.currentBook.pubType = 'Hidden'
        this.currentBook.version = '1.0'
        this.currentBook.importStatus = 'shared'
      }
    },
    newVersion () {
      this.currentBook.version = (parseFloat(this.currentBook.version) + 0.1).toFixed(1).toString()
    },
    toggleVisibility () {
      this.visible = !this.visible
    },

    downloadBook () {
      this.showModal = true
    },

    uploadAudio () {
      this.showModal_audio = true
    },

    linkTask() {
      let self = this
      self.linkTaskError = ''
      if (!self.cleanupTask._id) {
        self.linkTaskError = 'Required'
      } else {
        axios.put(self.API_URL + 'task/' + self.cleanupTask._id + '/link_book', {book_id: self.currentBook._id})
          .then((response) => {
            //self.getTasks()
            self.$emit('task_linked')
          })
          .catch((err) => {})
      }
    },
    sharePrivateBook() {
      this.textCleanupProcess = true
      var self = this
      self.showSharePrivateBookModal = false
      if (!self.cleanupTask._id) {
        self.errorMessage = 'No linked task, please link task'
        self.textCleanupProcess = false
      } else {
        //axios.put(API_URL + 'books/' + self.currentBook._id + '/share_private')
        self.liveUpdate('private', false)
          .then((doc) => {
            axios.put(self.API_URL + 'task/' + self.cleanupTask._id + '/finish_cleanup')
              .then((doc) => {
                self.textCleanupProcess = false
                if (!doc.data.error) {
                  self.currentBook.private = false
                  self.tc_currentBookTasks.assignments.splice(self.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                  self.$store.dispatch('tc_loadBookTask')
                  self.infoMessage = 'Text cleanup task finished'
                } else {
                  self.liveUpdate('private', true)
                  self.errorMessage = doc.data.error
                }
              })
              .catch((err, test) => {
                self.textCleanupProcess = false
                self.liveUpdate('private', true)
              })
          })
          .catch((err) => {
            self.textCleanupProcess = false
          })
      }
    },
    completeAudioMastering() {
      this.audioMasteringProcess = true;
      var self = this;
      self.showAudioMasteringModal = false;
      axios.put(self.API_URL + 'task/' + self.masteringTask._id + '/finish_mastering')
        .then((doc) => {
          self.audioMasteringProcess = false
          if (!doc.data.error) {
            self.$store.dispatch('tc_loadBookTask')
            self.infoMessage = 'Mastering task finished'
          } else {
            self.errorMessage = doc.data.error
          }
        })
        .catch((err, test) => {
          self.audioMasteringProcess = false;
        })
    },
    /*loadAudiobook(set_tab = false) {
      let self = this;
      this.getAudioBook(this.currentBookMeta.bookid).then(audio => {
        self.setAudiobook(audio);//
        //console.log(self.audiobook)
        self.setAllowSetMastered();
        if (false && set_tab) {
          if (self.audiobook.bookid) {
            self.$refs.panelTabs.findTabAndActivate('Audio Integration');
          } else {
            self.$refs.panelTabs.findTabAndActivate('Book Content');
          }
        }
      })
      .catch(err => this.setAudiobook({}))
    },
    setAudiobook(audiobook) {
      if (audiobook._id && audiobook._id != this.audiobook._id) {
        if (this.audiobookChecker) {
          clearInterval(this.audiobookChecker);
        }
        this.audiobookChecker = setInterval(() => {
            var dbPath = superlogin.getDbUrl('ilm_content')
            var db = new PouchDB(dbPath)
            db.get(audiobook._id)
              .then((a) => {
                //console.log(a)
                if (a) {
                  this.setAudiobook(a)
                }
              })
              .catch(err => console.log(err))
          }, 20000);
      }
      if (!audiobook._id) {
        if (this.audiobookChecker) {
          clearInterval(this.audiobookChecker);
        }
      }
      this.audiobook = audiobook;
    },
    onAudiobookUpdate(audio) {
      this.audiobook = {};
      Vue.nextTick(() => {
        this.audiobook = audio;
      })
    },*/
    addAuthor() {
      this.currentBook.author.push('');
      this.liveUpdate('author', this.currentBook.author);
    },
    removeAuthor(i) {
      if (i > 0 || this.currentBook.author.length > 1) {
        this.currentBook.author.splice(i, 1);
        this.liveUpdate('author', this.currentBook.author);
      }
    },
    publish() {
      // this.isPublishing = false;
      this.isPublishingQueue = true;
      return axios.post(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish')
      .then(resp => {
        console.log(resp);
      });
    },
    publishContent() {
      return axios.get(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish_content')
    },
    goToUnresolved(with_task = false) {

      let route = {
        name: this.$route.name,
        params: {
          book: this.$route.params.bookid
        }
      }

      if (this.blocksToApproveCounter === 0) {
        return route;
      }

      if (this.$route.matched.some(record => {
        return record.meta.mode === 'edit' || record.meta.mode === 'narrate'
      })) {
        route.params.block = 'unresolved';

        if (with_task) {
          route.params.task_type = true;
          if (this.tc_hasTask('content_cleanup')) route.params.task_type = 'text-cleanup';
        }
      //this.$router.push({name: this.$route.name, params:  params});
      }
      return route;
    },
    toggleMastering() {
      if (this._is('editor', true)) {
        this.liveUpdate('masteringRequired',  !this.currentBook.masteringRequired)
      }
    },
    setAllowExportAudio() {
      this.allowExportAudio = false;
      if (this.isEditor && this.currentBookMeta._id) {
        if (this.tc_hasTask('audio_mastering')) {
          this.allowExportAudio = true;
        } else {
          let self = this;
          return axios.get(this.API_URL + 'books/' + this.currentBookMeta._id + '/allow_audio_export')
            .then(response => {
              if (response.status == 200 && typeof response.data.allow !== 'undefined') {
                self.allowExportAudio = response.data.allow;
              } else {
                self.allowExportAudio = false;
              }
              return true;
            })
            .catch(err => {
              self.allowExportAudio = false;
              return false;
            });
        }
      }
    },
    startGenerateAudiofile() {
      this.currentBook.mergedAudiofile = null;
      this.liveUpdate('mergedAudiofile', null);
      this.generatingAudiofile = true;
      axios.get(this.API_URL + 'books/' + this.currentBook.bookid + '/audiobooks/download')
      //:href="API_URL + 'books/' + currentBook.bookid + '/audiobooks/download'" target="_blank"
    },
    removeBook() {
      if (this.isAdmin) {
        axios.delete(this.API_URL + 'books/' + this.currentBook.bookid)
      }
    },

    collectCheckedStyles(startId, endId, isSwitch = true) {
      let result = new Map();
      let nums = new Map();

      if (this.storeListO.getBlock(startId)) {
        let idsArrayRange = this.storeListO.idsArrayRange(startId, endId);
        idsArrayRange.forEach((blockId)=>{
        //console.log('blockId', blockId);

          let pBlock = this.storeList.get(blockId);
          if (pBlock) {
            if (!result.has(pBlock.type)) result.set(pBlock.type, new Map());

            for (let styleKey in this.blockTypes[pBlock.type]) {
              if (!result.get(pBlock.type).has(styleKey)) result.get(pBlock.type).set(styleKey, new Map());
              if (pBlock.classes[styleKey]) {
                result.get(pBlock.type).get(styleKey).set(pBlock.classes[styleKey], true);
              } else {
                result.get(pBlock.type).get(styleKey).set('none', true);
              }
            }

            if (!nums.has(pBlock.type))
              nums.set(pBlock.type, new Map([
                ['secNum',  !(pBlock.secnum === false)],
                ['secHide', !(pBlock.secHide === false)],
                ['parNum',  !(pBlock.parnum === false)],
                ['parHide', !(pBlock.parHide === false)],
              ]));

            //console.log('nums.get(pBlock.type)', nums.get(pBlock.type), !(pBlock.secnum === false));

            if (nums.get(pBlock.type).get('secNum') !== 'mixed') {
              if (pBlock.hasOwnProperty('secnum')) {
                if (!(pBlock.secnum === false) !== nums.get(pBlock.type).get('secNum')) {
                  nums.get(pBlock.type).set('secNum', 'mixed');
                } else {
                  nums.get(pBlock.type).set('secNum', !(pBlock.secnum === false));
                }
              } else {
                nums.get(pBlock.type).set('secNum', false);
              }
            }
            if (nums.get(pBlock.type).get('secHide') !== 'mixed') {
              if (pBlock.hasOwnProperty('secHide')) {
                if (!(pBlock.secHide === false) !== nums.get(pBlock.type).get('secHide')) {
                  nums.get(pBlock.type).set('secHide', 'mixed');
                } else {
                  nums.get(pBlock.type).set('secHide', !(pBlock.secHide === false));
                }
              } else {
                nums.get(pBlock.type).set('secHide', false);
              }
            }
            if (nums.get(pBlock.type).get('parNum') !== 'mixed') {
              if (pBlock.hasOwnProperty('parnum')) {
                if (!(pBlock.parnum === false) !== nums.get(pBlock.type).get('parNum')) {
                  nums.get(pBlock.type).set('parNum', 'mixed');
                } else {
                  nums.get(pBlock.type).set('parNum', !(pBlock.parnum === false));
                }
              } else {
                nums.get(pBlock.type).set('parNum', false);
              }
            }
          }

        });
      }

      this.styleTabs = result;
      this.numProps = nums;

      //console.log('nums', nums);

      Vue.nextTick(()=>{

        if (result.size == 0) {
          $('.block-style-tabs').find('li[name="tab"]').first().trigger( "click" );
        } else if (isSwitch) {
          //$(`a[aria-controls="#block-type-${result.keys().next().value}"]`).parent().trigger( "click" );
          $(`li#t-block-type-${result.keys().next().value}`).trigger( "click" );
        }

      });
    },

    selectStyle(blockType, styleKey, styleVal)
    {
      let updateToc = (styleKey == 'table of contents' || (blockType == 'title' && styleKey == 'style') );
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let idsArrayRange = this.storeListO.idsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          idsArrayRange.forEach((blockId)=>{
            let pBlock = this.storeList.get(blockId);

            if (pBlock && blockType == 'title' && styleKey == 'style' && styleVal != ''){
              pBlock.classes['table of contents'] = '';
            }

            if (pBlock && blockType == 'title' && styleKey == 'table of contents' && styleVal != ''){
              pBlock.classes['style'] = '';
            }

            if (pBlock && pBlock.type == blockType) {
                if (styleVal.length) {
                  pBlock.classes[styleKey] = styleVal;
                  if (blockType === 'header' && styleKey === 'level') {
                    updateToc = true;
                    pBlock.classes['table of contents'] = 'toc' + styleVal.replace(/\D/, '');
                  }
                }
              else pBlock.classes[styleKey] = '';

              if (pBlock.isChanged || pBlock.isAudioChanged) {
                pBlock.checked = false;
                pBlock.checked = true;
              } else {
                pBlock.partUpdate = true;
                this.putBlock(pBlock).then(()=>{
                  if (updateToc) {
                    this.$root.$emit('from-book-meta:upd-toc', true);
                  }
                });
              }
            }
          })
        }
        //this.$root.$emit('from-meta-edit:set-num');
        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
      }
    },

    listenSetStyle () {
      if (this.selectionStart && this.selectionEnd) {
        this.collectCheckedStyles(this.selectionStart, this.selectionEnd, false);
      }
    },

    goToBlock(id) {
      this.$root.$emit('for-bookedit:scroll-to-block', id);
    },

    selSecNum (blockType, valKey, currVal) {
      console.log('selSecNum', blockType, valKey, currVal);
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let putBlockOpromise = [];
          let idsArrayRange = this.storeListO.idsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          let pBlock, oBlock;

          idsArrayRange.forEach((blockId)=>{
            pBlock = this.storeList.get(blockId);
            //oBlock = this.storeListO.getBlock(blockId);
            oBlock = { rid: this.storeListO.getRIdById(blockId) };

            if (pBlock && pBlock.type == blockType) {
              switch(valKey) {
                  case 'secNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      if (pBlock.secVal) pBlock.secnum = pBlock.secVal;
                      else pBlock.secnum = '';
                      oBlock.isNumber = true;
                    } else {
                      pBlock.secVal = pBlock.secnum;
                      pBlock.secnum = false;
                      oBlock.isNumber = false;
                    }
                  } break;
                  case 'secHide' : {
                    if (currVal == 'mixed' || currVal === false) {
                      pBlock.secHide = true;
                      oBlock.isHidden = true;
                    } else {
                      pBlock.secHide = false;
                      oBlock.isHidden = false;
                    }
                  } break;
                  case 'parNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      pBlock.parnum = '';
                      oBlock.isNumber = true;
                    } else {
                      pBlock.parnum = false;
                      oBlock.isNumber = false;
                    }
                  } break;
                  case 'parHide' : {
                    if (currVal == 'mixed' || currVal === false) {
                      pBlock.parHide = true;
                      oBlock.isHidden = true;
                    } else {
                      pBlock.parHide = false;
                      oBlock.isHidden = false;
                    }
                  } break;
                  default : {
                  } break;
              };

              if (oBlock.rid) {
                putBlockOpromise.push(this.putBlockO(oBlock));
                this.storeListO.updBlockByRid(oBlock.rid, {
                  isHidden: oBlock.isHidden,
                  isNumber: oBlock.isNumber
                })
              }

              if (pBlock.isChanged || pBlock.isAudioChanged) {
              } else {
                pBlock.partUpdate = true;
                this.putBlock(pBlock).then(()=>{
                  if (valKey == 'secNum' || valKey == 'secHide') {
                    // TODO create other method
                    //this.$root.$emit('from-book-meta:upd-toc', true);
                  }
                });

              }
            }

          });

          Promise.all(putBlockOpromise).then((res)=>{
            if (valKey == 'secNum' || valKey == 'parNum') {
              let blockO = this.storeListO.getBlock(this.blockSelection.start._id);
              this.$root.$emit('from-meta-edit:set-num', this.currentBookid, this.currentBook.numeration, blockO.rid)
            } else {
              this.$root.$emit('from-meta-edit:set-num');
            }
          })
        }

        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
      }
    },

    downloadDemo() {
        return this.API_URL + 'books/' + this.currentBook._id + '/demo';
    },

    styleCaption(type, key) {
      if (this.styleTitles.hasOwnProperty(`${type}_${key}`)) {
        let caption = this.styleTitles[`${type}_${key}`];
        return caption.charAt(0).toUpperCase() + caption.slice(1);
      }
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    styleValue(type, key, val) {
      if (BlockTypesAlias[type] && BlockTypesAlias[type][key] && BlockTypesAlias[type][key]['values'] && BlockTypesAlias[type][key]['values'][val]) {
        return BlockTypesAlias[type][key]['values'][val];
      } else {
        return val;
      }
    },

    ...mapActions(['getAudioBook', 'updateBookVersion', 'setCurrentBookBlocksLeft', 'checkAllowSetAudioMastered', 'setCurrentBookCounters', 'putBlock', 'putBlockO', 'putNumBlockO', 'freeze', 'unfreeze', 'blockers', 'updateBookMeta'])
  }
}
</script>


<style scoped src='./css/BookProperties.css'></style>

<style scoped lang="less">

  .btn_download {
    border: 0px;
    background-color: Transparent;
    outline:none;
  }

  img.bookstack {
    width: 60px;
    opacity: .75
  }

  .download-area {
    margin-left:15px; padding-left:0;
  }
  .download-area .btn_download {
    float: right;
  }
  .download-area .btn_audio_upload {
    float: left;  margin: 10px; margin-left: -15px;
  }
  /* Wrapper around entire side editor */
  .sidebar {
    /*position: fixed;*/
    width: 100%;
    /*min-width: 426px;*/
    margin-top:0px;
    margin-left:0;
    padding-left:0;
    overflow-y: auto;
    height: 100%;
  }
  .sidebar::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
    border-radius: 10px;
    background-color: #F5F5F5;
  }
  .sidebar::-webkit-scrollbar {
    width: 12px;
    background-color: #F5F5F5;
  }
  .sidebar::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: #555;
  }

  /* Main book cover image */
  div.coverimg {
    padding:0; margin: 5px; margin-right: 8px;
    float: left;
    margin-left: 3px; margin-top: 0;
    background: white;
    box-shadow: inset 0px 0px 3px 3px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
  }
  div.coverimg-wrap {
    height: 80px;
    width: 60px;
  }
  .author,  h4.title {margin: 0; margin-top:2px; padding-bottom: 0; }
  .subtitle {margin-top:0;}

  /*  Top edit icon for opening the book in an edit mode */
  .edit-button {
    float: right;  cursor: pointer; margin-top: -5px;
  }

  /* Edit area for book description */
  fieldset.description textarea {
    width: 100%; padding: 0; margin:0; border: none; min-height: 180px;
    resize: vertical;
  }
  fieldset.description.brief textarea {
    min-height: 50px;
  }
  fieldset.approve-metadata textarea {
    width: 100%;
    min-height: 100px;
  }

  /* Properties editor area */
  table.properties {margin:0; padding:0; width:100%; font-size: 1em;
    border-collapse: separate; border-spacing: 3px;
  }
  table.properties td:nth-child(1) {width: 30%; padding: 3px; margin:0}
  table.properties td:nth-child(2) {width: auto; text-align: right}
  table.properties tr:nth-child(odd) {background-color: #F0F0F0}
  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  tr.subtitle input {font-size: .85em; width: 100%; line-height: 1.85em;}
  tr.author input {width: 80%;}
  tr.author button {width: 15%; border: none; background-color: inherit;}
  tr.author button.disabled i {display: none;}
  .disabled {font-style: italic; color: gray; font-size: .85em;}

  /* publication info */
  i.pubtoggle {cursor: pointer;}
  button.new-version { font-size: 1em; }
  button.sharebtn {width: 100%}

  .fix-message {
    color: red;
    background-color: yellow;
  }
  .preloader-small {
      background: url(/static/preloader-snake-small.gif);
      width: 34px;
      height: 34px;
  }
  .alert.top {
    top: 120px;
  }

  .nav-tabs-navigation {
    margin-top: 3px;
  }

  .tab-content input[type=radio] {
    width: auto;
    display: inline-block;
    margin-top: 8px;
    margin-left: 20px;
    padding-top: 5px;
  }

  .tab-content input[type=radio]:focus {
    box-shadow: none;
  }

  .tab-content .style-label {
    margin-top: 4px;
    margin-bottom: 0px;
    display: inline-block;
    vertical-align: top;
    font-weight: 400;
  }

  .style-label {
    cursor: pointer;
  }

  .sidebar-bookmeta {
    width: 96%;
  }

  .editing-wrapper {
    margin-left: 15px;
    .btn-edit-complete {
      margin-bottom: 5px;

    }

    .blocks-counter {
      vertical-align: middle;
      line-height: 34px;
      color: #337ab7;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }

    .blocks-counter-value {
      display: inline-block;
      width: 50px;
      float: none;
      font-weight: bold;
      text-align: right;
      margin-right: 8px;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .t-box {
    height: 45px;
    border-left: 1px solid #ddd;
    padding-top: 7px;
    padding-left: 20px;
    vertical-align: middle;

    .btn-switch {
      display: inline-block;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
    }
    span.s-label {
      /*margin-top: 6px;*/
      float: none;
      width: auto;
      cursor: pointer;
      line-height: 24px;
      &.-disabled {
        opacity: .65;
      }
    }
    i.fa-toggle-on, i.fa-toggle-off {
      /*margin-top: 6px;*/
      font-size: 22px;
      height: 22px;
      line-height: 22px;
      vertical-align: top;
    }
    .btn-export-audio {
      margin-left: 10px;
      &.-disabled {
        opacity: .65;
        cursor: not-allowed;
      }
    }
  }
  .modal-body {
    .align-preloader {
      width: 100%;
      background-repeat: no-repeat;
      background-position: center;
    }
    &.download-audiofile {
      text-align: center;
    }
  }

  .tab-container[role="tabpanel"] {
    padding-top: 3px;
  }

  .block-style-tabs {
    .block-style-fieldset {
      float: left;
      width: 32%;

      &.block-num-fieldset {

        width: 97%;
        clear: both;
        display: block;

        i.fa-check-square-o.-checked {
          color: #303030;
          &:hover {
            color: #303030;
          }
        }

        i.fa-square-o:hover,
        i.fa-check-square-o:hover,
        i.fa-plus-square-o:hover {
          color: gray;
        }

        .block-style-label {
          width: 50%;
          float: left;
        }
      }
    }

    .tab-container {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .block-style-label {
      display: block;
      line-height: 12px;
      font-weight: normal;
      cursor: pointer;
      input[type='radio'] {
        margin-left: 0px;
        margin-right: 5px;
      }
      span {
        float: none;
        width: auto;
      }
      i.fa-check-circle-o {
        color: #303030;
      }
      i.fa-dot-circle-o:hover, i.fa-circle-o:hover {
        color: gray;
      }
    }
  }
  .block-selection {
    a {
        cursor: pointer;
    }
  }
  .red-message {
      color: red;
  }
</style>

<style lang="less">

  .styles-catalogue {
    li.tab {
      span.title {
        text-transform: capitalize;
      }
    }

    /*.block-style-fieldset {
      legend {
        text-transform: capitalize;
      }
    }*/
  }

</style>
