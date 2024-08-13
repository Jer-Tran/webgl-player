
function handleFile() {
    const file = input.files[0]
    
    if (file.type.startsWith("video/")) {
        DrawVideo(file)
        console.log("video uploaded")
    }
    else {
        console.log("not video uploaded")
    }
}

function DrawVideo(file) {
    // load video

    // logic for handling doing a function each frame
    // For each frame
        // process frame to list of lists of floats
        // the various shapes that make-up the frame, which each shape is a list of vertices coordinates

        // from the list, draw the shapes onto the canvas
}

function Start() {
    console.log("Start")
}

const input = document.getElementById("input")
input.onchange = handleFile
const canvas = document.getElementById("canvas")
Start()