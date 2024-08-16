// Code stolen and modified from https://www.youtube.com/watch?v=y2UsQB3WSvo
import earcut from 'https://cdn.jsdelivr.net/npm/earcut/+esm'
// See https://github.com/mapbox/earcut

/** Helper method to output an error message to the screen */
function showError(errorText) {
    const errorBoxDiv = document.getElementById('error-box');
    const errorSpan = document.createElement('p');
    errorSpan.innerText = errorText;
    errorBoxDiv.appendChild(errorSpan);
    console.error(errorText);
  }

function PrepareGPU() {
    //
    // Setup Step 1: Get the WebGL rendering context for our HTML canvas rendering area
    //
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        showError('Could not find HTML canvas element - check for typos, or loading JavaScript file too early');
        return;
    }
    const gl = canvas.getContext('webgl2');
    if (!gl) {
        const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
        if (isWebGl1Supported) {
        showError('WebGL 1 is supported, but not v2 - try using a different device or browser');
        } else {
        showError('WebGL is not supported on this device - try using a different device or browser');
        }
        return;
    }
    
    //
    // Create the vertex and fragment shader for this demo. GLSL shader code is
    //  written as a plain JavaScript string, attached to a shader, and compiled
    //  with the "compileShader" call.
    //
    // If both shaders compile successfully, attach them to a WebGLProgram
    //  instance - vertex and fragment shaders must be used together in a draw
    //  call, and a WebGLProgram represents the combination of shaders to be used.
    //
    const vertexShaderSourceCode = `#version 300 es
    precision mediump float;
    
    in vec2 vertexPosition;
    in vec3 vertexColour;

    out vec3 fragmentColour;
    
    void main() {
        fragmentColour = vertexColour;
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
        }`;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSourceCode);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        const errorMessage = gl.getShaderInfoLog(vertexShader);
        showError(`Failed to compile vertex shader: ${errorMessage}`);
        return;
    }
    
    const fragmentShaderSourceCode = `#version 300 es
    precision mediump float;
    
    in vec3 fragmentColour;
    out vec4 outputColor;
    
    void main() {
        outputColor = vec4(fragmentColour, 1.0);
        }`;
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        const errorMessage = gl.getShaderInfoLog(fragmentShader);
        showError(`Failed to compile fragment shader: ${errorMessage}`);
        return;
    }
    
    const glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        const errorMessage = gl.getProgramInfoLog(glProgram);
        showError(`Failed to link GPU program: ${errorMessage}`);
        return;
    }
    gl.useProgram(glProgram)
    
    // Attribute locations allow us to talk about which shader input should
    //  read from which GPU buffer in the later "vertexAttribPointer" call.
    // NOTE - WebGL 2 and OpenGL 4.1+ should use VertexArrayObjects instead,
    //  which I'll cover in the next tutorial.
    const vertexPositionAttributeLocation = gl.getAttribLocation(glProgram, 'vertexPosition');
    const vertexColourAttributeLocation = gl.getAttribLocation(glProgram, 'vertexColour');
    if (vertexPositionAttributeLocation < 0 || vertexColourAttributeLocation < 0) {
        showError(`Failed to get attribute location for vertexPosition`);
        return;
    }
    return [gl, glProgram, vertexPositionAttributeLocation, vertexColourAttributeLocation]
}

function DrawShape(vertices, colours, indices) {
    //
    // Create a list of [X, Y] coordinates belonging to the corners ("vertices")
    //  of the triangle that will be drawn by WebGL.
    //
    
    const vertBufferData = new Float32Array(vertices);
    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertBufferData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const indexBufferData = new Uint16Array(indices);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const colourBufferData = new Float32Array(colours);
    const colourBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colourBufferData, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.vertexAttribPointer(posAttribs, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(posAttribs)

    gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
    gl.vertexAttribPointer(colourAttribs, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(colourAttribs)

    // gl.clearColor(0.5, 0.5, 0.5, 0.9);
    // Draw call (Primitive assembly (which vertices form triangles together?))
    // gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
}

export function DrawShapes(shapes, light = true) {
    // Takes in list of [ [vert coords..], [colour] ]

    // Resets Canvas of old shapes
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(light,light,light,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // For each shape
    for (var i in shapes) {
        // console.log(shape)
        const verts = shapes[i][0]
        const col = shapes[i][1]
        const indices = earcut(verts)
        const len = verts.length / 2
        let colours = []
        for (let x = 0; x < len; x++) {
            colours.push(col[0])
            colours.push(col[1])
            colours.push(col[2])
        }

        let j = 0
        // For each vertex index set generated, convert it into a set of the actual vertices, and draw
        while (j < indices.length) {
            DrawShape(verts, colours, indices)
            j += 3
        }
    }
}
  
const triangleVertices = [
    // Top middle
    0.0, 0.5,
    // Bottom left
    -0.5, -0.5,
    // Bottom right
    0.5, -0.5,
    0.5, 0.5
    , 0.3, 0.3
];

const indices2 = [
    // Top middle
    1.0, 1.5,
    // Bottom left
    0.5, 0.5,
    // Bottom right
    1.5, 0.5,
];

export function drawShape1() {
    DrawShapes([
        [triangleVertices, [0.1,0.5,0]]
    ])
}

export function drawShape2() {
    DrawShapes([
        [triangleVertices, [0.1,1,1]], 
        [indices2, [0.2,1,1]]
    ])
}

let val = PrepareGPU()
const gl = val[0]
const program = val[1]
const posAttribs = val[2]
const colourAttribs = val[3]

try {
    // drawShape(triangleVertices);
    // drawShape(indices2)
} catch (e) {
    showError(`Uncaught JavaScript exception: ${e}`);
}