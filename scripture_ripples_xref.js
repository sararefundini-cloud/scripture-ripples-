/**
 * Scripture Ripples - Simple Cross-Reference Feature for Kids
 * Drop this single file into your GitHub repository!
 */

// 1. Cross-reference data made super simple and kid-friendly
const simpleCrossReferences = {
    "Genesis 1": [
        {
            "ref": "John 1:1",
            "text": "In the beginning, Jesus was already there with God!"
        }
    ],
    "Genesis 2": [
        {
            "ref": "Hebrews 4:4",
            "text": "God rested on the seventh day and looked at His wonderful creation."
        }
    ],
    "Genesis 3": [
        {
            "ref": "Romans 16:20",
            "text": "God promised to rescue us and make everything right again!"
        }
    ]
};

// 2. Add simple styling to the page automatically
const styleTag = document.createElement('style');
styleTag.innerHTML = `
    .kid-xref-btn {
        background-color: #e0f2fe;
        color: #0369a1;
        border: 2px solid #bae6fd;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
        margin-bottom: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .kid-xref-btn:hover {
        background-color: #bae6fd;
    }
    .kid-xref-box {
        background-color: #f0fdf4;
        border: 2px dashed #bbf7d0;
        border-radius: 12px;
        padding: 12px;
        margin-top: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        color: #166534;
    }
    .kid-xref-box h4 {
        margin: 0 0 6px 0;
        color: #15803d;
        font-size: 14px;
    }
`;
document.head.appendChild(styleTag);

// 3. Helper function to create the button and popup for chapters
function renderChapterWithXref(chapterName) {
    const refs = simpleCrossReferences[chapterName] || [];
    const safeId = chapterName.replace(/\s+/g, '-');

    if (refs.length === 0) {
        return `<div><strong>${chapterName} · KJV</strong></div>`;
    }

    return `
        <div class="chapter-card" style="margin-bottom: 15px;">
            <div style="font-size: 16px; font-weight: bold; color: #1e293b;">${chapterName} · KJV</div>
            
            <!-- Fun Button for Kids -->
            <button class="kid-xref-btn" onclick="toggleKidXref('${safeId}')">
                ✨ See Connected Bible Verses (${refs.length})
            </button>

            <!-- Friendly Popup Box -->
            <div id="kid-xref-${safeId}" class="kid-xref-box" style="display: none;">
                <h4>📖 Bible Connection:</h4>
                <ul style="margin: 0; padding-left: 18px;">
                    ${refs.map(item => `<li><strong>${item.ref}</strong>: ${item.text}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// 4. Toggle function to open/close the box easily
function toggleKidXref(safeId) {
    const box = document.getElementById(`kid-xref-${safeId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
    }
}

console.log("Scripture Ripples kid-friendly cross-references loaded!");
