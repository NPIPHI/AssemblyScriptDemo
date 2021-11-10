import express from "express";
import bodyParser from "body-parser";
import child_process from "child_process";
import fs from "fs"
import { Stream } from "stream";

const app = express();
const port = 5500;


app.post('/compile', bodyParser.json(), (req, res) => {
    const {code, file_name} = req.body; 
    fs.writeFileSync("./wasm_compile/src/"+file_name, code);

    const child = child_process.spawn("wasm-pack", ["build", "--target", "web", "--release"], {
        stdio: [null, 'pipe', 'inherit'],
        cwd: "./wasm_compile"
    });

    child.stdout.on('close', code=>{
        res.send(fs.readFileSync("./wasm_compile/pkg/wasm_compile_bg.wasm"));
    });

    // let cout = fs.createWriteStream('./cout.txt');
    // child_process.execSync("wasm-pack build --target web --release", {cwd: "./wasm_compile", stdio: [null, cout, process.stderr]});
});

app.use(express.static('public'));

app.listen(port, ()=>{
    console.log(`listening on ${port}`)
})