var canvas;
var gl;

var numTimesToSubdivide = 6;
 
var index = 0;

var pointsArray = [];
var normalsArray = [];


var near = -20;
var far = 20;
var radius = 1.5;
var theta  = 0.0;
var moon_theta  = 0.0;
var ring_theta  = 0.0;

var phi    = 0.0;
var dr = 1 * Math.PI/180.0; //rotating speed
var moon_dr = 5 * Math.PI/180.0; //moon's rotating speed
var ring_dr = 20 * Math.PI/180.0; //ring's rotating speed


var left = -70.0, right = 70.0, ytop =70.0, bottom = -70.0;
var left_m1 = -50.0, right_m1 = 50.0, ytop_m1 =50.0, bottom_m1 = -50.0;
var left_m2 = -5.0, right_m2 = 5.0, ytop_m2 =5.0, bottom_m2 = -5.0;
var left_ring = -50.0, right_ring = 50.0, ytop_ring =50.0, bottom_ring = -50.0;


var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.842809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);


var lightPosition = vec4(0.5, 0.0, 1.0, 0.0 );
var lightAmbient = vec4(0.1, 0.1, 0.0, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 0.1, 0.4, 0.8, 1.0 );
var materialDiffuseMoon = vec4( 1.0, 0.9, 0.5, 1.0 );
var materialDiffuseRing = vec4( 1.0, 0.0, 0.0, 1.0 );

var materialSpecular = vec4( 1.0, 0.0, 0.0, 1.0 );
var materialShininess = 5000.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMatrix, normalMatrixLoc;

var eye;
var at = vec3(-1, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
    
var typeLoc;


function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
    
     // normals are vectors
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);
     index += 3; 
}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        triangle( a, b, c );
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    typeLoc = gl.getUniformLocation(program, "type");

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    diffuseProductMoon = mult(lightDiffuse, materialDiffuseMoon);
    diffuseProductRing = mult(lightDiffuse, materialDiffuseRing);
    specularProduct = mult(lightSpecular, materialSpecular);

    
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);


    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    document.getElementById("Button0").onclick = function(){radius *= 2.0;};
    document.getElementById("Button1").onclick = function(){radius *= 0.5;};
    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};
    

    
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
        "diffuseProductMoon"),flatten(diffuseProductMoon) );
    gl.uniform4fv( gl.getUniformLocation(program, 
        "diffuseProductRing"),flatten(diffuseProductRing) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    moonDraw(0,translate(-20,0,5),left,right,bottom,ytop,theta);
    moonDraw(0,translate(-20,0,0),left_m1,right_m1,bottom_m1,ytop_m1,moon_theta);
    moonDraw(1,translate(-1,0,0),left_m2,right_m2,bottom_m2,ytop_m2,moon_theta);
    ringDrawDriven();
    
    theta += dr;
    moon_theta += moon_dr;
    ring_theta += ring_dr;
    
    window.requestAnimFrame(render);
}

function moonDraw(type,p, l,r,b,t,theta){
    index = 0; pointsArray = [];  normalsArray = [];

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    gl.uniform1i( typeLoc, type);
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix,p);
    projectionMatrix = ortho(l, r, b, t, near, far);

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    for( var i=0; i<index; i+=3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
}
function ringDraw(type,p, l,r,b,t){
    index = 0; pointsArray = [];  normalsArray = [];

    tetrahedron(va, vb, vc, vd, 3);

    gl.uniform1i( typeLoc, type);
    eye = vec3(radius*Math.sin(ring_theta)*Math.cos(phi), 
        radius*Math.sin(ring_theta)*Math.sin(phi), radius*Math.cos(ring_theta));

    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix,p);
    projectionMatrix = ortho(l, r, b, t, -10, far);

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        
    for( var i=0; i<index; i+=3) {
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
}
function ringDrawDriven() {
    ringDraw(10, translate(-10, 0,  5), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(10, 0,  5), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(10, 0, - 5), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-10, 0, - 5), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-5, 0, 10), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(5, 0,  10), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(5, 0, - 10), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-5, 0, - 10), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-6, 0, 9), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(6, 0, 9), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-6, 0, -9), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(6, 0, -9), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-9, 0, -6), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(9, 0, -6), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(-9, 0, 6), left_ring, right_ring, bottom_ring, ytop_ring);
    ringDraw(10, translate(9, 0, 6), left_ring, right_ring, bottom_ring, ytop_ring);
}