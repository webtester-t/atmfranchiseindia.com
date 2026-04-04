/**
 * block.js – Protects content while preserving full usability of inputs, textareas, and search fields.
 * - Allows typing, backspace, delete, arrows, space, enter, tab inside editable elements.
 * - Allows copy/cut/paste inside inputs / textareas (editable areas).
 * - Blocks right‑click context menu everywhere.
 * - Blocks copy/cut/paste on non‑editable areas.
 * - Blocks F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+F, Ctrl+A (on non‑editable).
 * - Blocks dragstart (prevents image/text dragging).
 * - Applies CSS to make text selection harder on non‑editable content.
 */

(function() {
    "use strict";

    // Helper: check if an element (or its parent) is an editable field
    function isEditableElement(el) {
        if (!el) return false;
        // Directly an input or textarea
        if (el.tagName && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return true;
        // Contenteditable attribute (including inherited)
        if (el.isContentEditable === true) return true;
        if (el.closest && el.closest('[contenteditable="true"]')) return true;
        return false;
    }

    // Helper: currently focused element is editable
    function isActiveElementEditable() {
        return isEditableElement(document.activeElement);
    }

    // Helper: selection range inside an editable element
    function isSelectionInsideEditable() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        return isEditableElement(element);
    }

    // ------------------------------------------------------------------
    // 1. BLOCK RIGHT-CLICK CONTEXT MENU (everywhere)
    // ------------------------------------------------------------------
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // ------------------------------------------------------------------
    // 2. BLOCK COPY/CUT/PASTE – only on non‑editable areas
    // ------------------------------------------------------------------
    const clipboardEvents = ['copy', 'cut', 'paste'];
    clipboardEvents.forEach(evType => {
        document.addEventListener(evType, (e) => {
            if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
                e.preventDefault();
                return false;
            }
        });
    });

    // ------------------------------------------------------------------
    // 3. BLOCK DRAGSTART (image / text dragging)
    // ------------------------------------------------------------------
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });

    // ------------------------------------------------------------------
    // 4. PREVENT SELECTION START ON NON‑EDITABLE AREAS
    // ------------------------------------------------------------------
    document.addEventListener('selectstart', (e) => {
        if (!isEditableElement(e.target)) {
            e.preventDefault();
            return false;
        }
    });

    // ------------------------------------------------------------------
    // 5. CLEAR SELECTION ONLY IF IT IS OUTSIDE EDITABLE FIELDS
    //    (does NOT interfere with input caret or highlighting inside inputs)
    // ------------------------------------------------------------------
    document.addEventListener('selectionchange', () => {
        if (isActiveElementEditable() || isSelectionInsideEditable()) {
            return;   // preserve selection inside input / textarea
        }
        // Otherwise remove any selection on protected content
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    });

    // ------------------------------------------------------------------
    // 6. BLOCK KEYBOARD SHORTCUTS (F12, devtools, save, print, etc.)
    //    – but allow normal typing inside editable elements.
    // ------------------------------------------------------------------
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    function isCtrlOrCmd(e) {
        return e.ctrlKey || (isMac && e.metaKey);
    }

    document.addEventListener('keydown', (e) => {
        const key = e.key;
        const code = e.keyCode || e.which;
        const activeEditable = isActiveElementEditable();

        // ---- F12 ----
        if (code === 123 || key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- DevTools combos: Ctrl+Shift+I / Cmd+Option+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K ----
        if ((isCtrlOrCmd(e) && e.shiftKey && (key === 'I' || key === 'i')) ||
            (isMac && e.altKey && e.metaKey && (key === 'I' || key === 'i')) ||
            (isCtrlOrCmd(e) && e.shiftKey && (key === 'J' || key === 'j')) ||
            (isMac && e.altKey && e.metaKey && (key === 'J' || key === 'j')) ||
            (isCtrlOrCmd(e) && e.shiftKey && (key === 'C' || key === 'c')) ||
            (isCtrlOrCmd(e) && e.shiftKey && (key === 'K' || key === 'k'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- Ctrl+U (View Source) ----
        if (isCtrlOrCmd(e) && (key === 'U' || key === 'u')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- Ctrl+S (Save) & Ctrl+Shift+S (Save As) ----
        if (isCtrlOrCmd(e) && (key === 'S' || key === 's')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- Ctrl+P (Print) ----
        if (isCtrlOrCmd(e) && (key === 'P' || key === 'p')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- Ctrl+F (Find) – block globally (can reveal content) ----
        if (isCtrlOrCmd(e) && (key === 'F' || key === 'f')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // ---- Ctrl+A (Select All) – block only on non‑editable areas ----
        if (isCtrlOrCmd(e) && (key === 'A' || key === 'a')) {
            if (!activeEditable && !isSelectionInsideEditable()) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // allow inside inputs/textareas
            return true;
        }

        // ---- Ctrl+C / Ctrl+X / Ctrl+V (Copy/Cut/Paste) – already handled by clipboard events,
        //      but also block here as a second line of defence on non‑editable areas.
        if (isCtrlOrCmd(e) && (key === 'C' || key === 'c' || key === 'X' || key === 'x' || key === 'V' || key === 'v')) {
            if (!activeEditable && !isSelectionInsideEditable()) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // allow copy/paste/cut inside editable fields
            return true;
        }

        // ---- PrintScreen (attempt to clear clipboard) ----
        if (key === 'PrintScreen' || code === 44) {
            e.preventDefault();
            e.stopPropagation();
            setTimeout(() => {
                try { navigator.clipboard.writeText('').catch(() => {}); } catch (err) {}
            }, 50);
            return false;
        }

        // ---- For all other keys (letters, numbers, backspace, delete, arrows, space, enter, tab, etc.)
        //      do nothing – allow normal typing and navigation.
        return true;
    }, true); // capture phase to intercept before other handlers

    // Also prevent keyup for F12 (extra safety)
    document.addEventListener('keyup', (e) => {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // ------------------------------------------------------------------
    // 7. CSS – make selection hard on non‑editable content,
    //    but preserve normal selection inside inputs / textareas.
    // ------------------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = `
        /* Disable selection on everything except inputs, textareas, contenteditable */
        body, body *:not(input):not(textarea):not([contenteditable="true"]):not([contenteditable="true"] *) {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent;
        }
        /* Allow full selection & caret inside editable fields */
        input, textarea, [contenteditable="true"], [contenteditable="true"] * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
        /* Optional: make any accidental selection less visible */
        ::selection {
            background: rgba(0,0,0,0.1);
        }
        ::-moz-selection {
            background: rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);

    // ------------------------------------------------------------------
    // 8. Clean any stray selection at startup
    // ------------------------------------------------------------------
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }

    console.log('block.js loaded – typing in search/forms allowed, protections active for non‑editable content.');
})();
