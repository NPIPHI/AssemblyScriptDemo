const canvas = document.getElementById("canvas");
const status_text = document.getElementById("status");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 1000;

let instance = null;

window.onload = async ()=>{
    let file = await fetch("startup.wasm");
    let bin = await file.arrayBuffer();
    let inst = await instantiate(bin);
    instance = inst; 
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


let frame_count = 0;

function loop(){
    if(!instance) return;
    frame_count++;
    const ptr = instance.exports.run((Math.sin(frame_count/100) + 1)/2);
    const f64 = new Float64Array(instance.exports.memory.buffer);
    const len = instance.exports.len();
    const points_arr = f64.subarray(ptr/8, ptr/8 + len * 2);

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
    instance.exports.free(ptr);
}

function main_loop(){
    loop();
    requestAnimationFrame(main_loop);
}

requestAnimationFrame(main_loop)