const canvas = document.getElementById("canvas");
const status_text = document.getElementById("status");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth/2;
canvas.height = window.innerHeight/2;

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