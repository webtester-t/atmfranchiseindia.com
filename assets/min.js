// block-command.js
// Attempts to block copy/print/save/view-source/devtools shortcuts, context menu and selection.
// NOTE: This reduces casual copying/printing/inspection but cannot absolutely prevent a determined user.

(function () {
  'use strict';

  // Helper: return true if the event target is a field where we should NOT block keys
  function isEditableTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  // Block common shortcuts and developer tools keys
  function onKeyDown(e) {
    // allow in editable controls
    if (isEditableTarget(e.target)) return;

    const key = e.key || '';
    const code = e.code || '';
    const ctrl = e.ctrlKey || false;
    const shift = e.shiftKey || false;
    const alt = e.altKey || false;
    const meta = e.metaKey || false; // mac command key

    // Build a human-friendly description (for debugging if needed)
    // console.log('keydown', {key, code, ctrl, shift, alt, meta});

    // Block F12
    if (code === 'F12' || key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+S  (save)
    if ((ctrl || meta) && (key === 's' || key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+P  (print)
    if ((ctrl || meta) && (key === 'p' || key === 'P')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+U  (view-source)
    if ((ctrl || meta) && (key === 'u' || key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+I / Cmd+Option+I  (devtools)
    if ((ctrl && shift && (key === 'I' || key === 'i')) ||
        (meta && alt && (key === 'I' || key === 'i'))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+J / Cmd+Option+J  (console)
    if ((ctrl && shift && (key === 'J' || key === 'j')) ||
        (meta && alt && (key === 'J' || key === 'j'))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+C (inspect element)
    if (ctrl && shift && (key === 'C' || key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl+Shift+K (firefox web console)
    if (ctrl && shift && (key === 'K' || key === 'k')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+Shift+S (some browsers / extensions save as)
    if ((ctrl || meta) && shift && (key === 'S' || key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+C/X/V  (copy/cut/paste) on non-editable areas
    if ((ctrl || meta) && (key === 'c' || key === 'C' || key === 'x' || key === 'X' || key === 'v' || key === 'V')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+A (select all) on non-editable areas
    if ((ctrl || meta) && (key === 'a' || key === 'A')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block Ctrl/Cmd+F (find) on non-editable areas
    if ((ctrl || meta) && (key === 'f' || key === 'F')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Block context-key combinations that sometimes trigger screen capture tools
    // (Note: many OS-level combos can't be captured by the browser at all)
    if ((ctrl || meta) && (key === 'PrintScreen' || code === 'PrintScreen')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // If none matched, allow key through
    return true;
  }

  // Prevent copy/cut/paste events
  function onCopyCutPaste(e) {
    if (isEditableTarget(e.target)) return; // allow in editable controls
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Prevent dragstart (image/text dragging)
  function onDragStart(e) {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
    return false;
  }

  // Prevent selection changes (tries to clear selection)
  function onSelectionChange() {
    // If selection is inside an editable element, keep it
    const sel = document.getSelection();
    if (!sel) return;
    if (sel.rangeCount === 0) return;

    const r = sel.getRangeAt(0);
    const node = r.commonAncestorContainer;
    if (node && isEditableTarget(node.nodeType === 1 ? node : node.parentElement)) {
      return; // allow selection in editable areas
    }
    // remove selection
    sel.removeAllRanges();
  }

  // Block right-click context menu
  function onContextMenu(e) {
    if (isEditableTarget(e.target)) return; // allow in inputs
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Apply CSS to make selection harder while preserving inputs
  function injectCSS() {
    const css = `
      /* disable user selection globally except in inputs/textarea/contenteditable */
      html, body, #app, .container {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    const s = document.createElement('style');
    s.type = 'text/css';
    s.appendChild(document.createTextNode(css));
    document.head && document.head.appendChild(s);
  }

  // Attach listeners
  function attach() {
    // keydown for shortcuts
    window.addEventListener('keydown', onKeyDown, true);

    // copy/cut/paste
    window.addEventListener('copy', onCopyCutPaste, true);
    window.addEventListener('cut', onCopyCutPaste, true);
    window.addEventListener('paste', onCopyCutPaste, true);

    // dragstart
    window.addEventListener('dragstart', onDragStart, true);

    // selection change
    document.addEventListener('selectionchange', onSelectionChange, true);

    // context menu (right click)
    window.addEventListener('contextmenu', onContextMenu, true);

    // prevent certain mouse shortcuts (middle-click open might be allowed)
    // optional: block middle-click paste on Linux (button==1)
    window.addEventListener('mousedown', function (e) {
      if (isEditableTarget(e.target)) return;
      // block middle-click (button === 1) from doing unwanted things
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    injectCSS();
  }

  // Start once DOM is ready (or immediately if already ready)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    attach();
  } else {
    document.addEventListener('DOMContentLoaded', attach);
  }

  // Optional: provide a way to remove protection (for debugging)
  window.__unblockProtection = function () {
    try {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('copy', onCopyCutPaste, true);
      window.removeEventListener('cut', onCopyCutPaste, true);
      window.removeEventListener('paste', onCopyCutPaste, true);
      window.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('selectionchange', onSelectionChange, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
      // remove injected style
      const heads = document.getElementsByTagName('head');
      if (heads && heads[0]) {
        const styles = heads[0].querySelectorAll('style');
        styles.forEach(s => {
          if (s.textContent && s.textContent.indexOf('/* disable user selection globally') !== -1) {
            s.parentNode.removeChild(s);
          }
        });
      }
    } catch (err) {
      // ignore
    }
  };

})();
