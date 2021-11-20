import './style.css';

let globalOverwriteTimeout = null;
let globalFSHandle;
let globalFocused;
let globalSelection;
let globalEditMode = false;

function toggleMode() {
  globalEditMode = !globalEditMode;

  if(globalEditMode) {
    changeToEditMode();
  } else {
    changeToViewMode();
  }
}

function changeToViewMode() {
  document.getElementById("main").removeAttribute("contenteditable");
  document.getElementById("main").classList.remove("content");
}

function changeToEditMode() {
  document.getElementById("main").setAttribute("contenteditable", "true");
  document.getElementById("main").classList.add("content");
}

function insertElement(el) {
  let target = globalFocused;
  let html = target.innerHTML;
  let offset = globalSelection.focusOffset;
  target.innerHTML = html.substring(0,offset) + el + html.substring(offset);
}

function addTable() {
  insertElement(
    `<table>
      <tr><th>h1</th><th>h2</th><th>h3</th></tr>
      <tr><td>c1</td><td>c2</td><td>c3</td></tr>
      <tr><td>c4</td><td>c5</td><td>c6</td></tr>
     </table>`);
}

function addLink() {
  insertElement(
    `<a href="${prompt('Input link url')}">link</a>`);
}

function restoreFocus() {
  event.preventDefault();
  event.stopPropagation();
  console.log("restoreFocus");
  globalFocused.focus();
  document.getSelection().addRange(document.getSelection().getRangeAt(0));
  console.log(document.getSelection());
}

function saveFocus() {
  console.log("saveFocus");
  globalFocused = event.target;
  globalSelection = document.getSelection();
  console.log(globalFocused);
  console.log(globalSelection);
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

function serializeSource() {
  const xs = new XMLSerializer();
  const dp = new DOMParser();
  
  const dom = dp.parseFromString(xs.serializeToString(document), "text/html");
  dom.getElementById("mpdStyle").remove();
  // dom.getElementById("mpdScript").remove();
  dom.getElementByTagName("script").remove();
  return xs.serializeToString(dom)
    .replace('<\/html>',
      "\n"
      + `<style id="mpdStyle">` + document.getElementById("mpdStyle").innerHTML + `<\/style>`
      + "\n"
      + `<script type="text/javascript">` + document.getElementByTagName("script").innerHTML + `<\/script>`
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

window.saveFocus = saveFocus;
window.addTable = addTable;
window.addLink = addLink;
window.saveNew = saveNew;
window.saveOverwrite = saveOverwrite;
window.toggleMode = toggleMode;
