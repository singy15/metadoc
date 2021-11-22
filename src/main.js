import './style.css';
import domUtil from './dom-util.js';
import VanillaCaret from 'vanilla-caret-js';

let globalOverwriteTimeout = null;
let globalFSHandle;
let globalFocused;
let globalSelection;
let globalEditMode = true;
let globalOver;
let globalMain = document.getElementById("main");
let globalHiddenOptionControl = null;

function toggleMode() {
  globalEditMode = !globalEditMode;

  if(globalEditMode) {
    changeToEditMode();
  } else {
    changeToViewMode();
  }
}

function changeToViewMode() {
  globalMain.removeAttribute("contenteditable");
  globalMain.classList.remove("content");
}

function changeToEditMode() {
  globalMain.setAttribute("contenteditable", "true");
  globalMain.classList.add("content");
}

function insertElement(el) {
  let target = globalFocused;
  let html = target.innerHTML;
  let offset = globalSelection.focusOffset;
  target.innerHTML = html.substring(0,offset) + el + html.substring(offset);
}

function addTable() {
  domUtil.insertElementAtCaretByHtml(
    `<table>
      <tr><th>h1</th><th>h2</th><th>h3</th></tr>
      <tr><td>c1</td><td>c2</td><td>c3</td></tr>
      <tr><td>c4</td><td>c5</td><td>c6</td></tr>
     </table>`);
}

function addLink() {
  domUtil.insertElementAtCaretByHtml(
    `<a href="${prompt('Input link url')}">link</a>`);
}

function restoreFocus() {
  event.preventDefault();
  event.stopPropagation();
  console.log("restoreFocus");
  globalFocused.focus();
  document.getSelection().addRange(document.getSelection().getRangeAt(0));
}

function hiddenOptionControl() {
  let ctrl = document.getElementById("optionControl");
  ctrl.style.display = "none";
}

function showOptionControl(el) {
  if(globalHiddenOptionControl) {
    clearTimeout(globalHiddenOptionControl);
  }

  let ctrl = document.getElementById("optionControl");
  let bound = el.getBoundingClientRect();
  ctrl.style.top = bound.top - 50 + "px";
  ctrl.style.left = bound.left + bound.width + "px";
  el.classList.add("over");
  document.getElementById("tagName").innerText = el.tagName;
  ctrl.style.display = "block";

  globalHiddenOptionControl = setTimeout(function(){
    hiddenOptionControl();
  }, 5000);
}

function saveFocus() {
  if(event.target.id === "optionControl"
    || event.target.id === "main") {
    return;
  }

  event.stopPropagation();

  globalFocused = event.target;
  globalSelection = document.getSelection();

  if(globalFocused.id === "main") {
    globalFocused.children[globalFocused.children.length - 1].focus();
  }

  showOptionControl(globalFocused);

  // let ctrl = document.getElementById("optionControl");
  // let bound = globalFocused.getBoundingClientRect();
  // ctrl.style.top = bound.top - 50 + "px";
  // ctrl.style.left = bound.right + 100 + "px";
  // ctrl.style.left = bound.left + bound.width - ctrl.getBoundingClientRect().width + "px";

  // globalFocused.classList.add("over");

  // document.getElementById("tagName").innerText = globalFocused.tagName;
}

function saveOver() {
  if(event.target.id === "optionControl"
    || event.target.id === "main") {
    return;
  }

  event.stopPropagation();
  globalOver = event.target;

  // let ctrl = document.getElementById("optionControl");
  // let bound = globalOver.getBoundingClientRect();
  // ctrl.style.top = bound.top - 50 + "px";
  // ctrl.style.left = bound.left + bound.width - ctrl.getBoundingClientRect().width + "px";

  globalOver.classList.add("over");

  // document.getElementById("tagName").innerText = globalOver.tagName;
}

function onOver() {
  event.target.classList.remove("over");
}

function addLog(str) {
  console.log(str);
}

async function _writeFile(fileHandle, contents) {
  const writable = await fileHandle.createWritable();
  // await writable.truncate(0);
  await writable.write(contents);
  await writable.close();
}

async function saveFile(contents, handle = null) {
  try {
    if (!handle) {
      handle = await window.showSaveFilePicker({
        types: [
          {
            description: "HTML Files",
            accept: {
              "text/html": [".html"],
            },
          },
        ],
      });
    }
    await _writeFile(handle, contents);
    return handle;
  } catch (ex) {
    const msg = "failed to save";
    console.error(msg, ex);
    return false;
  }
}

async function openFile() {
  const result = {
    handle: null,
    text: ""
  };

  /** @type FileSystemHandle */
  let fileHandle;
  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "HTML Files",
          accept: {
            "text/html": [".html"],
          },
        },
      ],
    });
    result.handle = fileHandle;
  } catch (ex) {
    console.error("failed to fetch file", ex);
    return false;
  }

  const file = await fileHandle.getFile();
  try {
    const text = await file.text();
    result.text = text;
    return result;
  } catch (ex) {
    console.error("failed to get content", ex);
    return false;
  }
}

function isNativeFileSystemSupported() {
  // eslint-disable-next-line no-undef
  return "showOpenFilePicker" in window;
}

function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}
window.htmlDecode = htmlDecode;

function serializeSource() {
  const xs = new XMLSerializer();
  const dp = new DOMParser();
  
  const dom = dp.parseFromString(xs.serializeToString(document), "text/html");
  // dom.getElementsByTagName("style")[0].remove();
  let scripts = dom.getElementsByTagName("script");
  let baseScript = null;
  let userScript = null;
  for(var i = 0; i < scripts.length; i++) {
    if(!scripts[i].id) {
      baseScript = htmlDecode(scripts[i].innerHTML);
      scripts[i].remove();
    } else if(scripts[i].id === "userScript") {
      userScript = htmlDecode(scripts[i].innerHTML);
      scripts[i].remove();
    }
  }

  console.log("baseScript", unescape(baseScript));
  window.baseScript = baseScript;

  return xs.serializeToString(dom)
    .replace('<\/html>',
      "\n"
      // + `<style>` + document.getElementsByTagName("style")[0].innerHTML + `<\/style>`
      // + "\n"
      + `<script type="text/javascript">` + baseScript + `<\/script>`
      + "\n"
      + `<\/html>`);
}

async function overwrite() {
  if (!nativeFSSupported) {
    return;
  }

  if(!globalFSHandle) {
    return;
  }

  clearTimeout(globalOverwriteTimeout);
  globalOverwriteTimeout = setTimeout(async function() {
      const fsHandle = await saveFile(
        serializeSource(),
        globalFSHandle
      );
      if (fsHandle) {
        globalFSHandle = fsHandle;
        addLog("saved");
      } else {
        addLog("failed to save");
      }
    },
    3000);
}

document.getElementById("main").addEventListener("input", function() {
  overwrite();
});

async function saveNew() {
  if (!nativeFSSupported) {
    alert("nfs not supported");
    return;
  }

  const fsHandle = await saveFile(
    serializeSource(),
    null
  );
  if (fsHandle) {
    globalFSHandle = fsHandle;
    addLog("saved");
  } else {
    addLog("failed to save");
  }
}

async function saveOverwrite() {
  if (!nativeFSSupported) {
    alert("nfs not supported");
    return;
  }

  const fsHandle = await saveFile(
    serializeSource(),
    globalFSHandle
  );
  if (fsHandle) {
    globalFSHandle = fsHandle;
    addLog("saved");
  } else {
    addLog("failed to save");
  }
}

/**
 * Register event
 */

document.addEventListener("keydown", async (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
    e.preventDefault();
    saveNew();
  } else if (e.ctrlKey && e.code === "KeyS") {
    e.preventDefault();
    saveOverwrite();
  } 
  // else if (e.ctrlKey && e.code === "KeyO") {
  //   e.preventDefault();
  //   if (!nativeFSSupported) {
  //     alert("nfs not supported");
  //     return;
  //   }
  //
  //   const res = await openFile();
  //   if (res) {
  //     globalFSHandle = res.handle;
  //     document.getElementById("content").value = res.text;
  //     addLog("file opened");
  //   } else {
  //     addLog("failed to open file");
  //   }
  // }
});

const nativeFSSupported = isNativeFileSystemSupported();
addLog(`support for nfs: ${(nativeFSSupported) ? "yes" : "no"}`);

function markBold() {
  domUtil.insertElementAtCaret(
    domUtil.createElementFromString(
      `<b>${domUtil.getSelected().textContent}</b>`));
}

function markStrike() {
  domUtil.insertElementAtCaret(
    domUtil.createElementFromString(
      `<s>${domUtil.getSelected().textContent}</s>`));
}

function markClear() {
  domUtil.insertElementAtCaret(
    document.createTextNode(
      `${domUtil.getSelected().textContent}`));
}

function createSpan() {
  domUtil.insertElementAtCaret(
    domUtil.createElementFromString(
      `<span>${domUtil.getSelected().textContent}</span>`));
}

function createDiv() {
  domUtil.insertElementAtCaret(
    domUtil.createElementFromString(
      `<div>${domUtil.getSelected().textContent}</div>`));
}

function createH1() {
  domUtil.insertElementAtCaret(
    domUtil.createElementFromString(
      `<h1>${domUtil.getSelected().textContent}</h1>`));
}

function envelope() {
  let tag = prompt("Tag to envelope (hint: 'span' for <span>)");
  if(tag) {
    domUtil.insertElementAtCaret(
      domUtil.createElementFromString(
        `<${tag}>${domUtil.getSelected().textContent}</${tag}>`));
  }
}

function createTag() {
  let tag = prompt("Tag to create");
  if(tag) {
    domUtil.insertElementAtCaret(domUtil.createElementFromString(tag));
  }
}

function editStyle() {
  let target = globalFocused;
  let style = target.getAttribute("style");
  let param = prompt("Input style", (style)? style.trim() : "" );
  if(param) {
    target.setAttribute("style", param);
  }
}

function moveEl(dir) {
  console.log(dir);

    console.debug("foo");

  let el = globalFocused;

  if((dir < 0) && (el.previousSibling)) {
    let targetEl = el;
    let prevEl = el.previousSibling;
    let parentEl = targetEl.parentElement;

    if(parentEl == prevEl.parentElement) {
      targetEl.remove();
      parentEl.insertBefore(targetEl, prevEl);
    }
  } else if((dir > 0) && (el.nextSibling)) {

    let targetEl = el.nextSibling;
    let refEl = el;
    let parentEl = refEl.parentElement;

    console.log("down",targetEl);

    // if(parentEl == prevEl.parentElement) {
      targetEl.remove();
      parentEl.insertBefore(targetEl, refEl);
    // }


    // console.log("down",targetEl);
    // let targetEl = el;
    // let prevEl = el.nextSibling.nextSibling;
    // let parentEl = targetEl.parentElement;

    // if(parentEl == prevEl.parentElement) {
    //   targetEl.remove();
    //   parentEl.insertBefore(targetEl, prevEl);
    // }
  }
}

function modified() {
  let main = document.getElementById("main");
  if(main.children.length == 0) {
    main.appendChild(domUtil.createElementFromString("<p><br /></p>"));
    main.children[0].focus();
  }
}

function keydown() {
  console.log(event);
  if(event.keyCode === 13) {
    event.preventDefault();
    domUtil.insertElementAtCaretByHtml(`<br />`);
  }
}

window.vc = new VanillaCaret(document.getElementById('main'));
// caret.setPos(4); // Set
// document.getElementById('currentPosition').value = caret.getPos(); // Get

function testFeature() {
  console.log("testFeature");
  
}


function sss() {
  console.log("sss", event, event.target);
  // event.stopPropagation();
}

function convertTag(tagType) {
  if(domUtil.getSelected().textContent === '') {
    convertTo(tagType);
  } else {
    domUtil.insertElementAtCaret(
      domUtil.createElementFromString(
        `<${tagType}>${domUtil.getSelected().textContent}</${tagType}>`));
  }
}

function convertTo(tagType) {
  let html = globalOver.innerHTML;

  if(tagType === "p") {
    globalOver.replaceWith(domUtil.createElementFromString(
      "<p>" + html + "</p>"));
  }

  if(tagType === "div") {
    globalOver.replaceWith(domUtil.createElementFromString(
      "<div>" + html + "</div>"));
  }

  if(tagType === "span") {
    globalOver.replaceWith(domUtil.createElementFromString(
      "<span>" + html + "</span>"));
  }
} 



// document.getElementById("main").addEventListener("keypress", function(e) {
//   console.log(e);
//   // event.stopPropagation();
// 
//   // let tagName = e.target.tagName;
//   // let multilineTags = {
//   //   "P": true,
//   //   "SPAN": true
//   // };
// 
//   // if(!multilineTags[tagName]) {
//   //   console.log("none", tagName);
//   //   return true;
//   // }
// 
//   // if (e.which == 13) {
//   //   if (window.getSelection) {
//   //     var selection = window.getSelection(),
//   //       range = selection.getRangeAt(0),
//   //       br = document.createElement("br");
//   //     range.deleteContents();
//   //     range.insertNode(br);
//   //     range.setStartAfter(br);
//   //     range.setEndAfter(br);
//   //     range.collapse(false);
//   //     selection.removeAllRanges();
//   //     selection.addRange(range);
//   //     e.preventDefault();
//   //     return false;
//   //   }
//   // }
// 
//   // if (e.which == 13) {
//   //   e.preventDefault();
//   //   if (window.getSelection) {
//   //     var selection = window.getSelection(),
//   //       range = selection.getRangeAt(0),
//   //       br = document.createElement("br"),
//   //       textNode = document.createTextNode("\u00a0");
//   //     range.deleteContents();
//   //     range.insertNode(br);
//   //     range.collapse(false);
//   //     range.insertNode(textNode);
//   //     range.selectNodeContents(textNode);
// 
//   //     // selection.removeAllRanges();
//   //     // selection.addRange(range);
//   //     let v = new VanillaCaret(globalFocused).setPos(0);
//   //     v.setPos(0);
//   //     return false;
//   //   }
//   // }
// 
// 
//   // if (e.which == 13) {
//   //   console.log(globalFocused);
//   //   console.log(document.activeElement);
//   // }
// 
//   // let els = document.querySelectorAll("#main *");
//   // for(var i = 0; i < els.length; i++) {
//   //     console.log(els[i]);
//   //   els[i].removeEventListener("keypress", sss);
//   //   els[i].addEventListener("keypress", sss);
//   // }
// });




// $(function(){
// 
//   $("#editable")
// 
//   // make sure br is always the lastChild of contenteditable
//   .live("keyup mouseup", function(){
//     if (!this.lastChild || this.lastChild.nodeName.toLowerCase() != "br") {
//       this.appendChild(document.createChild("br"));
//      }
//   })
// 
//   // use br instead of div div
//   .live("keypress", function(e){
//     if (e.which == 13) {
//       if (window.getSelection) {
//         var selection = window.getSelection(),
//           range = selection.getRangeAt(0),
//           br = document.createElement("br");
//         range.deleteContents();
//         range.insertNode(br);
//         range.setStartAfter(br);
//         range.setEndAfter(br);
//         range.collapse(false);
//         selection.removeAllRanges();
//         selection.addRange(range);
//         return false;
//       }
//     }
//   });
// });

/**
 * Export
 */

window.saveFocus = saveFocus;
window.addTable = addTable;
window.addLink = addLink;
window.saveNew = saveNew;
window.saveOverwrite = saveOverwrite;
window.toggleMode = toggleMode;
window.markBold = markBold;
window.markStrike = markStrike;
window.markClear = markClear;
window.createSpan = createSpan;
window.createDiv = createDiv;
window.createH1 = createH1;
window.envelope = envelope;
window.createTag = createTag;
window.saveOver = saveOver;
window.editStyle = editStyle;
window.onOver = onOver;
window.moveEl = moveEl;
window.modified = modified;
window.keydown = keydown;
window.testFeature = testFeature;
window.sss = sss;
window.convertTo = convertTo;
window.domUtil = domUtil;
window.convertTag = convertTag;

