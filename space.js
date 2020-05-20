var canvas;
var gl;

var numTimesToSubdivide = 6;
 
var index = 0;

var pointsArray = [];
var normalsArray = [];


var near = -15;
var far = 15;
var radius = 1.5;
var theta  = 0.0;
var moon_theta  = 0.0;

var phi    = 0.0;
var dr = 1 * Math.PI/180.0; //rotating speed
var moon_dr = 5 * Math.PI/180.0; //moon's rotating speed


var left = -10.0, right = 10.0, ytop =10.0, bottom = -10.0;
var left_m1 = -15.0, right_m1 = 15.0, ytop_m1 =15.0, bottom_m1 = -15.0;

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
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

    render();
}


function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f( typeLoc, 0);
    eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    
    var t = translate(-4, 0, -4);
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix,t);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    

    // normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders
    
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
    
    index = 0;
    pointsArray = []; 
    normalsArray = [];

    left = -5.0;right = 5.0;ytop =5.0;bottom = -5.0;
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    gl.uniform1f( typeLoc, 1);
    eye = vec3(radius*Math.sin(moon_theta)*Math.cos(phi), 
        radius*Math.sin(moon_theta)*Math.sin(phi), radius*Math.cos(moon_theta));

    var t = translate(-1, 0, 0);
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix,t);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    

    // normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders
    
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

    
    index = 0;
    pointsArray = []; 
    normalsArray = [];
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    gl.uniform1f( typeLoc, 1);
    eye = vec3(radius*Math.sin(moon_theta)*Math.cos(phi), 
        radius*Math.sin(moon_theta)*Math.sin(phi), radius*Math.cos(moon_theta));

    t = translate(-9, 0, 0);
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix,t);
    projectionMatrix = ortho(left_m1, right_m1, bottom_m1, ytop_m1, near, far);

    
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
    left = -10.0;right = 10.0;ytop =10.0;bottom = -10.0;

    theta += dr;
    moon_theta += moon_dr;
    
    window.requestAnimFrame(render);
}