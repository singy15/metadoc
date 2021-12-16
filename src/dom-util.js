function createElementFromString(html) {
  let el = (new DOMParser()).parseFromString(html,"text/html").body.children[0];
  return el;
}

function insertTextAtCaret(text) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

function insertElementAtCaret(el) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(el);
        }
    }
}

function insertElementAtCaretByHtml(html) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(createElementFromString(html));
        }
    }
}

function getSelected() {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            return range.cloneContents();
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

function decodeHtml(input){
  var e = document.createElement('div');
  e.innerHTML = input;

  if(e.childNodes.length === 0) {
    return "";
  }

  let str = "";
  for(var i = 0; i < e.childNodes.length; i++) {
    str = str + e.childNodes[i].nodeValue;
  }

  return str;
}

module.exports = {
  insertTextAtCaret: insertTextAtCaret,
  insertElementAtCaret: insertElementAtCaret,
  insertElementAtCaretByHtml: insertElementAtCaretByHtml,
  getSelected: getSelected,
  createElementFromString: createElementFromString,
  decodeHtml: decodeHtml
};

