import {V} from 'working'

export default function calculateNormal(v0, v1, v2) {
    return new pc.Vec3().cross(V(v1).sub(v0), V(v2).sub(v0)).normalize()
}
