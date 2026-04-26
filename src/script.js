

const canvas = document.getElementById("canvas");
const sidebarButtons = document.querySelectorAll(".sidebar-button");

let isDragging = null;

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
    canvas.appendChild(element);
    return element;
}

sidebarButtons.forEach((button) => {
    button.addEventListener("mousedown", (event) => {
        //When user has already clicked a button and is dragging the element outside the canvas
        if (isDragging) return;

        const type = button.dataset.type;
        const element = CreateContainer(type);

        //Centre the new container under the cursor
        const offsetX = element.offsetWidth / 2;
        const offsetY = element.offsetHeight / 2;

        const { x, y } = GetCanvasCoordinate(event.clientX, event.clientY);
        const clamped = CanvasClamp(x - offsetX, y - offsetY, element);
        PlaceElement(element, clamped.x, clamped.y);

        isDragging = { element: element, offsetX, offsetY, phase: "spawning" };
    });
});

//Pickup Placed Container
canvas.addEventListener("mousedown", (event) => {
    if (isDragging) return;

    const target = event.target.closest(".container-instance");
    if (!target || target.classList.contains("hovering")) return;

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
