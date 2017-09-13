import m from 'mithril'
import './copy-panel.scss'
import 'font-awesome/scss/font-awesome.scss'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import some from 'lodash/some'
import merge from 'lodash/merge'
import debounce from 'lodash/debounce'

let copyBuffer = {components: {}, scripts: {}, entity: null}

function isSet(obj) {
    return some(obj, (v, c) => v)
}

editor.on('attributes:inspect[entity]', function (entities) {
    if (entities.length == 1) {
        function performCopy() {
            copyBuffer = {components: {}, scripts: {}, entity}
            map(copy.components, (copy, name) => {
                if (!copy) return
                copyBuffer.components[name] = entity.get('components.' + name)
            })
            map(copy.scripts, (copy, name) => {
                if (!copy) return
                copyBuffer.scripts[name] = scriptComponent.scripts[name]
            })
            m.redraw()
        }

        function performPaste() {
            map(paste.components, (paste, name) => {
                if (!paste) return
                // editor.call('entities:addComponent', [entity], name)
                entity.set('components.' + name, pasteBuffer.components[name])
                delete pasteBuffer.components[name]
            })
            if (isSet(paste.scripts)) {
                if (!entity.get('components.script')) {
                    editor.call('entities:addComponent', [entity], 'script')
                }
            }
            map(paste.scripts, (paste, name) => {
                if (!paste) return
                entity.set('components.script.scripts.' + name, pasteBuffer.scripts[name])
                entity.insert('components.script.order', name, entity.get('components.script.order').length);
                delete pasteBuffer.scripts[name]
            })

        }
        let scriptComponent = {}
        let entity = entities[0]
        let components = []
        let scripts = []
        let pasteBuffer = {scripts: {}, components: {}}
        let panel = editor.call('attributes:addPanel', {
            name: 'COPY & PASTE',
        })
        let copy = {components: {}, scripts: {}}
        let paste = {components: {}, scripts: {}}

        panel.class.add('component')
        panel.class.add('entity')
        let copyPanel = new ui.Panel()
        copyPanel.class.add('copy-components')
        copyPanel.hidden = false
        panel.append(copyPanel)
        let replace = new ui.Panel()
        copyPanel.append(replace)
        let CopyComponents = {
            view: function () {
                return [
                    (!isEmpty(components) || !isEmpty(scripts)) ? m('.ui-panel', m('header.ui-header', m('span.title', "COPY"))) : null,
                    components.map(c =>
                        m('.ui-panel.noHeader.field-checkbox', {onclick: () => (copy.components[c] = !copy.components[c])},
                            m('content.flex',
                                m('span.ui-label.label-field.component', m('i.fa.fa-circle'), c),
                                m('.ui-checkbox.noSelect.tick', {
                                        class: copy.components[c] ? 'checked' : ''
                                    }
                                )
                            )
                        )
                    ),
                    scripts.map(c =>
                        m('.ui-panel.noHeader.field-checkbox', {onclick: () => (copy.scripts[c] = !copy.scripts[c])},
                            m('content.flex',
                                m('span.ui-label.label-field', m('i.fa.fa-file-code-o'), c),
                                m('.ui-checkbox.noSelect.tick', {
                                        class: copy.scripts[c] ? 'checked' : ''
                                    }
                                )
                            )
                        )
                    ),
                    isSet(copy.scripts) || isSet(copy.components) ?
                        m('.ui-button.full-width.centered-text', {onclick: performCopy}, "Copy") : null,
                    entity !== pasteBuffer.entity && (!isEmpty(pasteBuffer.scripts) || !isEmpty(pasteBuffer.components)) ? [
                        [

                            m('.ui-panel', m('header.ui-header', m('span.title', "PASTE")))
                        ],
                        map(pasteBuffer.components, (_, c) =>
                            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (paste.components[c] = !paste.components[c])},
                                m('content.flex',
                                    m('span.ui-label.label-field.component', m('i.fa.fa-circle'), c),
                                    m('.ui-checkbox.noSelect.tick', {
                                            class: paste.components[c] ? 'checked' : ''
                                        }
                                    )
                                )
                            )
                        ),
                        map(pasteBuffer.scripts, (_, c) =>
                            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (paste.scripts[c] = !paste.scripts[c])},
                                m('content.flex',
                                    m('span.ui-label.label-field', m('i.fa.fa-file-code-o'), c),
                                    m('.ui-checkbox.noSelect.tick', {
                                            class: paste.scripts[c] ? 'checked' : ''
                                        }
                                    )
                                )
                            )
                        ),
                        isSet(paste.scripts) || isSet(paste.components) ?
                            m('.ui-button.full-width.centered-text', {onclick: performPaste}, "Paste") : null,
                    ] : null
                ]

            }
        }

        m.mount(replace.element, CopyComponents)

        var build = debounce(function build() {
            panel.hidden = true
            if (isEmpty(entity.get('components')) && isEmpty(copyBuffer.components) && isEmpty(copyBuffer.scripts)) return

            let data = entities[0].json()
            scriptComponent = data.components.script
            delete data.components.script
            components = map(data.components, (_, name) => {
                return name
            })
            scripts = scriptComponent ? map(scriptComponent.scripts, (_, name) => {
                return name
            }) : []


            pasteBuffer = merge({}, copyBuffer)
            components.forEach(c => delete pasteBuffer.components[c])
            scripts.forEach(c => delete pasteBuffer.scripts[c])

            map(pasteBuffer.components, (_, n) => paste.components[n] = true)
            map(pasteBuffer.scripts, (_, n) => paste.scripts[n] = true)
            panel.hidden = false
            m.redraw()
        }, 60)
        build()

        entity.on('*:set', build)
        entity.on('*:unset', build)
        entity.on('*:insert', build)
        entity.on('*:remove', build)
        editor.on('attributes:inspect[entity]', function (entities) {
            entity.off('*:set', build)
            entity.off('*:unset', build)
            entity.off('*:insert', build)
            entity.off('*:remove', build)

        })

    }

})

