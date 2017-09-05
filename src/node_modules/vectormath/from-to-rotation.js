import {V, Q} from 'working'
import getPosition from 'position'

function orthogonal(v) {

    var x = Math.abs(v.x)
    var y = Math.abs(v.y)
    var z = Math.abs(v.z)
    var other = x < y
        ? ( x < z
            ? pc.Vec3.RIGHT
            : pc.Vec3.FORWARD )
        : ( y < z
            ? pc.Vec3.UP
            : pc.Vec3.FORWARD )
    return V().cross(v, other)
}

function fromToRotation(v1, v2, q) {
    let kct = v1.dot(v2)
    q = q || Q()
    if (kct <= -0.999) {
        q.w = 0
        var v = orthogonal(v1).normalize()
        q.x = v.x
        q.y = v.y
        q.z = v.z
        return q
    }
    let half = V(v1).add(v2).scale(0.5)
    q.w = v1.dot(half)
    let cross = V().cross(v1, half)
    q.x = cross.x
    q.y = cross.y
    q.z = cross.z
    return q.normalize()

}
let fromForwardToUp = new pc.Quat()


try {
    fromForwardToUp.copy(fromToRotation(pc.Vec3.FORWARD, pc.Vec3.RIGHT))
} catch(e) {
    console.error(e)
}

pc.Quat.prototype.fromToRotation = function(v1,v2) {
    return fromToRotation(v1, v2, this)
}

pc.Quat.prototype.twist = function(axis) {
    let orth = orthogonal(axis)
    let transformed = this.transformVector(orth, V())
    let flattened = V(transformed).sub(V(axis).scale(transformed.dot(axis))).normalize()
    let angle = Math.acos(orth.dot(flattened)) * pc.math.RAD_TO_DEG
    return V(this.x, this.y, this.z).dot(axis) > 0 ? -angle : angle
}

let m = new pc.Mat4

pc.Quat.prototype.lookAt = function(from, to, up) {
    m.setLookAt(from, to, up || pc.Vec3.UP)
    this.setFromMat4(m)
    return this
}

let oldMul = pc.Vec3.prototype.mul

pc.Vec3.prototype.mul = function(p0,p1,p2) {
    if(p0 instanceof pc.Quat) {
        return p0.transformVector(this, this)
    } else
        return oldMul.call(this, p0,p1,p2)
}

let alternateFacing = new pc.Quat().setFromAxisAngle(pc.Vec3.UP, 180)

pc.Entity.prototype.lookRotation = function(entityOrPosition, backward) {
    let rotation = Q(this.getRotation())
    this.lookAt(V(getPosition(entityOrPosition)).Y(this.getPosition().y))
    let targetRotation = Q(this.getRotation())
    if(!backward) {
        targetRotation.mul(alternateFacing)
    }
    this.setRotation(rotation)
    return targetRotation
}

pc.Entity.prototype.dot = function(entityOrPosition) {
    if(entityOrPosition instanceof pc.Quat) {
        let forward = entityOrPosition.transformVector(pc.Vec3.BACK, V())
        return this.forward.dot(forward)
    }
    let vector = V(getPosition(entityOrPosition)).sub(this.getPosition()).normalize()
    return this.forward.dot(vector)
}

export {fromForwardToUp, fromToRotation, orthogonal}
