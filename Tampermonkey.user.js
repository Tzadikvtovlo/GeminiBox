// ==UserScript==
// @name         מצמצם בלוקי קוד בג'מיני
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  GeminiBox
// @author       צדיק וטוב לו וההודי של gemini
// @match        https://gemini.google.com/*
// @updateURL    https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/Tampermonkey.user.js
// @downloadURL  https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/Tampermonkey.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const MAX_HEIGHT_PX = 220;
    const MAX_HEIGHT = `${MAX_HEIGHT_PX}px`;

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

        /* Floating Button - Positioned absolutely at the bottom center */
        .custom-toggle-btn {
            position: absolute;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
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
        const pres = document.querySelectorAll('pre:not([data-custom-wrapped])');

        pres.forEach(pre => {
            pre.dataset.customWrapped = 'true';

            // 1. יצירת עטיפה
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-code-container';

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            // 2. יצירת הכפתור - מוסתר כברירת מחדל
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'custom-toggle-btn';
            toggleBtn.innerText = 'הרחב קוד';
            toggleBtn.style.display = 'none';

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

            wrapper.appendChild(toggleBtn);

            // 3. מעקב אחר גובה הבלוק בזמן אמת (מעולה לקוד שנכתב בלייב על ידי ג'מיני)
            const resizeObserver = new ResizeObserver(() => {
                // בדיקה אם גובה התוכן בפועל גדול מהמקסימום המותר
                if (pre.scrollHeight > MAX_HEIGHT_PX) {
                    toggleBtn.style.display = 'block'; // הצגת הכפתור
                    if (!isExpanded) {
                        pre.classList.add('custom-code-collapsed');
                    }
                } else {
                    toggleBtn.style.display = 'none'; // הסתרת הכפתור
                    pre.classList.remove('custom-code-collapsed');
                    pre.classList.remove('custom-code-expanded');
                }
            });

            resizeObserver.observe(pre);
        });
    }

    // שימוש באינטרוול רק כדי ללכוד בלוקים חדשים שנוצרים
    setInterval(processCodeBlocks, 1000);
})();
