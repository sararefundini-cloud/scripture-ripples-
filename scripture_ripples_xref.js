/**
 * Scripture Ripples - Auto-Inject Cross-References
 */
const simpleCrossReferences = {
    "Genesis 1": [
        { "ref": "John 1:1", "text": "In the beginning, Jesus was already there with God!" }
    ],
    "Genesis 2": [
        { "ref": "Hebrews 4:4", "text": "God rested on the seventh day and looked at His wonderful creation." }
    ],
    "Genesis 3": [
        { "ref": "Romans 16:20", "text": "God promised to rescue us and make everything right again!" }
    ]
};

// Add styling automatically
const styleTag = document.createElement('style');
styleTag.innerHTML = `
    .kid-xref-btn {
        background-color: #e0f2fe;
        color: #0369a1;
        border: 2px solid #bae6fd;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 6px;
        margin-bottom: 6px;
    }
    .kid-xref-box {
        background-color: #f0fdf4;
        border: 2px dashed #bbf7d0;
        border-radius: 10px;
        padding: 10px;
        margin-top: 6px;
        margin-bottom: 10px;
        font-size: 13px;
        color: #166534;
    }
`;
document.head.appendChild(styleTag);

// Automatically scan the page and add buttons to chapters
function injectCrossReferences() {
    const chapterDivs = document.querySelectorAll('.chapter-card, div, h3, span');
    
    chapterDivs.forEach(el => {
        for (const [chapterName, refs] of Object.entries(simpleCrossReferences)) {
            if (el.textContent.includes(chapterName + " · KJV") && !el.dataset.hasXref) {
                el.dataset.hasXref = "true";
                
                const safeId = chapterName.replace(/\s+/g, '-');
                const container = document.createElement('div');
                container.innerHTML = `
                    <button class="kid-xref-btn" onclick="document.getElementById('kid-xref-${safeId}').style.display = document.getElementById('kid-xref-${safeId}').style.display === 'none' ? 'block' : 'none'">
                        ✨ See Connected Bible Verses (${refs.length})
                    </button>
                    <div id="kid-xref-${safeId}" class="kid-xref-box" style="display: none;">
                        <strong>📖 Bible Connection:</strong>
                        <ul style="margin: 4px 0 0 16px; padding: 0;">
                            ${refs.map(item => `<li><strong>${item.ref}</strong>: ${item.text}</li>`).join('')}
                        </ul>
                    </div>
                `;
                el.appendChild(container);
            }
        }
    });
}

// Run scanner every second to catch when modals open
setInterval(injectCrossReferences, 1000);
