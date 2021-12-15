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

function removeOrAttributeDeleteClass(el, cls) {
  el.classList.remove(cls);
  if(el.classList.length === 0) {
    el.removeAttribute("class");
  }
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
    `<a href="${prompt('Input link url')}">${prompt('Input link text')}</a>`);
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
  // globalMain.classList.remove("content");
  removeOrAttributeDeleteClass(globalMain, "content");
  hideOptionControl();
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

function addOptionItem() {

}

function showOptionControl(el) {
  if(!globalEditMode) {
    return;
  }

  // let ctrl = document.getElementById("optionControl");
  // let bound = el.getBoundingClientRect();
  // ctrl.style.top = bound.top - 50 + "px";
  // ctrl.style.left = bound.left + bound.width + "px";

  // let tagname = document.getElementById("tagName");
  // tagname.innerHTML = "";
  // let pankuzuElems = getPankuzuList(el);
  // let tmp = pankuzuElems.map((x) => {
  //   if(tagname.innerHTML !== "") {
  //     tagname.appendChild(document.createTextNode(" > "));
  //   }
  //   let pel = document.createElement("span");
  //   pel.innerText = x.tagName;
  //   pel.classList.add("span-button-inline");
  //   pel.addEventListener("click", function(e) {
  //     setFocus(x);
  //   });
  //   tagname.appendChild(pel);
  // });

  // ctrl.style.display = "block";

  let optOld = document.getElementById("optionControl");
  if(optOld) {
    optOld.remove();
  }

  let optHtml = `<div id="optionControl" class="__metadoc-option-control">
    <span id="tagName" style="font-size:x-small; color:#AAA; "></span>
    <table style="text-align:center;margin-top:3px;" id="optTable">
      <tr>
        <td><span onclick="editStyle()" class="span-button-inline color-dark"><b>S</b></span></td>
        <td><span onclick="moveEl(-1)" class="span-button-inline color-dark"><svg style="width:6px;height:6px;"><polyline points="0,6 6,6 3,0" stroke="rgb(200,200,200)" fill="rgb(200,200,200)" stroke-width="1"></polyline></svg></span></td>
        <td><span onclick="moveEl(1)" class="span-button-inline color-dark"><svg style="width:6px;height:6px;"><polyline points="0,0 6,0 3,6" stroke="rgb(200,200,200)" fill="rgb(200,200,200)" stroke-width="1"></polyline></svg></span></td>
        <td><span onclick="deleteEl()" class="span-button-inline color-dark"><svg style="width:10px;height:5px;"><line x1="0" y1="0" x2="5" y2="5" stroke="rgb(200,200,200)" stroke-width="2"/><line x1="5" y1="0" x2="0" y2="5" stroke="rgb(200,200,200)" stroke-width="2"/></svg></span></td>
        <td><span onclick="unwrap()" class="span-button-inline color-dark">unwrap</span></td>
      </tr>
      <tr>
        <td><span onclick="convertTag('p')" class="span-button-inline color-dark">&lt;p&gt;</span></td>
        <td><span onclick="convertTag('div')" class="span-button-inline color-dark">&lt;div&gt;</span></td>
        <td><span onclick="convertTag('span')" class="span-button-inline color-dark">&lt;span&gt;</span></td>
        <td><span onclick="convertTag(prompt('tag type?'))" class="span-button-inline color-dark">&lt;?&gt;</span></td>
        <td><span onclick="editRawCode()" class="span-button-inline color-dark">&lt;/&gt;</span></td>
      </tr>
      <tr>
        <td><span onclick="addTagBefore()" class="span-button-inline color-dark"><svg style="width:10px;height:6px;"><polyline points="6,0 0,3 6,6" stroke="rgb(200,200,200)" fill="rgb(200,200,200)" stroke-width="1"></polyline></svg></span></td>
        <td><span onclick="addTagAfter()" class="span-button-inline color-dark"><svg style="width:10px;height:6px;"><polyline points="0,0 6,3 0,6" stroke="rgb(200,200,200)" fill="rgb(200,200,200)" stroke-width="1"></polyline></svg></span></td>
      </tr>
    </table>
  </div>`;

  let opt = DomUtil.createElementFromString(optHtml);

  document.body.appendChild(opt);

  let bound = el.getBoundingClientRect();
  opt.style.top = bound.top - 50 + "px";
  opt.style.left = bound.left + bound.width + "px";

  let tagname = document.getElementById("tagName");
  tagname.innerHTML = "";
  let pankuzuElems = getPankuzuList(el);
  let tmp = pankuzuElems.map((x) => {
    if(tagname.innerHTML !== "") {
      tagname.appendChild(document.createTextNode(" > "));
    }
    let pel = document.createElement("span");
    pel.innerText = x.tagName;
    pel.classList.add("span-button-inline");
    pel.addEventListener("click", function(e) {
      setFocus(x);
    });
    tagname.appendChild(pel);
  });

  if(el.tagName === "TD" || el.tagName === "TH") {
    let tbl = document.getElementById('optTable');
    let tr = document.createElement('tr');
    tbl.appendChild(tr);

    let td = document.createElement('td');
    tr.appendChild(td);
    let btn = DomUtil.createElementFromString('<span class="span-button-inline color-dark">row+</span>');
    td.appendChild(btn);

    let td2 = document.createElement('td');
    tr.appendChild(td2);
    let btn2 = DomUtil.createElementFromString('<span class="span-button-inline color-dark">col+</span>');
    td2.appendChild(btn2);

    btn.addEventListener('click', function() {
      let tbl = el.parentElement.parentElement;
      let tr = document.createElement('tr');
      tbl.appendChild(tr);

      let td = null;
      for(var i = 0; i < el.parentElement.children.length; i++) {
        td = document.createElement('td');
        td.innerHTML = '<br>';
        tr.appendChild(td);
      }
    });

    btn2.addEventListener('click', function() {
      let tbl = el.parentElement.parentElement;
      for(var i = 0; i < tbl.children.length; i++) {
        let tr = tbl.children[i];
        let thtd = null;
        if(tr.children[0].tagName === "TH") {
          thtd = document.createElement('th');
        } else {
          thtd = document.createElement('td');
        }
        tr.appendChild(thtd);
      }
    });
  }


}

function getPankuzuList(el) {
  let pankuzu = [el];
  let par = el;
  while(par = par.parentElement) {
    if(par.id === "main") {
      break;
    }

    pankuzu.unshift(par);
  }
  return pankuzu;
}

function hideOptionControl() {
  let opt = document.getElementById("optionControl");
  if(opt) {
    opt.remove();
  }
}

function saveFocus() {
  if(event.target.id === "optionControl") {
    return;
  }

  if(event.target.id === "main") {
    hideOptionControl();
    return;
  }

  event.stopPropagation();

  if(globalFocused) {
    // globalFocused.classList.remove("focused");
    removeOrAttributeDeleteClass(globalFocused, "focused");
  }

  globalFocused = event.target;
  globalSelection = document.getSelection();

  if(globalEditMode) {
    globalFocused.classList.add("focused");
  }

  if(globalFocused.id === "main") {
    // globalFocused.children[globalFocused.children.length - 1].focus();
    // return;
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

function setFocus(el) {
  if(globalFocused) {
    // globalFocused.classList.remove("focused");
    removeOrAttributeDeleteClass(globalFocused, "focused");
  }

  globalFocused = el;
  showOptionControl(globalFocused);

  if(globalEditMode) {
    globalFocused.classList.add("focused");
  }
}

function saveOver() {
  if(event.target.id === "optionControl"
    || event.target.id === "main") {
    return;
  }

  event.stopPropagation();

  if(globalOver) {
    // globalOver.classList.remove("over");
    removeOrAttributeDeleteClass(globalOver, "over");
  }

  globalOver = event.target;

  // let ctrl = document.getElementById("optionControl");
  // let bound = globalOver.getBoundingClientRect();
  // ctrl.style.top = bound.top - 50 + "px";
  // ctrl.style.left = bound.left + bound.width - ctrl.getBoundingClientRect().width + "px";

  if(globalEditMode) {
    globalOver.classList.add("over");
  }

  // document.getElementById("tagName").innerText = globalOver.tagName;
}


function onMouseout() {
  // event.stopPropagation();
  // event.target.classList.remove("over");
  // console.log("onMouseout", event.target);
}

function onMouseenter() {
  // event.stopPropagation();
  // event.target.classList.add("over");
  // console.log("onMouseenter", event.target);
}

function onBlur() {
  // event.stopPropagation();
  // event.target.classList.remove("over");
  // console.log("onBlur", event.target);
}

function onFocus() {
  // event.stopPropagation();
  // event.target.classList.add("over");
  // console.log("onFocus", event.target);
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

  let opt = dom.getElementById("optionControl");
  if(opt) { 
    opt.remove();
  }
  let header = dom.getElementById("header");
  if(header) {
    header.remove();
  }

  let els = dom.querySelectorAll("#main *");
  for(var i = 0; i < els.length; i++) {
    removeOrAttributeDeleteClass(els[i], "over");
    removeOrAttributeDeleteClass(els[i], "focused");

    if(els[i].tagName === "STYLE" && els[i].id !== "userStyle") {
      els[i].remove();
    }
  }

  let styles = dom.querySelectorAll("style");
  for(var i = 0; i < styles.length; i++) {
    if(styles[i].id !== "userStyle") {
      styles[i].remove();
    }
  }

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

function addTagBefore() {
  let tag = prompt("Tag to create");
  if(tag) {
    globalFocused.parentElement.insertBefore(DomUtil.createElementFromString(tag), globalFocused);
  }
}

function addTagAfter() {
  let tag = prompt("Tag to create");
  if(tag) {
    globalFocused.parentElement.insertBefore(DomUtil.createElementFromString(tag), globalFocused.nextElementSibling);
  }
}

function editStyle() {
  let target = globalFocused;
  let style = target.getAttribute("style");
  let param = prompt("Input style", (style)? style.trim() : "" );
  if(param != null && param !== undefined) {
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

function deleteEl() {
  let target = globalFocused;
  globalFocused = null;
  // target.remove();
  // target.replaceWith(DomUtil.createElementFromString(
  //   "<br />"));

  if((target.parentElement.id === "main")
    || (target.tagName === "TD")
    || (target.tagName === "TR")
    || (target.tagName === "TH")
    ) {
    target.remove();
  } else {
    target.replaceWith(DomUtil.createElementFromString(
      "<br />"));
  }

  hideOptionControl();
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
  let target = globalFocused;
  let html = target.innerHTML;

  if(tagType === "p") {
    target.replaceWith(DomUtil.createElementFromString(
      "<p>" + html + "</p>"));
  } else if(tagType === "div") {
    target.replaceWith(DomUtil.createElementFromString(
      "<div>" + html + "</div>"));
  } else if(tagType === "span") {
    target.replaceWith(DomUtil.createElementFromString(
      "<span>" + html + "</span>"));
  } else {
    target.replaceWith(DomUtil.createElementFromString(
      `<${tagType}>` + html + `</${tagType}>`));
  }

  // if(tagType === "?") {
  //   let tag = prompt("Tag type ex. 'span' for <span>:");
  //   target.replaceWith(DomUtil.createElementFromString(
  //     `<${tag}>` + html + `</${tag}>`));
  // }
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
 * Multiline editor
 */

function showMultilineEditor(defaultValue, confirmFn, cancelFn) {
  hideMultilineEditor();

  let el = DomUtil.createElementFromString(
`<div id="multilineEditor">
  <span class="span-button-inline color-dark" id="multilineEditorConfirm">Confirm</span>
  <span class="span-button-inline color-dark" id="multilineEditorCancel">Cancel</span>
  <textarea id="multilineEditorTextarea" spellcheck="false"></textarea>
</div>`);

  document.body.appendChild(el);

  document.getElementById("multilineEditorTextarea").value = defaultValue;
  document.getElementById("multilineEditorConfirm").addEventListener("click", function(e) {
    confirmFn(document.getElementById("multilineEditorTextarea").value);
    hideMultilineEditor();
  });
  document.getElementById("multilineEditorCancel").addEventListener("click", function(e) { 
    if(cancelFn) {
      cancelFn();
    }
    hideMultilineEditor();
  });
}

function hideMultilineEditor() {
  let el = document.getElementById("multilineEditor");
  if(el) {
    el.remove();
  }
}

function showImagePalette(defaultValue, confirmFn, cancelFn) {
  hideImagePalette();

  let el = DomUtil.createElementFromString(
`<div id="imagePalette">
  <span class="span-button-inline color-dark" id="imagePaletteConfirm">Confirm</span>
  <span class="span-button-inline color-dark" id="imagePaletteCancel">Cancel</span>
  <div id="imagePaletteEditable" spellcheck="false" contenteditable="true">Paste here</div>
</div>`);

  document.body.appendChild(el);

  document.getElementById("imagePaletteEditable").value = defaultValue;
  document.getElementById("imagePaletteConfirm").addEventListener("click", function(e) {
    confirmFn(document.getElementById("imagePaletteEditable").value);
    hideImagePalette();
  });
  document.getElementById("imagePaletteCancel").addEventListener("click", function(e) { 
    if(cancelFn) {
      cancelFn();
    }
    hideImagePalette();
  });

  document.getElementById("imagePaletteEditable").addEventListener("paste", function(e){
    if (!e.clipboardData 
        || !e.clipboardData.types
        || (e.clipboardData.types.length != 1)
        || (e.clipboardData.types[0] != "Files")) {
        return true;
    }

    var imageFile = e.clipboardData.items[0].getAsFile();
    
    var fr = new FileReader();
    fr.onload = function(e) {
      var base64 = e.target.result;
      console.log(base64);
      // document.querySelector("#outputImage").src = base64;
      // document.querySelector("#outputText").textContent = base64;
    };
    fr.readAsDataURL(imageFile);
    
    // this.innerHTML = "paste image here";
  });
}

function hideImagePalette() {
  let el = document.getElementById("imagePalette");
  if(el) {
    el.remove();
  }
}

function editUserStyle() {
  let userStyle = document.getElementById("userStyle");
  showMultilineEditor(DomUtil.decodeHtml(userStyle.innerHTML), function(s) {
    userStyle.innerHTML = DomUtil.decodeHtml(s);
  });
}

function editRawCode() {
  let el = globalFocused;
  showMultilineEditor(el.outerHTML, function(s) {
    el.outerHTML = s;
  });
}

function unwrap() {
  let el = globalFocused;
  if(el.parentElement.id === "main") {
    return;
  }
  el.outerHTML = el.innerHTML;
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
  //     writeLog("file opened");
  //   } else {
  //     writeLog("failed to open file");
  //   }
  // }
});

function sanitizeDocument() {
  let els = document.querySelectorAll("#main *");
  let sanitizeTarget = {
    "P": true,
    "SPAN": true,
    "DIV": true,
    "TR": true,
    "TABLE": true,
  };
  for(var i = 0; i < els.length; i++) {
    if(sanitizeTarget[els[i].tagName]) {
      if(els[i].innerHTML.trim() === "") {
        els[i].remove();
      }
    }
  }

  let main = document.getElementById("main");
  let children = main.children;
  let lastEl = children[children.length - 1];
  if(!((lastEl.tagName === "P") && (lastEl.innerHTML === "<br>"))) {
    main.appendChild(DomUtil.createElementFromString("<p><br></p>"));
  }
}

function createHeader() {
  let headerOld = document.getElementById("header");
  if(headerOld) {
    headerOld.remove();
  }

  let headerHtml = `<div id="header" class="__metadoc-header">
      <div style="position:relative; left:23px; top:3px;">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:32px; height:32px;">
          <polyline style="stroke:#626060;" points="20 23, 15 28, 2 15, 15 2, 28 15, 25 18" stroke="black" stroke-width="3.0" fill="none"></polyline>
          <polyline style="stroke:#919191;" points="17 16, 28 27" stroke="black" stroke-width="3.0" fill="none"></polyline>
        </svg>
      </div>
      <div class="__metadoc-header-title">metadoc</div>
      <div class="__metadoc-button-container">
        <span class="span-button-inline font-size-small color-dark" id="btnToggleMode" onclick="toggleMode()">EditMode</span>
        <span class="span-button-inline font-size-small color-dark" onclick="saveNew()">Save-As</span>
        <span class="span-button-inline font-size-small color-dark" onclick="saveOverwrite()">Save</span>
        <span class="span-button-inline font-size-small color-dark" onclick="addTable()">Table</span>
        <span class="span-button-inline font-size-small color-dark" onclick="addLink()">Link</span>
        <!-- <span class="span-button-inline font-size-small color-dark" onclick="markClear()">Clear</span> -->
        <span class="span-button-inline font-size-small color-dark" onclick="envelope()" >&lt;/&gt;</span>
        <span class="span-button-inline font-size-small color-dark" onclick="createTag()" >&lt;&gt;</span>
        <span class="span-button-inline font-size-small color-dark" onclick="editUserStyle()" >A</span>
      </div>
    </div>`;

  let header = DomUtil.createElementFromString(headerHtml);

  document.body.appendChild(header);
}

createHeader();

document.getElementById("main").addEventListener("keydown", function(e) {
  sanitizeDocument();
});

document.getElementById("main").addEventListener("click", function(e) {
  sanitizeDocument();
});

document.getElementById("main").addEventListener("input", function() {
  // overwrite();
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
window.moveEl = moveEl;
window.modified = modified;
window.keydown = keydown;
window.convertTo = convertTo;
window.DomUtil = DomUtil;
window.convertTag = convertTag;
window.onMouseout = onMouseout;
window.onMouseenter = onMouseenter;
window.onBlur = onBlur;
window.onFocus = onFocus;
window.addTagAfter = addTagAfter;
window.addTagBefore = addTagBefore;
window.deleteEl = deleteEl;
window.showMultilineEditor = showMultilineEditor;
window.editUserStyle = editUserStyle;
window.editRawCode = editRawCode;
window.unwrap = unwrap;
window.showImagePalette = showImagePalette;
window.hideImagePalette = hideImagePalette;
window.createHeader = createHeader;

