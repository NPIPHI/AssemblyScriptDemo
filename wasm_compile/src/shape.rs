pub struct Point {
    pub x: f64, 
    pub y: f64
}

impl Point {
    pub fn new(x: f64, y: f64) -> Point{
        return Point{x : x, y: y};
    }
}

pub struct Shape {
    pub points: Vec<Point>
}

impl Shape {
    pub fn new(pts: Vec<Point>) -> Shape{
        return Shape{points: pts};
    }
}