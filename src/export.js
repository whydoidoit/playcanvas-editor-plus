import add from 'ui-container'
import collect from 'collect'

function doExport() {
    let output = {}
    let root
    let items = editor.call('selector:items')
    root = items.length ? items[0] : editor.call('entities:root')
    let nodes = collect(root, nodes)
}


const Export = {
    view: function () {
        return m('span.ui-button', {
                onclick: function () {
                    doExport()
                }
            },
            m('i.fa.fa-download'),
            "Export")
    }
}
add(Export)
