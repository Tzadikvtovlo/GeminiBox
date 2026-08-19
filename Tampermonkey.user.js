// ==UserScript==
// @name         מצמצם בלוקי קוד בג'מיני
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  GeminiBox
// @author       צדיק וטוב לו וההודי של gemini
// @match        https://gemini.google.com/*
// @updateURL    https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/Tampermonkey.user.js
// @downloadURL  https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/Tampermonkey.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com
// @grant        none

// ==/UserScript==

(function() {
    'use strict';

    const MAX_HEIGHT = '300px';

    GM_addStyle(`
        .custom-code-container {
            position: relative;
            margin-bottom: 12px;
        }
        .custom-code-collapsed {
            max-height: ${MAX_HEIGHT} !important;
            overflow-y: auto !important;
        }
        .custom-code-expanded {
            max-height: none !important;
            overflow-y: visible !important;
        }

        /* Floating Button - Positioned absolutely within our own wrapper */
        .custom-toggle-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 100;
            background-color: var(--bard-color-surface-container-high, #444746);
            color: var(--bard-color-on-surface, #e3e3e3);
            border: 1px solid var(--bard-color-outline-variant, #5f6368);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 13px;
            font-family: inherit;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s ease, background-color 0.2s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        .custom-toggle-btn:hover {
            opacity: 1;
            background-color: var(--bard-color-surface-container-highest, #555857);
        }

        /* Scrollbar exactly matching Gemini's horizontal scrollbar */
        .custom-code-collapsed::-webkit-scrollbar,
        .custom-code-expanded::-webkit-scrollbar {
            width: 14px;
            height: 14px;
        }
        .custom-code-collapsed::-webkit-scrollbar-track,
        .custom-code-expanded::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-code-collapsed::-webkit-scrollbar-thumb,
        .custom-code-expanded::-webkit-scrollbar-thumb {
            background-color: var(--bard-color-surface-variant, #9aa0a6);
            border-radius: 10px;
            border: 4px solid transparent;
            background-clip: padding-box;
        }
        .custom-code-collapsed::-webkit-scrollbar-thumb:hover,
        .custom-code-expanded::-webkit-scrollbar-thumb:hover {
            background-color: var(--bard-color-outline, #5f6368);
            border: 4px solid transparent;
            background-clip: padding-box;
        }
    `);

    function processCodeBlocks() {
        // Target the <pre> elements directly instead of hunting for the header
        const pres = document.querySelectorAll('pre:not([data-custom-wrapped])');

        pres.forEach(pre => {
            pre.dataset.customWrapped = 'true';
            pre.classList.add('custom-code-collapsed');

            // 1. Create a wrapper to isolate our DOM changes from Gemini's React/Angular engine
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-code-container';

            // 2. Insert wrapper before the pre element, then move the pre inside it
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            // 3. Create the standalone floating button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'custom-toggle-btn';
            toggleBtn.innerText = 'הרחב קוד';

            let isExpanded = false;

            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isExpanded = !isExpanded;

                if (isExpanded) {
                    pre.classList.remove('custom-code-collapsed');
                    pre.classList.add('custom-code-expanded');
                    toggleBtn.innerText = 'צמצם קוד';
                } else {
                    pre.classList.add('custom-code-collapsed');
                    pre.classList.remove('custom-code-expanded');
                    toggleBtn.innerText = 'הרחב קוד';
                }
            });

            // 4. Attach the button inside our controlled wrapper
            wrapper.appendChild(toggleBtn);
        });
    }

    // Use a lightweight interval instead of MutationObserver to avoid race conditions with Gemini's rendering
    setInterval(processCodeBlocks, 1000);
})();
