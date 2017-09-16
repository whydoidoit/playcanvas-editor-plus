import Accessor from './accessor'
import Face from './face'
import flatten from 'lodash/flatten'
import Vertex from './vertex'
import './vertex-format'

const validTypes = {
    "POSITION": true,
    "NORMAL": true,
    "TANGENT": true,
    "TEXCOORD0": true,
    "TEXCOORD1": true,
    "BLENDWEIGHT": true,
    "BLENDINDICES": true,
    "COLOR": true
}

function prepare(meshInstance, settings) {
    let vertices = new Map()
    let vb = meshInstance.mesh.vertexBuffer
    let locked = vb.lock()
    let format = vb.getFormat()
    let data = {}
    for (let j = 0; j < format.elements.length; j++) {
        let element = format.elements[j]
        if (validTypes[element.name]) {
            data[element.name] = new Accessor(element.offset, format.size, locked, element.dataType, element.numComponents)
        }
    }

    settings.normal = !!data.NORMAL
    settings.uv0 = !!data.TEXCOORD0
    settings.uv1 = !!data.TEXCOORD1
    settings.color = !!data.COLOR
    settings.blendWeights = !!data.BLENDWEIGHT
    settings.blendIndices = !!data.BLENDINDICES

    let verticesCount = data.POSITION.length
    for (let i = 0; i < verticesCount; i++) {
        vertices.set(i, new Vertex({
            index: i,
            n: data.NORMAL ? data.NORMAL.get(i) : new pc.Vec3,
            v: data.POSITION ? data.POSITION.get(i) : new pc.Vec3,
            uv0: data.TEXCOORD0 ? data.TEXCOORD0.get(i) : new pc.Vec2,
            uv1: data.TEXCOORD1 ? data.TEXCOORD1.get(i) : new pc.Vec2,
            color: data.COLOR ? data.COLOR.get(i) : new pc.Vec3,
            bw: data.BLENDWEIGHT ? data.BLENDWEIGHT.get(i) : new pc.Vec4,
            bi: data.BLENDINDICES ? data.BLENDINDICES.get(i) : new pc.Vec4
        }))
    }

    return vertices
}

function calculateFaces(meshInstance, vertices) {
    let faces = new Set
    let ib = meshInstance.mesh.indexBuffer[0]
    let ibLocked = ib.lock()
    let indexes = new Accessor(0, 2, ibLocked, pc.ELEMENTTYPE_UINT16, 1)
    let numFaces = meshInstance.mesh.primitive[0].count
    let base = meshInstance.mesh.primitive[0].base
    for (let i = 0, l = numFaces; i < l; i += 3) {
        let face = new Face({
            vertices: [
                indexes.get(base + i),
                indexes.get(base + i + 1),
                indexes.get(base + i + 2)
            ]
        }, vertices)

        face.v0.faces.add(face)
        face.v1.faces.add(face)
        face.v2.faces.add(face)
        face.v0.neighbours.add(face.v1)
        face.v0.neighbours.add(face.v2)
        face.v1.neighbours.add(face.v0)
        face.v1.neighbours.add(face.v2)
        face.v2.neighbours.add(face.v1)
        face.v2.neighbours.add(face.v0)
        faces.add(face)

    }
    return faces
}

function specifyPreserved(vertices) {
    vertices.forEach(v => {
        v.neighbours.forEach(u => {
            let faces = 0
            v.faces.forEach(f => {
                if (f.hasVertex(u)) faces++
            })
            if (faces < 2) {
                v.preserve = true
                u.preserve = true
            }
        })
    })
}

function calculateErrors(vertices) {
    vertices.forEach(v => v.calculateError(vertices))
}

function removeFaces(numberOfFaces, vertices, faces) {
    while (faces.size > numberOfFaces) {
        let u = lowestCost(vertices)
        if (!u || u.removalCost > 10000) break
        let v = u.removalCandidate
        collapse(vertices, faces, u, v)
    }
}

function collapse(vertices, faces, u, v) {

    let tmpNeighbours = Array.from(u.neighbours).concat(Array.from(v.neighbours))

    //Find all of the faces that are on u->v
    let removeFaces = Array.from(faces).filter(face => face.hasVertex(v) && face.hasVertex(u))

    let recalc = new Set
    Array.from(faces).filter(f => f.hasVertex(u)).forEach(face => {
        face.v.forEach(v => {
            recalc.add(v)
            v.neighbours.forEach(v => recalc.add(v))
        })

        face.replace(u, v)

    })


    removeFaces.forEach(face => {
        face.v.forEach(v => {
            v.faces.delete(face)
            recalc.add(v)
            v.neighbours.forEach(v => v.faces.forEach(f => {
                f.v.forEach(v => {
                    v.neighbours.forEach(v => recalc.add(v))
                    recalc.add(v)
                })

            }))
        })
        faces.delete(face)
    })
    tmpNeighbours.forEach(v => v.neighbours.forEach(v => recalc.add(v)))
    Array.from(recalc).forEach(v => {
        v.reconstructNeighbours()
        v.neighbours.forEach(v => v.reconstructNeighbours())
    })

    v.n = Array.from(v.faces).reduce((a, face) => a.add(face.normal), new pc.Vec3).normalize()

    vertices.delete(u.index)
    Array.from(vertices.values()).forEach(v => {
        v.calculateError(vertices)
    })
}

function lowestCost(vertices) {
    let lowestCost = Infinity
    let lowest = null
    vertices.forEach(v => {
        if (v.removalCost < lowestCost) {
            lowestCost = v.removalCost
            lowest = v
        }
    })
    return lowest
}

function buildMesh(vertices, faces, settings) {
    let remap = new Map
    let index = 0
    let verts = Array.from(vertices.values())
    verts.forEach(v => {
        remap.set(v.index, index++)
    })

    let pos = flatten(verts.map(v => Array.from(v.v.data)))
    let normals = flatten(verts.map(v => Array.from(v.n.data)))
    let uvs = flatten(verts.map(v => Array.from(v.uv0.data)))
    let uvs1 = flatten(verts.map(v => Array.from(v.uv1.data)))
    let indices = flatten(Array.from(faces).map(face => face.vertices)).map(v => remap.get(v))
    let blendWeights = flatten(verts.map(v => Array.from(v.bw.data).slice(0, 2)))
    let blendIndices = flatten(verts.map(v => Array.from(v.bi.data).slice(0, 2)))
    let tangents = settings.normal && settings.uv0 ? pc.calculateTangents(pos, normals, uvs, indices) : null

    let mesh = pc.createMesh(pc.app.graphicsDevice, pos, {
        normals: settings.normal ? normals : null,
        indices,
        uvs: settings.uv0 ? uvs : null,
        uvs1: settings.uv1 ? uvs1 : null,
        colors: settings.color ? verts.map(v => v.color) : null,
        tangents: tangents,
        blendWeights: settings.blendWeights ? blendWeights : null,
        blendIndices: settings.blendIndices ? blendIndices : null,
    })

    return mesh
}

function decimate(numberOfFaces, meshInstance) {
    let settings = {}
    let vertices = prepare(meshInstance, settings)
    let faces = calculateFaces(meshInstance, vertices)
    calculateErrors(vertices)
    specifyPreserved(vertices)
    removeFaces(numberOfFaces, vertices, faces)
    return buildMesh(vertices, faces, settings)
}


export default decimate

