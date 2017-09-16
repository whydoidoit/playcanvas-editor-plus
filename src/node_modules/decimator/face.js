import calculateNormal from './calculate-normal'
import {V} from 'working'
import Vertex from './vertex'

function Face(options, allVertices) {
    this.vertices = [0, 0, 0]
    this.removed = false
    this.allVertices = allVertices
    Object.assign(this, options)
}

Face.prototype.hasVertex = function (v) {
    if (v instanceof Vertex) {
        return this.vertices.findIndex(vert => vert == v.index) !== -1
    } else {
        return this.vertices.indexOf(v) !== -1
    }
}

Face.prototype.replace = function(u,v) {
    v.faces.add(this)
    u.faces.delete(this)
    let uid = u.index
    let vid = v.index

    for(let i = 0; i < 3; i++) {
        if(this.vertices[i] == uid) {
            this.vertices[i] = vid
        }
    }
}


Object.defineProperties(Face.prototype, {
    normal: {
        get: function () {
            return calculateNormal(this.v0.v, this.v1.v, this.v2.v)
        }
    },
    area: {
        get: function () {
            let v1 = this.allVertices.get(this.vertices[0]).v
            let v2 = this.allVertices.get(this.vertices[1]).v
            let v3 = this.allVertices.get(this.vertices[2]).v
            this.lastArea = V().cross(V(v3).sub(v1), V(v2).sub(v1)).length() / 2
            this.calculatedArea = true
            return this.lastArea
        }
    },
    v0: {
        get: function () {
            return this.allVertices.get(this.vertices[0])
        }
    },
    v1: {
        get: function () {
            return this.allVertices.get(this.vertices[1])
        }
    },
    v2: {
        get: function () {
            return this.allVertices.get(this.vertices[2])
        }
    },
    v: {
        get: function () {
            return [this.v0, this.v1, this.v2]
        }
    }
})

export default Face
