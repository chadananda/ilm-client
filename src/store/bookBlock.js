const _ = require('lodash');
const _id = require('uniqid');
import superlogin from 'superlogin-client';
import Vue from 'vue';

let defBlock = [
  '_id',
  '_rev',
  'bookid',
  'chainid',
  'index',
  'tag',
  'content',
  'type',
  'classes',
  'audiosrc',
  'footnotes',
  'flags',
  '_deleted',
  'parnum',
  'secnum',
  /*'secVal',
  'secHide',*/
  'isHidden',
  'isNumber',
  'illustration',
  'illustration_width',
  'illustration_height',
  'description',
  'voicework',
  'language',
  'status',
  'audiosrc_ver',
  'blockid',
  'manual_boundaries',
  'parts'
]

let BlockTypes = {
//   title: {
//     '': [],
//     subtitle: [],
//     author: [],
//     translator: []
//   },
  title: {
    'table of contents': ['', 'toc1'],
    size: ['', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
    style: ['', 'subtitle', 'author', 'translator', 'copyright', 'allcaps'],
    align: ['', 'left', 'center', 'right', 'justify'],
    padding: ['', 'nopad', 'nopad-top', 'nopad-bottom', 'extrapad', 'extrapad-top', 'extrapad-bottom'],
    'outsize-padding': ['', 'outpad-top', 'outpad-top-extra', 'outpad-bottom', 'outpad-bottom-extra'],
  },
  header: {
    //type: ['', 'subhead'],
    level: ['', 'h2', 'h3', 'h4'],
    align: ['', 'left', 'center', 'right', 'justify'],
    'table of contents': ['', 'toc1', 'toc2', 'toc3', 'toc4'],
    size: ['', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
    style: ['', 'allcaps', 'smallcaps', 'italic', 'bold', 'underline'],
    padding: ['', 'nopad', 'nopad-top', 'nopad-bottom', 'extrapad', 'extrapad-top', 'extrapad-bottom'],
    'outsize-padding': ['', 'outpad-top', 'outpad-top-extra', 'outpad-bottom', 'outpad-bottom-extra'],
  },
//   subhead: {
//     'table of contents': ['', 'toc1', 'toc2', 'toc3', 'toc4'],
//     align: ['', 'left', 'center', 'right', 'justify'],
//     descriptor: ['', 'date', 'venue', 'subtitle']
//   },
  par: {
//     font: ['', 'typewriter', 'monospace', 'oldbook', 'modern'],
    padding: ['', 'nopad', 'nopad-top', 'nopad-bottom', 'extrapad', 'extrapad-top', 'extrapad-bottom'],
    'outsize-padding': ['', 'outpad-top', 'outpad-top-extra', 'outpad-bottom', 'outpad-bottom-extra'],
    size: ['', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
    width: ['', 'width-80', 'width-65', 'width-50', 'width-45', 'width-30'],
    style: ['', 'allcaps', 'smallcaps', 'italic', 'bold', 'underline'/*, 'rulebelow', 'bookgraphic'*/],
    align: ['', 'left', 'center', 'right', 'justify'],
    whitespace: ['', 'list', 'verse', 'pre'],
    author: ['', 'bab', 'baha', 'abd', 'shoghi', 'sacred', 'bible', 'muhammad', 'quran', 'jesus', 'ali', 'tradition', 'husayn'],
    'paragraph type': ['', 'dropcap', 'blockquote', 'centerquote', 'dedication', 'sitalcent', 'editor-note', 'question', 'signature', 'reference', 'preamble', 'prayer'],
  },
  illustration: {
    size: ['', 'x-small', 'small', 'large', 'x-large'],
    align: ['', 'left', 'center', 'right']
  },
//   footnote: {
//     '': [],
//     fn: []
//   },
  hr: {
    size: ['', 'small', 'large'],
    padding: ['', 'nopad', 'nopad-top', 'nopad-bottom', 'extrapad', 'extrapad-top', 'extrapad-bottom'],
    'outsize-padding': ['', 'outpad-top', 'outpad-top-extra', 'outpad-bottom', 'outpad-bottom-extra'],
  }
}
let BlockTypesAlias = {
  title: {
    'table of contents': {
      values: {
        'toc1': 'level 1'
      }
    }
  },

  header: {
    level: {
      'title': 'type',
      values: {
        'h2': 'header',
        'h3': 'subheader',
        'h4': 'sub subheader'
      }
    },
    'table of contents': {
      values: {
        'toc1': 'level 1',
        'toc2': 'level 2',
        'toc3': 'level 3',
        'toc4': 'level 4'
      }
    }
  }
}

class BookBlock {
  constructor(init) {

    // OrientDB properties
    this._rid = init.id || init.rid || '';
    this._uRid = encodeURIComponent(init.id || init.rid || init.blockid || '');
//     this.in = init.in || '';
//     this.out = init.out || '';
//     this.blockid = init.blockid || '';

    // CouchDB properties
    this._id = init.blockid || '';
    this._rev = init._rev || '';
    this.bookid = init.bookid || '';
    this.chainid = init.chainid || '';
    this.index = typeof init.index !== 'undefined' ? init.index : '';

    this.tag = init.tag || '';
    this.content = typeof init.content !== 'undefined' ? init.content : '';
    this.type = init.type || 'par';
    this.classes = init.classes || {};
    if (Array.isArray(this.classes)) this.classes = {};

    this.parnum = typeof init.parnum !== 'undefined' ? init.parnum : false;
    //this.section = typeof init.section !== 'undefined' ? init.section : false;

    this.secVal  = typeof init.secVal  !== 'undefined' ? init.secVal  : false;
    this.secnum  = typeof init.secnum  !== 'undefined' ? init.secnum  : (this.type === 'header' ? false : this.secVal);
    this.secHide = typeof init.secHide !== 'undefined' ? init.secHide : false;

    this.audiosrc = init.audiosrc || '';
    this.footnotes = init.footnotes || [];
    this.flags = init.flags || [];

    this.deleted = init.deleted || false;
    this.illustration = init.illustration;
    this.illustration_width = init.illustration_width;
    this.illustration_height = init.illustration_height;
    this.description = init.description || '';
    this.voicework = init.voicework;
    this.partUpdate = false;

    this.markedAsDone = init.markedAsDone || false;
    this.language = init.language || false;
    this.status = init.status;
    if (!this.status) {
      this.status = {}
    }
    this.audiosrc_ver = init.audiosrc_ver || {};
    for (let k in this.audiosrc_ver) {
      if (['m4a'].indexOf(k) === -1) {
        delete this.audiosrc_ver[k];
      }
    }

    this.isUpdated = false;
    this.isChanged = init.isChanged || false;
    this.changes = init.changes || [];
    this.isAudioChanged = init.isAudioChanged || false;
    this.isIllustrationChanged = init.isIllustrationChanged || false;
    this.timestamp = (new Date()).toJSON();

//     this.checkedStart = init.checkedStart || false;
//     this.checkedEnd = init.checkedEnd || false;
//     this.checked = init.checked || false;
    this.realigned = init.realigned || false;
    this.check_id = init.check_id || null;
    this.footnoteIdx = init.footnoteIdx || null;
    this.isAudioEditing = init.isAudioEditing || false;

    this.history = {};

    this.illustration_width = init.illustration_width || false;
    this.illustration_height = init.illustration_height || false;
    this.blockid = init.blockid || false;
    this.manual_boundaries = init.manual_boundaries || [];
    let parts = init.parts || [];
    if (Vue.prototype.globalJobInfo.id && (Vue.prototype.globalJobInfo.mastering || Vue.prototype.globalJobInfo.mastering_complete)) {
      this.parts = [];
    } else {
      this.parts = parts;
    }
    
  }

  clean() {
    if (this.flags.length) this.flags.forEach ((flag, flagIdx)=>{
      if (flag.parts.length) flag.parts.forEach ((part)=>{
        let user_Id = superlogin.getSession().user_id;
        if (part.newComment.length) part.comments.push ({
          creator: user_Id,
          created_at: (new Date()).toJSON(),
          comment: part.newComment
        });
        part.newComment = '';
      })
      else this.flags.splice(flagIdx, 1);
    });
    if (this.audiosrc) {
      this.audiosrc = this.audiosrc.replace(process.env.ILM_API, '');
      this.audiosrc = this.audiosrc.split('?').shift();
      this.audiosrc = this.audiosrc.replace(/(.*)-v-\d+(\..*)/, '$1$2');
    }
    if (this.audiosrc_ver) {
      for (let t in this.audiosrc_ver) {
        this.audiosrc_ver[t] = this.audiosrc_ver[t].replace(process.env.ILM_API, '');
        this.audiosrc_ver[t] = this.audiosrc_ver[t].split('?').shift();
        this.audiosrc_ver[t] = this.audiosrc_ver[t].replace(/(.*)-v-\d+(\..*)/, '$1$2');
      }
    }
    if (this.illustration) {
      this.illustration = this.illustration.replace(process.env.ILM_API, '');
      this.illustration = this.illustration.split('?').shift();
    }
    if (Array.isArray(this.classes) && this.classes.length) this.classes = this.classes[0];
    //if (this.parnum!==false) this.parnum = '';

    this.content = this.content.replace(/data-(.*?)="(.*?)"/igm,
    function(match, $1, $2) {
      var tmp = document.createElement("DIV");
      tmp.innerHTML = $2;
      tmp = tmp.textContent || tmp.innerText || "";
      return 'data-'+$1+'="'+_.escape(tmp)+'"';
    })
    this.content = this.content
    .replace(/(<[^>]+)(selected)/g, '$1')
    .replace(/(<[^>]+)(audio-highlight)/g, '$1')
    .replace(/(<sg\s*data-suggestion="[^"]*"[^>]*>\s*<\/sg>)/ig, '') // remove suggestions without text
    .replace(/(<qq\s*data-author="[^"]*"[^>]*>\s*<\/qq>)/ig, ''); // remove quotes without text
    return _.pick(this, defBlock); //<(qq*)\s*[^\/>]*>\s*<\/\1>
  }

  cleanField(fieldName) {
    if (defBlock.indexOf(fieldName)<0) return false;
    switch(fieldName) {
      case 'illustration' : {
      } break;
      case 'section' : {
        let result = _.pick(this, ['_id', 'section', 'secnum']);
        if (!isNaN(parseInt(result.section))) result.section = parseInt(result.section);
        if (result.section+'' === 'NaN') result.section = '';
        if (!isNaN(parseInt(result.secnum))) result.secnum = parseInt(result.secnum);
        return result;
      } break;
      default : {
        return _.pick(this, ['_id'/*, '_rev'*/, fieldName]);
      } break;
    };
  }

  genFlagId(isBlockFlag = false) {
    if (isBlockFlag) return this._id;
    else return _id(this._id + ':');
  }

  newFlag(range, type, isBlockFlag = false, mode = null) {
    let creator_role = null;
    switch (mode) {
      case 'edit':
        creator_role = 'editor';
        break;
      case 'narrate':
        creator_role = 'narrator';
        break;
      case 'proofread':
        creator_role = 'proofer';
        break;
    }
    let _id = this.genFlagId(isBlockFlag);
    let _at = (new Date()).toJSON();
    let userId = superlogin.getSession().user_id;
    let flagPart = new FlagPart({
      creator: userId,
      created_at: _at,
      type: type,
      content: (isBlockFlag ? false : range.cloneContents().textContent),
      updated_at: _at,
      creator_role: creator_role
    })

    this.flags.push ({
      _id: _id,
      creator: userId,
      created_at: _at,
      creator_role: creator_role,
      parts: [flagPart]
    });

    //console.log('addFlag', JSON.stringify(this.flags));
    return _id;
  }

  addFlag(_id, range, type, mode) {
    let creator_role = null;
    switch (mode) {
      case 'edit':
        creator_role = 'editor';
        break;
      case 'narrate':
        creator_role = 'narrator';
        break;
      case 'proofread':
        creator_role = 'proofer';
        break;
    }
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let userId = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: userId,
          created_at: _at,
          type: type,
          content: range.cloneContents().textContent,
          updated_at: _at,
          creator_role: creator_role
        })
        flag.parts.push(flagPart);
      }
    });
  }

  delFlag(_id) {
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        this.flags.splice(flagIdx,1);
      }
    });
  }

  addPart(_id, content, type, mode) {
    let creator_role = null;
    switch (mode) {
      case 'edit':
        creator_role = 'editor';
        break;
      case 'narrate':
        creator_role = 'narrator';
        break;
      case 'proofread':
        creator_role = 'proofer';
        break;
    }
    this.flags.forEach((flag, flagIdx)=>{
      if (flag._id === _id) {
        let _at = (new Date()).toJSON();
        let userId = superlogin.getSession().user_id;
        let flagPart = new FlagPart({
          creator: userId,
          created_at: _at,
          type: type,
          content: content,
          updated_at: _at,
          creator_role: creator_role
        })
        flag.parts.push(flagPart);
      }
    });
  }

  mergeFlags(fromIdx) {

    let fromBlock = this.flags[fromIdx];
    let blockFlagIdx = this.flags.map(f => f._id).indexOf(this._id);

    if (blockFlagIdx < 0) {
      let _id = this.genFlagId(true);
      let _at = (new Date()).toJSON();
      let userId = superlogin.getSession().user_id;
      this.flags.push ({
        _id: _id,
        creator: userId,
        created_at: _at,
        parts: fromBlock.parts
      });
    } else {
      this.flags[blockFlagIdx].parts = this.flags[blockFlagIdx].parts.concat(fromBlock.parts);
    }

    this.flags.splice(fromIdx, 1);
  }

  isNeedAlso(_id) {
    let checker = {};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        checker[part.type] = true;
      });
    });
    if (Object.keys(checker).length > 1) return false;
    return true;
  }

  calcFlagStatus(_id) {
    let status = {'open': 0, 'resolved': 0, 'hidden': 0};
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        status[part.status] += 1;
      });
    });
    if (status.open > 0) return 'open';
    if (status.resolved > 0) return 'resolved';
    return 'hidden';
  }

  calcFlagsSummary(block_level_only = false) {
    let status = {'open': 0, 'resolved': 0, 'hidden': 0};
    let direction = {'editor': 0, 'narrator': 0};
    if (this.flags && this.flags.length) {
      this.flags.forEach((flag)=>{
        if (flag.parts && flag.parts.length) {
          flag.parts.forEach((part)=>{
            if (!block_level_only || !part.content) {
              status[part.status] += 1;
              if (part.status == 'open') direction[part.type] += 1;
            }
          });
        }
      });
    }
    let flagsStatus = 'hidden';
    if (status.resolved > 0) flagsStatus = 'resolved';
    if (status.open > 0) flagsStatus = 'open';

    let flagsDirection = 'proofer';
    if (direction.narrator > 0) flagsDirection = 'narrator';
    if (direction.editor > 0) flagsDirection = 'editor';

    return {stat: flagsStatus, dir: flagsDirection}
  }

  countArchParts(_id) {
    let count = 0;
    this.flags.forEach((flag)=>{
      if (flag._id === _id) flag.parts.forEach((part)=>{
        if (part.status === 'hidden') count++;
      });
    });
    return count;
  }

  getIllustration() {
    if (this.illustration) {
      return process.env.ILM_API + this.illustration + '?' + this.timestamp;
    }
  }

  getAudiosrc(ver = false, full = true) {
    if (!ver  || !this.audiosrc_ver) {
      return this.audiosrc;
    }
    let path = typeof this.audiosrc_ver[ver] === 'undefined' ? this.audiosrc : this.audiosrc_ver[ver];
    if (!path) {
      return false;
    }
    return full ? process.env.ILM_API + path +'?'+ (new Date()).toJSON() : path;
  }
  
  getPartAudiosrc(partIdx, ver = false, full = true) {
    let part = this.parts[partIdx];
    if (!part || this.parts.length < 2) {
      part = this;
    }
    if (!part) {
      return '';
    }
    let path = !part.audiosrc_ver || typeof part.audiosrc_ver[ver] === 'undefined' ? part.audiosrc : part.audiosrc_ver[ver];
    if (!path) {
      return false;
    }
    return full ? process.env.ILM_API + path +'?'+ (new Date()).toJSON() : path;
  }
  
  getPartContent(partIdx) {
    if (!(Array.isArray(this.parts) && typeof this.parts[partIdx] !== 'undefined') && partIdx === 0) {
      return this.content;
    } else {
      return this.parts[partIdx].content;
    }
  }
  
  getPartManualBoundaries(partIdx) {
    if (!(Array.isArray(this.parts) && typeof this.parts[partIdx] !== 'undefined') && partIdx === 0) {
      return this.manual_boundaries || [];
    } else {
      return this.parts[partIdx].manual_boundaries || [];
    }
  }

  getAudiosrcFootnote(idx, ver = false, full = true) {
    let f = this.footnotes && this.footnotes[idx] ? this.footnotes[idx] : false;
    if (!f) {
      return false;
    }
    let path = false;
    if (!ver  || !f.audiosrc_ver) {
      path = f.audiosrc;
    } else {
      path = typeof f.audiosrc_ver[ver] === 'undefined' ? f.audiosrc : f.audiosrc_ver[ver];
    }
    if (!path) {
      return false;
    }
    return full ? process.env.ILM_API + path +'?'+ (new Date()).toJSON() : path;
  }

  setContent(content) {
    this.set('content', content);
  }
  
  setPartContent(partIdx, content) {
    let partCheck = Array.isArray(this.parts) && typeof this.parts[partIdx] !== 'undefined';
    if (partCheck) {
      this.set(`parts.${partIdx}.content`, content);
    } else if (partIdx === 0) {
      this.setContent(content);
    }
  }

  setAudiosrc(path, ver = {}) {
    this.set('audiosrc', path);
    this.set('audiosrc_ver', ver);
  }
  
  setPartAudiosrc(partIdx, path, ver = {}) {
    let partCheck = Array.isArray(this.parts) && typeof this.parts[partIdx] !== 'undefined';
    if (partCheck) {
      this.set(`parts.${partIdx}.audiosrc`, path);
      this.set(`parts.${partIdx}.audiosrc_ver`, ver);
    } else if (partIdx === 0) {
      this.setAudiosrc(path, ver);
    }
  }
  
  setManualBoundaries(boundaries = []) {
    this.set('manual_boundaries', boundaries);
  }
  
  setPartManualBoundaries(partIdx, boundaries = []) {
    let partCheck = Array.isArray(this.parts) && typeof this.parts[partIdx] !== 'undefined';
    if (partCheck) {
      this.set(`parts.${partIdx}.manual_boundaries`, boundaries);
    } else if (partIdx === 0) {
      this.setManualBoundaries(boundaries);
    }
  }

  undoContent() {
    this.undo('content');
  }
  
  undoPartContent(partIdx) {
    this.undo(`parts.${partIdx}.content`);
  }

  undoAudiosrc() {
    this.undo('audiosrc');
    this.undo('audiosrc_ver');
  }
  
  undoPartAudiosrc(partIdx) {
    this.undo(`parts.${partIdx}.audiosrc`);
    this.undo(`parts.${partIdx}.audiosrc_ver`);
  }
  
  undoManualBoundaries() {
    this.undo('manual_boundaries');
  }

  setAudiosrcFootnote(idx, path, ver) {
    this.set('footnotes.' + idx + '.audiosrc', path);
    this.set('footnotes.' + idx + '.audiosrc_ver', ver);
  }

  setContentFootnote(idx, content) {
    this.set('footnotes.' + idx + '.content', content);
  }
  
  setManualBoundariesFootnote(idx, boundaries = []) {
    this.set('footnotes.' + idx + '.manual_boundaries', boundaries);
  }

  undoContentFootnote(idx) {
    this.undo('footnotes.' + idx + '.content');
  }

  undoAudiosrcFootnote(idx) {
    this.undo('footnotes.' + idx + '.audiosrc');
    this.undo('footnotes.' + idx + '.audiosrc_ver');
  }
  
  undoManualBoundariesFootnote(idx) {
    this.undo('footnotes.' + idx + '.manual_boundaries');
  }

  needsText() {
    return ['hr', 'illustration'].indexOf(this.type) === -1;
  }

  hasAudio() {
    let hasAudio = (this.audiosrc && this.audiosrc.length);
    if (!hasAudio && Array.isArray(this.parts) && this.parts.length > 0) {
      hasAudio = this.parts.find(p => {
        return p.audiosrc && p.audiosrc.length;
      });
    }
    return hasAudio ? true : false;
  }
  
  hasCompleteAudio() {
    let hasAudio = (this.audiosrc && this.audiosrc.length);
    if (this.voicework === 'narration' && Array.isArray(this.parts) && this.parts.length > 1) {
      let noAudio = this.parts.find(p => {
        return !p.audiosrc || !p.audiosrc.length;
      });
      hasAudio = noAudio ? false : true;
    }
    return hasAudio ? true : false;
  }

  getClass(mode = null) {
    let result = this.type;
    if (this.classes && typeof this.classes === 'object') {
      for (let key in this.classes) {
        if (key && (mode !== 'narrate' || key === 'whitespace')) {
          if (this.classes[key] && this.classes[key] !== '') result += ' '+ this.classes[key];
          else if (Object.keys(BlockTypes[this.type])[0] === '') result += ' ' + key.replace(/\s/g, '-');
        }
      }
    }

    return result;
  }

  setClass(val) {
    let styleCurr = false;
    if (val) {
      //console.log('setClass', this._id, val);
      if (Object.keys(BlockTypes[this.type])[0] === '') {
        if (!this.classes[val]) {
          this.classes = {};
          this.classes[val] = '';
          styleCurr = val;
        }
      }

      if (!this.classes[val]) {
        this.classes[val] = ''
      } else {
        styleCurr = this.classes[val];
      }

    } else {
      if (val === '') this.classes = {};
    }
    return styleCurr;
  }

  setClassStyle(classVal, val) {
    if (typeof val !== 'undefined') this.classes[classVal] = val;
    if (val === '') delete this.classes[classVal];
  }

  set(field, value) {
    if (!this.history[field]) {
      this.history[field] = [];
    }
    if (field.indexOf('.') === -1) {
      this.history[field].push(this[field]);
      this[field] = value;
    } else {
      let f = null;
      let o = this;
      let path = field.split('.');
      do {
        f = path.shift();
        if (typeof o[f] === 'undefined') {
          return false;
        }
        o = o[f];
      } while(path.length > 1);
      f = path.shift();
      this.history[field].push(o[f]);
      o[f] = value;
    }
  }

  undo(field) {
    if (this.history[field]) {
      if (field.indexOf('.') === -1) {
        this[field] = this.history[field].pop();
      } else {
        let f = null;
        let o = this;
        let path = field.split('.');
        do {
          f = path.shift();
          o = o[f];
        } while(path.length > 1);
        f = path.shift();
        o[f] = this.history[field].pop();
      }
    }
  }
  
  getIsChanged() {
    if (this.isChanged) {
      return true;
    }
    let part = this.parts.find(p => {
      return p.isChanged === true;
    });
    return part ? true : false;
  }
  
  getIsAudioChanged() {
    if (this.isAudioChanged) {
      return true;
    }
    let part = this.parts.find(p => {
      return p.isAudioChanged === true;
    });
    return part ? true : false;
  }

}

class FlagPart {
  constructor(init) {
    this.creator = init.creator;
    this.created_at = init.created_at;
    this.status = init.status || 'open';
    this.type = init.type;
    this.content = init.content;
    this.comments = init.comments || [];
    this.updated_at = init.updated_at;
    this.newComment = '';
    this.collapsed = false;
    this.creator_role = init.creator_role || null;
  }
}

class FootNote {
  constructor(init) {
    this.content = init.content || '<p></p>';
    this.voicework = init.voicework || 'tts';
  }
}

let setBlockParnum = function(block, parCounter, numMask = 'x_x') {
  let result = false;
  switch(block.type) {
    case 'header' : case 'title' : {
      // this.parCounter.curr = 1;

      if (block.secnum === false) {
        //this.parCounter.pref = false;
        break;
      }
      if (block.secnum.length === 0) {
        //this.parCounter.curr = 1;
        parCounter.curr = 1;
        parCounter.prefCnt++;
        parCounter.pref = parCounter.prefCnt;
        result = parCounter.prefCnt;
        break;
      }
      if (!isNaN(block.secnum)) { // Number
        parCounter.curr = 1;
        parCounter.prefCnt = parseInt(block.secnum);
        parCounter.pref = parCounter.prefCnt;
      } else { // String
        parCounter.curr = 1;
        parCounter.pref = block.secnum;
      }
    } break;
    case 'par' : {
      if (block.parnum===false) {
        break;
      }
      if (parCounter.pref === false) {
        result = '';
        break;
      }
      switch(numMask) {
        case 'x' : {
          result = parCounter.curr;
        } break;
        case 'x_x' : {
          result = parCounter.pref+'.'+parCounter.curr;
        } break;
        default : {
          result = '';
        } break;
      }
      parCounter.curr++;
    } break;
  };
  return result;
}

export {
  BookBlock,
  BlockTypes,
  FootNote,
  setBlockParnum,
  BlockTypesAlias
}
