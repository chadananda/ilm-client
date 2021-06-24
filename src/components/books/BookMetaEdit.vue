<template>
  <div class="sidebar">

    <div id='bookmeta' v-if="currentBook" class="sidebar-bookmeta">
      <div class='booktopinfo'>
        <template v-if="isAdmin">
          <button class="hidden" v-on:click="removeBook()">Remove</button>
        </template>
      </div>

      <div class="row" style="height: 0">
      <div class="download-area col-sm-6">
      </div>
      </div>

      <BookDownload v-if="showModal" @close="showModal = false" />
      <AudioImport v-if="showModal_audio"
        @close="showModal_audio = false"
        @closeOk="checkAfterAudioImport"
        :book="currentBook"
        :importTask="importTask"
        :allowDownload="false" />

      <div class="book-listing">
        <vue-tabs ref="panelTabs" class="meta-edit-tabs">
          <vue-tab title="Assignments" id="assignments">
            <BookAssignments
              @showModal_audio="showModal_audio = true"
              ></BookAssignments>
          <fieldset class='description brief'>
            <legend>Description </legend>
            <textarea v-model='currentJobInfo.description' @input="updateJobDescription($event)" :disabled="!adminOrLibrarian" maxlength="2000"></textarea>
          </fieldset>
            <BookWorkflow
              v-if="adminOrLibrarian"
              :isPublishingQueue="isPublishingQueue"
              ></BookWorkflow>
          <fieldset class='Export' v-if="isAllowExportAudio" :disabled="getDemoStatus == 'progress'">
            <legend>Export book </legend>
              <div v-if="getDemoStatus == 'progress' " class="align-preloader -small">&nbsp;</div>
              <div v-if="getDemoStatus == 'rebuild'" style="margin-bottom: 5px;">Last build: {{this.convertTime(currentBook.demo_time)}}</div>
              <div>
                <button class="btn btn-primary" v-if="getDemoStatus == 'build' || getDemoStatus == 'failed'" v-on:click="downloadDemo()" :disabled="!isAllowExportAudio || getDemoStatus == 'progress'">Build</button>
                <button class="btn btn-primary" v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'" v-on:click="downloadDemo()" :disabled="!isAllowExportAudio || getDemoStatus == 'progress'">Rebuild</button>
              </div>
              <hr  v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'">
              <div v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'">
                Download: <br />
                <a class="btn btn-primary" style="margin-bottom: 5px;" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportMp3'" target="_blank">Compressed {{currentBook.demo_zip_mp3_size | prettyBytes }}</a>
                <a class="btn btn-primary" style="margin-bottom: 5px;" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportFlac'" target="_blank">Full Book {{currentBook.demo_zip_flac_size | prettyBytes }}</a>
                <a class="btn btn-primary" style="margin-bottom: 5px;" v-if="(getDemoStatus == 'rebuild' || getDemoStatus == 'progress') && currentBook.demo_zip_narration_size >=23" :disabled="getDemoStatus == 'progress'" :href="this.API_URL + 'export/' + this.currentBook._id + '/exportNarration'" target="_blank">Narration {{currentBook.demo_zip_narration_size | prettyBytes }}</a>
                <button style="margin-bottom: 5px;" v-if="currentBook.demo_zip_narration_size < 23" class="btn btn-primary" :disabled="true">Narration is empty</button>
                <hr>
                <div v-if="currentBook.demo"><a :href="this.SERVER_URL + currentBook.demo" target="_blank">{{this.SERVER_URL + currentBook.demo}}</a> <br /><!-- <button class="btn btn-primary" v-if="getDemoStatus == 'rebuild' || getDemoStatus == 'progress'" :disabled="getDemoStatus == 'progress'" v-clipboard="() => this.SERVER_URL + currentBook.demo" >Copy Link</button>--> <button class="btn btn-primary" v-on:click="deactivateDemoLink()"> Deactivate</button></div>
                <div v-if="!currentBook.demo">Public Demo Book link has been deactivated</div>
                <span v-if="getDemoStatus == 'failed'"> Demo Book generation has failed. Please try again.</span>
              </div>
          </fieldset>
          <CompleteAudioExport
            :convertTime="convertTime"
            :goToBlock="goToBlock"></CompleteAudioExport>
          <BookPublish @checkPublish="checkPublish" ></BookPublish>
          <SplitPreview v-if="allowBookSplitPreview"
            :convertTime="convertTime"></SplitPreview>
          </vue-tab>
          <vue-tab title="Meta" id="book-content">
            <fieldset>
              <legend>Book Metadata </legend>
              <table class='properties'>

                <tr class='bookid'>
                  <td>Book Id</td>
                  <td class='disabled'>{{currentBook.bookid}}</td>
                </tr>

                <tr class="extid">
                  <td>External Book Id</td>
                  <td class='disabled'>{{currentBook.extid}}
                    <!-- <input v-model="currentBook.extid" @input="updateExtid($event)" :disabled="!allowMetadataEdit" :class="[{'has-error': validationErrors['extid'].length}]"/>
                           <span class="validation-error" v-for="err in validationErrors['extid']">{{err}}</span> -->
                  </td>
                </tr>

                <tr class='title'>
                  <td>Title</td>
                  <td><input v-model='currentBook.title' v-on:change="updateWithDisabling('title',$event,)" :disabled="!allowMetadataEdit" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title'] }">
                      <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title']" class="validation-error">Define Title</span>
                  </td>
                </tr>

                <tr class='title' v-if="currentBook.language !== 'en'">
                  <td>Title EN</td>
                  <td><input v-model='currentBook.title_en' v-on:change="updateWithDisabling('title_en', $event) " :disabled="!allowMetadataEdit" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title_en'] }">
                      <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['title_en']" class="validation-error">Define Title EN</span>
                  </td>
                </tr>

                <tr class='subtitle'>
                  <td>Subtitle</td>
                  <td><input v-model='currentBook.subtitle' v-on:change="updateWithDisabling('subtitle', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='author'>
                  <td>Author</td>
                  <td style="text-align: left !important;">

                    <input v-model='currentBook.author[0]'  v-on:change="update('author', $event) " :disabled="!allowMetadataEdit" v-if="currentBook.author.length === 0" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author'] }">
                                                <div class="dropdown" v-if="currentBook.author.length === 0 && allowMetadataEdit">
                                                  <div v-on:click="showUnknownAuthor = -1 * showUnknownAuthor;" class="dropdown-button" ><i class="fa fa-angle-down" ></i></div>
                                                  <div class="dropdown-content" v-if="showUnknownAuthor == 1" v-on:click="showUnknownAuthor=-1; currentBook.author[0] = 'Unknown'; liveUpdate('author', currentBook.author);" >Unknown</div>
                                                </div>
                    <template v-for="(author, i) in currentBook.author" ><input v-model='currentBook.author[i]' v-on:change="update('author', $event); " :disabled="!allowMetadataEdit">
                                                <div class="dropdown" v-if=" i == 0 && allowMetadataEdit">
                                                  <div v-on:click="showUnknownAuthor = -1 * showUnknownAuthor;" class="dropdown-button"><i class="fa fa-angle-down" ></i></div>
                                                  <div class="dropdown-content" v-if="showUnknownAuthor == 1 && allowMetadataEdit" v-on:click="showUnknownAuthor=-1; currentBook.author[0] = 'Unknown'; liveUpdate('author', currentBook.author);" >Unknown</div>
                                                </div>
                                               <button v-if="i !== 0 && allowMetadataEdit" v-on:click="removeAuthor(i)" :class="{'disabled': i == 0 && currentBook.author.length == 1}" :disabled="!allowMetadataEdit" ><i class="fa fa-minus-circle" style="margin-right: -18px;"></i></button>
                    <br/>
                    </template>
                    <p v-if="allowMetadataEdit" style="text-align: right; margin: 0; padding: 0;"><button v-on:click="addAuthor" :disabled="!allowMetadataEdit" style="margin-right: 6px;"><i class="fa fa-plus-circle"></i></button></p>
                    <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author']" class="validation-error" style="text-align: right !important;">Define Author</span>
                  </td>
                </tr>

                <tr class='author' v-if="currentBook.language !== 'en'">
                  <td>Author EN</td>
                  <td style="text-align: left !important;"><input v-model='currentBook.author_en' v-on:change="update('author_en', $event) " :disabled="!allowMetadataEdit" style="width: 90%;" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_en'] }">
                                                <div class="dropdown" v-if="allowMetadataEdit">
                                                  <div v-on:click="showUnknownAuthorEn = -1 * showUnknownAuthorEn;" class="dropdown-button"><i class="fa fa-angle-down" ></i></div>
                                                  <div class="dropdown-content" v-if="showUnknownAuthorEn == 1" v-on:click="showUnknownAuthorEn=-1; currentBook.author_en = 'Unknown'; liveUpdate('author_en', 'Unknown');" >Unknown</div>
                                                </div>
                    <span style="text-align: right !important;" v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_en']" class="validation-error">Define Author EN</span>

                  </td>
                </tr>

                <tr class='language'>
                  <td>Language</td>
                  <td>
                    <select class="form-control" v-model='currentBook.language' @change="change('language')" :key="currentBookid" :disabled="!allowMetadataEdit || currentBookMeta.collection_id || lockLanguage">
                      <option v-if="!languages.hasOwnProperty(currentBook.language)" :value="currentBook.language">{{ currentBook.language }}</option>
                      <option v-for="(value, key) in languages" :value="key">{{ value }}</option>
                    </select>
                  </td>
                </tr>


              </table>
            </fieldset>
            <fieldset class='description brief' style="text-align: right;">
              <legend style="text-align: left;">URL Slug</legend>
                  <input v-model='currentBook.slug' v-on:change="lockLanguage = true; update('slug', $event); "  :disabled="!allowMetadataEdit || currentBook.slug_status == -1 " :style="[currentBook.slug_status === 1 ? {'color': '#999'} : {'color': '#000'}]" maxlength="100" style="width: 100%;" :title="currentBook.slug_status == -1 ? 'URL slug is not editable because Book has been published' : currentBook.slug" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['slug'] }">
                  <br><span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['slug']" class="validation-error">Define URL Slug</span>
            </fieldset>

            <fieldset>
              <table class='properties'>
                <tr class='size'>
                  <td>Size</td>
                  <td class="pull-left">{{ Math.round(currentBook.wordcount / 300) }} pages</td>
                </tr>

                <tr class='category'>
                  <td>Category</td>
                  <td>
                    <select id="categorySelection" v-bind:class="{ 'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['category'] }" class="form-control" v-model='currentBook.category' @change="change('category')" :key="currentBookid" :disabled="!allowMetadataEdit">
                      <template v-for="(data, index) in subjectCategories">
                        <optgroup :label="data.group">
                          <option v-for="(value, ind) in data.categories" :value="value">{{ value }}</option>
                        </optgroup>
                      </template>
                    </select>
                    <span v-if="requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['category']" class="validation-error">Define Category</span>
                  </td>
                       </tr>
                <tr class='difficulty'>
                  <td>Difficulty</td>
                  <td>
                    <input v-model="currentBook.difficulty" :disabled="!allowMetadataEdit"
                           v-on:change="updateWithDisabling('difficulty',$event,100)"  id="difficultySelection" :class="{ 'has-error': (this.validationErrorDifficulty) ,
                            'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['difficulty'] }">
                    <span class="validation-error" >{{(this.validationErrorDifficulty )}}</span>
<!--                    <span class="validation-error" >{{(validationErrors[currentBook.bookid]['weight'] && validationErrors[currentBook.bookid]['weight'])}}</span>-->
                  </td>
                </tr>

                <tr class='trans'>
                  <td>Translator</td>
                  <td><input v-model='currentBook.translator'  v-on:change="updateWithDisabling('translator', $event)" :disabled="!allowMetadataEdit"></td>
                </tr>

                <tr class='transfrom'>
                  <td>Tr From</td>
                  <!-- <td><input v-model="currentBook.transfrom" :placeholder="suggestTranslatedId"></td> -->
                  <td><input v-model="currentBook.transfrom" v-on:change="updateWithDisabling('transfrom', $event)" :disabled="!allowMetadataEdit"></td>
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
                <tr class='weight'>
                  <td>Weight:</td>
                  <td>
                    <input v-model='currentBook.weight' v-on:change="updateWeigth($event, 100)" :disabled="!allowMetadataEdit"
                           :class="[{'has-error': this.validationErrorWeight }]"/>
<!--                    <div v-if="validationErrors[currentBook.bookid] && validationErrors[currentBook.bookid]['weight'] && validationErrors[currentBook.bookid]['weight'].length > 0">-->
<!--                      <span class="validation-error" v-for="error in validationErrors[currentBook.bookid]['weight']">{{error}}</span>-->
                      <span class="validation-error" >{{validationErrorWeight}}</span>
<!--                    </div>-->
                  </td>
                </tr>
              </table>
            </fieldset>

          <fieldset class='description brief'>
            <legend>Book Cover</legend>
            <template v-if="allowMetadataEdit">
              <div class='coverimg pull-right' @click="bookEditCoverModalActive = true">
                <img height="80" v-if="currentBook.coverimg" v-bind:src="currentBook.coverimg" />
                <div v-else class='coverimg-wrap'></div>
              </div>
              <button class="btn btn-primary pull-right" @click="bookEditCoverModalActive = true"><i class="fa fa-pencil" style="color:white"></i></button>
            </template>
            <template v-else>
              <div class="coverimg pull-right">
                <img height="80" v-if="currentBook.coverimg" v-bind:src="currentBook.coverimg" />
              </div>
            </template>
          </fieldset>

          <fieldset class='description brief'>
            <legend>Brief Description </legend>
            <resizable-textarea ref="descriptionShort"><textarea v-model='currentBook.description_short' v-on:change="update('description_short', $event)" :disabled="!allowMetadataEdit" rows="1" class="resize-none outline-0 w-full"></textarea></resizable-textarea>
          </fieldset>

          <fieldset class='description long'>
            <legend>Long Description </legend>
            <resizable-textarea ref="descriptionLong"><textarea v-model='currentBook.description' v-on:change="update('description', $event)" :disabled="!allowMetadataEdit" rows="1" class="resize-none outline-0 w-full" ></textarea></resizable-textarea>
          </fieldset>
        </vue-tab>
          <vue-tab title="TOC" id="book-toc">
            <BookToc ref="bookToc"
              :bookId="currentBook.bookid"
            ></BookToc>
          </vue-tab>
          <vue-tab title="Audio" id="audio-integration" :disabled="!tc_displayAudiointegrationTab()">
            <div v-if="blockSelection.start._id && blockSelection.end._id" class="t-box block-selection">
              {{alignCounter.countAudio}} audio, {{alignCounter.countTTS}} TTS block in range
              <a v-on:click="goToBlock(blockSelection.start._id)">{{blockSelection.start._id_short}}</a> -
              <a v-on:click="goToBlock(blockSelection.end._id)">{{blockSelection.end._id_short}}</a>
            </div>
            <div v-else class="t-box red-message">Define block range</div>
            <BookAudioIntegration ref="audioIntegration"
                :isActive="activeTabIndex == TAB_AUDIO_INDEX"
                @onTtsSelect="ttsUpdate"
                @uploadAudio="showModal_audio = true"
              ></BookAudioIntegration>
          </vue-tab>

        <vue-tab title="Styles" :id="'styles-switcher'" :disabled="!tc_displayStylesTab() && !proofreadModeReadOnly">
            <div class="styles-catalogue">

              <vue-tabs ref="blockTypesTabs" class="block-style-tabs" :class="{ disabled: proofreadModeReadOnly }">

                <vue-tab title="Book" :id="'global-styles-switcher'">
                  <fieldset class="block-style-fieldset">
                  <legend>Book styles</legend>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('styles.global', '') } : {}">
                      <i v-if="!currentBook.styles || !currentBook.styles.global || currentBook.styles.global === ''"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    ILM</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('styles.global', 'global-ocean') } : {}">
                      <i v-if="currentBook.styles && currentBook.styles.global === 'global-ocean'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    Ocean</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('styles.global', 'global-ffa') } : {}">
                      <i v-if="currentBook.styles && currentBook.styles.global === 'global-ffa'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      FFA</label>
                  </div>
                  </fieldset>

                  <fieldset class="block-style-fieldset">
                  <legend>Automatic numeration</legend>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('numbering', 'x') } : {}">
                      <i v-if="currentBook.numbering === 'x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('numbering', 'x_x') } : {}">
                      <i v-if="currentBook.numbering === 'x_x'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                    x.x</label>
                  </div>
                  <div>
                    <label class="style-label"
                      v-on="!proofreadModeReadOnly ? { click: () => liveUpdate('numbering', 'none') } : {}">
                      <i v-if="currentBook.numbering === 'none'"
                        class="fa fa-check-circle-o"></i>
                      <i v-else class="fa fa-circle-o"></i>
                      Off</label>
                  </div>
                  </fieldset>

                </vue-tab>

                <vue-tab :title="prepareStyleTabLabel(blockType)"
                  :disabled="!(styleTabs.has(blockType))"
                  v-for="(val, blockType) in blockTypes"
                  :id="'block-type-'+blockType" :key="blockType">

                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['header'].indexOf(blockType) > -1">
                    <legend>Numeration</legend>
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
                    <legend>{{styleCaption('header', 'level')}}</legend>
                    <ul>
                      <li v-for="(sVal, styleKey) in blockTypes[blockType]['level']">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'level'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="selectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset v-if="(blockType === 'title') && styleTabs.get(blockType)" class="block-style-fieldset block-num-fieldset">
                    <legend>{{styleCaption(blockType, 'style')}}</legend>
                    <ul>
                      <li v-for="(sVal, styleKey) in blockTypes[blockType]['style']">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'style'"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="selectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset v-if="(blockType === 'header' || blockType === 'title') && styleTabs.get(blockType)" class="block-style-fieldset block-num-fieldset">
                    <legend>{{styleCaption(blockType, 'table of contents')}}</legend>
                    <ul v-for="(styleObj, styleKey) in blockTypes[blockType]['table of contents']">
                      <li v-for="(sVal, sIdx) in styleObj">
                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="[sVal]"
                          :styleKey="'table of contents'+'.'+styleKey"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="selectStyle"
                        ></block-style-labels>
                      </li>
                    </ul>
                  </fieldset>
                  <fieldset class="block-style-fieldset block-num-fieldset"
                  v-if="numProps.has(blockType) && ['par'].indexOf(blockType) > -1">
                    <legend>Numeration</legend>
                    <label class="block-style-label"
                      @click="selSecNum(blockType, 'parNum', numProps.get(blockType).get('parNum'))">
                      <template v-if="numProps.get(blockType).get('parNum') == 'mixed'">
                        <i class="fa fa-square-o" aria-hidden="true"></i>
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
                  <fieldset v-if="pausesBeforeProps.get(blockType) && blockType !== 'illustration'" class="block-style-fieldset block-num-fieldset block-pause-fieldset">
                    <legend>Pause before block (sec.)</legend>
                    <block-style-labels
                      :blockType="blockType"
                      :styleArr="['none', '0.6', '1', '2', '4']"
                      :styleKey="'pause_before'"
                      :styleTabs="pausesBeforeProps"
                      :styleValue="styleValue"
                      @selectStyleEv="selectPauseBefore"
                    ></block-style-labels>
                  </fieldset>
                  <template v-for="(styleArr, styleKey) in blockTypes[blockType]">

                    <fieldset v-if="styleTabs.has(blockType) && styleTabs.get(blockType).has(styleKey) && styleArr.length && styleKey !== 'table of contents' && !(styleKey == 'level' && blockType == 'header') && !(styleKey == 'style' && blockType == 'title')" :key="styleKey" class="block-style-fieldset">
                      <legend>{{styleCaption(blockType, styleKey)}}</legend>

                        <block-style-labels
                          :blockType="blockType"
                          :styleArr="styleArr"
                          :styleKey="styleKey"
                          :styleTabs="styleTabs"
                          :styleValue="styleValue"
                          @selectStyleEv="selectStyle"
                        ></block-style-labels>


                      </fieldset>

                  </template>

                </vue-tab>

              </vue-tabs>

            </div>
        </vue-tab>
      </vue-tabs>
      </div>
    </div>

    <book-edit-cover-modal
      :show="bookEditCoverModalActive"
      @closed="bookEditCoverModalActive = false"
      :img="currentBook"
    ></book-edit-cover-modal>

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

    <div v-if="showUnknownAuthor == 1" class="outside" v-on:click="showUnknownAuthor = -1"></div>
    <div v-if="showUnknownAuthorEn == 1" class="outside" v-on:click="showUnknownAuthorEn = -1"></div>
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
import { modal, accordion, panel } from 'vue-strap'
import task_controls from '../../mixins/task_controls.js'
import api_config from '../../mixins/api_config.js'
import access from '../../mixins/access.js'
import { Languages } from "../../mixins/lang_config.js"
import { VueTabs, VTab } from 'vue-nav-tabs'
//import VueTextareaAutosize from 'vue-textarea-autosize'
import BookAssignments from './details/BookAssignments';
import BookWorkflow from './details/BookWorkflow';
import BookPublish from './details/BookPublish';
import SplitPreview from './details/SplitPreview';
import BlockStyleLabels from './details/BlockStyleLabels';
import CompleteAudioExport from './details/CompleteAudioExport';
var BPromise = require('bluebird');

//Vue.use(VueTextareaAutosize)

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
    modal,
    accordion,
    panel,
    BookAssignments,
    BookWorkflow,
    BookPublish,
    SplitPreview,
    BlockStyleLabels,
    CompleteAudioExport
  },

  data () {
    return {
      requiredFields:[],
      pubTypes: [
        'Public', 'Hidden', 'Encumbered', 'Research', 'Private'
      ],
      styleTitles: {
        'title_style': 'Subtype',
        'header_level': 'Subtype',
      },
      styleTabLabels: {
        'hr': 'line'
      },
      styleNotNumbered: ['sitalcent', 'editor-note', 'signature', 'reference'],
      languages: Languages,
      dirty: {
      },
      visible: true,
      showModal: false,
      showModal_audio: false,
      bookEditCoverModalActive: false,
      currentBook: {},
      masteringTask: {},
      importTask: {},
      linkTaskError: '',
      isOwner: false,
      approveMetadataComment: '',
      showSharePrivateBookModal: false,
      textCleanupProcess: false,
      finishPublishedProcess: false,
      //audiobook: {},
      unlinkCollectionWarning: false,
      blockTypes: BlockTypes,
      generatingAudiofile: false,
      audiobookChecker: false,
      showUnknownAuthor: -1,
      showUnknownAuthorEn: -1,
      lockLanguage: false,

      // set blocks properties
      styleTabs: new Map(),
      numProps: new Map(),
      activeTabIndex: 0,
      isPublishing: false,
      isPublishingQueue: false,
      publicationStatus: false,
      isExporting:false,
      //validationErrors: {extid: [], weight: []},
      validationErrors: {},
      validationErrorDifficulty: '',
      validationErrorWeight: '',
      updateAllowed: false,
      TAB_ASSIGNMENT_INDEX: 0,
      TAB_META_INDEX: 1,
      TAB_TOC_INDEX: 2,
      TAB_AUDIO_INDEX: 3,
      TAB_STYLE_INDEX: 4,
      users: {
        'editor': [],
        'proofer': [],
        'engineer': [],
        'reader': [],
        'narrator': []
      },
      authorsLangFarsi:    // move to config
      {
       'bab':      'باب',
       'baha':     'بهاءالّله',
       'abd':      'عبدالبهاء',
       'shoghi':   'شوقی',
       'sacred':   'sacred',
       'bible':    'انجيل',
       'muhammad': 'محمد',
       'quran':    'قرآن',
       'jesus':    'عیسی',
       'ali':      'علی',
       'tradition': 'حدیث',
       'husayn':   'حسین'
      },
      pausesBeforeProps: new Map()
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
      //tc_tasksByBlock: 'tc_tasksByBlock',
      storeList: 'storeList',
      storeListO: 'storeListO',
      blockSelection: 'blockSelection',
      alignCounter: 'alignCounter',
      audiobook: 'currentAudiobook',
      subjectCategories: 'bookCategories',
      // subjectDifficulties: 'bookDifficulties',
      bookDifficultyDefault: 'bookDifficultyDefault',
      tasks_counter: 'tasks_counter',
      taskTypes: 'taskTypes',
      adminOrLibrarian: 'adminOrLibrarian',
      allowBookSplitPreview: 'allowBookSplitPreview',
      mode: 'bookMode',
      aligningBlocks: 'aligningBlocks'
    }),
    proofreadModeReadOnly: {
      get() {
          // return this.mode === 'proofread' || (this._is('proofer') && ['Collection'].indexOf(this.$route.name) > -1) ;
          // ILM-3992:
          return this.mode === 'proofread'  ;
      }
    },
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
    getDemoStatus(){ // build, rebuild, progress, failed
        let errorGenerateTime = 1 * 60 * 60000;   // 1 hr * 60 min * 60000 msec;
        let currTime = new Date().getTime();

        if (!this.currentBookMeta.demo_time) return 'build';

        if (Number(this.currentBookMeta.demo_time) < 0){
            if (Number(currTime) + Number(this.currentBookMeta.demo_time) > errorGenerateTime){
              console.log('failed');
              return 'failed';
            } else {
              return 'progress';
            }
        }
        return 'rebuild';
    },
    suggestTranslatedId: function () {
      if (this.currentBook) return this.currentBook.bookid.split('-').slice(0, -1).join('-') + '-?'
    },
    isAllowExportAudio: {
      get() {
        if (this._is('admin') || this._is('librarian') || this._is('editor', true)) {
          return true;
        }
        return false;
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
        return this.tc_blocksToApproveCount();
      }
    },
    selectionStart() {
      return this.blockSelection.start._id ? this.blockSelection.start._id : false;
    },
    selectionEnd() {
      return this.blockSelection.end._id ? this.blockSelection.end._id : false;
    },
    allowMetadataEdit: {
      get() {
        //do not allow to edit metadata while book is in Publish Queue:      
        if (this.currentBookMeta.isInTheQueueOfPublication === true || this.currentBookMeta.isIntheProcessOfPublication === true)
            return false;

        return this.tc_allowMetadataEdit();
      }
    }
  },

  mixins: [task_controls, api_config, access],

  mounted() {
    this.$root.$on('from-bookblockview:voicework-type-changed', this.getAudioBook);
    //this.loadAudiobook(true)

    this.getAudioBook({bookid: this.currentBookid})
      .then(() => {
        if (this.currentAudiobook) {

        }
      });
    this.setCurrentBookCounters();
    this.$root.$on('from-block-edit:set-style', this.listenSetStyle);
    this.$root.$on('from-block-edit:set-style-switch', this.listenSetStyleSwitch);
    /*document.addEventListener("click", this.onClickOutside);*/
    if (this.selectionStart && this.selectionEnd) {
      this.collectCheckedStyles(this.selectionStart, this.selectionEnd)
    }
    $('body').on('click', '.vue-tabs.meta-edit-tabs li.tab', () => {
      this.activeTabIndex = this.$refs.panelTabs ? this.$refs.panelTabs.activeTabIndex : null;
      if (this.activeTabIndex === 1 && this.$refs.descriptionShort) {
        Vue.nextTick(() => {
          this.$refs.descriptionShort.initSize();
        });
      }
      if (this.activeTabIndex === 1 && this.$refs.descriptionLong) {
        Vue.nextTick(() => {
          this.$refs.descriptionLong.initSize();
        });
      }
    });
  },
  beforeDestroy: function () {
    this.$root.$off('uploadAudio');
    this.$root.$off('audiobookUpdated');
    this.$root.$off('from-bookblockview:voicework-type-changed', this.getAudioBook);
    //this.$root.$off('book-reimported');
    this.$root.$off('from-block-edit:set-style', this.listenSetStyle);
    this.$root.$off('from-block-edit:set-style-switch', this.listenSetStyleSwitch);
  },

  watch: {

    currentBookMeta: {
      handler (val) {
        this.init();
        this.lockLanguage = false;

      },
      deep: true
    },
    currentBookFiles: {
      handler (val) {
        this.currentBook.coverimg = this.currentBookFiles.coverimg
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
    'blockSelection.refresh': {
      handler(val, oldVal) {
        if (val) {
          //console.log('WATCH blockSelection.refresh', val, oldVal);
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id);
        }
      }
    },
    '$route': {
      handler(val) {
        //console.log('ROUTE CHANGE')
        let newIndex = false;

        switch (this.activeTabIndex) {
          case this.TAB_ASSIGNMENT_INDEX:
            break;
          case this.TAB_META_INDEX:
            break;
          case this.TAB_AUDIO_INDEX:
            if (!this.tc_displayAudiointegrationTab()) {
              newIndex = this.TAB_ASSIGNMENT_INDEX;
              //console.log('HERE')
            }
            break;
          case this.TAB_STYLE_INDEX:
            if (!this.tc_displayStylesTab()) {
              newIndex = this.TAB_ASSIGNMENT_INDEX;
            }
            break;
        }
        if (newIndex !== false) {
          this.activeTabIndex = newIndex;
          this.$refs.panelTabs.findTabAndActivate(newIndex);
        }
        this.$forceUpdate();
      }
    },
    'aligningBlocks.length': {
      handler(val, oldVal) {
        if (val < oldVal && this.blockSelection.start._id) {// e.g. pause_before can be changed after realignment
          //console.log('ALIGNING', val);
          this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
        }
      }
    }

  },

  created () {
    this.init()
  },

  methods: {

    init () {
      // if( !this.validationErrors[this.currentBook.bookid])
      //   this.validationErrors[this.currentBook.bookid] = {};
      // if( !this.validationErrors[this.currentBook.bookid]['difficulty'])
      //   this.validationErrors[this.currentBook.bookid]['difficulty'] = '';
      // if( !this.validationErrors[this.currentBook.bookid]['weight'])
      //   this.validationErrors[this.currentBook.bookid]['weight'] = '';
      //
      // this.validationErrorDifficulty = (this.validationErrors[this.currentBook.bookid] && this.validationErrors[this.currentBook.bookid]['difficulty']) ? this.validationErrors[this.currentBook.bookid]['difficulty'] : '';
      // this.validationErrorWeight = (this.validationErrors[this.currentBook.bookid] && this.validationErrors[this.currentBook.bookid]['weight']) ? this.validationErrors[this.currentBook.bookid]['weight'] : '';
      this.validationErrorDifficulty ='';
      this.validationErrorWeight = '';

      let checkId = this.currentBook.bookid;
      this.updateAllowed = false;
      setTimeout(() => {
        if (!checkId || this.currentBook.bookid === checkId) {
          this.updateAllowed = true;//autosize plugin send updates on initialization
        }
      }, 1500)
      for (let id in this.$store.state.tc_currentBookTasks.tasks) {
        let record = this.$store.state.tc_currentBookTasks.tasks[id]
        if (record.type == 'import-book') {
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
    /*
    //close unknown author if clicked outside
    onClickOutside(event) {
      console.log('event', event);
      this.showUnknownAuthor = -1;
      this.showUnknownAuthorEn = -1;
    },*/
    checkPublish(){
        this.requiredFields[this.currentBookMeta.bookid] = [];

        let defaultCategory = ['story', 'Stories']; // means there is no category assigned

        if(!this.currentBookMeta.category || defaultCategory.includes(this.currentBookMeta.category)){
          this.requiredFields[this.currentBookMeta.bookid]['category'] = true;
        }

        if (this.currentBookMeta.title == ''){
          console.log('bookid', this.currentBookMeta.bookid);
          this.requiredFields[this.currentBookMeta.bookid]['title'] = true;
        }

        if (this.currentBookMeta.author.join("").length == 0){
          this.requiredFields[this.currentBookMeta.bookid]['author'] = true;
        }

        if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.title_en == '' || !this.currentBookMeta.hasOwnProperty('title_en'))){
          this.requiredFields[this.currentBookMeta.bookid]['title_en'] = true;
        }

        if (this.currentBookMeta.language != 'en' && (this.currentBookMeta.author_en == '' || !this.currentBookMeta.hasOwnProperty('author_en'))){
          this.requiredFields[this.currentBookMeta.bookid]['author_en'] = true;
        }

        if (this.currentBookMeta.slug == '' || !this.currentBookMeta.hasOwnProperty('slug')){
          this.requiredFields[this.currentBookMeta.bookid]['slug'] = true;
        }



    },

    updateCollection(event) {
      let collectionId = event && event.target.value ? event.target.value : null;
      if (event && !collectionId) {
        this.unlinkCollectionWarning = true;
      } else {
        return this.updateBookCollection(collectionId)
          .then(response => {
            this.unlinkCollectionWarning = false;
            if (response.status === 200) {
              if (collectionId) {
                this.$router.replace({path: '/collections/' + collectionId + '/' + this.currentBook.bookid});
              } else {
                Vue.nextTick(() => {
                  this.$router.replace({path: '/books'});
                });
              }
            }
          })
          .catch(err => {
            this.unlinkCollectionWarning = false;
            console.log(err);
          })
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
      //if changed language let's refresh the page for update default block & footnote language.

      if (key == 'language'){
        setTimeout(() => {
          this.reloadBook()
          .then(() => {
            this.$root.$emit('book-reimported');
            this.isBatchProgress = false;
          })
        }, 1500)
      }
    },
    updateWithDisabling(key, event, debounceTime){
      if(!debounceTime)
        debounceTime = false;

      return this.update(key, event, debounceTime, true);
    },

    update(key, event, debounceTime, disable){
      if(!debounceTime)
        debounceTime = false;
      if(!disable)
        disable = false;

      console.log('here', debounceTime, disable);


      if(key =='difficulty'){

          let validationErrors = '';

          let re = /^\d+(\.\d+)*$/i;

          if ( !this.currentBook.difficulty.match(re) ){
            validationErrors = 'Allowed range 1 - 14.99';
          }

        if ( parseFloat(this.currentBook.difficulty) > 14.99 ){
          validationErrors = 'Allowed range 1 - 14.99';
        }
        if ( parseFloat(this.currentBook.difficulty) < 1){
          validationErrors = 'Allowed range 1 - 14.99';
        }

        if(validationErrors !=this.validationErrors['difficulty'] ){
          // this.validationErrors[this.currentBook.bookid]['difficulty'] = validationErrors;
          this.validationErrorDifficulty = validationErrors;
        }
        if(validationErrors && event && disable){
          event.target.toggleAttribute('disable');
          return;
        }

      }

      if(disable && event) {
        event.target.disabled = true;
      }
      if(debounceTime){
        let debouncedFunction = _.debounce((key,event)=>{
          let val = typeof event === 'string' ? event : event.target.value;
          this.liveUpdate(key, key == 'author' ? this.currentBook.author : val, event)

        },  debounceTime, {
          'leading': false,
          'trailing': true
        });
        debouncedFunction(key,event);
      }else{
        let val = typeof event === 'string' ? event : event.target.value;
        this.liveUpdate(key, key == 'author' ? this.currentBook.author : val, event)
      }
    },

    liveUpdate (key, value, event) {
      // Removed regards with ILM-3683:
      //bad conflict fix
      //  if(this.proofreadModeReadOnly)
      //      return ;
      //bad conflict fix

        if( this.requiredFields[this.currentBook.bookid] && this.requiredFields[this.currentBook.bookid][key] ) {
          if (key != 'author'){
            delete this.requiredFields[this.currentBook.bookid][key];
          } else {
            if (this.currentBookMeta.author.join("").length !== 0){
              delete this.requiredFields[this.currentBook.bookid][key];
            }
          }
        }

        if (this.currentBook.language == 'en' && (key == 'title' || key == 'author'))
        {
            try {
              delete this.requiredFields[this.currentBook.bookid]['slug'];
            } catch (err){
            }
        }
        if (this.currentBook.author != 'en' && (key == 'title_en' || key == 'author_en'))
        {
            try {
              delete this.requiredFields[this.currentBook.bookid]['slug'];
            } catch (err){
            }
        }

      var keys = key.split('.');
      key = keys[0];
      if (keys.length > 1) {
          this.currentBook[keys[0]][keys[1]] = value;
          value = this.currentBook[keys[0]];
      }

      var update = {
        [key]: value
      }

      // Batch updates
      if (key === 'language') {
        update.voices = {};
      }

      return this.updateBookMeta(update)
      .then((response)=>{
        console.log('response', response);
        console.log('event', event);
        if(event)
          event.target.disabled  = false ;

        this.lockLanguage = false;
        if (key == 'numbering') {
          this.$root.$emit('from-meta-edit:set-num', this.currentBookid, value);
        }

          return response;

      })
      .catch(err => {
        console.log(err);
        return BPromise.reject(err);
      });

    },

    liveUpdateOld (key, value) {
      var dbPath = superlogin.getDbUrl('ilm_content_meta')
      if (process.env.DOCKER) dbPath = dbPath.replace('couchdb', 'localhost')

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
      var db = new PouchDB(dbPath)
      var api = db.hoodieApi()

      this.freeze('updateBookMeta');
      return api.update(this.currentBookid, update)
      .then(doc => {
        if (key == 'numbering') {
          this.unfreeze('updateBookMeta');
          this.$root.$emit('from-meta-edit:set-num', this.currentBookid, value);
          //this.$root.$emit('from-book-meta:upd-toc', true);
        }
        //console.log('success DB update: ', doc)
        let updateVersion = {minor: true};
        switch(key) {
          case 'styles':
          case 'numbering':
            updateVersion = {major: true};
            break;
        }
        return this.updateBookVersion(updateVersion)
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

    sharePrivateBook() {
      this.textCleanupProcess = true
      var self = this
      self.showSharePrivateBookModal = false
        //axios.put(API_URL + 'books/' + self.currentBook._id + '/share_private')
        self.liveUpdate('private', false)
          .then((doc) => {
            axios.put(self.API_URL + 'task/' + self.currentBook._id + '/finish_cleanup')
              .then((doc) => {
                self.textCleanupProcess = false
                if (!doc.data.error) {
                  self.currentBook.private = false
                  self.tc_currentBookTasks.assignments.splice(self.tc_currentBookTasks.assignments.indexOf('content_cleanup'));
                  self.$store.dispatch('tc_loadBookTask')
                  self.$store.dispatch('getCurrentJobInfo');
                  self.$root.$emit('set-alert', 'Text cleanup task finished')
                } else {
                  self.liveUpdate('private', true)
                  this.$root.$emit('set-error-alert', doc.data.error);
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
    },
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
      // this.isPublishingQueue = true;
      return axios.post(this.API_URL + 'books/' + this.currentBookMeta.bookid + '/publish')
      .then(resp => {
        if (resp.status == 200 && resp.data.ok) {
          this.currentBook.isInTheQueueOfPublication = true;
          this.currentBookMeta.isInTheQueueOfPublication = true;
        }
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
          if (this.currentJobInfo.text_cleanup) route.params.task_type = 'text-cleanup';
        }
      //this.$router.push({name: this.$route.name, params:  params});
      }
      return route;
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
      let lang = 'en'; // for transfer to block styles panel;
      let pausesBefore = new Map();

      //console.log('collectCheckedStyles', startId, endId);

      if (this.storeListO.getBlock(startId)) {
        let idsArrayRange = this.storeListO.ridsArrayRange(startId, endId);
        idsArrayRange.forEach((blockRid)=>{
        //console.log('blockId', blockId);

          let oBlock = this.storeListO.get(blockRid);

          if (oBlock) {
            let pBlock = this.storeList.get(oBlock.blockid);
            if (pBlock) {
              if (!result.has(oBlock.type)) result.set(oBlock.type, new Map());

              if (pBlock.language && pBlock.language.length) {
                //return this.block.language;
                if (pBlock.language != 'en') lang = pBlock.language;
              } else {
                if (this.currentBookMeta.language != 'en') lang = this.currentBookMeta.language;
              }

              for (let styleKey in this.blockTypes[oBlock.type]) {
                if (!result.get(oBlock.type).has(styleKey)) result.get(oBlock.type).set(styleKey, new Map());

                let styleSubKey = this.blockTypes[oBlock.type][styleKey];
                if (typeof styleSubKey == 'object' && !Array.isArray(styleSubKey)) {
                  for (let subKey in styleSubKey) {
                    if (!result.get(oBlock.type).get(styleKey).has(subKey)) {
                      result.get(oBlock.type).get(styleKey).set(subKey, new Map());
                    }
                    if (pBlock.classes[styleKey] && pBlock.classes[styleKey][subKey]) {
                      result.get(oBlock.type).get(styleKey).get(subKey).set(pBlock.classes[styleKey][subKey], true);
                    } else {
                      result.get(oBlock.type).get(styleKey).get(subKey).set(this.blockTypes[oBlock.type][styleKey][subKey][0], true);
                    }
                  };
                } else {
                  if (pBlock.classes[styleKey]) {
                    result.get(oBlock.type).get(styleKey).set(pBlock.classes[styleKey], true);
                  } else {
                    result.get(oBlock.type).get(styleKey).set('none', true);
                  }
                }
              }

              if (!nums.has(oBlock.type))
                nums.set(oBlock.type, new Map([
                  ['secNum',  !(oBlock.isNumber === false)],
                  ['secHide', !(oBlock.isHidden === false)],
                  ['parNum',  !(oBlock.isNumber === false)],
                  ['parHide', !(oBlock.isHidden === false)],
                ]));

              //console.log('nums.get(pBlock.type)', nums.get(pBlock.type), !(pBlock.secnum === false));

              if (nums.get(oBlock.type).get('secNum') !== 'mixed') {
                if (oBlock.hasOwnProperty('secnum')) {
                  if (!(oBlock.isNumber === false) !== nums.get(oBlock.type).get('secNum')) {
                    nums.get(oBlock.type).set('secNum', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('secNum', !(oBlock.isNumber === false));
                  }
                } else {
                  nums.get(oBlock.type).set('secNum', false);
                }
              }
              if (nums.get(oBlock.type).get('secHide') !== 'mixed') {
                if (oBlock.hasOwnProperty('isHidden')) {
                  if (!(oBlock.isHidden === false) !== nums.get(oBlock.type).get('secHide')) {
                    nums.get(oBlock.type).set('secHide', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('secHide', !(oBlock.isHidden === false));
                  }
                } else {
                  nums.get(oBlock.type).set('secHide', false);
                }
              }
              if (nums.get(oBlock.type).get('parNum') !== 'mixed') {
                if (oBlock.hasOwnProperty('isNumber')) {
                  if (!(oBlock.isNumber === false) !== nums.get(oBlock.type).get('parNum')) {
                    nums.get(oBlock.type).set('parNum', 'mixed');
                  } else {
                    nums.get(oBlock.type).set('parNum', !(oBlock.isNumber === false));
                  }
                } else {
                  nums.get(oBlock.type).set('parNum', false);
                }
              }
              if (!pausesBefore.has(oBlock.type)) {
                pausesBefore.set(oBlock.type, new Map());
                pausesBefore.get(oBlock.type).set('pause_before', new Map());
                /*pausesBefore.get(oBlock.type).get('pauses_before').set(new Map([
                  ['none', !pBlock.pause_before],
                  [0.6, pBlock.pause_before == 0.6],
                  [1, pBlock.pause_before == 1],
                  [2, pBlock.pause_before == 2],
                  [4, pBlock.pause_before == 4]
                ]));*/
              }
              pausesBefore.get(oBlock.type).get('pause_before').set(pBlock.pause_before ? `${pBlock.pause_before}` : 'none', true);
              //pausesBefore.get(oBlock.type).get('pause_before').set(pBlock.pause_before ? pBlock.pause_before : '0.6', true);
            }
          }

        });
      }

      if (lang != 'en'){
        result.lang = lang;
      }

      this.styleTabs = result;
      this.numProps = nums;
      this.pausesBeforeProps = pausesBefore;

      //console.log('result', result);
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
      if(this.proofreadModeReadOnly)
          return

      let styleKeyArr = styleKey.split('.');
      styleKey = styleKeyArr.shift();
      //console.log('selectStyle-', 'blockType:', blockType, 'styleKey:', styleKey, 'styleVal:', styleVal);
      let updateToc = (styleKey == 'table of contents' || (blockType == 'title' && styleKey == 'style') );
      let updateNum = !(styleKey == 'paragraph type' && ['sitalcent', 'editor-note', 'reference', 'signature'].indexOf(styleVal) >-1);
      let updatePromises = [], updateNums = [];
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          idsArrayRange.forEach((blockRid)=>{
            let oBlock = this.storeListO.get(blockRid);
            if (oBlock) {
              let pBlock = this.storeList.get(oBlock.blockid);

              if (styleKey !== 'paragraph type') updateNum = oBlock.isNumber;

              if (pBlock && blockType == 'title') { // ILM-2533
                if (styleKey == 'style') {
                  if (styleVal != '') {
                    pBlock.classes['table of contents'] = {isInToc: 'off'};
                  } else {
                    pBlock.classes['table of contents'] = {isInToc: 'on'};
                  }
                }
                if (styleKey == 'table of contents' && styleVal == 'on') {
                  pBlock.classes['style'] = '';
                } else {
                  //pBlock.classes['style'] = this.blockTypes[blockType]['style'][1];
                }
              }
              if (pBlock && blockType == 'header') { // ILM-2533
                if (styleKey == 'level')
                  switch(styleVal) {
                    case 'h2' : {
                      pBlock.classes['table of contents'] = {isInToc: 'on', tocLevel: 'toc2'};
                    } break;
                    case 'h3' : {
                      pBlock.classes['table of contents'] = {isInToc: 'on', tocLevel: 'toc3'};
                    } break;
                    case 'h4' : {
                      pBlock.classes['table of contents'] = {isInToc: 'off', tocLevel: 'toc4'};
                    } break;
                  };
                if (styleKey == 'table of contents') {
                  if (typeof pBlock.classes['table of contents'] !== 'object') {
                    pBlock.classes['table of contents'] = {};
                  }
                  switch(styleVal) {
                    case 'toc4' : {
                      pBlock.classes['table of contents']['isInToc'] = 'off'
                    } break;
                    default: {
                      pBlock.classes['table of contents']['isInToc'] = 'on'
                    }
                  };
                }
              }

              if (this.styleNotNumbered.indexOf(pBlock.classes[styleKey]) == -1 && this.styleNotNumbered.indexOf(styleVal) != -1){
                pBlock.parnum = false;
                pBlock.isNumber = false;
              }

              if (this.styleNotNumbered.indexOf(pBlock.classes[styleKey]) != -1 && this.styleNotNumbered.indexOf(styleVal) == -1){
                pBlock.parnum = true;
                pBlock.isNumber = true;
              }

              if (pBlock && pBlock.type == blockType) {
                  if (styleVal.length) {
                    if (styleKeyArr.length) {
                      if (typeof pBlock.classes[styleKey] !== 'object') {
                        pBlock.classes[styleKey] = {};
                        pBlock.classes[styleKey][styleKeyArr.slice().shift()] = styleVal;
                      } else {
                        pBlock.classes[styleKey][styleKeyArr.slice().shift()] = styleVal;
                      }
                    }
                    else pBlock.classes[styleKey] = styleVal;
                    if (blockType === 'header' && styleKey === 'level') {
                      updateToc = true;
                      //pBlock.classes['table of contents'] = {};//'toc' + styleVal.replace(/\D/, '');
                    }
                  }
                else pBlock.classes[styleKey] = '';
                //console.log(oBlock.blockid, 'isNumber', oBlock.isNumber,  'updateNum', updateNum);
                if (oBlock.isNumber !== updateNum) {
                  updateNums.push(oBlock.rid);
                  pBlock.isNumber = updateNum;
                  oBlock.isNumber = updateNum;
                  updatePromises.push(this.putNumBlock(pBlock));
                } else {
                  //pBlock.status = pBlock.status || {};
                  //pBlock.status.marked = false;
                  console.log(styleKey, styleVal, pBlock.isChanged, pBlock.content);
                  let updateBody = {
                    blockid: pBlock.blockid,
                    bookid: pBlock.bookid,
                    classes: pBlock.classes//,
                    //status: pBlock.status
                  };
                  let isCouplet = styleKey === "whitespace" && styleVal === "couplet";
                  if (isCouplet) {// send content for update, to parse content for couplet
                    updateBody['content'] = pBlock.content;
                  }
                  updatePromises.push(this.putBlockPart([updateBody, false, pBlock.getIsChanged() || pBlock.getIsAudioChanged()])
                    .then(() => {
                      if (isCouplet) {
                        this.$root.$emit(`block-state-refresh-${pBlock.blockid}`);
                      }
                      return Promise.resolve();
                    }));
                }
              }
            }
          })
          this.updateBookVersion({major: true});
        }
        Promise.all(updatePromises)
          .then(()=>{
            if (updateNums.length > 0) {
              this.putNumBlockOBatch({bookId: this.currentBookid})
              .then(()=>{
                this.$root.$emit('from-meta-edit:set-num');
                console.log("$emit('from-meta-edit:set-num')");
                if (updateToc) {
                  this.$root.$emit('from-book-meta:upd-toc', true);
                }
                this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
              });
            } else {
              if (updateToc) {
                this.$root.$emit('from-book-meta:upd-toc', true);
              }
              this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
            }
          })
      }
    },
    selectPauseBefore(blockType, styleKey, styleVal) {
      //console.log(blockType, styleKey, styleVal);
      if (this.proofreadModeReadOnly) {
        return;
      }
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          idsArrayRange.forEach((blockRid)=>{
            let oBlock = this.storeListO.get(blockRid);
            if (oBlock && oBlock.type === blockType) {
              let pBlock = this.storeList.get(oBlock.blockid);
              pBlock.pause_before = styleVal;
            }
          })
          this.updateBookVersion({major: true});
        }
        return this.setPauseBefore([blockType, styleVal])
          .then(() => {
            this.tc_loadBookTask(this.currentBookMeta._id);
            this.getCurrentJobInfo();
            this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
          });
      }
    },

    listenSetStyle () {
      //console.log('listenSetStyle', this.selectionStart, this.selectionEnd);
      if (this.selectionStart && this.selectionEnd) {
        this.collectCheckedStyles(this.selectionStart, this.selectionEnd, false);
      }
    },

    listenSetStyleSwitch () {
      //console.log('listenSetStyleSwitch', this.selectionStart, this.selectionEnd);
      if (this.selectionStart && this.selectionEnd) {
        this.collectCheckedStyles(this.selectionStart, this.selectionEnd, true);
      }
    },

    selSecNum (blockType, valKey, currVal) {
        if(this.proofreadModeReadOnly)
            return;
      //console.log('selSecNum', blockType, valKey, currVal);
      let updatePromises = [];
      if (this.blockSelection.start._id && this.blockSelection.end._id) {
        if (this.storeList.has(this.blockSelection.start._id)) {
          let putBlockOpromise = [];
          let idsArrayRange = this.storeListO.ridsArrayRange(this.blockSelection.start._id, this.blockSelection.end._id);
          let oBlock;

          idsArrayRange.forEach((blockRid)=>{
            oBlock = this.storeListO.get(blockRid);
            if (oBlock && oBlock.type == blockType) {
              switch(valKey) {
                  case 'secHide' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isHidden = true;
                    } else {
                      oBlock.isHidden = false;
                    }
                  } break;

                  case 'secNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isNumber = true;
                    } else {
                      oBlock.isNumber = false;
                    }
                  } break;

                  case 'parNum' : {
                    if (currVal == 'mixed' || currVal === false) {
                      oBlock.isNumber = true;
                    } else {
                      oBlock.isNumber = false;
                    }
                  } break;
                  default : {
                  } break;
              };

              if (oBlock.rid) {
                let upd = {
                  rid: oBlock.rid,
                  isHidden: oBlock.isHidden,
                  isNumber: oBlock.isNumber
                }
                putBlockOpromise.push(this.putBlockO(upd));
              }
            }
          });

          Promise.all([putBlockOpromise]).then((res)=>{
            if (valKey == 'secNum' || valKey == 'parNum') {
              let blockO = this.storeListO.getBlock(this.blockSelection.start._id);
              this.$root.$emit('from-meta-edit:set-num', this.currentBookid, this.currentBook.numbering, blockO.rid)
            } else {
              this.$root.$emit('from-meta-edit:set-num');
            }
            this.updateBookVersion({major: true})
            if (valKey == 'secHide' && blockType == 'header') {
              this.$root.$emit('from-book-meta:upd-toc', true);
            }
          })
        }

        this.collectCheckedStyles(this.blockSelection.start._id, this.blockSelection.end._id, false);
      }
    },

    downloadDemo() {
        let currTime = new Date().getTime();
        this.currentBookMeta.demo_time = -1 * currTime;
        return axios.get(this.API_URL + 'books/' + this.currentBook._id + '/demo')
               .then(resp => {
                 //this.isExporting = false;
               });
    },
    deactivateDemoLink() {
      console.log('inside deactivate');
      return axios.get(this.API_URL + 'books/' + this.currentBook._id + '/deactivateDemoLink')
             .then(resp => {
               //this.isExporting = false;
             });
    },
    downloadExportMp3() {
        return this.API_URL + 'export/' + this.currentBook._id + '/exportMp3';
    },
    downloadExportFlac() {
        return this.API_URL + 'export/' + this.currentBook._id + '/exportFlac';
    },
    prepareStyleTabLabel(title) {
      if (this.styleTabLabels.hasOwnProperty(title)) {
        let caption = this.styleTabLabels[title];
        return caption; 
      }
      return title; 
    },
    styleCaption(type, key) {
      if (this.styleTitles.hasOwnProperty(`${type}_${key}`)) {
        let caption = this.styleTitles[`${type}_${key}`];
        return caption.charAt(0).toUpperCase() + caption.slice(1);
      }
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    styleValue(type, key, val, lang='en') {
      key = key.split('.').shift(); // in case of "table of contents.level"
      //console.log('styleValue:', type, key, val);

      if (BlockTypesAlias[type] && BlockTypesAlias[type][key] && BlockTypesAlias[type][key]['values'] && BlockTypesAlias[type][key]['values'][val]) {
        return BlockTypesAlias[type][key]['values'][val];
      } else {
        if (this.authorsLangFarsi.hasOwnProperty(val) && (lang == 'fa' || lang == 'ar')){
          return this.authorsLangFarsi[val];
        } else {
          return val;
        }

      }
    },
    convertTime(dt, time = false) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      var date = new Date(dt);
      var toutc = date.toUTCString();
      var locdate = new Date(toutc + " UTC");

      var year = locdate.getFullYear(),
      month = locdate.getMonth() + 1, // months are zero indexed
      day = locdate.getDate(),
      hour = locdate.getHours(),
      minute = locdate.getMinutes(),
      second = locdate.getSeconds(),
      hourFormatted = hour < 10 ? `0${hour}` : hour, // hour returned in 24 hour format
      minuteFormatted = minute < 10 ? "0" + minute : minute

      //console.log(toutc, locdate);
      let result = day + " " + monthNames[month - 1] + " " + year ;
      if (time) {
        result += " " + hourFormatted + ":" + minuteFormatted;
      }
      return result;

    },
    finishPublished() {
      this.finishPublishedProcess = true;
      return axios.post(this.API_URL + 'task/' + this.currentBook._id + '/finish_published')
        .then(response => {
          this.finishPublishedProcess = false;
          this.updateBookVersion({major: true})
          this.tc_loadBookTask();
          this.getCurrentJobInfo();
        })
        .catch(err => {
          this.finishPublishedProcess = false;
          return false;
        });
    },

    updateExtid: _.debounce(function(event) {
      if (event.target.value && event.target.value.length != 32) {
        this.validationErrors[this.currentBook.bookid]['extid'] = ['Length must be equal to 32 symbols.']
      } else if (/[^a-z\d]+/.test(event.target.value) || /\d+\.$/.test(event.target.value)) {
        this.validationErrors[this.currentBook.bookid]['extid'] = ['Only lowercase letters (a-z) and numbers.']
      } else {
        this.validationErrors[this.currentBook.bookid]['extid'] = [];
        this.liveUpdate('extid', event.target.value);
      }
    }, 500),

    updateWeigth (event,debounceTime) {
      const value = event.target.value.replace(/ /g, '');
      const key = 'weight';
      const maxValue = 10.99;
      const minValue = 1.00;
      let error = '';
      if (Number(value) == value && value % 1 !== 0) {
        if (value > maxValue || value < minValue || (value.split('.')[1]).toString().length > 2) {
          //errors.push('Allowed range ' + minValue + ' - ' + maxValue + ' and format 10.12');
          //ILM-3622:
          error = 'Allowed range ' + minValue + ' - ' + maxValue ;
        }
      } else {
        if (value !== '' && (Number(value) != value || (value > maxValue || value < minValue))) {
          //errors.push('Allowed range ' + minValue + ' - ' + maxValue + ' and format 10.12');
          //ILM-3622:
          error = 'Allowed range ' + minValue + ' - ' + maxValue ;
        }
      }


      // if (!this.validationErrors[this.currentBook.bookid]) {Vue.set(this.validationErrors, this.currentBook.bookid, {key: []})} //this.validationErrors[this.currentBook.bookid] = []};
      // this.validationErrors[this.currentBook.bookid][key] = error;
      this.validationErrorWeight = error;
      if (!error) {

        event.target.disabled  = true ;

        let debouncedFunction = _.debounce((key,event)=>{
          let val = typeof event === 'string' ? event : event.target.value;
          this.liveUpdate(key, key == 'author' ? this.currentBook.author : val, event)

        },  debounceTime, {
          'leading': false,
          'trailing': true
        });
        debouncedFunction(key,event);
      }
      console.log('HERE', this.validationErrors);

    },

    getTaskType(typeId) {
      let t = this.taskTypes.tasks.find(_t => {
        return _t._id === typeId;
      });
      if (t) {
        return t.title;
      } else {
        return '';
      }
    },

    checkAfterAudioImport() {
      this.showModal_audio = false
      if (this.activeTabIndex !== this.TAB_AUDIO_INDEX && this.$refs.panelTabs && this.$refs.panelTabs.tabs[this.TAB_AUDIO_INDEX] && !this.$refs.panelTabs.tabs[this.TAB_AUDIO_INDEX].disabled) {
        this.activeTabIndex = this.TAB_AUDIO_INDEX;
        this.$refs.panelTabs.findTabAndActivate(this.TAB_AUDIO_INDEX);
        this.$forceUpdate();
      }
    },

    updateJobDescription: _.debounce(function(event) {
      this.updateJob({id: this.currentJobInfo.id, description: event.target.value});
    }, 500),

    goToBlock(blockId, ev) {
      this.$router.push({name: this.$route.name, params: {}});
      this.$router.push({name: this.$route.name, params:  { block: blockId }});
    },

    ...mapActions(['getAudioBook', 'updateBookVersion', 'setCurrentBookCounters', 'putBlock', 'putBlockO', 'putNumBlock', 'putNumBlockO', 'putNumBlockOBatch', 'freeze', 'unfreeze', 'blockers', 'tc_loadBookTask', 'getCurrentJobInfo', 'updateBookMeta', 'updateJob', 'updateBookCollection', 'putBlockPart', 'reloadBook', 'setPauseBefore'])
  }
}


Vue.component('resizable-textarea', {
  methods: {
    resizeTextarea (event) {
      event.target.style.height = 'auto'
      event.target.style.height = (event.target.scrollHeight) + 'px'
    },
    initSize() {
      this.$el.setAttribute('style', 'height:' + (this.$el.scrollHeight) + 'px;overflow-y:hidden;')
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initSize();
    })

    this.$el.addEventListener('input', this.resizeTextarea)
  },
  beforeDestroy () {
    this.$el.removeEventListener('input', this.resizeTextarea)
  },
  render () {
    return this.$slots.default[0]
  },
});


Vue.filter('prettyBytes', function (num) {
  // jacked from: https://github.com/sindresorhus/pretty-bytes

  if (typeof num !== 'number' || isNaN(num)) {
    //throw new TypeError('Expected a number');
    return 0;
  }

  var exponent;
  var unit;
  var neg = num < 0;
  var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (neg) {
    num = -num;
  }

  if (num < 1) {
    return (neg ? '-' : '') + num + ' B';
  }

  exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
  num = (num / Math.pow(1000, exponent)).toFixed(1) * 1;
  unit = units[exponent];

  return (neg ? '-' : '') + num + ' ' + unit;
});
</script>
<style>
  select.text-danger#categorySelection, input.text-danger{
    color: #000;
    border: 1px solid red!important;
    border-radius: 0px;
  }
.meta-edit-tabs .nav-tabs-navigation {
  /*border: 1px solid red;*/
  position: sticky;
  top: 44px;
  background-color:white;
  z-index: 19;
  /*border-top: 10px solid white;*/
}

#p-styles-switcher.tab-container {
  padding-top: 0px;
}

.meta-edit-tabs > .nav-tabs-navigation{
  border: 1px solid white;
  position: sticky;
  top: 0px;
  z-index: 20;
}

</style>

<style scoped src='./css/BookProperties.css'></style>
<style>
  .disabled .tab{
    background-color: whitesmoke ;
  }
  .disabled .tab.active{
    background-color: transparent ;
  }
</style>
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
    width: 100%; padding: 0; margin:0; border: none;
    /*min-height: 180px;*/
    resize: vertical;
  }
  fieldset.description.brief textarea {
    /*min-height: 50px;*/
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
  table.properties td:nth-child(2) {width: auto; text-align: right !important;}
  table.properties tr:nth-child(odd) {background-color: #F0F0F0}
  table tr {border: 2px solid white}
  table tr.changed {border: 2px solid wheat}
  table tr input {font-size: 1em; width: 100%}
  tr.subtitle input {font-size: .85em; width: 100%; line-height: 1.85em;}
  tr.author input {width: 90%;}
  tr.author button {border: none !important; background-color: inherit; padding: 0}
  tr.author button.disabled i {display: none; border: none;}
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

        ul, li {
          padding: 0;
          margin: 0;
          list-style: none;
        }
        ul {
          display: flex;
          flex-wrap: wrap;
          &:not(:first-of-type) {
            border-top: 1px solid #b9b6b6;
            margin-top: 5px;
            padding-top: 10px;
          }
        }
        li {
          margin-inline-end: 20px;
          .block-style-label {
            float: none;
            width: auto;
          }
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
  table.properties {
    .has-error {
        border: 1px solid red;
    }
  }
  fieldset  .validation-error {
    width: 100% !important;
    color: red;
    float: left !important;
  }

</style>

<style lang="less">
  div.block-style-tabs .nav-tabs > li > a {
    margin: 0 !important;
  }

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
  li.tab {
      &.disabled {
          display: none;
      }
  }
  section.tab-container {
    li.tab {
      display: block;
    }
  }

  .outline-0 {
    outline: 0;
  }

  .meta-edit-tabs.vue-tabs .disabled legend{
    font-size: 12px;
    font-style: normal;
    color: gray;
  }
  .meta-edit-tabs.vue-tabs .disabled span{
    font-size: 14px;
    font-style: normal;
  }
  .meta-edit-tabs.vue-tabs .disabled label{
    font-size: 14px;
    font-style: normal;
    min-height: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i{
    font-size: 14px;
  }

  .meta-edit-tabs.vue-tabs i.fa-check-circle-o{
    color: #303030;
  }

  .meta-edit-tabs.vue-tabs .disabled i.fa-check-circle-o{
    /*color: #303030;*/
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-circle-o{
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-check-square-o{
    font-size: 18px;
  }
  .meta-edit-tabs.vue-tabs .disabled i.fa-square-o{
    font-size: 18px;
  }

  /*.author select * {
    padding: 5px;
    margin: 5px;
    font-size: 110%;
  } */

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .dropdown-button {
    border: 1px solid #444;
    border-radius: 2px;
    padding: 4px;
    height: 30px
  }

  .dropdown-content {
    cursor: default;
    top: 30px;
    left:-59px;
    position: absolute;
    background-color: #f9f9f9;
    min-width: 80px;
    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
    padding: 5px;
    z-index: 1;
    border: 1px solid #aaa;
  }

  .dropdown-content:hover {
    background: #1e90ff;
    color: #fff;
  }

  .outside {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0px;
    left: 0px;
}

</style>
