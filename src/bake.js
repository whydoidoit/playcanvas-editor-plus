import add from 'ui-container'
import m from 'mithril'
import './bake.scss'

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
    state: {numberOfVertices: 0, castShadows: true, receiveShadows: true, lightmapped: false},
    view: function () {
        return [
            m('header.ui-header', m('.ui-panel.noHeader', "BAKE OPTIONS")),
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
            m('.right-aligned',
                m('span.ui-button.bake-button', {
                    onclick: function () {
                        Options.overlay.hidden = true
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
    let items = editor.call('selector:items')
    if (items.length !== 1 || !items[0].entity) {
        editor.call('picker:confirm:class', 'bake')
        editor.call('picker:confirm', "You must have one and only one item selected, it's children will be baked...")
        return
    }
    overlay.hidden = false
    m.redraw()

}

add(Bake)
