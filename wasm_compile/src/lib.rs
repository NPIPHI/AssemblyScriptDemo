mod make_shape;
mod shape;

use make_shape::make_shape;

use wasm_bindgen::prelude::*;

static mut LEN: usize = 0;

#[wasm_bindgen]
pub fn run(val: f64) -> *mut () {
    let a = make_shape(val).points.into_boxed_slice();
    let len = a.len();
    let raw_ptr = Box::into_raw(a);
    unsafe {
        LEN = len;
    }
    return raw_ptr as *mut ();
}

#[wasm_bindgen]
pub fn len() -> usize {
    unsafe {
        return LEN;
    }
}

#[wasm_bindgen]
pub fn free(p: *mut ()){
    //deallocate the memory
    unsafe {
        Box::from_raw(p);
    }
}
