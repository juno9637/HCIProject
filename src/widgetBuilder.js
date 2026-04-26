const titleInput        = document.getElementById("widget-title-input");
const descriptionBox    = document.getElementById("widget-description");
const previewShape      = document.getElementById("preview-shape");
const previewTitle      = document.getElementById("preview-title");
const previewDesc       = document.getElementById("preview-desc");

const shapeSelect       = document.getElementById("shape-select");
const addElementBtn     = document.getElementById("add-element-btn");
const elementsList      = document.getElementById("elements-list");

const editorTabs        = document.querySelectorAll(".editor-tab");
const editorViews       = document.querySelectorAll(".editor-view");

const codeTabs          = document.querySelectorAll(".code-tab");
const codeAreas         = document.querySelectorAll(".code-area");

const publishBtn        = document.getElementById("publish-btn");
const previewOnPageBtn  = document.getElementById("preview-on-page-btn");

let subElementCounter = 0;


// ──────────────────────────────────────────
// ALL OF THIS CODE HAS BEEN GENERATED WITH AI
// ITS FUCKING SLOP
// ──────────────────────────────────────────
titleInput.addEventListener("input", () => {
    previewTitle.textContent = titleInput.value;
});

descriptionBox.addEventListener("input", () => {
    previewDesc.textContent = descriptionBox.value;
});


// ──────────────────────────────────────────
// Shape selector — toggles a modifier class on the preview
// ──────────────────────────────────────────
shapeSelect.addEventListener("change", () => {
    if (shapeSelect.value === "circle") {
        previewShape.classList.add("preview-shape--circle");
    } else {
        previewShape.classList.remove("preview-shape--circle");
    }
});


// ──────────────────────────────────────────
// Adding / removing static sub-elements
// Each sub-element shows up as:
//   1. A small box inside the preview shape
//   2. A removable "pill" in the elements list under the editor
// ──────────────────────────────────────────
addElementBtn.addEventListener("click", () => {
    subElementCounter += 1;
    const id = `sub-${subElementCounter}`;

    // 1. The visual shape inside the preview
    const subEl = document.createElement("div");
    subEl.className = "sub-element";
    subEl.dataset.id = id;
    previewShape.appendChild(subEl);

    // 2. The pill in the editor's elements list
    const pill = document.createElement("span");
    pill.className = "element-pill";
    pill.dataset.id = id;
    pill.innerHTML = `
        Element ${subElementCounter}
        <button class="element-pill__remove" type="button" aria-label="Remove element">×</button>
    `;
    elementsList.appendChild(pill);

    // Remove button removes both the pill and the matching sub-element
    pill.querySelector(".element-pill__remove").addEventListener("click", () => {
        subEl.remove();
        pill.remove();
    });
});


// ──────────────────────────────────────────
// Top-level tab switching: Basic Editor ↔ Advanced Editor
// ──────────────────────────────────────────
editorTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const targetPanel = tab.dataset.panel;

        // Update tab visual state
        editorTabs.forEach((t) => {
            const isActive = t === tab;
            t.classList.toggle("editor-tab--active", isActive);
            t.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        // Show the matching view, hide the others
        editorViews.forEach((view) => {
            const matches = view.dataset.view === targetPanel;
            view.classList.toggle("editor-view--hidden", !matches);
        });
    });
});


// ──────────────────────────────────────────
// Code editor sub-tabs: HTML / CSS / JS
// Only one textarea is visible at a time
// ──────────────────────────────────────────
codeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const lang = tab.dataset.lang;

        // Update sub-tab visual state
        codeTabs.forEach((t) => {
            const isActive = t === tab;
            t.classList.toggle("code-tab--active", isActive);
            t.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        // Show the matching textarea
        codeAreas.forEach((area) => {
            area.classList.toggle("code-area--active", area.dataset.lang === lang);
        });
    });
});


// ──────────────────────────────────────────
// Preview on Page — placeholder for a real preview routine.
// For now we just toast a brief confirmation by flashing the preview canvas.
// ──────────────────────────────────────────
previewOnPageBtn.addEventListener("click", () => {
    const canvas = document.querySelector(".preview-canvas");
    if (!canvas) return;
    canvas.style.transition = "outline 0.2s ease";
    canvas.style.outline = "4px solid #ffed7b";
    setTimeout(() => { canvas.style.outline = ""; }, 600);
});


// ──────────────────────────────────────────
// Publish flow
// Mirrors the behavior used on template.html:
//   1. Add `published` class to the body so CSS locks every control
//   2. Show a centered "Site Published!" message with a "Go Home" link
// ──────────────────────────────────────────
publishBtn.addEventListener("click", () => {
    // Don't double-publish if already published
    if (document.body.classList.contains("published")) return;

    document.body.classList.add("published");

    const message = document.createElement("div");
    message.className = "published-message";

    const title = document.createElement("span");
    title.className = "published-message__title";
    title.textContent = "Widget Published To Community Library!";
    message.appendChild(title);

    const homeLink = document.createElement("a");
    homeLink.href = "communityWidgetPage.html";
    homeLink.textContent = "See Gallery";
    homeLink.className = "published-message__home";
    message.appendChild(homeLink);

    document.body.appendChild(message);
});