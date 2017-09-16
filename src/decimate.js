import m from 'mithril'
import decimate from 'decimator'
import MeshCreator from 'editor-mesh-creator'
import Accessor from 'decimator/accessor'
import validTypes from 'vertex-valid-types'
import './decimate.scss'

function round(v) {
    return Math.round(v * 1000) / 1000
}

const Overlay = {
    view: function () {
        return [m('.huge.single-line',
            m('i.fa.fa-compress.fa-large.warning'),
            m('span', m.trust("&nbsp;Decimation in progress..."))
        ),
            m('.single-line..subTitle.centered-text.full-width', "(c) Ixion Digital.  Mike Talbot 2015-2017. @whydoidoit"
            )
        ]
    }
}

let overlay = Overlay.overlay = new ui.Overlay();
overlay.class.add('decimate-warning');
overlay.class.add('ixion');
overlay.hidden = true;

let root = editor.call('layout.root');
root.append(overlay);

let label = new ui.Label({text: ""})
label.renderChanges = false
overlay.append(label);
m.mount(label._element, Overlay)

function shortDelay(duration) {
    return new Promise(function (resolve) {
        setTimeout(resolve, duration || 10)
    })
}


editor.on('attributes:inspect[asset]', function (assets) {
        if (assets.length === 1) {
            function process() {
                let asset = assets[0].json()
                if (asset.type !== 'model') return
                let panel = editor.call('attributes:addPanel', {
                    name: 'DECIMATE',
                })
                if (!asset.meta) {
                    editor.call('realtime:send', 'pipeline', {
                        name: 'meta',
                        id: asset.id
                    });
                    assets[0].once('meta:set', function () {
                        process()
                    })
                    return
                }
                panel.visible = false
                panel.class.add('component')
                panel.class.add('asset')
                let copyPanel = new ui.Panel()
                copyPanel.class.add('decimate')
                copyPanel.hidden = false
                panel.append(copyPanel)
                let replace = new ui.Panel()
                copyPanel.append(replace)

                let replaceExisting = false
                let maxTriangles = asset.meta.triangles
                if (!maxTriangles || maxTriangles < 10) return
                let minTriangles = Math.floor(maxTriangles * 0.25)
                let currentTriangles = maxTriangles

                async function runDecimation() {
                    try {
                        overlay.hidden = false
                        m.redraw()
                        await shortDelay(300)
                        let modelNode = new pc.GraphNode();
                        let modelPlaceholder = new pc.Model();
                        let materials = []
                        let mc = new MeshCreator
                        let skins = mc.skins
                        modelPlaceholder.node = modelNode;
                        let model = pc.app.assets.get(asset.id)._editorPreviewModel.clone()
                        let parent = mc.root

                        function recurseScan(node, parent) {
                            node.children
                                .forEach(child => {
                                    recurseScan(child, child.$node = mc.createNode(child.name, parent, child.getLocalPosition(), child.getLocalEulerAngles(), child.getLocalScale()))
                                })
                        }

                        parent.scale = Array.from(model.graph.getLocalScale().data).map(v => round(v))
                        recurseScan(model.graph, parent)
                        model.meshInstances.forEach(i => {
                            materials.push(i.material)
                            let newMesh = mc.createMesh()
                            let vertices = mc.createVertices()
                            let node = i.node.$node
                            let instance = mc.createMeshInstance(node, newMesh)
                            skins.push({
                                inverseBindMatrices: i.skinInstance.skin.inverseBindPose.map(v => Array.from(v.data).map(round)),
                                boneNames: i.skinInstance.skin.boneNames
                            })
                            let pos = vertices.position.data
                            let uv = vertices.texCoord0.data
                            let uv1 = vertices.texCoord1.data
                            let colors = vertices.color.data
                            let normal = vertices.normal.data
                            let indices = newMesh.indices
                            let blendIndices = vertices.blendIndices.data
                            let blendWeights = vertices.blendWeight.data
                            newMesh.vertices = vertices.$id
                            let faces = Math.floor((i.mesh.primitive[0].count / (maxTriangles * 3)) * currentTriangles)
                            let mesh = decimate(faces, i)
                            let vb = mesh.vertexBuffer
                            let locked = vb.lock()
                            let format = vb.getFormat()
                            let data = {}
                            for (let j = 0; j < format.elements.length; j++) {
                                let element = format.elements[j]
                                if (validTypes[element.name]) {
                                    data[element.name] = new Accessor(element.offset, format.size, locked, element.dataType, element.numComponents,
                                        v => Array.from(v.data)
                                            .map(d => round(d))
                                    )
                                }
                            }
                            let length = data.POSITION.length
                            for (let i = 0; i < length; i++) {
                                pos.push.apply(pos, data.POSITION.get(i))
                                if (data.NORMAL) {
                                    normal.push.apply(normal, data.NORMAL.get(i))
                                }
                                if (data.TEXCOORD0) {
                                    uv.push.apply(uv, data.TEXCOORD0.get(i))
                                }
                                if (data.TEXCOORD1) {
                                    uv1.push.apply(uv1, data.TEXCOORD1.get(i))
                                }
                                if (data.BLENDWEIGHT) {
                                    let weight = data.BLENDWEIGHT.get(i)
                                    let total = weight[0] + weight[1]
                                    weight[0] = weight[0] / total
                                    weight[1] = weight[1] / total
                                    blendWeights.push.apply(blendWeights, weight.concat([0, 0]))
                                }
                                if (data.BLENDINDICES) {
                                    blendIndices.push.apply(blendIndices, data.BLENDINDICES.get(i).concat([0, 0]))
                                }
                                if (data.COLOR) {
                                    colors.push.apply(colors, data.COLOR.get(i))
                                }
                            }
                            vb.unlock()
                            let ib = mesh.indexBuffer[0]
                            let ibLocked = ib.lock()
                            let indexes = new Accessor(0, 2, ibLocked, pc.ELEMENTTYPE_UINT16, 1)
                            for (let i = 0; i < indexes.length; i++) {
                                indices.push(indexes.get(i))
                            }

                            newMesh.count = indices.length
                            let min = newMesh.aabb.min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]
                            let max = newMesh.aabb.max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
                            for (let s = 0; s < pos.length; s += 3) {
                                for (let q = 0; q < 3; q++) {
                                    let v = pos[s + q]
                                    if (v > max[q]) max[q] = v
                                    if (v < min[q]) min[q] = v
                                }
                            }
                            if (!data.TEXCOORD0) {
                                delete vertices.texCoord0
                            }
                            if (!data.TEXCOORD1) {
                                delete vertices.texCoord1
                            }
                            if (!data.BLENDWEIGHT) {
                                delete vertices.blendWeight
                            }
                            if (!data.BLENDINDICES) {
                                delete vertices.blendIndices
                            }
                            if (!data.COLOR) {
                                delete vertices.color
                            }


                        })
                        let modelData = mc.getModel()
                        console.log(JSON.parse(modelData))
                        editor.call('assets:create', {
                            name: 'Decimated ' + asset.name,
                            type: 'model',
                            source: false,
                            preload: false,
                            tags: ["Decimated"],
                            data: asset.data,
                            parent: editor.call('assets:panel:currentFolder'),
                            filename: 'Decimated ' + asset.name + '.json',
                            file: new Blob([modelData], {type: 'application/json'})
                        })
                    }
                    finally {
                        overlay.hidden = true
                    }


                }


                let Decimator = {
                    view: function () {
                        return [m('.ui-panel.noHeader', {
                                onmousedown: e => e.stopPropagation(),
                                onclick: e => e.stopPropagation(),
                                onmouseup: e => e.stopPropagation()
                            },
                            m('content.flex',
                                m('span.ui-label.label-field.select-label', m('i.fa.fa-compress.warning'), "Triangles"),
                                m('input.ui-label.range-control', {
                                        type: 'range',
                                        value: currentTriangles,
                                        oninput: m.withAttr('value', v => currentTriangles = +v),
                                        min: minTriangles,
                                        max: maxTriangles
                                    },
                                )
                            ),
                            m('.ui-panel.noHeader.buttons',
                                m('.content',
                                    m('.ui-button.centered-text.full-width', {onclick: runDecimation},
                                        m('i.fa.fa-compress.fa-large'),
                                        "Decimate " + Math.floor((1 - currentTriangles / maxTriangles) * 100) + "%"
                                    )
                                )
                            )
                        )
                        ]
                    }
                }
                panel.visible = true
                m.mount(replace.element, Decimator)
            }

            process()
        }


    }
)
