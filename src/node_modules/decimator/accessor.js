function defaultTransform(v) {
    return v
}

function Accessor(offset, stride, buffer, type, components, transformer) {
    var transform = function(fn) {
        return function(param1, param2, param3) {
            return (transformer || defaultTransform)(fn.call(this, param1, param2, param3))
        }
    }.bind(this)
    this.stride = stride || 1
    switch (type) {
        case pc.ELEMENTTYPE_INT8:
            this.size = 1
            this.data = new Int8Array(buffer, offset)
            break
        case pc.ELEMENTTYPE_UINT8:
            this.size = 1
            this.data = new Uint8Array(buffer, offset)
            break
        case pc.ELEMENTTYPE_INT16:
            this.size = 2
            this.data = new Int16Array(buffer, offset)
            this.stride /= 2
            break
        case pc.ELEMENTTYPE_UINT16:
            this.size = 2
            this.data = new Uint16Array(buffer, offset)
            this.stride /= 2
            break
        case pc.ELEMENTTYPE_INT32:
            this.size = 4
            this.data = new Int32Array(buffer, offset)
            this.stride /= 4
            break
        case pc.ELEMENTTYPE_UINT32:
            this.size = 4
            this.data = new Uint32Array(buffer, offset)
            this.stride /= 4
            break
        case pc.ELEMENTTYPE_FLOAT32:
            this.size = 4
            this.data = new Float32Array(buffer, offset)
            this.stride /= 4
            break
    }
    this.components = components
    switch (components) {

        case 2:
            this.get = transform(this.vec2)
            break
        case 3:
            this.get = transform(this.vec3)
            break
        case 4:
            this.get = transform(this.vec4)
            break
        default:
            this.get = transform(this._get)
            break
    }

}

Accessor.prototype._get = function (index, offset) {
    offset = offset || 0
    return this.data[index * this.stride + offset]
}
Accessor.prototype.vec3 = function (index) {
    return new pc.Vec3(this._get(index), this._get(index, 1), this._get(index, 2))
}
Accessor.prototype.vec4 = function (index) {
    return new pc.Vec4(this._get(index), this._get(index, 1), this._get(index, 2), this._get(index, 3))
}
Accessor.prototype.vec2 = function (index) {
    return new pc.Vec2(this._get(index), this._get(index, 1))
}
Object.defineProperties(Accessor.prototype, {
    length: {
        get: function () {
            return this.data.length / this.stride
        }
    }
})

export default Accessor
