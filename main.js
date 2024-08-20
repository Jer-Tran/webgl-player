import { drawShape1, drawShape2, DrawShapes } from "./draw.js";

function handleFile() {
    if (input.files.length == 0) {
        console.log("nothing uploaded")
        return
    }

    const file = input.files[0]

    if (file.type.startsWith("video/")) {
        DrawVideo(file)
    }
    else if (file.type.startsWith("image/")) {
        DrawImage(file)
    }
    else {
        console.log("not video uploaded")
    }
}

function AggregateData(data) {
    const res = []
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i+1]
        let b = data[i+2]
        res.push([r,g,b])
    }

    return res
}

function abs(val) {
    if (val < 0) {
        return -1 * val
    }
    return val
}

function Approx(px1, px2, _var) {
    return abs(px1[0] - px2[0]) <= _var && abs(px1[1] - px2[1]) <= _var && abs(px1[2] - px2[2]) <= _var
}

function DrawImage(file) {
    // const blob = URL.createObjectURL(file)
    console.log("Received image")
    const frame = document.createElement("canvas")
    const context = frame.getContext('2d')

    const reader = new FileReader()
    reader.onload = e =>{
        const image = new Image()
        image.onload = () => {
            const width = image.width
            const height = image.height
            console.log (width, height)
            canvas.width = width
            canvas.height = height
            frame.width = width
            frame.height = height
            context.drawImage(image, 0, 0, width, height)
            
            const aggrData = AggregateData(context.getImageData(0,0, width, height).data)
            const polys = GetPolygons(aggrData, width, height)
            console.log("polys", polys)

            DrawShapes(polys)
        }
        image.src = e.target.result;
    }
    reader.readAsDataURL(file)
}

function DrawVideo(file) {
    const blob = URL.createObjectURL(file)
    // var width = DEFAULT_WIDTH, height = DEFAULT_WIDTH * 9/16

    // On video being loaded
    video.onloadedmetadata = function () {
        canvas.width = video.videoWidth
        canvas.height= video.videoHeight
    }

    const frame = document.createElement("canvas")
    const context = frame.getContext('2d')

    // Function to draw whatever the current frame the video is at
    DrawFunction = function () {
        // console.log("do a draw")
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const aggrData = AggregateData(context.getImageData(0,0,frame.width, frame.height).data)
        const polys = GetPolygons(aggrData, frame.width, frame.height)
        console.log("polys", polys)

        DrawShapes(polys)
    }

    video.src = blob
    // TogglePlayback()
}

function GetPolygons(data, width, height) {
    
    const GetPixel = function(x, y) {
        return data[y * width + x]
    }
    
    var polygons = []
    var visited = []
    for (let l = 0; l < width; l++) {
        let row = []
        for (let k = 0; k < height; k++) {
            row.push(false)
        }
        visited.push(row)
    }
    const base_seg = []
    for (let i = 0; i < width; i++) {
        const row = []
        for (let j = 0; j < height; j++) {
            // row.push(0)
            base_seg.push(0)
        }
        // base_seg.push(row)
    }
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            if (visited[i][j]) {
                continue
            }
            
            // Get pixel colour
            const colour = GetPixel(i,j)
            var avg_colour = [colour[0], colour[1], colour[2]]
            
            // var arr_seg = base_seg
            var arr_seg = []
            
            var pixels = 0
            // arr_seg[j][i] = 0
            
            let queue = [[i, j]]
            while (queue.length > 0) {
                const tile = queue[0]
                queue.shift()
                let x = tile[0]
                let y = tile[1]
                
                // Get current colour
                const curr_colour = GetPixel(x,y)
                let z = 0
                while (z < 3) {
                    avg_colour[z] += curr_colour[z]
                    z += 1
                }
                pixels += 1
                
                // for each adjacent square ,x+1, x-1, etc 
                // if not visited yet, and is approx same colour
                // mark as visited, add to queue
                if (x > 1) {
                    arr_seg[x-1 + y * width] = 1
                    if (!visited[x-1][y] && Approx(GetPixel(x-1,y), colour, VARIATION)) {
                        visited[x-1][y] = true
                        queue.push([x-1, y])
                    }
                }
                if (x+1 < width) {
                    arr_seg[x+1 + y * width] = 1
                    if (!visited[x+1][y] && Approx(GetPixel(x+1,y), colour, VARIATION)) {
                        visited[x+1][y] = true
                        queue.push([x+1, y])
                    }
                }
                if (y > 1) {
                    arr_seg[x + (y-1) * width] = 1
                    if (!visited[x][y-1] && Approx(GetPixel(x,y-1), colour, VARIATION)) {
                        visited[x][y-1] = true
                        queue.push([x, y-1])
                    }
                }
                if (y+1 < height) {
                    arr_seg[x + (y+1) * width] = 1
                    if (!visited[x][y+1] && Approx(GetPixel(x,y+1), colour, VARIATION)) {
                        visited[x][y+1] = true
                        queue.push([x, y+1])
                    }
                }
            }
            
            // Once out of loop, if enough pixels, get contours and convert to polygon
            if (pixels > LOWER_CUT) {
                const mat = cv.matFromArray(width, height, cv.CV_8UC1, arr_seg)
                var contours = new cv.MatVector()
                let hierarchy = new cv.Mat()
                cv.findContours(mat, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)
                const points = []
                for (let a = 0; a < contours.size(); a++) {
                    try {
                        const ci = contours.get(i) // Sometimes this returns undefined, and idk why
                        for (let b = 0; b < ci.data32S.length; b += 2) {
                            points.push(ci.data32S[b] / height)
                            points.push(ci.data32S[b+1] / width)
                        }
                    }
                    catch (error) {
                        // console.log(error)
                    }
                }
                // Somethings broken here, either the algo or the getting pixels part
                
                // Get the final colour with average
                const final_colour = [avg_colour[0] / pixels / 255, avg_colour[1] / pixels / 255, avg_colour[2] / pixels / 255]
                polygons.push([points, final_colour])
            }
        }
    }
    return polygons
}

function RepeatFrame() {
    DrawFunction()
    if (video.currentTime >= video.duration) {
        video.pause()
    }
    if (!video.paused) {
        requestAnimationFrame(RepeatFrame)
    }
    // console.log("drawing")
}

function TogglePlayback() {
    if (video.src == "") {return}
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
video.src = ""
const input = document.getElementById("input")
input.onchange = handleFile
const canvas = document.getElementById("canvas")
document.getElementById("pause").onclick = TogglePlayback
// const DEFAULT_WIDTH = 1000
var DrawFunction = function () { console.log("No video uploaded yet") }
const LOWER_CUT = 0
const VARIATION = 20

document.getElementById("1").onclick = drawShape1
document.getElementById("2").onclick = drawShape2
document.getElementById("3").onclick = function () { DrawShapes([]); console.log(cv) }

Start()