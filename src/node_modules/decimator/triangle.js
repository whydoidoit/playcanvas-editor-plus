import calculateNormal from './calculate-normal'
import {V} from 'working'

function Triangle() {
    this.points = [new pc.Vec3, new pc.Vec3, new pc.Vec3]
}
Object.defineProperties(Triangle.prototype, {
    v1: {
        get: function() {
            return this.points[0]
        },
        set: function(v) {
            this.points[0].copy(v)
        }
    },
    v2: {
        get: function() {
            return this.points[1]
        },
        set: function (v) {
            this.points[1].copy(v)
        }
    },
    v3: {
        get: function() {
            return this.points[2]
        },
        set: function (v) {
            this.points[2].copy(v)
        }
    },
    normal: {
        get: function() {
            return calculateNormal(this.v1, this.v2, this.v3)
        }
    },
    area: {
        get: function() {
            return Math.max(0.00000001, this.normal.dot(V().cross(V(this.v2).sub(this.v1), V(this.v3).sub(this.v1))))
        }
    },
    planeD: {
        get: function() {
            return - this.v2.dot(this.normal)
        }
    }

})

Triangle.prototype.bary = function(point) {
    let result = new pc.Vec3
    result.x = this.normal.dot(V().cross(V(this.v2).sub(point), V(this.v3).sub(point))) / this.area
    result.y = this.normal.dot(V().cross(V(this.v3).sub(point), V(this.v1).sub(point))) / this.area
    result.z = 1 - result.x - result.y
    return result
}

Triangle.prototype.calculateUV = function(bary, uvs) {
    let uv0 = new pc.Vec2
    let uv1 = new pc.Vec2
    let uv2 = new pc.Vec2
    uv0.copy(uvs[0])
    uv1.copy(uvs[1])
    uv2.copy(uvs[2])
    return uv0.scale(bary.x).add(uv1.scale(bary.y)).add(uv2.scale(bary.z))
}

Triangle.prototype.point = function(baryCoord, distance) {
    let result = new pc.Vec3
    result.x = (baryCoord.x * this.v1.x) + (baryCoord.y * this.v2.x) + (baryCoord.z * this.v3.x)
    result.y = (baryCoord.x * this.v1.y) + (baryCoord.y * this.v2.y) + (baryCoord.z * this.v3.y)
    result.x = (baryCoord.x * this.v1.z) + (baryCoord.y * this.v2.z) + (baryCoord.z * this.v3.z)
    return result.add(V(this.normal).scale(distance))
}

export default Triangle
