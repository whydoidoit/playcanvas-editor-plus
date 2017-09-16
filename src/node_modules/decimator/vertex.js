import calculateNormal from './calculate-normal'
import Triangle from './triangle'

function Vertex(options) {
    this.faces = new Set
    this.neighbours = new Set
    Object.assign(this, options)
}

Object.defineProperties(Vertex.prototype, {
    hasNormal: {
        get: function () {
            return this.n && this.n.lengthSq()
        }
    },
    area: {
        get: function () {
            let totalArea = 0
            let maxArea = 0
            this.faces.forEach(f => {
                let a = f.area
                if (a > maxArea) {
                    maxArea = a
                }
                totalArea += a
            })
            return totalArea
        }
    }
})

Vertex.prototype.replace = function (u, v) {
    this.neighbours.delete(u)
    if (this.index !== v.index) {
        this.neighbours.add(v)
    }
}

Vertex.prototype.reconstructNeighbours = function () {
    let neighbours = new Set
    let faces = new Set
    Array.from(this.faces).filter(face => face.hasVertex(this)).forEach(face => faces.add(face))
    faces.forEach(face => {
        neighbours.add(face.v0)
        neighbours.add(face.v1)
        neighbours.add(face.v2)
        neighbours.delete(this)
    })
    neighbours.forEach(n => {
        n.removalCandidate = null
        n.removalCost = Infinity
    })
    this.removalCandidate = null
    this.removalCost = Infinity
    this.neighbours = neighbours
    this.faces = faces
}

Vertex.prototype.calculateError = function (vertices) {
    if (this.removalCandidate) return

    let triangle = new Triangle()
    this.removalCandidate = null
    this.removalCost = Infinity
    if (this.preserve) return
    this.neighbours.forEach(u => {
        if (u.preserve) return
        let additionalError = 0
        let ok = true
        Array.from(this.faces).every(f => {
            let test = f.v
                .map(v => v === this ? u : this)

            var updatedNormal = calculateNormal(test[0].v, test[1].v, test[2].v)
            if (updatedNormal.lengthSq() > 0.0001 && updatedNormal.dot(f.normal) <= 0) {
                ok = false
                return false
            }
            triangle.v1 = test[0].v
            triangle.v2 = test[1].v
            triangle.v3 = test[2].v
            let bary = triangle.bary(this.v)
            if (bary.x >= 0 && bary.y >= 0 && bary.x >= 0) {
                let uv = triangle.calculateUV(bary, [test[0].uv0, test[1].uv0, test[2].uv0])
                additionalError = Math.max(additionalError, uv.sub(this.uv0).length())
            }


        })
        if (!ok) return
        let curvature = 0
        let candidateFaces = Array.from(u.faces).filter(f => f.hasVertex(this))
        if (candidateFaces.length >= 2) {
            u.faces.forEach(face => {
                var minCurve = 1
                candidateFaces.forEach(s => {
                    let dot = face.normal.dot(s.normal) * this.hasNormal ? this.n.dot(u.n) : 1
                    minCurve = Math.min(minCurve, (1 - dot) / 2)
                })
                curvature = Math.max(curvature, minCurve)
            })

            let error = (curvature*2) + additionalError

            if (error < this.removalCost) {
                this.removalCost = error
                this.removalCandidate = u
            }
        }

    })
}

export default Vertex
