const canvas = document.getElementById("canvas");
const status_text = document.getElementById("status");
const input_text = document.getElementById("code-area");
const run_button = document.getElementById("run-button");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth/2;
canvas.height = window.innerWidth/2;

let instance = null;

const main_file = `
import {ArrRet} from "./shape"
import {make_shape} from "./module"

export function main(val: f64): ArrRet {
    __reset();
    return make_shape(val).encode();
}

`
const shape_file = `
export class Point{
    constructor(x: f64, y: f64){
        this.x = x;
        this.y = y;
    }
    x: f64;
    y: f64;
}
export class ArrRet{
    begin: usize;
    len: u32;
    arr: Float64Array;
    constructor(b: usize, len: u32, arr: Float64Array){
        this.begin = b;
        this.len = len;
        this.arr = arr;
    }
}

export class Shape{
    points: Point[];
    constructor(pts: Point[]){
        this.points = pts;
    }

    encode(): ArrRet {
        const arr = new Float64Array(this.points.length * 2);
        for(let i = 0; i < this.points.length; i++){
            arr[i*2] = this.points[i].x;
            arr[i*2+1] = this.points[i].y;
        }
        return new ArrRet(arr.dataStart, arr.length, arr);
    }
}
`

window.onload = async ()=>{
    input_text.editor.setValue(`
import {Shape, Point} from "./shape";

/*

class Shape {
    points: Point[];
}

class Point {
    x: f64;
    y: f64;
}

*/
//val goes in a sin wave from 0 to 1
export function make_shape(val: f64): Shape {
    const pts: Point[] = [];
    const n: f64 = 20;

    for(let i = 0; i < n; i++){
        const f: f64 = n;
        let x1 = Math.cos(i/n*6.28);
        let x2 = Math.cos(i/n*6.28+0.05);
        let y1 = Math.sin(i/n*6.28);
        let y2 = Math.sin(i/n*6.28+0.05);
        let dx = 300;
        let dy = 300;
        let a = (val + 0.1)*100;
        let b = (1 - val + 0.1)*100;

        pts.push(new Point(x1*a+dx,y1*a+dy));
        pts.push(new Point(x2*b+dx,y2*b+dy));
    }
    return new Shape(pts);
}
`);


    let file = await fetch("startup.wasm");
    let bin = await file.arrayBuffer();
    let inst = await instantiate(bin);
    instance = inst; 
}

function compile(source) {
return new Promise((resolve, reject)=>{
    const stdout = asc.createMemoryStream();
    const stderr = asc.createMemoryStream();
    asc.main([
        "main.ts",
        "-Os",
        "--runtime", "stub",
        "--binaryFile", "module.wasm",
        // "--textFile", "module.wat",
        // "--sourceMap"
    ], {
        stdout,
        stderr,
        readFile(name, baseDir) {
            switch(name){
                case "module.ts":
                    return source;
                case "shape.ts":
                    return shape_file;
                case "main.ts":
                    return main_file;
                default:
                    return null;
            }
        },
        writeFile(name, data, baseDir) {
        resolve(data);
        },
        listFiles(dirname, baseDir) {
        return [];
        }
    }, err => {
        reject({stdout: stdout.toString(), stderr: stderr.toString(), err: err});
    });
});
}

async function instantiate(binary){
    let {module, instance} = await WebAssembly.instantiate(binary, {env: {
        abort: console.error 
    }});

    return instance;
}

async function run(source) {
    let {module, instance} = await WebAssembly.instantiate(await compile(source));

    return instance.exports.main();
}



run_button.addEventListener("click", async ()=>{
    status_text.innerHTML = "compiling";
    let binary;
    try {
    binary = await compile(input_text.editor.getValue());
    
    // let a = document.createElement("a");
    // a.href = window.URL.createObjectURL(new Blob([binary.buffer], {type: "octet/stream"}));
    // a.download = "startup.wasm";
    // a.click();
    } catch(e){
        status_text.innerHTML = e.stderr;
        instance = null;
        return;
    }
    
    console.log("Binary size: ", binary.length);
    status_text.innerHTML = "running";
    const imports = {
        imports: {
           
        },
        env: {
            abort: console.error
        }
    }
    let wasm = await WebAssembly.instantiate(binary, imports);
    instance = wasm.instance;
    status_text.innerHTML = "done";
});

let frame_count = 0;

function loop(){
    if(!instance) return;
    frame_count++;
    let result = instance.exports.main((Math.sin(frame_count/100) + 1)/2);
    status_text.innerHTML = "Mem: " + result;
    const u32 = new Uint32Array(instance.exports.memory.buffer);
    const f64 = new Float64Array(instance.exports.memory.buffer);
    const begin = u32[result/4]/8;
    const len = u32[result/4 + 1];
    const points_arr = f64.subarray(begin, begin + len);

    ctx.clearRect(0,0,1000,1000);
    ctx.fillStyle = '#f00';
    ctx.beginPath();

    ctx.moveTo(points_arr[0], points_arr[1]);
    for(let i = 1; i < points_arr.length / 2; i++){
        ctx.lineTo(points_arr[i*2],points_arr[i*2 + 1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function main_loop(){
    loop();
    requestAnimationFrame(main_loop);
}

requestAnimationFrame(main_loop)