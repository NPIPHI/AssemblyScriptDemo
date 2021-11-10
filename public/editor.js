const canvas = document.getElementById("canvas");
const status_text = document.getElementById("status");
const input_text = document.getElementById("code-area");
const run_button = document.getElementById("run-button");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 1000;

let instance = null;

window.onload = async ()=>{
    input_text.editor.setValue(`

    use crate::shape::*;

    pub fn make_shape(val: f64)->Shape{
        let mut pts = Vec::new();
    
        let n = 100;
    
        for i in 0..n {
            let n_theta = i as f64 / n as f64 * 6.28;
            pts.push(Point::new(n_theta.cos()*100.0*val+100.0, n_theta.sin()*100.0*val+100.0));
        }
    
        return Shape::new(pts);
    }
    
`);


    let file = await fetch("startup.wasm");
    let bin = await file.arrayBuffer();
    let inst = await instantiate(bin);
    instance = inst; 
}

async function compile(source) {
    headers = {
        method: "POST",
        headers: {
            'Accept': "application/wasm",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({code: source, file_name: "make_shape.rs"})
    }

    const response = await fetch('/compile', headers);
    const buffer = await response.arrayBuffer();
    return buffer;
}

async function instantiate(binary){
    let {module, instance} = await WebAssembly.instantiate(binary, {env: {
        abort: console.error 
    }});

    return instance;
}


run_button.addEventListener("click", async ()=>{
    status_text.innerHTML = "compiling";
    let binary;
    binary = await compile(input_text.editor.getValue());
    // let a = document.createElement('a');
    // a.href = window.URL.createObjectURL(new Blob([binary], {type: "octet/stream"}));
    // a.download = "startup.wasm";
    // a.click();

    console.log("Binary size: ", binary.length);
    status_text.innerHTML = "instantiating";
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