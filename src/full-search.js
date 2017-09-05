import add from 'ui-container'
import m from 'mithril'
import map from 'lodash/map'
import collect from 'collect'

let term = ''



const Search = {
    view: function () {
        return m('span.ui-button',
            m('i.fa.fa-search'),
            m('input.field.right-space', {
                value: term,
                onkeyup: m.withAttr('value', value => term = value),
                onfocus: function () {
                    setTimeout(() => {
                        this.setSelectionRange(0, term.length)
                    })
                }
            }),
            m('span', {
                onclick: function () {
                    let items = editor.call('selector:items')
                    let root
                    if (items.length) {
                        root = items[0]
                    } else {
                        root = editor.call('entities:root')
                    }
                    editor.call('selector:clear')

                    setTimeout(() => {
                        let entities = collect(root, [])
                            .filter(entity => {
                                let regex = new RegExp(term, 'ig')
                                let search = entity.get('name') + " " + map(entity.get('components'), (value, key) => "=" + key).join(' ')
                                search += map(entity.get('components.script'), (value,name)=>"#"+name).join(' ')
                                return regex.test(search)
                            })
                        editor.call('selector:set', 'entity', entities)
                    })
                }
            }, "GO")
        )
    }
}

add(Search)
