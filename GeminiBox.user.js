// ==UserScript==
// @name         GeminiBox
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  מסגרת עבה ונוכחת, כפתורים לבנים ועבים בשורה אחת חלקה, העלמה הרמטית של כפתורי ייצוא מיותרים, וטולטיפ אינטראקטיבי לשינוי שם קובץ.
// @author       צדיק וטוב לו וההודי של gemini
// @match        https://gemini.google.com/*
// @updateURL    https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/GeminiBox.user.js
// @downloadURL  https://raw.githubusercontent.com/Tzadikvtovlo/GeminiBox/main/GeminiBox.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gemini.google.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const MAX_HEIGHT_PX = 220;
    const MAX_HEIGHT = `${MAX_HEIGHT_PX}px`;

    // --- עיצוב CSS דורסני ומתוקן ---
    GM_addStyle(`
        /* צמצום והרחבה */
        .custom-code-collapsed { max-height: ${MAX_HEIGHT} !important; overflow-y: auto !important; }
        .custom-code-expanded { max-height: none !important; overflow-y: visible !important; }
        .custom-code-collapsed::-webkit-scrollbar, .custom-code-expanded::-webkit-scrollbar { width: 14px; height: 14px; }
        .custom-code-collapsed::-webkit-scrollbar-track, .custom-code-expanded::-webkit-scrollbar-track { background: transparent; }
        .custom-code-collapsed::-webkit-scrollbar-thumb, .custom-code-expanded::-webkit-scrollbar-thumb { background-color: var(--bard-color-surface-variant, #9aa0a6); border-radius: 10px; border: 4px solid transparent; background-clip: padding-box; }

        /* מסגרת מדויקת ועבה (4px) */
        @keyframes geminiExtPulseRed {
            0% { box-shadow: inset 0 0 0 4px rgba(234, 67, 53, 0.9); }
            50% { box-shadow: inset 0 0 0 4px rgba(234, 67, 53, 0.3); }
            100% { box-shadow: inset 0 0 0 4px rgba(234, 67, 53, 0.9); }
        }
        .gemini-ext-border-overlay {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            pointer-events: none; z-index: 50; transition: box-shadow 0.3s ease; box-sizing: border-box;
        }
        .gemini-ext-finished {
            box-shadow: inset 0 0 0 4px rgba(52, 168, 83, 0.9) !important; /* ירוק עבה ובולט */
        }

        /* כפתורי הפעולה של השורה העליונה (לבנים, עבים יותר) */
        .gemini-ext-btn {
            background: transparent; border: none; cursor: pointer; color: #ffffff !important;
            display: inline-flex !important; align-items: center; justify-content: center;
            width: 36px; height: 36px; border-radius: 50%; transition: background-color 0.2s;
            margin: 0 4px; padding: 0; flex-shrink: 0;
        }
        .gemini-ext-btn:hover { background-color: rgba(255, 255, 255, 0.15); }
        .gemini-ext-btn svg { width: 22px; height: 22px; }

        /* העלמה בכוח של כל כפתור מקורי מיותר (משאיר רק את ההעתקה ואת הכפתורים שלנו) */
        .gemini-visual-box button:not(.gemini-ext-btn):not([aria-label*="Copy"]):not([aria-label*="העתק"]):not([data-tooltip*="Copy"]):not([data-tooltip*="העתק"]):not([title*="Copy"]):not([title*="העתק"]) {
            display: none !important;
        }

        /* כפיית שורה אחת ישרה לכפתורים הנותרים */
        .gemini-action-row {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
        }

        /* טולטיפ אינטראקטיבי לשינוי שם קובץ */
        #gemini-filename-tooltip {
            position: fixed;
            z-index: 100000;
            background: #1e1f20;
            color: #e3e3e3;
            border: 1px solid #444746;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 13px;
            font-family: inherit;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s ease, transform 0.15s ease;
            transform: translate(-50%, 4px);
            white-space: nowrap;
        }
        #gemini-filename-tooltip.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, 0);
        }
        #gemini-filename-tooltip span {
            font-size: 12px;
            color: #c4c7c5;
            user-select: none;
            direction: rtl;
        }
        #gemini-filename-tooltip input {
            background: #2b2c2f;
            color: #ffffff;
            border: 1px solid #525458;
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 13px;
            font-family: monospace;
            outline: none;
            min-width: 170px;
            direction: ltr;
            text-align: left;
        }
        #gemini-filename-tooltip input:focus {
            border-color: #8ab4f8;
            box-shadow: 0 0 0 1px #8ab4f8;
        }

        /* הכפתור העולמי צף למטה */
        #gemini-ext-global-btn { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background-color: rgba(52, 168, 83, 0.9); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 10px 16px; font-size: 14px; font-family: inherit; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: transform 0.2s, background-color 0.2s; backdrop-filter: blur(4px); direction: rtl; }
        #gemini-ext-global-btn:hover { transform: scale(1.05); background-color: rgba(52, 168, 83, 1); }
    `);

    // --- יצירת אייקונים (עובי 2.4, לבן נקי) ---
    const ICON_STROKE_WIDTH = '2.4';
    const ICON_COLOR = '#ffffff';

    function createSvgElement(tag, attrs) { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; }
    function createDownloadIcon() { const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: ICON_COLOR, 'stroke-width': ICON_STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); svg.appendChild(createSvgElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' })); svg.appendChild(createSvgElement('polyline', { points: '7 10 12 15 17 10' })); svg.appendChild(createSvgElement('line', { x1: '12', y1: '15', x2: '12', y2: '3' })); return svg; }
    function createLayersArrowDownIcon() { const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: ICON_COLOR, 'stroke-width': ICON_STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); svg.appendChild(createSvgElement('line', { x1: '12', y1: '2', x2: '12', y2: '11' })); svg.appendChild(createSvgElement('polyline', { points: '8 7 12 11 16 7' })); svg.appendChild(createSvgElement('polyline', { points: '3 14 12 17 21 14' })); svg.appendChild(createSvgElement('polyline', { points: '3 18 12 21 21 18' })); return svg; }
    function createCheckIconGreen() { const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: '#4caf50', 'stroke-width': ICON_STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); svg.appendChild(createSvgElement('polyline', { points: '20 6 9 17 4 12' })); return svg; }
    function createExpandIcon() { const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: ICON_COLOR, 'stroke-width': ICON_STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); svg.appendChild(createSvgElement('polyline', { points: '17 15 12 20 7 15' })); svg.appendChild(createSvgElement('polyline', { points: '7 9 12 4 17 9' })); return svg; }
    function createCollapseIcon() { const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: ICON_COLOR, 'stroke-width': ICON_STROKE_WIDTH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); svg.appendChild(createSvgElement('polyline', { points: '17 20 12 15 7 20' })); svg.appendChild(createSvgElement('polyline', { points: '7 4 12 9 17 4' })); return svg; }

    // --- ניהול טולטיפ אינטראקטיבי לשינוי שם הקובץ ---
    let tooltipEl = null;
    let tooltipInput = null;
    let activePreForTooltip = null;
    let tooltipHideTimeout = null;

    function initFilenameTooltip() {
        if (tooltipEl || !document.body) return;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'gemini-filename-tooltip';

        const label = document.createElement('span');
        label.innerText = 'שם קובץ:';

        tooltipInput = document.createElement('input');
        tooltipInput.type = 'text';
        tooltipInput.spellcheck = false;

        tooltipEl.appendChild(label);
        tooltipEl.appendChild(tooltipInput);

        tooltipInput.addEventListener('input', () => {
            if (activePreForTooltip) {
                const val = tooltipInput.value.trim();
                if (val) activePreForTooltip.dataset.customFilename = val;
                else delete activePreForTooltip.dataset.customFilename;
            }
        });

        tooltipInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                tooltipInput.blur();
                hideFilenameTooltip();
            }
        });

        tooltipInput.addEventListener('blur', () => {
            scheduleHideFilenameTooltip();
        });

        tooltipEl.addEventListener('mouseenter', () => {
            clearTimeout(tooltipHideTimeout);
        });

        tooltipEl.addEventListener('mouseleave', () => {
            scheduleHideFilenameTooltip();
        });

        document.body.appendChild(tooltipEl);
    }

    function showFilenameTooltip(btn, pre) {
        initFilenameTooltip();
        if (!tooltipEl) return;
        clearTimeout(tooltipHideTimeout);
        activePreForTooltip = pre;
        tooltipInput.value = getFilenameForBlock(pre);
        tooltipEl.classList.add('visible');

        const rect = btn.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8;
        if (top < 10) {
            top = rect.bottom + 8;
        }

        let left = rect.left + (rect.width / 2);
        const halfWidth = tooltipRect.width / 2;
        if (left - halfWidth < 10) {
            left = halfWidth + 10;
        } else if (left + halfWidth > window.innerWidth - 10) {
            left = window.innerWidth - 10 - halfWidth;
        }

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function scheduleHideFilenameTooltip() {
        clearTimeout(tooltipHideTimeout);
        tooltipHideTimeout = setTimeout(() => {
            if (tooltipInput && document.activeElement !== tooltipInput) {
                hideFilenameTooltip();
            }
        }, 250);
    }

    function hideFilenameTooltip() {
        if (tooltipEl) {
            tooltipEl.classList.remove('visible');
        }
        activePreForTooltip = null;
    }

    // --- פונקציות עזר ---
    function getFilenameForBlock(preElement) {
        if (preElement && preElement.dataset.customFilename) {
            return preElement.dataset.customFilename;
        }
        let filename = 'code_snippet.txt';
        const regex = /([a-zA-Z0-9_\-]+\.(?:json|jsx|tsx|html|yaml|vue|svelte|cpp|css|java|py|js|ts|cs|txt|md|sh|yml|xml|php|rb|go|rs|sql|c|h))\b/ig;
        let container = preElement; while(container && !container.tagName.toLowerCase().includes('message') && !container.hasAttribute('data-message-id')) { if(container.parentElement) container = container.parentElement; else break; }
        let textBefore = ""; const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false); let currentNode;
        while ((currentNode = walker.nextNode())) { if (preElement.contains(currentNode)) break; textBefore += currentNode.nodeValue + " "; }
        const matches = [...textBefore.matchAll(regex)];
        if (matches.length > 0) filename = matches[matches.length - 1][1];
        else { const headerMatch = preElement.textContent.split('\n')[0].match(regex); if (headerMatch) filename = headerMatch[0]; }
        return filename;
    }

    function extractCode(preElement) { return (preElement.querySelector('code') || preElement).textContent.replace(/^\s*[\r\n]/, '').trimEnd(); }
    function triggerDownload(content, filename) { const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

    // --- ליבה: איתור הקופסה המדויקת של הרקע השחור ---
    function getVisualCodeBlock(pre) {
        let curr = pre;
        while (curr && curr !== document.body) {
            const style = window.getComputedStyle(curr);
            if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent' && parseInt(style.borderRadius) > 0) {
                curr.classList.add('gemini-visual-box'); // תיוג עבור ה-CSS הדורסני!
                return curr;
            }
            curr = curr.parentElement;
        }
        return pre.parentElement.parentElement;
    }

    function getActionContainer(visualBox) {
        if (!visualBox) return { actionContainer: null, copyBtn: null };
        const btns = Array.from(visualBox.querySelectorAll('button:not(.gemini-ext-btn)'));
        const copyBtn = btns.find(b => /(copy|העתק)/i.test((b.getAttribute('aria-label')||'') + ' ' + (b.title||'') + ' ' + (b.getAttribute('data-tooltip')||'')));
        const actionContainer = copyBtn ? copyBtn.parentElement : null;
        if (actionContainer) actionContainer.classList.add('gemini-action-row'); // החלת חוקי ה-Flex הברזל
        return { actionContainer, copyBtn };
    }

    // --- כפתור עולמי ---
    function renderGlobalDownloadBtn() {
        if (document.getElementById('gemini-ext-global-btn')) return;
        const btn = document.createElement('button'); btn.id = 'gemini-ext-global-btn';
        const renderDefault = () => { btn.innerHTML = ''; btn.appendChild(createDownloadIcon()); const s = document.createElement('span'); s.innerText = 'הורד את כל קבצי השיחה'; btn.appendChild(s); };
        renderDefault();
        btn.addEventListener('click', async () => {
            const allBlocks = Array.from(document.querySelectorAll('pre[data-ai-hijacked="true"]'));
            if (allBlocks.length === 0) return alert('לא נמצאו קבצים מוכנים להורדה.');
            btn.innerHTML = `<span>מוריד ${allBlocks.length} קבצים...</span>`;
            let count = 0;
            for (let b of allBlocks) { if (b.textContent.trim().length === 0) continue; triggerDownload(extractCode(b), getFilenameForBlock(b)); count++; await new Promise(r => setTimeout(r, 400)); }
            btn.innerHTML = ''; btn.appendChild(createCheckIconGreen()); const s = document.createElement('span'); s.innerText = `הורדו ${count} קבצים בהצלחה!`; btn.appendChild(s);
            setTimeout(renderDefault, 4000);
        });
        document.body.appendChild(btn);
    }

    // --- המנוע המרכזי ---
    function processCodeBlocks() {
        try { renderGlobalDownloadBtn(); initFilenameTooltip(); } catch (e) {}
        const pres = document.querySelectorAll('pre');
        const groups = new Map();

        pres.forEach(pre => {
            try {
                let msgContainer = pre; while(msgContainer && !msgContainer.tagName.toLowerCase().includes('message')) { if(msgContainer.parentElement) msgContainer = msgContainer.parentElement; else break; }
                if (!groups.has(msgContainer)) groups.set(msgContainer, []); groups.get(msgContainer).push(pre);

                const visualBox = getVisualCodeBlock(pre);
                const { actionContainer, copyBtn } = getActionContainer(visualBox);

                // 1. איתור וסידור השורה של הכפתורים, וכפתור צמצום/הרחבה כאייקון!
                if (!pre.dataset.geminiExtProcessed) {
                    pre.dataset.geminiExtProcessed = 'true';

                    if (actionContainer && copyBtn) {
                        const toggleBtn = document.createElement('button');
                        toggleBtn.className = 'gemini-ext-btn gemini-ext-toggle';
                        toggleBtn.title = 'הרחב קוד';
                        toggleBtn.appendChild(createExpandIcon());
                        actionContainer.insertBefore(toggleBtn, copyBtn);

                        let isExpanded = false;
                        toggleBtn.addEventListener('click', (e) => {
                            e.preventDefault(); e.stopPropagation(); isExpanded = !isExpanded;
                            if (isExpanded) { pre.classList.remove('custom-code-collapsed'); pre.classList.add('custom-code-expanded'); toggleBtn.title = 'צמצם קוד'; toggleBtn.replaceChildren(createCollapseIcon()); }
                            else { pre.classList.add('custom-code-collapsed'); pre.classList.remove('custom-code-expanded'); toggleBtn.title = 'הרחב קוד'; toggleBtn.replaceChildren(createExpandIcon()); }
                        });

                        new ResizeObserver(() => {
                            if (pre.scrollHeight > MAX_HEIGHT_PX) { toggleBtn.style.display = 'inline-flex'; if (!isExpanded) pre.classList.add('custom-code-collapsed'); }
                            else { toggleBtn.style.display = 'none'; pre.classList.remove('custom-code-collapsed'); pre.classList.remove('custom-code-expanded'); }
                        }).observe(pre);
                    }
                }

                if (pre.textContent.trim().length === 0) return;

                // 2. מסגרת עבה 4px שיורשת את הפינות
                if (window.getComputedStyle(visualBox).position === 'static') visualBox.style.position = 'relative';
                let overlay = visualBox.querySelector('.gemini-ext-border-overlay');
                if (!overlay) {
                    overlay = document.createElement('div'); overlay.className = 'gemini-ext-border-overlay';
                    overlay.style.borderRadius = window.getComputedStyle(visualBox).borderRadius || '16px';
                    visualBox.appendChild(overlay);
                }

                const currentLength = pre.textContent.length; const prevLength = parseInt(pre.getAttribute('data-prev-length') || '0', 10); let stableTicks = parseInt(pre.getAttribute('data-stable-ticks') || '0', 10);
                if (currentLength !== prevLength) {
                    pre.setAttribute('data-prev-length', currentLength); pre.setAttribute('data-stable-ticks', '0');
                    overlay.classList.remove('gemini-ext-finished');
                    overlay.style.animation = 'geminiExtPulseRed 1.5s infinite';
                    if (pre.getAttribute('data-ai-hijacked') !== 'true') return;
                } else {
                    stableTicks++; pre.setAttribute('data-stable-ticks', stableTicks); if (stableTicks < 2 && pre.getAttribute('data-ai-hijacked') !== 'true') return;
                }

                pre.setAttribute('data-ai-hijacked', 'true');
                overlay.style.animation = 'none';
                overlay.classList.add('gemini-ext-finished'); // מחיל את הירוק העבה

                // 3. הוספת כפתור הורדה בודד
                if (actionContainer && copyBtn) {
                    if (!actionContainer.querySelector('.gemini-ext-single')) {
                        const singleBtn = document.createElement('button');
                        singleBtn.className = 'gemini-ext-btn gemini-ext-single';
                        singleBtn.appendChild(createDownloadIcon());

                        singleBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerDownload(extractCode(pre), getFilenameForBlock(pre));
                            singleBtn.replaceChildren(createCheckIconGreen());
                            setTimeout(() => singleBtn.replaceChildren(createDownloadIcon()), 2000);
                        });

                        // חיבור הטולטיפ האינטראקטיבי
                        singleBtn.addEventListener('mouseenter', () => showFilenameTooltip(singleBtn, pre));
                        singleBtn.addEventListener('mouseleave', scheduleHideFilenameTooltip);

                        const refNode = actionContainer.querySelector('.gemini-ext-toggle') || copyBtn;
                        actionContainer.insertBefore(singleBtn, refNode);
                    }
                }
            } catch (err) { }
        });

        // 4. כפתור הורדת כל קבצי ההודעה
        groups.forEach((blocksInGroup) => {
            try {
                if (blocksInGroup.length < 2) return;
                if (!blocksInGroup.every(b => b.getAttribute('data-ai-hijacked') === 'true')) return;

                blocksInGroup.forEach(pre => {
                    const visualBox = getVisualCodeBlock(pre);
                    const { actionContainer, copyBtn } = getActionContainer(visualBox);

                    if (!actionContainer || !copyBtn || actionContainer.querySelector('.gemini-ext-bulk')) return;

                    const bulkBtn = document.createElement('button'); bulkBtn.className = 'gemini-ext-btn gemini-ext-bulk'; bulkBtn.title = `הורדת ${blocksInGroup.length} קבצי ההודעה`; bulkBtn.appendChild(createLayersArrowDownIcon());
                    bulkBtn.addEventListener('click', async (e) => {
                        e.preventDefault(); e.stopPropagation();
                        blocksInGroup.forEach(b => { const ac = getActionContainer(getVisualCodeBlock(b)).actionContainer; if(ac) { const btn = ac.querySelector('.gemini-ext-bulk'); if(btn) btn.title = 'מוריד...'; }});
                        let downloadedCount = 0;
                        for (let b of blocksInGroup) { if (b.textContent.trim().length === 0) continue; triggerDownload(extractCode(b), getFilenameForBlock(b)); downloadedCount++; await new Promise(r => setTimeout(r, 400)); }
                        blocksInGroup.forEach(b => {
                            const ac = getActionContainer(getVisualCodeBlock(b)).actionContainer;
                            if(ac) { const btn = ac.querySelector('.gemini-ext-bulk'); if (btn) { btn.title = `ירדו ${downloadedCount} בהצלחה!`; btn.replaceChildren(createCheckIconGreen()); setTimeout(() => { btn.title = `הורדת ${blocksInGroup.length} קבצים`; btn.replaceChildren(createLayersArrowDownIcon()); }, 3000); } }
                        });
                    });

                    const refNode = actionContainer.querySelector('.gemini-ext-single') || actionContainer.querySelector('.gemini-ext-toggle') || copyBtn;
                    actionContainer.insertBefore(bulkBtn, refNode);
                });
            } catch (err) {}
        });
    }

    setInterval(processCodeBlocks, 1000);
})();
