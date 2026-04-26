const canvas = document.getElementById("canvas");
const sidebar = document.getElementById("sidebar");
const sidebarButtons = document.querySelectorAll(".sidebar-button");
const widgetDrawerBtn = document.getElementById("widget-drawer-btn");
const previewSiteBtn = document.getElementById("preview-site-btn");
const publishSiteBtn = document.getElementById("publish-site-btn");
publishSiteBtn.classList.add("hidden");

let isDragging = null;
let activePaintPopover = null;   // tracks which popover is currently open

function GetCanvasCoordinate(clientX, clientY) {
    const boundingClientRect = canvas.getBoundingClientRect();
    return {
        x: clientX - boundingClientRect.left,
        y: clientY - boundingClientRect.top,
    };
}

function CanvasClamp(x, y, element) {
    const maxX = canvas.clientWidth - element.offsetWidth;
    const maxY = canvas.clientHeight - element.offsetHeight;
    return {
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
    };
}

//Create Container
function PlaceElement(element, x, y) {
    element.style.left = x + "px";
    element.style.top = y + "px";
}

function CreateContainer(type) {
    const element = document.createElement("div");
    element.classList.add("container-instance", `container-type-${type}`, "hovering");

    //Build the in-widget controls (delete × + paint bucket)
    AttachWidgetControls(element);

    canvas.appendChild(element);
    return element;
}

// ──────────────────────────────────────────
// Widget controls: delete (×) and paint bucket
// ──────────────────────────────────────────
function AttachWidgetControls(element) {
    // Delete button (top-right of widget)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "widget-control widget-control--delete";
    deleteBtn.type = "button";
    deleteBtn.setAttribute("aria-label", "Delete widget");
    deleteBtn.textContent = "×";
    element.appendChild(deleteBtn);

    // Paint bucket button (bottom-left of widget)
    const paintBtn = document.createElement("button");
    paintBtn.className = "widget-control widget-control--paint";
    paintBtn.type = "button";
    paintBtn.setAttribute("aria-label", "Change colors");
    paintBtn.textContent = "🎨";
    element.appendChild(paintBtn);
}

// Delete a widget
function HandleDeleteClick(event) {
    const deleteBtn = event.target.closest(".widget-control--delete");
    if (!deleteBtn) return;

    const widget = deleteBtn.closest(".container-instance");
    if (!widget) return;

    //Close any open paint popover that belongs to this widget
    if (activePaintPopover && activePaintPopover.widget === widget) {
        ClosePaintPopover();
    }
    widget.remove();
}

// Open the paint popover for a widget
function OpenPaintPopover(widget) {
    ClosePaintPopover(); //only one open at a time

    const popover = document.createElement("div");
    popover.className = "paint-popover";

    //Read current colors from the element so the picker reflects them
    const computed = getComputedStyle(widget);
    const currentBg = RgbToHex(computed.backgroundColor) || "#2a2a2a";
    const currentBorder = RgbToHex(computed.borderTopColor) || "#ffffff";

    popover.innerHTML = `
        <label class="paint-row">
            <span class="paint-label">Fill</span>
            <input type="color" class="paint-input" data-target="background" value="${currentBg}">
        </label>
        <label class="paint-row">
            <span class="paint-label">Border</span>
            <input type="color" class="paint-input" data-target="border" value="${currentBorder}">
        </label>
    `;

    widget.appendChild(popover);
    activePaintPopover = { widget, popover };

    //Wire up the inputs
    popover.querySelectorAll(".paint-input").forEach((input) => {
        input.addEventListener("input", (e) => {
            const target = e.target.dataset.target;
            const value = e.target.value;
            if (target === "background") {
                widget.style.backgroundColor = value;
            } else if (target === "border") {
                widget.style.borderColor = value;
            }
        });
    });
}

function ClosePaintPopover() {
    if (!activePaintPopover) return;
    activePaintPopover.popover.remove();
    activePaintPopover = null;
}

// Convert "rgb(r, g, b)" or "rgba(r, g, b, a)" → "#rrggbb" (color inputs need hex)
function RgbToHex(rgb) {
    if (!rgb) return null;
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return null;
    const [r, g, b] = match.map(Number);
    return "#" + [r, g, b].map(n => n.toString(16).padStart(2, "0")).join("");
}

// Paint button click handler
function HandlePaintClick(event) {
    const paintBtn = event.target.closest(".widget-control--paint");
    if (!paintBtn) return;

    const widget = paintBtn.closest(".container-instance");
    if (!widget) return;

    //Toggle: clicking the same widget's paint button closes the popover
    if (activePaintPopover && activePaintPopover.widget === widget) {
        ClosePaintPopover();
    } else {
        OpenPaintPopover(widget);
    }
}

// ──────────────────────────────────────────
// Spawning widgets from the sidebar
// ──────────────────────────────────────────
sidebarButtons.forEach((button) => {
    button.addEventListener("mousedown", (event) => {
        //When user has already clicked a button and is dragging the element outside the canvas
        if (isDragging) return;

        //Don't allow spawning while in preview mode
        if (document.body.classList.contains("preview-mode")) return;

        const type = button.dataset.type;
        const element = CreateContainer(type);

        //Centre the new container under the cursor
        const offsetX = (element.offsetWidth / 2) + 100;
        const offsetY = (element.offsetHeight / 2) + 100;

        const { x, y } = GetCanvasCoordinate(event.clientX, event.clientY);
        const clamped = CanvasClamp(x - offsetX, y - offsetY, element);
        PlaceElement(element, clamped.x, clamped.y);

        isDragging = { element: element, offsetX, offsetY, phase: "spawning" };
    });
});

// ──────────────────────────────────────────
// Pickup / move / place existing widgets
// ──────────────────────────────────────────
canvas.addEventListener("mousedown", (event) => {
    if (isDragging) return;

    //Don't allow picking up containers in preview mode
    if (document.body.classList.contains("preview-mode")) return;

    //If the user clicked on a widget control, handle it as a click and DO NOT start a drag.
    if (event.target.closest(".widget-control")) {
        if (event.target.closest(".widget-control--delete")) {
            HandleDeleteClick(event);
        } else if (event.target.closest(".widget-control--paint")) {
            HandlePaintClick(event);
        }
        event.stopPropagation();
        return;
    }

    //Clicks inside the popover (color picker etc.) shouldn't drag the widget
    if (event.target.closest(".paint-popover")) {
        return;
    }

    const target = event.target.closest(".container-instance");
    if (!target || target.classList.contains("hovering")) return;

    //Close any open paint popover when starting a drag on a different widget
    if (activePaintPopover && activePaintPopover.widget !== target) {
        ClosePaintPopover();
    }

    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    target.classList.add("dragging");

    isDragging = { element: target, offsetX, offsetY, phase: "moving" };
});

//Move Container
document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const { element: element, offsetX, offsetY } = isDragging;
    const { x, y } = GetCanvasCoordinate(event.clientX, event.clientY);
    const clamped = CanvasClamp(x - offsetX, y - offsetY, element);
    PlaceElement(element, clamped.x, clamped.y);
});

//Place Container
document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    const { element: element, phase } = isDragging;

    if (phase === "spawning") {
        element.classList.remove("hovering");
    }
    element.classList.remove("dragging");
    isDragging = null;
});

// Close paint popover when clicking anywhere outside it
document.addEventListener("mousedown", (event) => {
    if (!activePaintPopover) return;
    if (event.target.closest(".paint-popover")) return;
    if (event.target.closest(".widget-control--paint")) return;
    ClosePaintPopover();
});

// ──────────────────────────────────────────
// Widget Drawer toggle (opens/closes the right sidebar)
// ──────────────────────────────────────────
widgetDrawerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("closed");
    widgetDrawerBtn.classList.toggle("active");
});

// ──────────────────────────────────────────
// Preview Site toggle (locks the canvas so containers can't be moved)
// ──────────────────────────────────────────
previewSiteBtn.addEventListener("click", () => {
    document.body.classList.toggle("preview-mode");
    previewSiteBtn.classList.toggle("active");

    //Close the widget drawer & any open paint popover when entering preview mode
    if (document.body.classList.contains("preview-mode")) {
        sidebar.classList.add("closed");
        widgetDrawerBtn.classList.remove("active");
        widgetDrawerBtn.classList.add("hidden");
        publishSiteBtn.classList.remove("hidden");
        ClosePaintPopover();
    }else {
        widgetDrawerBtn.classList.remove("hidden"); // ← show it again
        publishSiteBtn.classList.add("hidden");
    }
});

publishSiteBtn.addEventListener("click", () => {
    if (document.body.classList.contains("preview-mode")) {
        // Lock the site permanently
        document.body.classList.add("published");

        // Build the message widget
        const message = document.createElement("div");
        message.classList.add("container-instance", "published-message");
        message.style.backgroundColor = "#f5f5f0";
        message.style.color = "#2a2a2a";
        message.style.position = "absolute";
        message.style.top = "50%";
        message.style.left = "50%";
        message.style.transform = "translate(-50%, -50%)";
        message.style.display = "flex";
        message.style.flexDirection = "column";
        message.style.alignItems = "center";
        message.style.justifyContent = "center";
        message.style.gap = "16px";
        message.style.padding = "32px 48px";
        message.style.pointerEvents = "auto";
        message.style.cursor = "default";

        // The text
        const text = document.createElement("span");
        text.textContent = "Site Published!";
        text.style.fontSize = "20px";
        text.style.fontWeight = "600";
        message.appendChild(text);

        // The home button — anchor tag, just like the Menu link
        const homeLink = document.createElement("a");
        homeLink.href = "index.html";
        homeLink.textContent = "Go Home";
        homeLink.classList.add("action-button");
        homeLink.style.color = "#2a2a2a";
        homeLink.style.borderColor = "#2a2a2a";
        homeLink.style.textDecoration = "none";
        message.appendChild(homeLink);

        canvas.appendChild(message);
    }
});


// ── Premade widgets on page load ──

if (canvas.dataset.premade === "true") {
    const premadeWidgets = [
        { type: 0, x: 530,  y: 180, backgroundColor: "#71aa5f" , borderColor: "#bfbfbf" },
        { type: 1, x: 800, y: 120,  backgroundColor: "#e89a99" , borderColor: "#bdbdbd"},
        { type: 2, x: 800,  y: 340, backgroundColor: "#a3b9e0" , borderColor: "#c1c1c1" },
        { type: 5, x: 460, y: 340, backgroundColor: "#dec862" , borderColor: "#b8b8b8" },
    ];

    for (let i = 0; i < premadeWidgets.length; i++) {
        const preset = premadeWidgets[i];
        const widget = CreateContainer(preset.type);
        widget.classList.remove("hovering");
        PlaceElement(widget, preset.x, preset.y);
        widget.style.backgroundColor = preset.backgroundColor || "#2a2a2a";
        widget.style.borderColor = preset.borderColor || "#ffffff";
    }
}