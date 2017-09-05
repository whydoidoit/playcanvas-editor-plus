import add from 'ui-container'
import m from 'mithril'

let active = false

const Dropping = {
    view: function () {
        return m('span.ui-button', {
                class: active ? 'active' : '',
                onclick: function () {
                    active = !active
                }
            },
            m('i.fa.fa-chevron-circle-down'),
            "Drop to Root"
        )
    }
}

add(Dropping)

editor.on('entities:add', function (entity) {
    if (!active) return
    let dropping = editor.call('drop:active')
    setTimeout(function () {
        if (dropping) {
            let position = entity.entity.getPosition().clone()
            let rotation = entity.entity.getEulerAngles().clone()
            let root = editor.call('entities:root')
            let parent = editor.call('entities:get', entity.get('parent'))
            parent.removeValue('children', entity.get('resource_id'))
            root.insert('children', entity.get('resource_id'))
            entity.set('parent', root.get('resource_id'))
            entity.set('position', Array.prototype.slice.call(position.data))
            entity.set('rotation', Array.prototype.slice.call(rotation.data))
            setTimeout(() => {
                let item = document.querySelector('.ui-tree.hierarchy > .ui-tree-item').ui
                for (let i = 0; i < item._children; i++) {
                    let child = item.child(i)
                    child.ui.open = false
                }
            })
        }
    })

})
