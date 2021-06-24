"use strict";
import narrationBlockContent from '../../../../src/components/books/narrationBlockContent';
import { benchmarkSuite } from "jest-bench";

let block = '';
benchmarkSuite("sample", {
  // setup will not run just once, it will run for each loop
  setup() {

  },
  //
  // // same thing with teardown
  // teardown() {
  //   if (a.length < 10e6) a.unshift(0);
  // },
  //
  // ["Array.indexOf"]: () => {
  //   a.indexOf(555599);
  // },
  //
  // ["delete Array[i]"]: () => {
  //   expect(a.length).toEqual(10e6);
  //   delete a[0];
  // },
  //
  // ["Array.unshift"]: () => {
  //   a.unshift(-1);
  // },
  //
  ["regex"]: () => {

    let inTextFormattingShouldBeVisible = {
      'doubleSidedTags':['ol','ul','li','u'],
      'singleSidedTags':['br']
    };
    inTextFormattingShouldBeVisible['doubleSidedTags'].forEach(function(tag){
      block = `<w id='1'>word </w> <w id='2'><${tag}>word </${tag}></w>`;
    });
    narrationBlockContent.setContent(block);
    narrationBlockContent._removeInTextFormatting('regex');
  },
  ["dom"]: () => {

    let inTextFormattingShouldBeVisible = {
      'doubleSidedTags':['ol','ul','li','u'],
      'singleSidedTags':['br']
    };
    inTextFormattingShouldBeVisible['doubleSidedTags'].forEach(function(tag){
      block = `<w id='1'>word </w> <w id='2'><${tag}>word </${tag}></w>`;
    });
    narrationBlockContent.setContent(block);
    narrationBlockContent._removeInTextFormatting('dom');
  },
});
