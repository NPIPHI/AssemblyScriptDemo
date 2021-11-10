

    use crate::shape::*;

    pub fn make_shape(val: f64)->Shape{
        let mut pts = Vec::new();
    
        let n = 100;
    
        for i in 0..n {
            let n_theta = i as f64 / n as f64 * 6.28;
            pts.push(Point::new(n_theta.cos()*200.0*val+100.0, n_theta.sin()*100.0*val+100.0));
        }
    
        return Shape::new(pts);
    }
    
