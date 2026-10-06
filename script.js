/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://tvnpwthcdqqabxpvodfe.supabase.co";

/*
 * IMPORTANT:
 * Replace this with your CURRENT working Supabase Publishable
 * / anon key.
 *
 * Do NOT use an old key containing an accidental space.
 */
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnB3dGhjZHFxYWJ4cHZvZGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDEzOTEsImV4cCI6MjEwNjQxNzM5MX0.RoKsPXxUgvmH8rzEK7SKSAos8DQD5lMoz8U_hc57Tdc";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );



/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById("canvas");

const clearCanvasBtn =
    document.getElementById("clearCanvasBtn");

const makeAnotherCountyBtn =
    document.getElementById("makeAnotherCountyBtn");

const uploadCategory =
    document.getElementById("uploadCategory");

const cameraInput =
    document.getElementById("cameraInput");

const albumInput =
    document.getElementById("albumInput");

const takePhotoBtn =
    document.getElementById("takePhotoBtn");

const fromAlbumBtn =
    document.getElementById("fromAlbumBtn");



/* =========================================================
   CATEGORY CONTAINERS
========================================================= */

const categoryContainers = {
    people: document.getElementById("peopleMaterials"),
    objects: document.getElementById("objectsMaterials"),
    buildings: document.getElementById("buildingsMaterials")
};



/* =========================================================
   STATIC MATERIAL STATE
========================================================= */

const STATIC_STATE_KEY =
    "county-literature-static-materials";


let staticMaterialState =
    loadStaticMaterialState();


function loadStaticMaterialState() {

    try {

        const saved =
            localStorage.getItem(STATIC_STATE_KEY);

        if (!saved) {
            return {};
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Failed to load static material state:",
            error
        );

        return {};
    }
}


function saveStaticMaterialState() {

    try {

        localStorage.setItem(
            STATIC_STATE_KEY,
            JSON.stringify(staticMaterialState)
        );

    } catch (error) {

        console.error(
            "Failed to save static material state:",
            error
        );
    }
}



/* =========================================================
   INITIALIZE STATIC MATERIALS
========================================================= */

function applyStaticMaterialState() {

    document
        .querySelectorAll(".static-material")
        .forEach(card => {

            const id =
                card.dataset.staticId;

            const saved =
                staticMaterialState[id];

            if (!saved) {
                return;
            }


            if (saved.deleted) {

                card.remove();

                return;
            }


            if (saved.category) {

                moveCardToCategoryContainer(
                    card,
                    saved.category
                );

                const select =
                    card.querySelector(
                        ".material-category-select"
                    );

                if (select) {
                    select.value =
                        saved.category;
                }
            }
        });
}


function bindStaticMaterials() {

    document
        .querySelectorAll(".static-material")
        .forEach(card => {

            const image =
                card.querySelector("img");

            const select =
                card.querySelector(
                    ".material-category-select"
                );

            const deleteBtn =
                card.querySelector(
                    ".material-delete"
                );


            /* Add to Canvas */

            if (image) {

                image.addEventListener(
                    "click",
                    () => {

                        addImageToCanvas(
                            image.src,
                            image.alt
                        );

                    }
                );
            }


            /* Change category */

            if (select) {

                select.addEventListener(
                    "change",
                    event => {

                        moveStaticMaterial(
                            card,
                            event.target.value
                        );

                    }
                );
            }


            /* Delete */

            if (deleteBtn) {

                deleteBtn.addEventListener(
                    "click",
                    () => {

                        deleteStaticMaterial(
                            card
                        );

                    }
                );
            }

        });
}


function moveStaticMaterial(
    card,
    category
) {

    const id =
        card.dataset.staticId;


    staticMaterialState[id] = {
        category: category,
        deleted: false
    };


    saveStaticMaterialState();


    moveCardToCategoryContainer(
        card,
        category
    );
}


function moveCardToCategoryContainer(
    card,
    category
) {

    const container =
        categoryContainers[category];

    if (!container) {
        return;
    }

    container.appendChild(card);
}


function deleteStaticMaterial(card) {

    const id =
        card.dataset.staticId;


    staticMaterialState[id] = {
        category:
            card.closest(".material-category")
                ?.dataset.category || "people",

        deleted: true
    };


    saveStaticMaterialState();


    card.remove();
}



/* =========================================================
   SUPABASE AUTH
========================================================= */

async function ensureAnonymousAuth() {

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();


        if (
            sessionData &&
            sessionData.session
        ) {
            return sessionData.session;
        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInAnonymously();


        if (error) {

            console.error(
                "Anonymous auth failed:",
                error
            );

            return null;
        }


        return data.session;

    } catch (error) {

        console.error(
            "Auth error:",
            error
        );

        return null;
    }
}



/* =========================================================
   LOAD MATERIALS
========================================================= */

async function loadMaterials() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("materials")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Load materials failed:",
                error
            );

            return;
        }


        /*
         * Remove only previously loaded dynamic materials.
         * Static materials are NOT touched.
         */

        document
            .querySelectorAll(".user-material")
            .forEach(card => {
                card.remove();
            });


        if (!data) {
            return;
        }


        data.forEach(material => {

            createUserMaterial(
                material
            );

        });

    } catch (error) {

        console.error(
            "Sync materials failed:",
            error
        );
    }
}



/* =========================================================
   CREATE USER MATERIAL
========================================================= */

function createUserMaterial(material) {

    const category =
        material.category || "people";


    const container =
        categoryContainers[category];

    if (!container) {
        return;
    }


    const card =
        document.createElement("div");

    card.className =
        "material-card user-material";


    card.dataset.materialId =
        material.id;


    card.dataset.storagePath =
        material.storage_path || "";


    const image =
        document.createElement("img");

    image.crossOrigin = "anonymous";
    image.src =
        material.image_url;

    image.alt =
        material.name || "Uploaded material";

    image.draggable =
        false;


    image.addEventListener(
        "click",
        () => {

            addImageToCanvas(
                image.src,
                image.alt
            );

        }
    );


    const menu =
        createMaterialMenu(
            material
        );


    card.appendChild(image);
    card.appendChild(menu);

    container.appendChild(card);
}



/* =========================================================
   MATERIAL MENU
========================================================= */

function createMaterialMenu(material) {

    const menu =
        document.createElement("div");

    menu.className =
        "material-menu";


    /* Category select */

    const select =
        document.createElement("select");

    select.className =
        "material-category-select";


    const categories = [
        ["people", "PEOPLE"],
        ["objects", "OBJECTS"],
        ["buildings", "BUILDINGS"]
    ];


    categories.forEach(
        ([value, label]) => {

            const option =
                document.createElement("option");

            option.value =
                value;

            option.textContent =
                label;

            if (
                value ===
                (material.category || "people")
            ) {

                option.selected =
                    true;
            }

            select.appendChild(
                option
            );
        }
    );


    select.addEventListener(
        "change",
        event => {

            moveMaterialToCategory(
                material.id,
                event.target.value
            );

        }
    );


    /* Delete button */

    const deleteBtn =
        document.createElement("button");

    deleteBtn.type =
        "button";

    deleteBtn.className =
        "material-delete";

    deleteBtn.textContent =
        "DELETE";


    deleteBtn.addEventListener(
        "click",
        () => {

            deleteUserMaterial(
                material
            );

        }
    );


    menu.appendChild(select);
    menu.appendChild(deleteBtn);


    return menu;
}



/* =========================================================
   MOVE MATERIAL CATEGORY
========================================================= */

async function moveMaterialToCategory(
    materialId,
    category
) {

    try {

        const {
            error
        } =
            await supabaseClient
                .from("materials")
                .update({
                    category: category
                })
                .eq(
                    "id",
                    materialId
                );


        if (error) {

            console.error(
                "Category update failed:",
                error
            );

            return;
        }


        await loadMaterials();

    } catch (error) {

        console.error(
            "Category update error:",
            error
        );
    }
}



/* =========================================================
   DELETE USER MATERIAL
========================================================= */

async function deleteUserMaterial(
    material
) {

    const confirmed =
        window.confirm(
            "Delete this material?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * Delete database record first.
         */

        const {
            error: dbError
        } =
            await supabaseClient
                .from("materials")
                .delete()
                .eq(
                    "id",
                    material.id
                );


        if (dbError) {

            console.error(
                "Database delete failed:",
                dbError
            );

            return;
        }


        /*
         * Delete storage file if path exists.
         */

        if (material.storage_path) {

            const {
                error: storageError
            } =
                await supabaseClient
                    .storage
                    .from("materials")
                    .remove([
                        material.storage_path
                    ]);


            if (storageError) {

                console.warn(
                    "Storage delete failed:",
                    storageError
                );
            }
        }


        await loadMaterials();

    } catch (error) {

        console.error(
            "Delete material error:",
            error
        );
    }
}



/* =========================================================
   UPLOAD BUTTONS
========================================================= */

function bindUploadButtons() {

    takePhotoBtn.addEventListener(
        "click",
        () => {

            cameraInput.click();

        }
    );


    fromAlbumBtn.addEventListener(
        "click",
        () => {

            albumInput.click();

        }
    );


    cameraInput.addEventListener(
        "change",
        event => {

            handleUpload(
                event.target.files
            );

            event.target.value =
                "";

        }
    );


    albumInput.addEventListener(
        "change",
        event => {

            handleUpload(
                event.target.files
            );

            event.target.value =
                "";

        }
    );
}



/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(file) {

    const parts =
        file.name.split(".");


    if (parts.length < 2) {
        return "jpg";
    }


    return parts
        .pop()
        .toLowerCase();
}



/* =========================================================
   UPLOAD
========================================================= */

async function handleUpload(
    files
) {

    if (
        !files ||
        !files.length
    ) {
        return;
    }


    const file =
        files[0];


    const category =
        uploadCategory.value;


    try {

        const session =
            await ensureAnonymousAuth();


        if (!session) {

            alert(
                "Authentication failed."
            );

            return;
        }


        const userId =
            session.user.id;


        const extension =
            getFileExtension(file);


        const fileName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${extension}`;


        const storagePath =
            `${userId}/${fileName}`;


        /*
         * Upload image
         */

        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("materials")
                .upload(
                    storagePath,
                    file,
                    {
                        upsert: false,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {

            console.error(
                "Storage upload failed:",
                uploadError
            );

            alert(
                "Upload failed. Please check Supabase Storage permissions."
            );

            return;
        }


        /*
         * Public URL
         */

        const {
            data: publicUrlData
        } =
            supabaseClient
                .storage
                .from("materials")
                .getPublicUrl(
                    storagePath
                );


        const imageUrl =
            publicUrlData.publicUrl;


        /*
         * Insert database record
         */

        const {
            error: insertError
        } =
            await supabaseClient
                .from("materials")
                .insert({

                    name:
                        file.name,

                    image_url:
                        imageUrl,

                    storage_path:
                        storagePath,

                    category:
                        category,

                    user_id:
                        userId

                });


        if (insertError) {

            console.error(
                "Database insert failed:",
                insertError
            );

            /*
             * If database insertion fails,
             * remove the uploaded file.
             */

            await supabaseClient
                .storage
                .from("materials")
                .remove([
                    storagePath
                ]);

            alert(
                "Database insert failed. Please check Supabase permissions."
            );

            return;
        }


        await loadMaterials();

    } catch (error) {

        console.error(
            "Upload error:",
            error
        );

        alert(
            "Upload failed."
        );
    }
}



/* =========================================================
   CANVAS STATE
========================================================= */

let selectedCanvasItem =
    null;


/*
 * Start with a reasonably high z-index.
 * New elements will always appear on top.
 */
let highestZIndex = 1;



/* =========================================================
   ADD IMAGE TO CANVAS
========================================================= */

function addImageToCanvas(
    imageSrc,
    imageAlt = "Material"
) {

    const item =
        document.createElement("div");

    item.className =
        "canvas-item";


    /*
     * Give every new item a higher z-index.
     */

    highestZIndex += 1;

    item.style.zIndex =
        highestZIndex;


    item.dataset.rotation =
        "0";


    item.dataset.scale =
        "1";


    const image =
        document.createElement("img");

    image.crossOrigin = "anonymous";
    image.src =
        imageSrc;

    image.alt =
        imageAlt;

    image.draggable =
        false;


    /*
     * Controls
     */

    const deleteBtn =
        createCanvasControl(
            "canvas-delete",
            "×",
            "Delete"
        );


    const frontBtn =
        createCanvasControl(
            "canvas-front",
            "↑↑",
            "Bring to front"
        );


    const forwardBtn =
        createCanvasControl(
            "canvas-forward",
            "↑",
            "Bring forward"
        );


    const backwardBtn =
        createCanvasControl(
            "canvas-backward",
            "↓",
            "Send backward"
        );


    const backBtn =
        createCanvasControl(
            "canvas-back",
            "↓↓",
            "Send to back"
        );


    const rotateBtn =
        createCanvasControl(
            "canvas-rotate",
            "↻",
            "Rotate"
        );


    const resizeBtn =
        createCanvasControl(
            "canvas-resize",
            "↘",
            "Resize"
        );


    item.appendChild(image);

    item.appendChild(
        deleteBtn
    );

    item.appendChild(
        frontBtn
    );

    item.appendChild(
        forwardBtn
    );

    item.appendChild(
        backwardBtn
    );

    item.appendChild(
        backBtn
    );

    item.appendChild(
        rotateBtn
    );

    item.appendChild(
        resizeBtn
    );


    canvas.appendChild(item);


    /*
     * Place the element near the center
     * of the canvas.
     */

    const canvasRect =
        canvas.getBoundingClientRect();


    const initialLeft =
        Math.max(
            20,
            canvasRect.width / 2 - 80
        );


    const initialTop =
        Math.max(
            20,
            canvasRect.height / 2 - 80
        );


    item.style.left =
        `${initialLeft}px`;

    item.style.top =
        `${initialTop}px`;


    /*
     * Bind controls
     */

    bindCanvasControls(
        item,
        {
            deleteBtn,
            frontBtn,
            forwardBtn,
            backwardBtn,
            backBtn,
            rotateBtn,
            resizeBtn
        }
    );


    /*
     * Dragging
     */

    enableCanvasDragging(
        item
    );


    /*
     * Select when created
     */

    selectCanvasItem(
        item
    );
}



/* =========================================================
   CREATE CANVAS CONTROL
========================================================= */

function createCanvasControl(
    className,
    text,
    title
) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        `canvas-control ${className}`;

    button.textContent =
        text;

    button.title =
        title;

    /*
     * Prevent button pointer events
     * from being interpreted as dragging.
     */

    button.addEventListener(
        "pointerdown",
        event => {

            event.stopPropagation();

        }
    );


    return button;
}



/* =========================================================
   BIND CANVAS CONTROLS
========================================================= */

function bindCanvasControls(
    item,
    controls
) {

    /*
     * Delete
     */

    controls.deleteBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            removeCanvasItem(
                item
            );

        }
    );


    /*
     * Bring forward one level
     */

    controls.forwardBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            bringForward(
                item
            );

        }
    );


    /*
     * Send backward one level
     */

    controls.backwardBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sendBackward(
                item
            );

        }
    );


    /*
     * Bring to front
     */

    controls.frontBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            bringToFront(
                item
            );

        }
    );


    /*
     * Send to back
     */

    controls.backBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sendToBack(
                item
            );

        }
    );


    /*
     * Rotation
     */

    controls.rotateBtn.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();
            event.stopPropagation();

            startRotation(
                event,
                item
            );

        }
    );


    /*
     * Resize
     */

    controls.resizeBtn.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();
            event.stopPropagation();

            startResize(
                event,
                item
            );

        }
    );
}



/* =========================================================
   SELECT CANVAS ITEM
========================================================= */

function selectCanvasItem(
    item
) {

    document
        .querySelectorAll(
            ".canvas-item.selected"
        )
        .forEach(
            other => {

                other.classList.remove(
                    "selected"
                );

            }
        );


    item.classList.add(
        "selected"
    );


    selectedCanvasItem =
        item;
}



/* =========================================================
   DESELECT ALL
========================================================= */

function deselectAllCanvasItems() {

    document
        .querySelectorAll(
            ".canvas-item.selected"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "selected"
                );

            }
        );


    selectedCanvasItem =
        null;
}



/* =========================================================
   REMOVE CANVAS ITEM
========================================================= */

function removeCanvasItem(
    item
) {

    if (!item) {
        return;
    }


    if (
        selectedCanvasItem ===
        item
    ) {

        selectedCanvasItem =
            null;
    }


    item.remove();
}



/* =========================================================
   LAYER ORDER
========================================================= */

/*
 * Get all Canvas items sorted by z-index.
 */

function getCanvasItemsSorted() {

    return Array
        .from(
            canvas.querySelectorAll(
                ".canvas-item"
            )
        )
        .sort(
            (a, b) => {

                return (
                    parseInt(
                        a.style.zIndex || "0"
                    ) -
                    parseInt(
                        b.style.zIndex || "0"
                    )
                );

            }
        );
}



/*
 * Normalize all z-index values.
 *
 * This prevents z-index numbers from becoming
 * unnecessarily large after many operations.
 */

function normalizeZIndexes() {

    const items =
        getCanvasItemsSorted();


    items.forEach(
        (item, index) => {

            item.style.zIndex =
                index + 1;

        }
    );


    highestZIndex =
        items.length + 1;
}



/*
 * Bring one item forward by one layer.
 */

function bringForward(
    item
) {

    const items =
        getCanvasItemsSorted();


    const currentIndex =
        items.indexOf(item);


    if (currentIndex === -1) {
        return;
    }


    /*
     * Already at top.
     */

    if (
        currentIndex ===
        items.length - 1
    ) {
        return;
    }


    const nextItem =
        items[
            currentIndex + 1
        ];


    const currentZ =
        parseInt(
            item.style.zIndex || "0"
        );


    const nextZ =
        parseInt(
            nextItem.style.zIndex || "0"
        );


    item.style.zIndex =
        nextZ;

    nextItem.style.zIndex =
        currentZ;
}



/*
 * Send one item backward by one layer.
 */

function sendBackward(
    item
) {

    const items =
        getCanvasItemsSorted();


    const currentIndex =
        items.indexOf(item);


    if (currentIndex === -1) {
        return;
    }


    /*
     * Already at bottom.
     */

    if (
        currentIndex === 0
    ) {
        return;
    }


    const previousItem =
        items[
            currentIndex - 1
        ];


    const currentZ =
        parseInt(
            item.style.zIndex || "0"
        );


    const previousZ =
        parseInt(
            previousItem.style.zIndex || "0"
        );


    item.style.zIndex =
        previousZ;

    previousItem.style.zIndex =
        currentZ;
}



/*
 * Bring item to absolute top.
 */

function bringToFront(
    item
) {

    const items =
        getCanvasItemsSorted();


    if (
        items.length === 0
    ) {
        return;
    }


    const maxZ =
        Math.max(
            ...items.map(
                currentItem =>
                    parseInt(
                        currentItem.style.zIndex || "0"
                    )
            )
        );


    item.style.zIndex =
        maxZ + 1;


    normalizeZIndexes();
}



/*
 * Send item to absolute bottom.
 */

function sendToBack(
    item
) {

    const items =
        getCanvasItemsSorted();


    if (
        items.length === 0
    ) {
        return;
    }


    const minZ =
        Math.min(
            ...items.map(
                currentItem =>
                    parseInt(
                        currentItem.style.zIndex || "0"
                    )
            )
        );


    item.style.zIndex =
        minZ - 1;


    normalizeZIndexes();
}



/* =========================================================
   DRAGGING
========================================================= */

function enableCanvasDragging(
    item
) {

    item.addEventListener(
        "pointerdown",
        event => {

            /*
             * Only primary pointer.
             */

            if (
                event.button !== 0 &&
                event.pointerType !== "touch"
            ) {
                return;
            }


            /*
             * Do not start dragging
             * from control buttons.
             */

            if (
                event.target.closest(
                    ".canvas-control"
                )
            ) {
                return;
            }


            event.preventDefault();


            selectCanvasItem(
                item
            );


            /*
             * Bring selected item visually
             * above its controls only.
             *
             * We do NOT automatically change
             * the user's layer order here.
             */


            const canvasRect =
                canvas.getBoundingClientRect();


            const itemRect =
                item.getBoundingClientRect();


            const offsetX =
                event.clientX -
                itemRect.left;


            const offsetY =
                event.clientY -
                itemRect.top;


            item.setPointerCapture(
                event.pointerId
            );


            function move(
                moveEvent
            ) {

                const x =
                    moveEvent.clientX -
                    canvasRect.left -
                    offsetX;


                const y =
                    moveEvent.clientY -
                    canvasRect.top -
                    offsetY;


                item.style.left =
                    `${x}px`;

                item.style.top =
                    `${y}px`;
            }


            function end(
                endEvent
            ) {

                try {

                    item.releasePointerCapture(
                        endEvent.pointerId
                    );

                } catch (error) {
                    /* Ignore */
                }


                item.removeEventListener(
                    "pointermove",
                    move
                );

                item.removeEventListener(
                    "pointerup",
                    end
                );

                item.removeEventListener(
                    "pointercancel",
                    end
                );
            }


            item.addEventListener(
                "pointermove",
                move
            );

            item.addEventListener(
                "pointerup",
                end
            );

            item.addEventListener(
                "pointercancel",
                end
            );

        }
    );
}
           



/* =========================================================
   ROTATION
========================================================= */

function startRotation(
    event,
    item
) {

    selectCanvasItem(
        item
    );


    const rect =
        item.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    const startAngle =
        Math.atan2(
            event.clientY - centerY,
            event.clientX - centerX
        );


    const currentRotation =
        parseFloat(
            item.dataset.rotation || "0"
        );


    item.setPointerCapture(
        event.pointerId
    );


    function move(
        moveEvent
    ) {

        const currentAngle =
            Math.atan2(
                moveEvent.clientY - centerY,
                moveEvent.clientX - centerX
            );


        const delta =
            (
                currentAngle -
                startAngle
            ) *
            (180 / Math.PI);


        const rotation =
            currentRotation +
            delta;


        item.dataset.rotation =
            rotation;


        updateCanvasTransform(
            item
        );
    }


    function end(
        endEvent
    ) {

        try {

            item.releasePointerCapture(
                endEvent.pointerId
            );

        } catch (error) {
            /* Ignore */
        }


        item.removeEventListener(
            "pointermove",
            move
        );

        item.removeEventListener(
            "pointerup",
            end
        );

        item.removeEventListener(
            "pointercancel",
            end
        );
    }


    item.addEventListener(
        "pointermove",
        move
    );

    item.addEventListener(
        "pointerup",
        end
    );

    item.addEventListener(
        "pointercancel",
        end
    );
}



/* =========================================================
   RESIZE
========================================================= */

function startResize(
    event,
    item
) {

    selectCanvasItem(
        item
    );


    const rect =
        item.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;


    const centerY =
        rect.top +
        rect.height / 2;


    const startDistance =
        Math.hypot(
            event.clientX -
                centerX,

            event.clientY -
                centerY
        );


    const startWidth =
        item.getBoundingClientRect()
            .width;


    item.setPointerCapture(
        event.pointerId
    );


    function move(
        moveEvent
    ) {

        const currentDistance =
            Math.hypot(
                moveEvent.clientX -
                    centerX,

                moveEvent.clientY -
                    centerY
            );


        if (
            startDistance <= 0
        ) {
            return;
        }


        let newWidth =
            startWidth *
            (
                currentDistance /
                startDistance
            );


        /*
         * Minimum and maximum size
         */

        newWidth =
            Math.max(
                40,
                Math.min(
                    1000,
                    newWidth
                )
            );


        item.style.width =
            `${newWidth}px`;
    }


    function end(
        endEvent
    ) {

        try {

            item.releasePointerCapture(
                endEvent.pointerId
            );

        } catch (error) {
            /* Ignore */
        }


        item.removeEventListener(
            "pointermove",
            move
        );

        item.removeEventListener(
            "pointerup",
            end
        );

        item.removeEventListener(
            "pointercancel",
            end
        );
    }


    item.addEventListener(
        "pointermove",
        move
    );

    item.addEventListener(
        "pointerup",
        end
    );

    item.addEventListener(
        "pointercancel",
        end
    );
}



/* =========================================================
   UPDATE TRANSFORM
========================================================= */

function updateCanvasTransform(
    item
) {

    const rotation =
        parseFloat(
            item.dataset.rotation || "0"
        );


    const scale =
        parseFloat(
            item.dataset.scale || "1"
        );


    item.style.transform =
        `rotate(${rotation}deg) scale(${scale})`;
}



/* =========================================================
   CANVAS BACKGROUND CLICK
========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            event.target === canvas
        ) {

            deselectAllCanvasItems();

        }

    }
);



/* =========================================================
   KEYBOARD DELETE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Delete" ||
            event.key === "Backspace"
        ) {

            /*
             * Do not delete Canvas item when
             * user is typing/selecting text in
             * an input or select.
             */

            const activeElement =
                document.activeElement;


            if (
                activeElement &&
                (
                    activeElement.tagName ===
                    "INPUT" ||

                    activeElement.tagName ===
                    "TEXTAREA" ||

                    activeElement.tagName ===
                    "SELECT"
                )
            ) {
                return;
            }


            if (
                selectedCanvasItem
            ) {

                removeCanvasItem(
                    selectedCanvasItem
                );

            }
        }

    }
);



/* =========================================================
   MAKE ANOTHER COUNTY
   Automatically recombine materials from the shared library.
   This does NOT delete or modify Supabase materials.
========================================================= */

const AUTO_COUNTY_SETTINGS = {
    minimumItems: 6,
    maximumItems: 9,

    peopleMinimum: 1,
    peopleMaximum: 2,

    objectsMinimum: 2,
    objectsMaximum: 3,

    buildingsMinimum: 2,
    buildingsMaximum: 3,

    minimumWidth: 90,
    maximumWidth: 280,

    minimumRotation: -18,
    maximumRotation: 18,

    edgePadding: 24
};


/*
 * Get all currently visible material cards.
 *
 * The category is read from the nearest
 * .material-category[data-category] container.
 *
 * This works for both:
 * - the original static materials
 * - materials uploaded through Supabase
 */
function getAvailableCountyMaterials() {

    const cards =
        Array.from(
            document.querySelectorAll(
                ".material-card"
            )
        );

    return cards
        .map(card => {

            const image =
                card.querySelector("img");

            if (!image || !image.src) {
                return null;
            }

            const categoryContainer =
                card.closest(
                    ".material-category"
                );

            const category =
                categoryContainer?.dataset.category ||
                "people";

            return {
                src: image.src,
                alt: image.alt || "Material",
                category: category
            };

        })
        .filter(Boolean);
}


/*
 * Random number between min and max.
 */
function randomBetween(
    min,
    max
) {
    return (
        Math.random() *
            (max - min) +
        min
    );
}


/*
 * Random integer between min and max.
 */
function randomInteger(
    min,
    max
) {
    return Math.floor(
        Math.random() *
            (max - min + 1)
    ) + min;
}


/*
 * Shuffle an array without changing the
 * original array.
 */
function shuffleArray(
    array
) {

    const result =
        [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                    (i + 1)
            );


        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


/*
 * Randomly choose up to `count` unique materials.
 */
function chooseMaterials(
    materials,
    count
) {

    return shuffleArray(
        materials
    ).slice(
        0,
        Math.min(
            count,
            materials.length
        )
    );
}


/*
 * Make sure the generated county has
 * a reasonable mixture of:
 *
 * BUILDINGS = background / structural layer
 * OBJECTS   = middle layer
 * PEOPLE    = foreground / activity
 */

/*
 * Make sure the generated county has
 * a reasonable mixture of:
 *
 * BUILDINGS = background / structural layer
 * OBJECTS   = middle layer
 * PEOPLE    = foreground / activity
 */
function buildAutomaticCountySelection(
    materials
) {

    const people =
        materials.filter(
            material =>
                material.category ===
                "people"
        );

    const objects =
        materials.filter(
            material =>
                material.category ===
                "objects"
        );

    const buildings =
        materials.filter(
            material =>
                material.category ===
                "buildings"
        );

    let selected = [];

    /*
     * First create the structural mix.
     */
    selected.push(
        ...chooseMaterials(
            people,
            randomInteger(
                AUTO_COUNTY_SETTINGS.peopleMinimum,
                AUTO_COUNTY_SETTINGS.peopleMaximum
            )
        )
    );

    selected.push(
        ...chooseMaterials(
            objects,
            randomInteger(
                AUTO_COUNTY_SETTINGS.objectsMinimum,
                AUTO_COUNTY_SETTINGS.objectsMaximum
            )
        )
    );

    selected.push(
        ...chooseMaterials(
            buildings,
            randomInteger(
                AUTO_COUNTY_SETTINGS.buildingsMinimum,
                AUTO_COUNTY_SETTINGS.buildingsMaximum
            )
        )
    );

    /*
     * If there are not enough materials in one
     * category, fill the county from all materials.
     */
    if (
        selected.length <
        AUTO_COUNTY_SETTINGS.minimumItems
    ) {

        const alreadySelected =
            new Set(
                selected.map(
                    material =>
                        material.src
                )
            );

        const remaining =
            materials.filter(
                material =>
                    !alreadySelected.has(
                        material.src
                    )
            );

        selected.push(
            ...chooseMaterials(
                remaining,
                AUTO_COUNTY_SETTINGS.minimumItems -
                    selected.length
            )
        );
    }

    /*
     * Limit the total number of materials.
     */
    const targetCount =
        randomInteger(
            AUTO_COUNTY_SETTINGS.minimumItems,
            AUTO_COUNTY_SETTINGS.maximumItems
        );

    if (
        selected.length >
        targetCount
    ) {
        selected =
            shuffleArray(
                selected
            ).slice(
                0,
                targetCount
            );
    }

    /*
     * If there are still fewer materials than
     * the target, fill from unused materials.
     */
    if (
        selected.length <
        targetCount
    ) {

        const selectedSources =
            new Set(
                selected.map(
                    material =>
                        material.src
                )
            );

        const remaining =
            materials.filter(
                material =>
                    !selectedSources.has(
                        material.src
                    )
            );

        selected.push(
            ...chooseMaterials(
                remaining,
                targetCount -
                    selected.length
            )
        );
    }

    return selected;
}


/*
 * Apply automatic position, size, rotation,
 * and layer order.
 */

function placeAutomaticCountyItem(
    item,
    material,
    index,
    total
) {

    const canvasWidth =
        canvas.clientWidth;


    const canvasHeight =
        canvas.clientHeight;


    /*
     * Buildings tend to be larger and lower,
     * creating a loose "county scene".
     */

    let width;


    if (
        material.category ===
        "buildings"
    ) {

        width =
            randomBetween(
                180,
                AUTO_COUNTY_SETTINGS.maximumWidth
            );

    } else if (
        material.category ===
        "people"
    ) {

        width =
            randomBetween(
                100,
                190
            );

    } else {

        width =
            randomBetween(
                AUTO_COUNTY_SETTINGS.minimumWidth,
                210
            );
    }


    /*
     * Keep the item inside a reasonable
     * portion of the canvas.
     */

    width =
        Math.min(
            width,
            Math.max(
                60,
                canvasWidth -
                    AUTO_COUNTY_SETTINGS.edgePadding * 2
            )
        );


    item.style.width =
        `${width}px`;


    /*
     * Force a browser layout so that the
     * actual item dimensions are available.
     */

    const itemWidth =
        item.offsetWidth || width;


    const itemHeight =
        item.offsetHeight ||
        width;


    const maxLeft =
        Math.max(
            AUTO_COUNTY_SETTINGS.edgePadding,
            canvasWidth -
                itemWidth -
                AUTO_COUNTY_SETTINGS.edgePadding
        );


    const maxTop =
        Math.max(
            AUTO_COUNTY_SETTINGS.edgePadding,
            canvasHeight -
                itemHeight -
                AUTO_COUNTY_SETTINGS.edgePadding
        );


    let left;
    let top;


    if (
        material.category ===
        "buildings"
    ) {

        /*
         * Buildings stay mostly toward the
         * lower / background area.
         */

        left =
            randomBetween(
                AUTO_COUNTY_SETTINGS.edgePadding,
                maxLeft
            );


        top =
            randomBetween(
                Math.max(
                    AUTO_COUNTY_SETTINGS.edgePadding,
                    canvasHeight * 0.35
                ),
                maxTop
            );

    } else if (
        material.category ===
        "people"
    ) {

        /*
         * People are more likely to appear
         * in the middle of the scene.
         */

        left =
            randomBetween(
                canvasWidth * 0.15,
                Math.max(
                    canvasWidth * 0.15,
                    maxLeft
                )
            );


        top =
            randomBetween(
                canvasHeight * 0.20,
                Math.max(
                    canvasHeight * 0.20,
                    maxTop
                )
            );

    } else {

        /*
         * Objects can appear almost anywhere,
         * between buildings and people.
         */

        left =
            randomBetween(
                AUTO_COUNTY_SETTINGS.edgePadding,
                maxLeft
            );


        top =
            randomBetween(
                canvasHeight * 0.20,
                Math.max(
                    canvasHeight * 0.20,
                    maxTop
                )
            );
    }


    /*
     * Clamp values so that unusual image
     * dimensions do not push the item outside.
     */

    left =
        Math.max(
            AUTO_COUNTY_SETTINGS.edgePadding,
            Math.min(
                left,
                maxLeft
            )
        );


    top =
        Math.max(
            AUTO_COUNTY_SETTINGS.edgePadding,
            Math.min(
                top,
                maxTop
            )
        );


    item.style.left =
        `${left}px`;


    item.style.top =
        `${top}px`;


    /*
     * Small random rotation.
     */

    item.dataset.rotation =
        randomBetween(
            AUTO_COUNTY_SETTINGS.minimumRotation,
            AUTO_COUNTY_SETTINGS.maximumRotation
        );


    /*
     * Keep scale at 1 because the actual
     * width already controls the size.
     */

    item.dataset.scale =
        "1";


    updateCanvasTransform(
        item
    );


    /*
     * Layer order:
     * buildings behind,
     * objects in the middle,
     * people in front.
     *
     * The small random offset keeps the
     * result from becoming completely fixed.
     */

    let baseLayer;


    if (
        material.category ===
        "buildings"
    ) {

        baseLayer = 10;

    } else if (
        material.category ===
        "objects"
    ) {

        baseLayer = 100;

    } else {

        baseLayer = 200;
    }


    item.style.zIndex =
        baseLayer +
        index +
        randomInteger(
            0,
            20
        );
}
    


/*
 * Main function.
 *
 * MAKE ANOTHER COUNTY:
 *
 * 1. Read the current shared material library.
 * 2. Choose a new combination.
 * 3. Clear only the current canvas.
 * 4. Add the chosen materials.
 * 5. Randomly construct a new county.
 *
 * Supabase data is NOT changed.
 */
async function makeAnotherCounty() {

    if (!canvas) {
        return;
    }

    const materials =
        getAvailableCountyMaterials();

    if (!materials.length) {
        alert(
            "No materials are available yet."
        );
        return;
    }

    /*
     * Select a new combination.
     */
    const selectedMaterials =
        buildAutomaticCountySelection(
            materials
        );

    if (!selectedMaterials.length) {
        alert(
            "Not enough materials to make another county."
        );
        return;
    }

    /*
     * Remove only the items currently
     * displayed on the canvas.
     *
     * This does NOT remove material cards,
     * uploaded files, or Supabase records.
     */
    canvas
        .querySelectorAll(
            ".canvas-item"
        )
        .forEach(
            item => item.remove()
        );

    selectedCanvasItem =
        null;

    highestZIndex =
        1;

    /*
     * Shuffle once more so the visual order
     * changes every time the button is pressed.
     */
    const shuffledMaterials =
        shuffleArray(
            selectedMaterials
        );

    /*
     * Add each material using the existing
     * canvas system. This preserves all
     * existing controls:
     *
     * DELETE
     * BRING TO FRONT
     * BRING FORWARD
     * SEND BACKWARD
     * SEND TO BACK
     * ROTATE
     * RESIZE
     */
    shuffledMaterials.forEach(
        (material, index) => {

            addImageToCanvas(
                material.src,
                material.alt
            );

            const items =
                canvas.querySelectorAll(
                    ".canvas-item"
                );

            const item =
                items[
                    items.length - 1
                ];

            if (!item) {
                return;
            }

            placeAutomaticCountyItem(
                item,
                material,
                index,
                shuffledMaterials.length
            );
        }
    );

    /*
     * The automatic generator should present
     * the result as a finished county, not as
     * an actively selected editing object.
     */
    deselectAllCanvasItems();
}


/*
 * If the HTML already contains the button,
 * use it directly.
 *
 * If it does not, create it automatically
 * next to CLEAR.
 *
 * This makes this JavaScript compatible with
 * both the original index.html and the
 * modified MAKE ANOTHER COUNTY index.html.
 */
function setupMakeAnotherCountyButton() {

    if (!canvas || !clearCanvasBtn) {
        return;
    }

    let button =
        document.getElementById(
            "makeAnotherCountyBtn"
        );

    if (!button) {

        button =
            document.createElement(
                "button"
            );

        button.id =
            "makeAnotherCountyBtn";

        button.type =
            "button";

        button.textContent =
            "MAKE ANOTHER COUNTY";

        /*
         * Put the new button before CLEAR.
         */
        clearCanvasBtn.parentNode.insertBefore(
            button,
            clearCanvasBtn
        );
    }

    /*
     * Prevent duplicate event listeners
     * if this function is ever called again.
     */
    if (
        button.dataset.countyButtonBound ===
        "true"
    ) {
        return;
    }

    button.dataset.countyButtonBound =
        "true";

    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;

            const originalText =
                button.textContent;

            button.textContent =
                "MAKING COUNTY...";

            try {
                await makeAnotherCounty();

            } catch (error) {

                console.error(
                    "MAKE ANOTHER COUNTY failed:",
                    error
                );

                alert(
                    "Could not make another county."
                );

            } finally {

                button.disabled =
                    false;

                button.textContent =
                    originalText;
            }
        }
    );
}


/* =========================================================
   CLEAR CANVAS
========================================================= */

clearCanvasBtn.addEventListener(
    "click",
    () => {

        const confirmed =
            window.confirm(
                "Clear all elements from the canvas?"
            );

        if (!confirmed) {
            return;
        }

        document
            .querySelectorAll(
                ".canvas-item"
            )
            .forEach(
                item => {
                    item.remove();
                }
            );

        selectedCanvasItem =
            null;

        highestZIndex =
            1;
    }
);


/* =========================================================
   CLEAR CANVAS
========================================================= */

clearCanvasBtn.addEventListener(
    "click",
    () => {

        const confirmed =
            window.confirm(
                "Clear all elements from the canvas?"
            );


        if (!confirmed) {
            return;
        }


        document
            .querySelectorAll(
                ".canvas-item"
            )
            .forEach(
                item => {
                    item.remove();
                }
            );


        selectedCanvasItem =
            null;


        highestZIndex =
            1;
    }
);



/* =========================================================
   PERIODIC MATERIAL SYNC
========================================================= */

let syncInterval =
    null;


function startMaterialSync() {

    if (syncInterval) {
        clearInterval(
            syncInterval
        );
    }


    syncInterval =
        setInterval(
            () => {

                loadMaterials();

            },
            5000
        );
}


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadMaterials();

        }

    }
);



/* =========================================================
   EXPORT CANVAS
   Self-contained: creates the EXPORT button and loads
   html2canvas automatically. No index.html/CSS edit needed.
========================================================= */

(function setupCanvasExport() {

    if (!canvas || !clearCanvasBtn) {
        return;
    }

    /* Create a small action wrapper if it does not exist. */
    let actions =
        clearCanvasBtn.parentElement &&
        clearCanvasBtn.parentElement.classList.contains(
            "canvas-actions"
        )
            ? clearCanvasBtn.parentElement
            : null;

    if (!actions) {
        actions =
            document.createElement("div");

        actions.className =
            "canvas-actions";

        clearCanvasBtn.parentNode.insertBefore(
            actions,
            clearCanvasBtn
        );

        actions.appendChild(
            clearCanvasBtn
        );
    }

    let exportBtn =
        document.getElementById(
            "exportCanvasBtn"
        );

    if (!exportBtn) {

        exportBtn =
            document.createElement("button");

        exportBtn.id =
            "exportCanvasBtn";

        exportBtn.type =
            "button";

        exportBtn.textContent =
            "EXPORT";

        actions.appendChild(
            exportBtn
        );
    }

    /* Minimal styling so this works without editing style.css. */
    actions.style.display = "flex";
    actions.style.alignItems = "center";
    actions.style.gap = "6px";

    exportBtn.style.height = "30px";
    exportBtn.style.padding = "0 14px";
    exportBtn.style.border = "1px solid #111";
    exportBtn.style.background = "#111";
    exportBtn.style.color = "#f4f1ea";
    exportBtn.style.cursor = "pointer";
    exportBtn.style.fontSize = "10px";
    exportBtn.style.letterSpacing = "0.08em";

    exportBtn.addEventListener(
        "mouseenter",
        () => {
            exportBtn.style.background =
                "transparent";
            exportBtn.style.color =
                "#111";
        }
    );

    exportBtn.addEventListener(
        "mouseleave",
        () => {
            exportBtn.style.background =
                "#111";
            exportBtn.style.color =
                "#f4f1ea";
        }
    );

    function loadHtml2Canvas() {

        if (
            typeof window.html2canvas ===
            "function"
        ) {
            return Promise.resolve(
                window.html2canvas
            );
        }

        return new Promise(
            (resolve, reject) => {

                const existing =
                    document.querySelector(
                        'script[data-county-html2canvas="true"]'
                    );

                if (existing) {

                    existing.addEventListener(
                        "load",
                        () => {
                            if (
                                typeof window.html2canvas ===
                                "function"
                            ) {
                                resolve(
                                    window.html2canvas
                                );
                            } else {
                                reject(
                                    new Error(
                                        "html2canvas loaded but is unavailable."
                                    )
                                );
                            }
                        },
                        { once: true }
                    );

                    existing.addEventListener(
                        "error",
                        () => {
                            reject(
                                new Error(
                                    "Could not load html2canvas."
                                )
                            );
                        },
                        { once: true }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

                script.async = true;

                script.dataset.countyHtml2canvas =
                    "true";

                script.onload =
                    () => {

                        if (
                            typeof window.html2canvas ===
                            "function"
                        ) {
                            resolve(
                                window.html2canvas
                            );
                        } else {
                            reject(
                                new Error(
                                    "html2canvas is unavailable."
                                )
                            );
                        }
                    };

                script.onerror =
                    () => {
                        reject(
                            new Error(
                                "Could not load html2canvas."
                            )
                        );
                    };

                document.head.appendChild(
                    script
                );
            }
        );
    }

    exportBtn.addEventListener(
        "click",
        async () => {

            const originalText =
                exportBtn.textContent;

            exportBtn.disabled = true;
            exportBtn.textContent =
                "EXPORTING...";

            try {

                await loadHtml2Canvas();

                /*
                 * Remember current selection and inline background.
                 */
                const selectedItems =
                    Array.from(
                        document.querySelectorAll(
                            ".canvas-item.selected"
                        )
                    );

                const controls =
                    Array.from(
                        canvas.querySelectorAll(
                            ".canvas-control"
                        )
                    );

                const originalBackground =
                    canvas.style.background;

                /*
                 * Hide editing UI during capture.
                 */
                selectedItems.forEach(
                    item => {
                        item.classList.remove(
                            "selected"
                        );
                    }
                );

                controls.forEach(
                    control => {
                        control.style.visibility =
                            "hidden";
                    }
                );

                /*
                 * Export a clean canvas without the editor grid.
                 */
                canvas.style.background =
                    "#f4f1ea";

                await new Promise(
                    resolve =>
                        requestAnimationFrame(
                            () => requestAnimationFrame(
                                resolve
                            )
                        )
                );

                const exportedCanvas =
                    await window.html2canvas(
                        canvas,
                        {
                            backgroundColor:
                                "#f4f1ea",
                            useCORS: true,
                            allowTaint: false,
                            scale: 2,
                            logging: false
                        }
                    );

                /*
                 * Restore editor state.
                 */
                canvas.style.background =
                    originalBackground;

                controls.forEach(
                    control => {
                        control.style.visibility =
                            "";
                    }
                );

                selectedItems.forEach(
                    item => {
                        item.classList.add(
                            "selected"
                        );
                    }
                );

                const dataURL =
                    exportedCanvas.toDataURL(
                        "image/png"
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.download =
                    "county-literature.png";

                link.href =
                    dataURL;

                document.body.appendChild(
                    link
                );

                link.click();

                link.remove();

            } catch (error) {

                console.error(
                    "Canvas export failed:",
                    error
                );

                alert(
                    "Export failed. Please check your internet connection and try again."
                );

            } finally {

                /*
                 * Safety restore in case html2canvas throws.
                 */
                canvas.style.background = "";

                canvas
                    .querySelectorAll(
                        ".canvas-control"
                    )
                    .forEach(
                        control => {
                            control.style.visibility =
                                "";
                        }
                    );

                exportBtn.disabled =
                    false;

                exportBtn.textContent =
                    originalText;
            }
        }
    );

})();

/* =========================================================
   INITIALIZATION
========================================================= */

async function initialize() {

    /*
     * Static materials first.
     */

    applyStaticMaterialState();

    bindStaticMaterials();


    /*
     * MAKE ANOTHER COUNTY button.
     */
    setupMakeAnotherCountyButton();

    /*
     * Upload buttons.
     */

    bindUploadButtons();


    /*
     * Supabase anonymous session.
     */

    await ensureAnonymousAuth();


    /*
     * Load shared materials.
     */

    await loadMaterials();


    /*
     * Start automatic refresh.
     */

    startMaterialSync();
}


initialize();