import add from 'ui-container'
import m from 'mithril'

function selectRoot() {
    editor.call('selector:clear')
    editor.call('selector:set', 'entity', [editor.call('entities:root')])
    setTimeout(() => {
        let item = editor.call('entities:hierarchy').selected[0]
        for (let i = 0; i < item._children; i++) {
            let child = item.child(i)
            child.ui.open = false
        }
    })
}

function goUp() {
    let items = editor.call('selector:items')
    if (items.length == 1) {
        let root = editor.call('entities:root')
        let item = items[0]
        let parent = editor.call('entities:get', item.get('parent'))
        if (!parent) return
        editor.call('selector:clear')
        editor.call('selector:set', 'entity', [parent])
        if (root.get('resource_id') !== item.get('parent')) {
            let item = editor.call('entities:hierarchy').selected[0]
            item.open = false
        }
    }
}

const Root = {
    view: function () {
        return [
            m('span.ui-button', {
                    onclick: selectRoot
                },
                m('i.fa.fa-arrow-up'),
                "Root"
            ), m('span.ui-button', {
                    onclick: goUp

                }, m('i.fa.fa-angle-up'),
                "Up")
        ]
    }
}

editor.call('hotkey:register', 'go:root', {
    key: 'r',
    callback: selectRoot
});
editor.call('hotkey:register', 'go:up', {
    key: 'u',
    callback: goUp
});

add(Root)
