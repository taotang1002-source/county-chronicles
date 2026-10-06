/* =========================================================
   COUNTY LITERATURE
   FINAL SCRIPT
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://tvnpwthcdqqabxpvodfe.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_1xhO1Dg9VoHWq96dEiLs4A_B8Oqq_xI";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById(
        "canvas"
    );

const clearCanvasBtn =
    document.getElementById(
        "clearCanvasBtn"
    );

const makeAnotherCountyBtn =
    document.getElementById(
        "makeAnotherCountyBtn"
    );

const addDialogueBtn =
    document.getElementById(
        "addDialogueBtn"
    );

const uploadCategory =
    document.getElementById(
        "uploadCategory"
    );

const cameraInput =
    document.getElementById(
        "cameraInput"
    );

const albumInput =
    document.getElementById(
        "albumInput"
    );

const takePhotoBtn =
    document.getElementById(
        "takePhotoBtn"
    );

const fromAlbumBtn =
    document.getElementById(
        "fromAlbumBtn"
    );

const dialogueStylePanel =
    document.getElementById(
        "dialogueStylePanel"
    );

const dialogueTextColor =
    document.getElementById(
        "dialogueTextColor"
    );

const dialogueBorderColor =
    document.getElementById(
        "dialogueBorderColor"
    );


/* =========================================================
   CATEGORY CONTAINERS
========================================================= */

const categoryContainers = {

    people:
        document.getElementById(
            "peopleMaterials"
        ),

    objects:
        document.getElementById(
            "objectsMaterials"
        ),

    buildings:
        document.getElementById(
            "buildingsMaterials"
        )

};


/* =========================================================
   CANVAS STATE
========================================================= */

let selectedCanvasItem =
    null;

let highestZIndex =
    1;


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
            localStorage.getItem(
                STATIC_STATE_KEY
            );

        if (!saved) {

            return {};

        }

        return JSON.parse(
            saved
        );

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
            JSON.stringify(
                staticMaterialState
            )
        );

    } catch (error) {

        console.error(
            "Failed to save static material state:",
            error
        );

    }

}


/* =========================================================
   STATIC MATERIALS
========================================================= */

function applyStaticMaterialState() {

    document
        .querySelectorAll(
            ".static-material"
        )
        .forEach(
            card => {

                const id =
                    card.dataset.staticId;

                const saved =
                    staticMaterialState[id];

                if (!saved) {

                    return;

                }


                if (
                    saved.deleted
                ) {

                    card.remove();

                    return;

                }


                if (
                    saved.category
                ) {

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

            }
        );

}


function bindStaticMaterials() {

    document
        .querySelectorAll(
            ".static-material"
        )
        .forEach(
            card => {

                const image =
                    card.querySelector(
                        "img"
                    );

                const select =
                    card.querySelector(
                        ".material-category-select"
                    );

                const deleteBtn =
                    card.querySelector(
                        ".material-delete"
                    );


                if (image) {

                    image.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            const category =
                                card.closest(
                                    ".material-category"
                                )?.dataset.category ||
                                "people";


                            addImageToCanvas(
                                image.src,
                                image.alt,
                                {
                                    category:
                                        category
                                }
                            );

                        }
                    );

                }


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


                if (deleteBtn) {

                    deleteBtn.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            deleteStaticMaterial(
                                card
                            );

                        }
                    );

                }

            }
        );

}


function moveStaticMaterial(
    card,
    category
) {

    const id =
        card.dataset.staticId;


    staticMaterialState[id] = {

        category:
            category,

        deleted:
            false

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
        categoryContainers[
            category
        ];

    if (!container) {

        return;

    }


    container.appendChild(
        card
    );

}


function deleteStaticMaterial(
    card
) {

    const id =
        card.dataset.staticId;


    const currentCategory =
        card.closest(
            ".material-category"
        )?.dataset.category ||
        "people";


    staticMaterialState[id] = {

        category:
            currentCategory,

        deleted:
            true

    };


    saveStaticMaterialState();


    card.remove();

}


/* =========================================================
   AUTH
========================================================= */

async function ensureAnonymousAuth() {

    try {

        const {
            data:
                sessionData
        } =
            await supabaseClient
                .auth
                .getSession();


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
            await supabaseClient
                .auth
                .signInAnonymously();


        if (error) {

            console.error(
                "Anonymous authentication failed:",
                error
            );

            return null;

        }


        return data.session;

    } catch (error) {

        console.error(
            "Authentication error:",
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
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Load materials failed:",
                error
            );

            return;

        }


        document
            .querySelectorAll(
                ".user-material"
            )
            .forEach(
                card => {

                    card.remove();

                }
            );


        if (!data) {

            return;

        }


        data.forEach(
            material => {

                createUserMaterial(
                    material
                );

            }
        );

    } catch (error) {

        console.error(
            "Material loading error:",
            error
        );

    }

}


/* =========================================================
   CREATE USER MATERIAL
========================================================= */

function createUserMaterial(
    material
) {

    const category =
        material.category ||
        "people";


    const container =
        categoryContainers[
            category
        ];


    if (!container) {

        return;

    }


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "material-card user-material";


    card.dataset.materialId =
        material.id;


    card.dataset.storagePath =
        material.storage_path ||
        "";


    const image =
        document.createElement(
            "img"
        );


    image.crossOrigin =
        "anonymous";


    image.src =
        material.image_url;


    image.alt =
        material.name ||
        "Uploaded material";


    image.draggable =
        false;


    image.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            addImageToCanvas(
                image.src,
                image.alt,
                {
                    category:
                        material.category ||
                        "people"
                }
            );

        }
    );


    const menu =
        createMaterialMenu(
            material
        );


    card.appendChild(
        image
    );


    card.appendChild(
        menu
    );


    container.appendChild(
        card
    );

}


/* =========================================================
   MATERIAL MENU
========================================================= */

function createMaterialMenu(
    material
) {

    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "material-menu";


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "material-category-select";


    const categories = [

        [
            "people",
            "PEOPLE"
        ],

        [
            "objects",
            "OBJECTS"
        ],

        [
            "buildings",
            "BUILDINGS"
        ]

    ];


    categories.forEach(
        ([value, label]) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;


            option.textContent =
                label;


            if (
                value ===
                (
                    material.category ||
                    "people"
                )
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


    const deleteBtn =
        document.createElement(
            "button"
        );


    deleteBtn.type =
        "button";


    deleteBtn.className =
        "material-delete";


    deleteBtn.textContent =
        "×";


    deleteBtn.setAttribute(
        "aria-label",
        "Delete"
    );


    deleteBtn.title =
        "Delete";


    deleteBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            deleteUserMaterial(
                material
            );

        }
    );


    menu.appendChild(
        select
    );


    menu.appendChild(
        deleteBtn
    );


    return menu;

}


/* =========================================================
   MOVE USER MATERIAL
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

                    category:
                        category

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

            alert(
                "Could not change material category."
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

        const {
            error:
                dbError
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

            alert(
                "Could not delete this material."
            );

            return;

        }


        if (
            material.storage_path
        ) {

            const {
                error:
                    storageError
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

    if (
        takePhotoBtn &&
        cameraInput
    ) {

        takePhotoBtn.addEventListener(
            "click",
            () => {

                cameraInput.click();

            }
        );

    }


    if (
        fromAlbumBtn &&
        albumInput
    ) {

        fromAlbumBtn.addEventListener(
            "click",
            () => {

                albumInput.click();

            }
        );

    }


    if (cameraInput) {

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

    }


    if (albumInput) {

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

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
    file
) {

    const parts =
        file.name.split(
            "."
        );


    if (
        parts.length <
        2
    ) {

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


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        alert(
            "Please upload an image."
        );

        return;

    }


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
            getFileExtension(
                file
            );


        const fileName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}.${extension}`;


        const storagePath =
            `${userId}/${fileName}`;


        const {
            error:
                uploadError
        } =
            await supabaseClient
                .storage
                .from("materials")
                .upload(
                    storagePath,
                    file,
                    {
                        upsert:
                            false,

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


        const {
            data:
                publicUrlData
        } =
            supabaseClient
                .storage
                .from("materials")
                .getPublicUrl(
                    storagePath
                );


        const imageUrl =
            publicUrlData.publicUrl;


        const {
            error:
                insertError
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
   CANVAS HELPERS
========================================================= */

function getCanvasItems() {

    if (!canvas) {

        return [];

    }


    return Array.from(
        canvas.querySelectorAll(
            ".canvas-item"
        )
    );

}


function getNextZIndex() {

    highestZIndex +=
        1;

    return highestZIndex;

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
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        `canvas-control ${className}`;


    button.textContent =
        text;


    button.title =
        title;


    button.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            event.stopPropagation();

        }
    );


    return button;

}


/* =========================================================
   ADD IMAGE TO CANVAS
========================================================= */

function addImageToCanvas(
    imageSrc,
    imageAlt = "Material",
    options = {}
) {

    if (
        !canvas ||
        !imageSrc
    ) {

        return null;

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "canvas-item";


    item.dataset.rotation =
        "0";


    item.dataset.scale =
        "1";


    item.dataset.category =
        options.category ||
        "objects";


    item.style.width =
        `${
            options.width ||
            180
        }px`;


    item.style.zIndex =
        getNextZIndex();


    const image =
        document.createElement(
            "img"
        );


    image.src =
        imageSrc;


    image.alt =
        imageAlt;


    image.crossOrigin =
        "anonymous";


    image.draggable =
        false;


    image.addEventListener(
        "dragstart",
        event => {

            event.preventDefault();

        }
    );


    item.appendChild(
        image
    );


    /* ---------------------------------------------
       Controls
    --------------------------------------------- */

    const deleteBtn =
        createCanvasControl(
            "canvas-delete",
            "×",
            "Delete"
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


    const rotateBtn =
        createCanvasControl(
            "canvas-rotate",
            "↻",
            "Rotate"
        );


    const resizeBtn =
        createCanvasControl(
            "canvas-resize",
            "↗",
            "Resize"
        );


    item.appendChild(
        deleteBtn
    );


    item.appendChild(
        forwardBtn
    );


    item.appendChild(
        backwardBtn
    );


    item.appendChild(
        rotateBtn
    );


    item.appendChild(
        resizeBtn
    );


    canvas.appendChild(
        item
    );


    /* ---------------------------------------------
       Position
    --------------------------------------------- */

    const canvasRect =
        canvas.getBoundingClientRect();


    const width =
        options.width ||
        180;


    item.style.left =
        `${
            Math.max(
                20,
                (
                    canvasRect.width -
                    width
                ) / 2
            )
        }px`;


    item.style.top =
        `${
            Math.max(
                20,
                (
                    canvasRect.height -
                    180
                ) / 2
            )
        }px`;


    bindCanvasControls(
        item,
        {
            deleteBtn,
            forwardBtn,
            backwardBtn,
            rotateBtn,
            resizeBtn
        }
    );


    enableCanvasDragging(
        item
    );


    selectCanvasItem(
        item
    );


    return item;

}


/* =========================================================
   BIND CANVAS CONTROLS
========================================================= */

function bindCanvasControls(
    item,
    controls
) {

    controls.deleteBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            removeCanvasItem(
                item
            );

        }
    );


    controls.forwardBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            bringForward(
                item
            );

        }
    );


    controls.backwardBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sendBackward(
                item
            );

        }
    );


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
   SELECT
========================================================= */

function selectCanvasItem(
    item
) {

    if (!item) {

        return;

    }


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


    if (
        item.classList.contains(
            "dialogue-item"
        )
    ) {

        showDialogueStylePanel(
            item
        );

    } else {

        hideDialogueStylePanel();

    }

}


/* =========================================================
   DESELECT
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


    hideDialogueStylePanel();

}


/* =========================================================
   REMOVE
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


    hideDialogueStylePanel();

}


/* =========================================================
   LAYER ORDER
========================================================= */

function getCanvasItemsSorted() {

    return getCanvasItems()
        .sort(
            (a, b) => {

                return (
                    parseInt(
                        a.style.zIndex ||
                        "0"
                    ) -
                    parseInt(
                        b.style.zIndex ||
                        "0"
                    )
                );

            }
        );

}


function bringForward(
    item
) {

    const items =
        getCanvasItemsSorted();


    const index =
        items.indexOf(
            item
        );


    if (
        index < 0 ||
        index >=
        items.length - 1
    ) {

        return;

    }


    const nextItem =
        items[
            index + 1
        ];


    const currentZ =
        parseInt(
            item.style.zIndex ||
            "0"
        );


    const nextZ =
        parseInt(
            nextItem.style.zIndex ||
            "0"
        );


    item.style.zIndex =
        nextZ;


    nextItem.style.zIndex =
        currentZ;

}


function sendBackward(
    item
) {

    const items =
        getCanvasItemsSorted();


    const index =
        items.indexOf(
            item
        );


    if (
        index <= 0
    ) {

        return;

    }


    const previousItem =
        items[
            index - 1
        ];


    const currentZ =
        parseInt(
            item.style.zIndex ||
            "0"
        );


    const previousZ =
        parseInt(
            previousItem.style.zIndex ||
            "0"
        );


    item.style.zIndex =
        previousZ;


    previousItem.style.zIndex =
        currentZ;

}


/* =========================================================
   DRAGGING
   IMPORTANT:
   - Image: normal drag
   - Dialogue:
       click = edit
       drag > 5px = move
========================================================= */

function enableCanvasDragging(
    item
) {

    let startX =
        0;

    let startY =
        0;

    let startLeft =
        0;

    let startTop =
        0;

    let pointerId =
        null;

    let dragging =
        false;


    item.addEventListener(
        "pointerdown",
        event => {

            if (
                event.button !== 0 &&
                event.pointerType !== "touch"
            ) {

                return;

            }


            if (
                event.target.closest(
                    ".canvas-control"
                )
            ) {

                return;

            }


            selectCanvasItem(
                item
            );


            startX =
                event.clientX;

            startY =
                event.clientY;


            startLeft =
                parseFloat(
                    item.style.left ||
                    "0"
                );


            startTop =
                parseFloat(
                    item.style.top ||
                    "0"
                );


            pointerId =
                event.pointerId;


            dragging =
                false;


            try {

                item.setPointerCapture(
                    pointerId
                );

            } catch (error) {

                /* Ignore */

            }


            function move(
                moveEvent
            ) {

                if (
                    moveEvent.pointerId !==
                    pointerId
                ) {

                    return;

                }


                const dx =
                    moveEvent.clientX -
                    startX;


                const dy =
                    moveEvent.clientY -
                    startY;


                if (!dragging) {

                    const distance =
                        Math.hypot(
                            dx,
                            dy
                        );


                    if (
                        distance <
                        5
                    ) {

                        return;

                    }


                    dragging =
                        true;

                }


                moveEvent.preventDefault();


                item.style.left =
                    `${startLeft + dx}px`;


                item.style.top =
                    `${startTop + dy}px`;

            }


            function end(
                endEvent
            ) {

                if (
                    endEvent.pointerId !==
                    pointerId
                ) {

                    return;

                }


                try {

                    item.releasePointerCapture(
                        pointerId
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


                pointerId =
                    null;


                dragging =
                    false;

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
            event.clientY -
                centerY,

            event.clientX -
                centerX
        );


    const currentRotation =
        parseFloat(
            item.dataset.rotation ||
            "0"
        );


    try {

        item.setPointerCapture(
            event.pointerId
        );

    } catch (error) {

        /* Ignore */

    }


    function move(
        moveEvent
    ) {

        const currentAngle =
            Math.atan2(
                moveEvent.clientY -
                    centerY,

                moveEvent.clientX -
                    centerX
            );


        const delta =
            (
                currentAngle -
                startAngle
            ) *
            (
                180 /
                Math.PI
            );


        item.dataset.rotation =
            currentRotation +
            delta;


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


    try {

        item.setPointerCapture(
            event.pointerId
        );

    } catch (error) {

        /* Ignore */

    }


    function move(
        moveEvent
    ) {

        if (
            startDistance <= 0
        ) {

            return;

        }


        const currentDistance =
            Math.hypot(
                moveEvent.clientX -
                    centerX,

                moveEvent.clientY -
                    centerY
            );


        let newWidth =
            startWidth *
            (
                currentDistance /
                startDistance
            );


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
   TRANSFORM
========================================================= */

function updateCanvasTransform(
    item
) {

    const rotation =
        parseFloat(
            item.dataset.rotation ||
            "0"
        );


    const scale =
        parseFloat(
            item.dataset.scale ||
            "1"
        );


    item.style.transform =
        `rotate(${rotation}deg) scale(${scale})`;

}


/* =========================================================
   DIALOGUE
========================================================= */

function addDialogue() {

    if (!canvas) {

        return;

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "canvas-item dialogue-item";


    item.dataset.rotation =
        "0";


    item.dataset.scale =
        "1";


    item.style.width =
        "230px";


    item.style.zIndex =
        getNextZIndex();


    const box =
        document.createElement(
            "div"
        );


    box.className =
        "dialogue-box";


    box.contentEditable =
        "true";


    box.spellcheck =
        false;


    box.textContent =
        "TYPE YOUR COUNTY STORY";


    box.style.color =
        dialogueTextColor?.value ||
        "#111111";


    box.style.borderColor =
        dialogueBorderColor?.value ||
        "#111111";


    item.appendChild(
        box
    );


    /* ---------------------------------------------
       Controls
    --------------------------------------------- */

    const deleteBtn =
        createCanvasControl(
            "canvas-delete",
            "×",
            "Delete"
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


    const rotateBtn =
        createCanvasControl(
            "canvas-rotate",
            "↻",
            "Rotate"
        );


    const resizeBtn =
        createCanvasControl(
            "canvas-resize",
            "↗",
            "Resize"
        );


    item.appendChild(
        deleteBtn
    );


    item.appendChild(
        forwardBtn
    );


    item.appendChild(
        backwardBtn
    );


    item.appendChild(
        rotateBtn
    );


    item.appendChild(
        resizeBtn
    );


    canvas.appendChild(
        item
    );


    /* ---------------------------------------------
       Position
    --------------------------------------------- */

    const canvasRect =
        canvas.getBoundingClientRect();


    item.style.left =
        `${Math.max(
            20,
            canvasRect.width / 2 -
            115
        )}px`;


    item.style.top =
        `${Math.max(
            20,
            canvasRect.height / 2 -
            50
        )}px`;


    bindCanvasControls(
        item,
        {
            deleteBtn,
            forwardBtn,
            backwardBtn,
            rotateBtn,
            resizeBtn
        }
    );


    enableCanvasDragging(
        item
    );


    /*
     * IMPORTANT:
     *
     * Do NOT stopPropagation here.
     *
     * The parent .canvas-item needs to receive
     * pointerdown so dragging can work.
     *
     * The drag system waits for 5px movement.
     *
     * Therefore:
     *
     * click = text editing
     * drag = move dialogue
     */

    box.addEventListener(
        "pointerdown",
        () => {

            selectCanvasItem(
                item
            );

        }
    );


    box.addEventListener(
        "focus",
        () => {

            selectCanvasItem(
                item
            );

        }
    );


    box.addEventListener(
        "dragstart",
        event => {

            event.preventDefault();

        }
    );


    selectCanvasItem(
        item
    );


    setTimeout(
        () => {

            box.focus();


            try {

                const selection =
                    window.getSelection();


                const range =
                    document.createRange();


                range.selectNodeContents(
                    box
                );


                selection.removeAllRanges();


                selection.addRange(
                    range
                );

            } catch (error) {

                /* Ignore */

            }

        },
        50
    );


    return item;

}


/* =========================================================
   DIALOGUE STYLE PANEL
========================================================= */

function showDialogueStylePanel(
    item
) {

    if (!dialogueStylePanel) {

        return;

    }


    dialogueStylePanel.classList.add(
        "visible"
    );


    dialogueStylePanel.setAttribute(
        "aria-hidden",
        "false"
    );


    const box =
        item.querySelector(
            ".dialogue-box"
        );


    if (!box) {

        return;

    }


    const computed =
        window.getComputedStyle(
            box
        );


    if (
        dialogueTextColor
    ) {

        dialogueTextColor.value =
            rgbToHex(
                computed.color
            );

    }


    if (
        dialogueBorderColor
    ) {

        dialogueBorderColor.value =
            rgbToHex(
                computed.borderTopColor
            );

    }

}


function hideDialogueStylePanel() {

    if (!dialogueStylePanel) {

        return;

    }


    dialogueStylePanel.classList.remove(
        "visible"
    );


    dialogueStylePanel.setAttribute(
        "aria-hidden",
        "true"
    );

}


function rgbToHex(
    color
) {

    if (!color) {

        return "#111111";

    }


    if (
        color.startsWith(
            "#"
        )
    ) {

        return color;

    }


    const values =
        color.match(
            /\d+/g
        );


    if (
        !values ||
        values.length <
        3
    ) {

        return "#111111";

    }


    return (
        "#" +
        values
            .slice(0, 3)
            .map(
                value =>
                    parseInt(
                        value,
                        10
                    )
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join("")
    );

}


/* =========================================================
   DIALOGUE TEXT COLOR
========================================================= */

if (
    dialogueTextColor
) {

    dialogueTextColor.addEventListener(
        "input",
        event => {

            if (
                !selectedCanvasItem ||
                !selectedCanvasItem.classList.contains(
                    "dialogue-item"
                )
            ) {

                return;

            }


            const box =
                selectedCanvasItem.querySelector(
                    ".dialogue-box"
                );


            if (box) {

                box.style.color =
                    event.target.value;

            }

        }
    );

}


/* =========================================================
   DIALOGUE BORDER COLOR
========================================================= */

if (
    dialogueBorderColor
) {

    dialogueBorderColor.addEventListener(
        "input",
        event => {

            if (
                !selectedCanvasItem ||
                !selectedCanvasItem.classList.contains(
                    "dialogue-item"
                )
            ) {

                return;

            }


            const box =
                selectedCanvasItem.querySelector(
                    ".dialogue-box"
                );


            if (box) {

                box.style.borderColor =
                    event.target.value;

            }

        }
    );

}


/* =========================================================
   ADD DIALOGUE BUTTON
========================================================= */

if (
    addDialogueBtn
) {

    addDialogueBtn.addEventListener(
        "click",
        () => {

            addDialogue();

        }
    );

}


/* =========================================================
   CANVAS BACKGROUND
========================================================= */

if (canvas) {

    canvas.addEventListener(
        "pointerdown",
        event => {

            if (
                event.target ===
                canvas
            ) {

                deselectAllCanvasItems();

            }

        }
    );

}


/* =========================================================
   KEYBOARD DELETE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Delete" &&
            event.key !==
            "Backspace"
        ) {

            return;

        }


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
            activeElement &&
            activeElement.isContentEditable
        ) {

            return;

        }


        if (
            selectedCanvasItem
        ) {

            event.preventDefault();

            removeCanvasItem(
                selectedCanvasItem
            );

        }

    }
);


/* =========================================================
   MAKE ANOTHER COUNTY
========================================================= */

const AUTO_COUNTY_SETTINGS = {

    minimumItems:
        6,

    maximumItems:
        9,

    peopleMinimum:
        1,

    peopleMaximum:
        2,

    objectsMinimum:
        2,

    objectsMaximum:
        3,

    buildingsMinimum:
        2,

    buildingsMaximum:
        3,

    minimumWidth:
        90,

    maximumWidth:
        280,

    minimumRotation:
        -18,

    maximumRotation:
        18,

    edgePadding:
        24

};


/* =========================================================
   RANDOM HELPERS
========================================================= */

function randomBetween(
    min,
    max
) {

    return (
        Math.random() *
        (
            max -
            min
        ) +
        min
    );

}


function randomInteger(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (
            max -
            min +
            1
        )
    ) + min;

}


function shuffleArray(
    array
) {

    const result =
        [...array];


    for (
        let i =
            result.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (
                    i + 1
                )
            );


        [
            result[i],
            result[j]
        ] =
        [
            result[j],
            result[i]
        ];

    }


    return result;

}


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


/* =========================================================
   GET AVAILABLE MATERIALS
========================================================= */

function getAvailableCountyMaterials() {

    return Array
        .from(
            document.querySelectorAll(
                ".material-card"
            )
        )
        .map(
            card => {

                const image =
                    card.querySelector(
                        "img"
                    );


                if (
                    !image ||
                    !image.src
                ) {

                    return null;

                }


                const category =
                    card.closest(
                        ".material-category"
                    )?.dataset.category ||
                    "objects";


                return {

                    src:
                        image.src,

                    alt:
                        image.alt ||
                        "Material",

                    category:
                        category

                };

            }
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   BUILD AUTOMATIC COUNTY
========================================================= */

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


    let selected =
        [];


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


    const unique =
        [];


    const seen =
        new Set();


    selected.forEach(
        material => {

            if (
                seen.has(
                    material.src
                )
            ) {

                return;

            }


            seen.add(
                material.src
            );


            unique.push(
                material
            );

        }
    );


    selected =
        unique;


    if (
        selected.length <
        AUTO_COUNTY_SETTINGS.minimumItems
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
                AUTO_COUNTY_SETTINGS.minimumItems -
                selected.length
            )
        );

    }


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


    return selected;

}


/* =========================================================
   PLACE AUTOMATIC ITEM
========================================================= */

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


    width =
        Math.min(
            width,
            Math.max(
                60,
                canvasWidth -
                AUTO_COUNTY_SETTINGS.edgePadding *
                2
            )
        );


    item.style.width =
        `${width}px`;


    const itemWidth =
        item.offsetWidth ||
        width;


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

        left =
            randomBetween(
                AUTO_COUNTY_SETTINGS.edgePadding,
                maxLeft
            );


        top =
            randomBetween(
                Math.max(
                    AUTO_COUNTY_SETTINGS.edgePadding,
                    canvasHeight *
                    0.35
                ),
                maxTop
            );

    } else if (
        material.category ===
        "people"
    ) {

        left =
            randomBetween(
                canvasWidth *
                0.15,

                Math.max(
                    canvasWidth *
                    0.15,

                    maxLeft
                )
            );


        top =
            randomBetween(
                canvasHeight *
                0.20,

                Math.max(
                    canvasHeight *
                    0.20,

                    maxTop
                )
            );

    } else {

        left =
            randomBetween(
                AUTO_COUNTY_SETTINGS.edgePadding,
                maxLeft
            );


        top =
            randomBetween(
                canvasHeight *
                0.20,

                Math.max(
                    canvasHeight *
                    0.20,

                    maxTop
                )
            );

    }


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


    item.dataset.rotation =
        randomBetween(
            AUTO_COUNTY_SETTINGS.minimumRotation,
            AUTO_COUNTY_SETTINGS.maximumRotation
        );


    item.dataset.scale =
        "1";


    updateCanvasTransform(
        item
    );


    /*
     * Layer:
     *
     * buildings → back
     * objects   → middle
     * people    → front
     */

    let baseLayer;


    if (
        material.category ===
        "buildings"
    ) {

        baseLayer =
            10;

    } else if (
        material.category ===
        "objects"
    ) {

        baseLayer =
            100;

    } else {

        baseLayer =
            200;

    }


    item.style.zIndex =
        baseLayer +
        index +
        randomInteger(
            0,
            20
        );

}


/* =========================================================
   MAKE ANOTHER COUNTY
========================================================= */

async function makeAnotherCounty() {

    if (!canvas) {

        return;

    }


    const materials =
        getAvailableCountyMaterials();


    if (
        !materials.length
    ) {

        alert(
            "No materials are available yet."
        );

        return;

    }


    const selection =
        buildAutomaticCountySelection(
            materials
        );


    if (
        !selection.length
    ) {

        alert(
            "Not enough materials to make another county."
        );

        return;

    }


    canvas
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


    const shuffled =
        shuffleArray(
            selection
        );


    shuffled.forEach(
        (
            material,
            index
        ) => {

            const item =
                addImageToCanvas(
                    material.src,
                    material.alt,
                    {
                        category:
                            material.category
                    }
                );


            if (!item) {

                return;

            }


            placeAutomaticCountyItem(
                item,
                material,
                index,
                shuffled.length
            );

        }
    );


    deselectAllCanvasItems();

}


/* =========================================================
   MAKE ANOTHER COUNTY BUTTON
========================================================= */

if (
    makeAnotherCountyBtn
) {

    makeAnotherCountyBtn.addEventListener(
        "click",
        async () => {

            const originalText =
                makeAnotherCountyBtn.textContent;


            makeAnotherCountyBtn.disabled =
                true;


            makeAnotherCountyBtn.textContent =
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

                makeAnotherCountyBtn.disabled =
                    false;


                makeAnotherCountyBtn.textContent =
                    originalText;

            }

        }
    );

}


/* =========================================================
   CLEAR CANVAS
========================================================= */

if (
    clearCanvasBtn
) {

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


            canvas
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


            hideDialogueStylePanel();

        }
    );

}


/* =========================================================
   EXPORT PNG
========================================================= */

async function loadHtml2Canvas() {

    if (
        typeof window.html2canvas ===
        "function"
    ) {

        return window.html2canvas;

    }


    return new Promise(
        (
            resolve,
            reject
        ) => {

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
                                    "html2canvas unavailable."
                                )
                            );

                        }

                    },
                    {
                        once:
                            true
                    }
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
                    {
                        once:
                            true
                    }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";


            script.async =
                true;


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
                                "html2canvas unavailable."
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


async function exportCanvasAsPNG() {

    if (!canvas) {

        return;

    }


    const exportBtn =
        document.getElementById(
            "exportCanvasBtn"
        );


    const originalSelected =
        selectedCanvasItem;


    const selectedItems =
        Array.from(
            canvas.querySelectorAll(
                ".canvas-item.selected"
            )
        );


    try {

        if (exportBtn) {

            exportBtn.disabled =
                true;

            exportBtn.textContent =
                "EXPORTING...";

        }


        await loadHtml2Canvas();


        selectedItems.forEach(
            item => {

                item.classList.remove(
                    "selected"
                );

            }
        );


        await new Promise(
            resolve =>
                requestAnimationFrame(
                    resolve
                )
        );


        const controls =
            Array.from(
                canvas.querySelectorAll(
                    ".canvas-control"
                )
            );


        controls.forEach(
            control => {

                control.style.visibility =
                    "hidden";

            }
        );


        const exportedCanvas =
            await window.html2canvas(
                canvas,
                {

                    backgroundColor:
                        "#f4f1ea",

                    useCORS:
                        true,

                    allowTaint:
                        false,

                    scale:
                        2,

                    logging:
                        false,

                    imageTimeout:
                        15000

                }
            );


        controls.forEach(
            control => {

                control.style.visibility =
                    "";

            }
        );


        const link =
            document.createElement(
                "a"
            );


        link.download =
            `county-literature-${Date.now()}.png`;


        link.href =
            exportedCanvas.toDataURL(
                "image/png"
            );


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
            "Export failed. Please try again."
        );

    } finally {

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


        if (
            originalSelected &&
            originalSelected.isConnected
        ) {

            selectCanvasItem(
                originalSelected
            );

        }


        if (exportBtn) {

            exportBtn.disabled =
                false;

            exportBtn.textContent =
                "EXPORT";

        }

    }

}


/* =========================================================
   EXPORT BUTTON
========================================================= */

function setupExportButton() {

    if (
        !clearCanvasBtn
    ) {

        return;

    }


    const actions =
        clearCanvasBtn.parentElement;


    if (!actions) {

        return;

    }


    let exportBtn =
        document.getElementById(
            "exportCanvasBtn"
        );


    if (exportBtn) {

        return;

    }


    exportBtn =
        document.createElement(
            "button"
        );


    exportBtn.id =
        "exportCanvasBtn";


    exportBtn.type =
        "button";


    exportBtn.textContent =
        "EXPORT";


    actions.appendChild(
        exportBtn
    );


    exportBtn.addEventListener(
        "click",
        exportCanvasAsPNG
    );

}


/* =========================================================
   PERIODIC MATERIAL SYNC
========================================================= */

let syncInterval =
    null;


function startMaterialSync() {

    if (
        syncInterval
    ) {

        clearInterval(
            syncInterval
        );

    }


    syncInterval =
        setInterval(
            () => {

                if (
                    document.visibilityState ===
                    "visible"
                ) {

                    loadMaterials();

                }

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
   INITIALIZATION
========================================================= */

async function initialize() {

    console.log(
        "COUNTY LITERATURE initializing..."
    );


    applyStaticMaterialState();


    bindStaticMaterials();


    bindUploadButtons();


    setupExportButton();


    await ensureAnonymousAuth();


    await loadMaterials();


    startMaterialSync();


    console.log(
        "COUNTY LITERATURE ready."
    );

}


/* =========================================================
   START
========================================================= */

initialize();