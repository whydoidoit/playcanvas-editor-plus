const MAX_CACHE = 2048

let quats = []
let vecs = []
let nextQuat = 0
let nextVec = 0

for (let i = 0; i < MAX_CACHE; i++) {
    vecs.push(new pc.Vec3)
    quats.push(new pc.Quat)
}

function Q(existing) {
    let q = quats[nextQuat++ & (MAX_CACHE-1)]
    if (existing != false) q.copy(existing || pc.Quat.IDENTITY)
    return q
}

function V(existing, y, z) {
    let v = vecs[nextVec++ & (MAX_CACHE-1)]
    if (y !== undefined && z !== undefined) {
        let d = v.data
        d[0] = existing
        d[1] = y
        d[2] = z
        return v
    }
    if (existing !== undefined) {
        let d1 = v.data
        let d2 = existing.data
        d1[0] = d2[0]
        d1[1] = d2[1]
        d1[2] = d2[2]
    }
    return v
}

pc.Vec3.temp = V
pc.Quat.temp = Q

export {Q, V}
