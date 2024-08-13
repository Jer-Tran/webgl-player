
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
    const blob = URL.createObjectURL(file)
    // var width = DEFAULT_WIDTH, height = DEFAULT_WIDTH * 9/16

    // On video being loaded
    video.onloadedmetadata = function () {
        // width = Math.min(DEFAULT_WIDTH, video.videoWidth)
        // height = Math.floor(width * video.videoHeight / video.videoWidth)
        canvas.width = video.videoWidth
        canvas.height= video.videoHeight
    }

    // Function to draw whatever the current frame the video is at
    DrawFunction = function () {
        console.log("do a draw")
        // Not gonna do anything yet since I'm not sure what the OpenCV library requires
        // Can just draw video onto canvas if needed though

        // logic for handling doing a function each frame
        // For each frame
            // process frame to list of lists of floats, using CV
            // the various shapes that make-up the frame, which each shape is a list of vertices coordinates
    
            // from the list, draw the shapes onto the canvas
    }

    video.src = blob
    // TogglePlayback()

}

function RepeatFrame() {
    DrawFunction()
    if (video.currentTime >= video.duration) {
        video.pause()
    }
    if (!video.paused) {
        requestAnimationFrame(RepeatFrame)
    }
    console.log("drawing")
}

function TogglePlayback() {
    if (video.paused) {
        video.play()
        RepeatFrame()
    }
    else {
        video.pause()
    }
}

function Start() {
    console.log("Start")
}

const video = document.createElement("video")
const input = document.getElementById("input")
input.onchange = handleFile
const canvas = document.getElementById("canvas")
document.getElementById("pause").onclick = TogglePlayback
// const DEFAULT_WIDTH = 1000
var DrawFunction = function () { console.log("No video uploaded yet") }

Start()