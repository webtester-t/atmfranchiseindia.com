/**
 * block.js
 * Comprehensive protection script that blocks:
 * - Right-click context menu
 * - Copy / Cut / Paste (with conditional allow inside editable fields)
 * - Keyboard shortcuts (F12, devtools combos, save, print, view-source, find, select all, etc.)
 * - Dragstart (image/text dragging)
 * - Selection changes / clearing selection on non-editable areas
 * - CSS user-select to make text selection harder while preserving inputs
 *
 * All form inputs, textareas, and contenteditable elements remain fully usable for typing.
 */

(function() {
    "use strict";

    // Helper: Check if an element is editable (input, textarea, contenteditable)
    function isEditableElement(el) {
        if (!el) return false;
        const tagName = el.tagName ? el.tagName.toLowerCase() : '';
        if (tagName === 'input' || tagName === 'textarea') return true;
        // Check contenteditable attribute (including inherited)
        if (el.isContentEditable === true) return true;
        // Also check if any parent is contenteditable (common for rich text editors)
        if (el.closest && el.closest('[contenteditable="true"]')) return true;
        return false;
    }

    // Helper: Get currently focused element or event target's editable state
    function isActiveElementEditable() {
        return isEditableElement(document.activeElement);
    }

    // Helper: Determine if selection range is inside an editable element
    function isSelectionInsideEditable() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        // container can be text node, so get parent element
        const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
        return isEditableElement(element);
    }

    // ========== 1. BLOCK RIGHT-CLICK CONTEXT MENU ==========
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ========== 2. BLOCK COPY / CUT / PASTE EVENTS (conditional for editable areas) ==========
    document.addEventListener('copy', function(e) {
        if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
            e.preventDefault();
            return false;
        }
    });
    document.addEventListener('cut', function(e) {
        if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
            e.preventDefault();
            return false;
        }
    });
    document.addEventListener('paste', function(e) {
        if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
            e.preventDefault();
            return false;
        }
    });

    // ========== 3. BLOCK DRAGSTART (image / text dragging) ==========
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // ========== 4. PREVENT SELECTION ON NON-EDITABLE AREAS (selectstart + selectionchange) ==========
    document.addEventListener('selectstart', function(e) {
        if (!isEditableElement(e.target)) {
            e.preventDefault();
            return false;
        }
    });

    // Clear selection if it occurs on non-editable areas (defense in depth)
    document.addEventListener('selectionchange', function() {
        // If focus is inside an editable field OR selection is inside editable, keep it.
        if (isActiveElementEditable() || isSelectionInsideEditable()) {
            return;
        }
        // Otherwise clear selection
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    });

    // ========== 5. BLOCK KEYBOARD SHORTCUTS ==========
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    
    function isCtrlOrCmd(e) {
        return e.ctrlKey || (isMac && e.metaKey);
    }

    function isShift(e) {
        return e.shiftKey;
    }

    function isAlt(e) {
        return e.altKey;
    }

    function blockShortcut(e) {
        const key = e.key;
        const code = e.keyCode || e.which;
        
        // --- F12 (Developer Tools) ---
        if (code === 123 || key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+Shift+I (DevTools) / Cmd+Option+I (Mac) ---
        if ((isCtrlOrCmd(e) && isShift(e) && (key === 'I' || key === 'i')) ||
            (isMac && e.altKey && e.metaKey && (key === 'I' || key === 'i'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+Shift+J (Console) / Cmd+Option+J (Mac) ---
        if ((isCtrlOrCmd(e) && isShift(e) && (key === 'J' || key === 'j')) ||
            (isMac && e.altKey && e.metaKey && (key === 'J' || key === 'j'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+Shift+C (Inspect Element) / Cmd+Shift+C Mac ---
        if ((isCtrlOrCmd(e) && isShift(e) && (key === 'C' || key === 'c')) ||
            (isMac && e.metaKey && isShift(e) && (key === 'C' || key === 'c'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+Shift+K (Firefox Web Console) ---
        if (isCtrlOrCmd(e) && isShift(e) && (key === 'K' || key === 'k')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+U (View Source) ---
        if (isCtrlOrCmd(e) && (key === 'U' || key === 'u')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+S (Save) ---
        if (isCtrlOrCmd(e) && (key === 'S' || key === 's')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+P (Print) ---
        if (isCtrlOrCmd(e) && (key === 'P' || key === 'p')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+Shift+S (Save As / some browsers) ---
        if (isCtrlOrCmd(e) && isShift(e) && (key === 'S' || key === 's')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+F (Find) - block globally to prevent exposing content via browser find ---
        if (isCtrlOrCmd(e) && (key === 'F' || key === 'f')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // --- Ctrl+A (Select All) - block on non-editable areas ---
        if (isCtrlOrCmd(e) && (key === 'A' || key === 'a')) {
            if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Allow select-all inside inputs/textareas
            return true;
        }
        
        // --- Ctrl+C / Ctrl+X / Ctrl+V (Copy/Cut/Paste) - block on non-editable areas ---
        // These are already handled by copy/cut/paste events, but also block keydown to be safe
        if (isCtrlOrCmd(e) && (key === 'C' || key === 'c' || key === 'X' || key === 'x' || key === 'V' || key === 'v')) {
            if (!isActiveElementEditable() && !isSelectionInsideEditable()) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Allow within editable fields
            return true;
        }
        
        // --- Additional: Block PrintScreen key (cannot fully prevent, but can try to clear clipboard) ---
        if (key === 'PrintScreen' || code === 44) {
            e.preventDefault();
            e.stopPropagation();
            // Attempt to clear clipboard after a tiny delay (not guaranteed but defensive)
            setTimeout(() => {
                try {
                    navigator.clipboard.writeText('').catch(() => {});
                } catch (err) {}
            }, 50);
            return false;
        }
        
        // --- Block some screen capture related combos (e.g., Windows+Shift+S) ---
        // Note: Native OS combos can't be fully blocked, but we can block if ctrl/shift combos overlap
        if (isCtrlOrCmd(e) && isShift(e) && (key === 'S' || key === 's')) {
            // Already handled above
            return false;
        }
        
        // Allow normal typing, navigation keys, backspace, delete, enter, tab, arrows, etc.
        return true;
    }

    // Attach keydown listener with high priority (capture phase)
    document.addEventListener('keydown', function(e) {
        if (blockShortcut(e) === false) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true); // capture phase to intercept before any other handlers

    // Also prevent keyup for some safety (though not necessary)
    document.addEventListener('keyup', function(e) {
        const key = e.key;
        const code = e.keyCode || e.which;
        if (code === 123 || key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // ========== 6. CSS TO MAKE SELECTION HARDER (while preserving inputs) ==========
    const style = document.createElement('style');
    style.textContent = `
        /* Prevent text selection on most elements */
        body, body *:not(input):not(textarea):not([contenteditable="true"]):not([contenteditable="true"] *) {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-tap-highlight-color: transparent;
        }
        /* Allow selection and normal behavior inside editable fields */
        input, textarea, [contenteditable="true"], [contenteditable="true"] * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
        /* Optional: make non-editable selection background less visible if any leak */
        ::selection {
            background: rgba(0,0,0,0.1);
        }
        ::-moz-selection {
            background: rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);

    // ========== 7. ADDITIONAL DEFENSES ==========
    // Prevent F12 via onkeydown on window (extra layer)
    window.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // Disable right-click on images via drag prevention (already handled)
    // Also disable default browser behavior for middle-click paste if any (optional)
    document.addEventListener('auxclick', function(e) {
        if (e.button === 1) { // middle button
            e.preventDefault();
            return false;
        }
    });

    // Prevent text selection via mouseup/mousedown combo (defense)
    document.addEventListener('mousedown', function(e) {
        // If target is not editable and we are starting selection, try to prevent
        if (!isEditableElement(e.target)) {
            // Do not prevent default completely - might break UI interactions.
            // However, we rely on CSS + selectstart + selectionchange.
            // This just ensures selection is cleared aggressively.
            if (e.detail > 1) { // double click prevention
                e.preventDefault();
            }
        }
    });

    // Final: clear any accidental selection on document load
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }

    console.log('Block.js active: right-click, copy, shortcuts, devtools blocked. Typing in forms preserved.');
})();