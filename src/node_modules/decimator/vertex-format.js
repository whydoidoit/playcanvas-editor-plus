var _typeSize = [];
_typeSize[pc.ELEMENTTYPE_INT8] = 1;
_typeSize[pc.ELEMENTTYPE_UINT8] = 1;
_typeSize[pc.ELEMENTTYPE_INT16] = 2;
_typeSize[pc.ELEMENTTYPE_UINT16] = 2;
_typeSize[pc.ELEMENTTYPE_INT32] = 4;
_typeSize[pc.ELEMENTTYPE_UINT32] = 4;
_typeSize[pc.ELEMENTTYPE_FLOAT32] = 4;
var VertexFormat = function (graphicsDevice, description) {
    var i, len, element;
    this.elements = [];
    this.hasUv0 = false;
    this.hasUv1 = false;
    this.hasColor = false;
    this.size = 0;
    for (i = 0, len = description.length; i < len; i++) {
        var elementDesc = description[i];
        element = {
            name: elementDesc.semantic,
            offset: 0,
            stride: 0,
            stream: -1,
            scopeId: graphicsDevice.scope.resolve(elementDesc.semantic),
            dataType: elementDesc.type,
            numComponents: elementDesc.components,
            normalize: elementDesc.normalize === undefined ? false : elementDesc.normalize,
            size: elementDesc.components * _typeSize[elementDesc.type]
        };
        this.elements.push(element);
        this.size += element.size;
        if (elementDesc.semantic === pc.SEMANTIC_TEXCOORD0) {
            this.hasUv0 = true;
        } else {
            if (elementDesc.semantic === pc.SEMANTIC_TEXCOORD1) {
                this.hasUv1 = true;
            } else {
                if (elementDesc.semantic === pc.SEMANTIC_COLOR) {
                    this.hasColor = true;
                }
            }
        }
    }
    this.size = Math.ceil(this.size/4) * 4
    var offset = 0;
    for (i = 0, len = this.elements.length; i < len; i++) {
        element = this.elements[i];
        element.offset = offset;
        element.stride = this.size;
        offset = Math.ceil(element.size/4) * 4 + offset;
    }
};

pc.VertexFormat = VertexFormat
