import add from 'ui-container'
import m from 'mithril'
import map from 'lodash/map'
import collect from 'collect'

let term = ''
let global = true
let element

function search() {
    let items = editor.call('selector:items')
    let root
    if (items.length && !global) {
        root = items[0]
    } else {
        root = editor.call('entities:root')
    }
    editor.call('selector:clear')

    setTimeout(() => {
        let entities = collect(root, [])
            .filter(entity => {
                let regex = new RegExp(term, 'ig')
                let search = ":" + entity.get('name') + " " + map(entity.get('components'), (value, key) => "=" + key).join(' ')
                let scriptComponent = entity.get('components.script')
                if (scriptComponent) {
                    search += " " + map(scriptComponent.scripts, (script,name) => "#" + (script.name || name)).join(' ')
                }
                return regex.test(search)
            })
        editor.call('selector:set', 'entity', entities)
    })
}

const Search = {
    view: function () {
        return m('span.ui-ixion',
            m('i.fa.fa-search'),
            m('input.field.right-space', {
                placeholder: "Search for :name or =component or #scriptname",
                value: term,
                style: {
                    width: '270px'
                },
                oncreate: function (vnode) {
                    element = vnode.dom
                },
                oninput: m.withAttr('value', value => term = value),
                onkeydown: function (evt) {
                    if (evt.key === "Enter" || evt.keyCode === pc.KEY_RETURN) {
                        search()
                    }

                },
                onfocus: function () {
                    setTimeout(() => {
                        this.setSelectionRange(0, term.length)
                    })
                }
            }),
            m('span', m.trust("&nbsp;")),
            m('span', {
                onclick: search
            }, m('strong.ui-ixion-button', "GO")),
            m('span', { onclick: ()=>global = !global},
                m('span.ui-checkbox.noSelect.tick', {
                        class: global ? 'checked' : ''
                    }
                ),
                m('span', "Everywhere")
            )
        )
    }
}

editor.call('hotkey:register', 'go:search', {
    key: 'g',
    callback: function () {
        element.focus()
    }
});


add(Search)
