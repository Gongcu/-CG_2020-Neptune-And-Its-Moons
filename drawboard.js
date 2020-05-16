var canvas;
var gl;

var NumVertices = 18;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [0, 0, 0];

var thetaLoc;
var mvLoc;

var startX=0, startY=0;
var curX=0, curY=0;
var dragging = false;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    colorPyramid();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST); // 깊이 정보를 사용

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    
    //buffer object를 gpu에 생성하여 colors 데이터를 gpu에 load
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    //program 내의 vColor 변수를 gpu 내부 데이터버퍼와 연결
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);



    //buffer object를 gpu에 생성하여 points 데이터를 gpu에 load
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    //program 내의 vPosition 변수를 gpu 내부 데이터버퍼와 연결
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //program 내의 uniform 변수를 포인팅
    thetaLoc = gl.getUniformLocation(program, "theta");

    //event listeners
    this.canvas.addEventListener("mousemove",function(e){move(e),false});
    this.canvas.addEventListener("mousedown",function(e){down(e),false});
    this.canvas.addEventListener("mouseup",function(e){up(e),false});
    this.canvas.addEventListener("mouseout",function(e){out(e),false});

    this.document.getElementById("pencil").onclick = function (){
        //to-do pencil work
    };
    this.document.getElementById("eraser").onclick = function (){
        //to-do eraser work
    };
    this.document.getElementById("spoid").onclick = function (){
        //to-do spoid work
    };
    this.document.getElementById("scaling").onclick = function (){
        //to-do scaling work
    };

    render();
}

function colorPyramid() {
    //1개의 사각형 4개의 삼각형
    quad(1, 0, 3, 2);
    triangle(1, 4, 0);
    triangle(0, 3, 4);
    triangle(4, 2, 3);
    triangle(2, 4, 1);
}

function quad(a, b, c, d) {
    var vertices = [
        vec4(-0.5, -0.5, 0, 1.0),
        vec4(-0.5, 0.5, 0, 1.0),
        vec4(0.5, 0.5, 0, 1.0),
        vec4(0.5, -0.5, 0, 1.0)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push([0.0, 1.0, 0.0, 1.0]);

    }
}
function triangle(a, b, c) {
    var vertices = [
        vec4(-0.5, -0.5, 0, 1.0),
        vec4(-0.5, 0.5, 0, 1.0),
        vec4(0.5, 0.5, 0, 1.0),
        vec4(0.5, -0.5, 0, 1.0),
        vec4(0, 0, 0.75, 1.0)
    ];

    var vertexColors = [
        [0.0, 0.0, 0.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0]
    ];
    var indices = [a, b, c];

    for (var i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        colors.push(vertexColors[a]);

    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    theta[axis] += 2.0;

    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    requestAnimFrame(render);
}

function down(e){
    startX=e.offsetX; startY=e.offsetY; dragging=true;
}

function up(e){
    dragging = false;
}
function out(e){
    dragging = false;
}

function move(e){
    if(!dragging) return;
    var curX= e.offsetX, curY= e.offsetY;
    draw(curX, curY);
    startX=curX; startY=curY;
}

function draw(curX, curY){
    /*
     start to cur work
    */ 
}

