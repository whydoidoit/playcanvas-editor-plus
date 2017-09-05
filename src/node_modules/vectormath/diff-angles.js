import {V} from 'working'

function angleBetween(vector1, vector2, up) {
    up = up || pc.Vec3.UP
    return Math.atan2(V().cross(vector1, vector2).dot(up), vector1.dot(vector2)) * pc.math.RAD_TO_DEG
}

pc.Vec3.prototype.angle = function(vector, up) {
    return angleBetween(this, vector, up)
}

export default angleBetween
