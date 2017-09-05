import add from 'ui-container'
import m from 'mithril'
import './bake.scss'
import combine from 'mesh-combiner/editor'

const Bake = {
    view: function () {
        return m('span.ui-button', {
                onclick: bake
            },
            m('i.fa.fa-birthday-cake'),
            "Bake")
    }
}

const Options = {
    state: {numberOfVertices: 0, castShadows: true, receiveShadows: true, lightmapped: false, lightmapSizeMultiplier: 16},
    view: function () {
        return [
            m('header.ui-header', m('.ui-panel.noHeader', "BAKE OPTIONS")),
            m('p', `Using this tool you can combine meshes that share a material to reduce draw calls. The tool is non-destructive.`),
            m('p', `A new mesh will be added to your Assets for every material discovered and an entity will be created with that mesh keeping the items in their current
                    locations while the originals will be disabled.  The process may take some time, and after the combined mesh is built
                    it must go through the import procedure before the originals are modified.  Watch for the usual progress bar.`),
            m('p', `If you are using lightmapping, ensure that you have created or imported UV1 coordinates before baking your meshes.`),
            m('hr'),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => Options.state.castShadows = !Options.state.castShadows},
                m('content.flex',
                    m('span.ui-label.label-field', "Cast Shadows"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: Options.state.castShadows ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => Options.state.receiveShadows = !Options.state.receiveShadows},
                m('content',
                    m('span.ui-label.label-field', "Receive Shadows"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: Options.state.receiveShadows ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => Options.state.lightmapped = !Options.state.lightmapped},
                m('content',
                    m('span.ui-label.label-field', "Lightmapped"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: Options.state.lightmapped ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-number',
                m('content',
                    m('span.ui-label.label-field', "Lightmap Size Multiplier"),
                    m('span.ui-number-field', {
                            placeholder: 'x Multiplier',
                            style: {flexGrow: 1}
                        },
                        m('input.field', {
                            oninput: m.withAttr('value', value=>Options.state.lightmapSizeMultiplier = +value),
                            value: Options.state.lightmapSizeMultiplier
                        })
                    )
                )
            ),
            m('.ui-panel.noHeader.field-number',
                m('content',
                    m('span.ui-label.label-field', "Max Vertices"),
                    m('span.ui-number-field', {
                            placeholder: 'Vertices',
                            style: {flexGrow: 1}
                        },
                        m('input.field', {
                            oninput: m.withAttr('value', value=>Options.state.numberOfVertices = +value),
                            value: Options.state.numberOfVertices
                        })
                    )
                )
            ),
            m('hr'),
            m('em', m('ul', m('li','Baking may take some time, please wait until the model in imported before exiting so that the original items may be disabled.'))),
            m('.right-aligned',
                m('span.ui-button.bake-button', {
                    onclick: function () {
                        Options.overlay.hidden = true
                        combine(Options.state.items,
                            Options.state.castShadows,
                            Options.state.receiveShadows,
                            Options.state.lightmapped,
                            Options.state.lightmapSizeMultiplier,
                            instance => Options.state.numberOfVertices < 1 || instance.mesh.vertexBuffer.getNumVertices() < Options.state.numberOfVertices
                        )
                    }
                }, "BAKE")
            )

        ]
    }
}

let overlay = Options.overlay = new ui.Overlay();
overlay.class.add('bake-options');
overlay.hidden = true;

let root = editor.call('layout.root');
root.append(overlay);

let label = new ui.Label({text: ""})
label.renderChanges = false
overlay.append(label);
m.mount(label._element, Options)

function bake() {
    let items = Options.state.items = editor.call('selector:items').filter(i=>!!i.entity)
    if (items.length < 1) {
        editor.call('picker:confirm:class', 'bake')
        editor.call('picker:confirm', "You must select at least one item to bake...")
        return
    }
    overlay.hidden = false
    m.redraw()

}

add(Bake)
