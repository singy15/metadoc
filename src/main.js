/*
 * import
 */

import './style.css';
import DomUtil from './dom-util.js';
// import VanillaCaret from 'vanilla-caret-js';

/*
 * variables
 */

let globalOverwriteTimeout = null;
let globalFSHandle;
let globalFocused;
let globalSelection;
let globalEditMode = true;
let globalOver;
let globalMain = document.getElementById("main");
let globalHiddenOptionControl = null;

/*
 * utilities
 */

function writeLog(str) {
  console.log(str);
}

/*
 * core functions
 */

function addTable() {
  DomUtil.insertElementAtCaretByHtml(
    `<div><table>
      <tr><th>h1</th><th>h2</th><th>h3</th></tr>
      <tr><td>c1</td><td>c2</td><td>c3</td></tr>
      <tr><td>c4</td><td>c5</td><td>c6</td></tr>
     </table></div>`);
}

function addLink() {
  DomUtil.insertElementAtCaretByHtml(
    `<a href="${prompt('Input link url')}">link</a>`);
}

function toggleMode() {
  globalEditMode = !globalEditMode;

  if(globalEditMode) {
    changeToEditMode();
  } else {
    changeToViewMode();
  }
}

function changeToViewMode() {
  document.getElementById("btnToggleMode").innerText = "ViewMode";
  globalMain.removeAttribute("contenteditable");
  globalMain.classList.remove("content");
}

function changeToEditMode() {
  document.getElementById("btnToggleMode").innerText = "EditMode";
  globalMain.setAttribute("contenteditable", "true");
  globalMain.classList.add("content");
}

function insertElement(el) {
  let target = globalFocused;
  let html = target.innerHTML;
  let offset = globalSelection.focusOffset;
  target.innerHTML = html.substring(0,offset) + el + html.substring(offset);
}

function restoreFocus() {
  event.preventDefault();
  event.stopPropagation();
  console.log("restoreFocus");
  globalFocused.focus();
  document.getSelection().addRange(document.getSelection().getRangeAt(0));
}

/*
 * option control
 */

function showOptionControl(el) {
  if(globalHiddenOptionControl) {
    clearTimeout(globalHiddenOptionControl);
  }

  let ctrl = document.getElementById("optionControl");
  let bound = el.getBoundingClientRect();
  ctrl.style.top = bound.top - 50 + "px";
  ctrl.style.left = bound.left + bound.width + "px";
  el.classList.add("over");

  let pankuzu = el.tagName;
  let par = el;
  while(par = par.parentElement) {
    if(par.id === "main") {
      break;
    }

    pankuzu = par.tagName + " > " + pankuzu;
  }

  document.getElementById("tagName").innerText = pankuzu;
  ctrl.style.display = "block";

  // globalHiddenOptionControl = setTimeout(function(){
  //   hideOptionControl();
  // }, 5000);
}

function hideOptionControl() {
  let ctrl = document.getElementById("optionControl");
  ctrl.style.display = "none";
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

async function writeFile(fileHandle, contents) {
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
    await writeFile(handle, contents);
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
      baseScript = DomUtil.decodeHtml(scripts[i].innerHTML);
      scripts[i].remove();
    } else if(scripts[i].id === "userScript") {
      userScript = DomUtil.decodeHtml(scripts[i].innerHTML);
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
        writeLog("saved");
      } else {
        writeLog("failed to save");
      }
    },
    3000);
}

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
    writeLog("saved");
  } else {
    writeLog("failed to save");
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
    writeLog("saved");
  } else {
    writeLog("failed to save");
  }
}

const nativeFSSupported = isNativeFileSystemSupported();
writeLog(`support for nfs: ${(nativeFSSupported) ? "yes" : "no"}`);

function markBold() {
  DomUtil.insertElementAtCaret(
    DomUtil.createElementFromString(
      `<b>${DomUtil.getSelected().textContent}</b>`));
}

function markStrike() {
  DomUtil.insertElementAtCaret(
    DomUtil.createElementFromString(
      `<s>${DomUtil.getSelected().textContent}</s>`));
}

function markClear() {
  DomUtil.insertElementAtCaret(
    document.createTextNode(
      `${DomUtil.getSelected().textContent}`));
}

function createSpan() {
  DomUtil.insertElementAtCaret(
    DomUtil.createElementFromString(
      `<span>${DomUtil.getSelected().textContent}</span>`));
}

function createDiv() {
  DomUtil.insertElementAtCaret(
    DomUtil.createElementFromString(
      `<div>${DomUtil.getSelected().textContent}</div>`));
}

function createH1() {
  DomUtil.insertElementAtCaret(
    DomUtil.createElementFromString(
      `<h1>${DomUtil.getSelected().textContent}</h1>`));
}

function envelope() {
  let tag = prompt("Tag to envelope (hint: 'span' for <span>)");
  if(tag) {
    DomUtil.insertElementAtCaret(
      DomUtil.createElementFromString(
        `<${tag}>${DomUtil.getSelected().textContent}</${tag}>`));
  }
}

function createTag() {
  let tag = prompt("Tag to create");
  if(tag) {
    DomUtil.insertElementAtCaret(DomUtil.createElementFromString(tag));
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
    main.appendChild(DomUtil.createElementFromString("<p><br /></p>"));
    main.children[0].focus();
  }
}

function keydown() {
  console.log(event);
  if(event.keyCode === 13) {
    event.preventDefault();
    DomUtil.insertElementAtCaretByHtml(`<br />`);
  }
}

// window.vc = new VanillaCaret(document.getElementById('main'));
// caret.setPos(4); // Set
// document.getElementById('currentPosition').value = caret.getPos(); // Get

function convertTag(tagType) {
  if(DomUtil.getSelected().textContent === '') {
    convertTo(tagType);
  } else {
    DomUtil.insertElementAtCaret(
      DomUtil.createElementFromString(
        `<${tagType}>${DomUtil.getSelected().textContent}</${tagType}>`));
  }
}

function convertTo(tagType) {
  let html = globalOver.innerHTML;

  if(tagType === "p") {
    globalOver.replaceWith(DomUtil.createElementFromString(
      "<p>" + html + "</p>"));
  }

  if(tagType === "div") {
    globalOver.replaceWith(DomUtil.createElementFromString(
      "<div>" + html + "</div>"));
  }

  if(tagType === "span") {
    globalOver.replaceWith(DomUtil.createElementFromString(
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
  //     writeLog("file opened");
  //   } else {
  //     writeLog("failed to open file");
  //   }
  // }
});

document.getElementById("main").addEventListener("keydown", function(e) {
  let els = document.querySelectorAll("#main *");
  let sanitizeTarget = {
    "P": true,
    "SPAN": true,
    "DIV": true
  };
  for(var i = 0; i < els.length; i++) {
    if(sanitizeTarget[els[i].tagName]) {
      if(els[i].innerHTML.trim() === "") {
        els[i].remove();
      }
    }
  }
});

document.getElementById("main").addEventListener("input", function() {
  overwrite();
});



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
window.convertTo = convertTo;
window.DomUtil = DomUtil;
window.convertTag = convertTag;

