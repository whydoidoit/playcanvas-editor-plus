import m from 'mithril'
import add from 'ui-container'



function snap() {
    let increment = editor.call('settings:projectUser').get('editor').snapIncrement
    let items = editor.call('selector:items')
    items.forEach(item => {
        let position = item.get('position')
        for (let i = 0; i < 3; i++) {
            position[i] = Math.round(position[i] / increment) * increment
        }
        item.set('position', position)
    })
}

function snapRotation() {
    let items = editor.call('selector:items')
    items.forEach(item => {
        let rotation = item.get('rotation')
        let sign = rotation[1] < 0 ? -1 : 1
        rotation[1] = Math.round(Math.abs(rotation[1]) / 90) * 90 * sign
        item.set('rotation', rotation)
    })
}

const Snap = {
    view: function () {
        return [
            m('span.ui-button', {
                    onclick: snap
                },
                m('i.fa.fa-square'),
                "Snap"
            ), m('span.ui-button', {
                    onclick: snapRotation
                },
                m('i.fa.fa-circle'),
                "Snap Rotation"
            )]
    }
}

editor.call('hotkey:register', 'snap:grid', {
    key: 't',
    callback: snap
});

editor.call('hotkey:register', 'snap:rotation', {
    key: 'l',
    callback: snapRotation
});


add(Snap)
