"use strict";
let content = '';
let classes = '';

let setClasses = function (classesContentToWorkWith) {
  classes = classesContentToWorkWith;
}
let setContent = function (contentToWorkWith) {
  content = contentToWorkWith;
}
let getContent = function () {
  return content;
}

let superScriptRemove = function () {
  content = content.replace(/<sup[^>]*>.*?<\/sup>/img, '');
}

let removeBrAtTheEndOfTheBlock = function () {
  content = content.replace(/<br[^>]*>\s*$/, '');
}

let removeNonHtmlSpaceMarkers = function () {
  content = content.replace(/[\r\n]\s*$/, '');
}

let removeInTextFormatting = function () {

    let InTextFormattingShouldBeVisible = ['ol','ul','li','u','br','i','b'].join('|');
    const regex = new RegExp(`(<\/?(?:${InTextFormattingShouldBeVisible})[^>]*>)|<[^>]+>`,'img');
    content = content.replace(regex, '$1');

}
let prepare = function ( getBlockLang) {

  if(!content){
    return false;
  }

  // let content = blockPartcontent.replace(/<sup[^>]*>.*?<\/sup>/img, '');
  superScriptRemove();

  // content = content.replace(/<br[^>]*>\s*$/, '')
  removeBrAtTheEndOfTheBlock();

  // content = content.replace(/[\r\n]\s*$/, '');//remove <br> at the end of the block
  removeNonHtmlSpaceMarkers();

  // content = content.replace(/(<\/?(?:ol|ul|li|u|br)[^>]*>)|<[^>]+>/img, '$1');
  removeInTextFormatting();

  content = content.replace(/(<\/li>[^<]*?<li[^>]*>)/img, '<br>$1');
  let is_list = content.match(/<br[^>]*>/m) || content.match(/<br[^>]*>/m) || content.match(/<li[^>]*>/m) || content.match(/<li[^>]*>/m);
  if (classes && typeof classes === 'object' && typeof classes.whitespace !== 'undefined' && classes.whitespace.length > 0 && content.match(/[\r\n]/)) {
    content = content.replace(/[\r\n]/mg, '<br>');
    is_list = true;
  }
  let separator = '<div class="part-separator"></div>'
  let joinBy = is_list ? '<split/>' : `<split/><split/>`;
  /*let rg = new RegExp('((?<!St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|(?=\\b)cf|(?=\\b)Cap|(?=\\b)ca|(?=\\b)cca|(?=\\b)fl|(?=\\b)gen|(?=\\b)gov|(?=\\b)vs|(?=\\b)v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|(?=\\b)scil|(?=\\b)ed|(?=\\b)p|(?=\\b)viz|\\W[A-Z]))([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])', 'img');
  content = content.replace(rg, '$1$2<br><br>');*/
  let parts = [];
  let lettersPattern = 'a-zA-Zа-яА-Я\\u0600-\\u06FF';
  let regEx = new RegExp(`[\.\!\?\…\؟]+[^${lettersPattern}]*?( |[\r\n]|<br[^>]*>|<\/[^>]+>)(?![\\W]*[a-z])`, 'mg')
  let regExAbbr = new RegExp(`(?=\\b)(St|Mr|Mrs|Dr|Hon|Ms|Messrs|Mmes|Msgr|Prof|Rev|Rt|Hon|cf|Cap|ca|cca|fl|gen|gov|vs|v|i\\.e|i\\.a|e\\.g|n\\.b|p\\.s|p\\.p\\.s|scil|ed|p|viz|[^\\wáíú’][A-Z])([\.\!\?\…\؟])$`, 'img');
  let regExColon = new RegExp(`[\:\;\؛]\\W* `, 'mg');
  if (getBlockLang !== 'en') {
    regEx = new RegExp(`[\.\!\?\…\.\!\…\؟] `, 'mg');
    regExColon = new RegExp(`[\:\;\؛] `, 'mg');
  }
  let regExLetters = new RegExp(`[${lettersPattern}]`);
  let regExNewline = new RegExp(`[^\.\!\?\…\؟]<br[^>]*>[^${lettersPattern}]*$`);
  let regExNewlineSpace = new RegExp(`[^\.\!\?\…\؟]\s+<br[^>]*>[^${lettersPattern}]*$`);
  //var regExLower = new RegExp('$([\\.\\!\\?\\…\\؟]+)(?!\\W*[a-z])')
  let match;
  let shift = 0;
  while ((match = regEx.exec(content))) {
    //console.log(match)
    let pos = match.index + match[0].length;
    let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
    //var substrLower = str.substring(match.index);
    //console.log(`CHECK "${substr}"`);
    //console.log('MATCH: ', substr.match(regExAbbr))
    if (!substr.match(regExAbbr) && substr.match(regExLetters) && (!substr.match(regExNewline) || !substr.match(regExNewlineSpace))) {
      parts.push(substr);
      shift = pos;
    }
  }
  if (parts.length > 0) {
    if (shift < content.length) {
      let substr = content.substring(shift);
      if (substr.match(regExLetters) && !substr.match(regExNewline)) {
        parts.push(substr);
      } else {
        parts[parts.length - 1]+=substr;
      }
    }
    content = parts.join(joinBy);
  }
  parts = [];
  shift = 0;
  while ((match = regExColon.exec(content))) {
    let pos = match.index + match[0].length;
    let substr = content.substring(shift, match.index < content.length ? pos : null).trim();
    if (substr.match(regExLetters)) {
      parts.push(substr);
      shift = pos;
    }
  }
  if (parts.length > 0) {
    if (shift < content.length) {
      let substr = content.substring(shift);
      if (substr.match(regExLetters)) {
        parts.push(substr);
      } else {
        parts[parts.length - 1]+=substr;
      }
    }
    content = parts.join('<split/>');
  }
  try {
    content = content.replace(new RegExp('(?<!<split\\/>)<br[^>]*>(?!<split\\/>)', 'gm'), `<br>${separator}`);// lists with br should have empty line
  } catch (e) {// Firefox does not support negative lookbehind

  }
  content = content.replace(/<split\/>/gm, '<br>');// replace split with html br
  content = content.replace(/<br><br><br>/gm, '<br><br>');
  content = content.replace(/<br[^>]*><br[^>]*>/gm, '<br><div class="part-separator"></div>');
  //content = content.replace(, '$1<br>');
  // console.log(content);
  // return content;
}

let narrationBlockContent = {
  prepare :prepare,
  setClasses :setClasses,
  setContent :setContent,
  getContent :getContent,
  _superScriptRemove :superScriptRemove,
  _removeBrAtTheEndOfTheBlock :removeBrAtTheEndOfTheBlock,
  _removeNonHtmlSpaceMarkers :removeNonHtmlSpaceMarkers,
  _removeInTextFormatting :removeInTextFormatting

}

export default narrationBlockContent;
