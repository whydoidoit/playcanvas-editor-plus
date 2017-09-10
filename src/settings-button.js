import add from 'ui-container'
import m from 'mithril'
import settings from 'settings'

const Settings = {
    view: function () {
        return m('span.ui-button',
            m('a[href="https://ixion.digital"][target="Ixion"]', "IXION"),
            m.trust('&nbsp;'),
            m('i.fa.fa-cog', {
                onclick: showSettings
            })
        )
    }
}

function showSettings() {
    overlay.hidden = false
}

const Options = {
    view: function () {
        settings.enabled.rootButton = settings.enabled.rootButton !== false ? true : false
        settings.enabled.dropToRoot = settings.enabled.dropToRoot !== false ? true : false
        settings.enabled.bakeButton = settings.enabled.bakeButton !== false ? true : false
        settings.enabled.snapButtons = settings.enabled.snapButtons !== false ? true : false
        settings.enabled.searchButtons = settings.enabled.searchButtons !== false ? true : false
        return [
            m('header.ui-header', m('.ui-panel.noHeader', "SETTINGS")),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (settings.enabled.rootButton = !settings.enabled.rootButton, settings.save())},
                m('content.flex',
                    m('span.ui-label.label-field', "Show Root/Up Buttons"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: settings.enabled.rootButton !== false ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (settings.enabled.dropToRoot = !settings.enabled.dropToRoot, settings.save())},
                m('content.flex',
                    m('span.ui-label.label-field', "Show Drop To Root Button"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: settings.enabled.dropToRoot !== false ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (settings.enabled.bakeButton = !settings.enabled.bakeButton, settings.save())},
                m('content.flex',
                    m('span.ui-label.label-field', "Show Bake Button"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: settings.enabled.bakeButton !== false ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (settings.enabled.snapButtons = !settings.enabled.snapButtons, settings.save())},
                m('content.flex',
                    m('span.ui-label.label-field', "Show Snap Buttons"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: settings.enabled.snapButtons !== false ? 'checked' : ''
                        }
                    )
                )
            ),
            m('.ui-panel.noHeader.field-checkbox', {onclick: () => (settings.enabled.searchButtons = !settings.enabled.searchButtons, settings.save())},
                m('content.flex',
                    m('span.ui-label.label-field', "Show Search Bar"),
                    m('.ui-checkbox.noSelect.tick', {
                            class: settings.enabled.searchButtons !== false ? 'checked' : ''
                        }
                    )
                )
            ),
            m('hr'),
            m('.right-aligned',
                m('span.ui-button.bake-button', {
                    onclick: function () {
                        Options.overlay.hidden = true
                    }
                }, "CLOSE")
            )
        ]
    }
}


let overlay = Options.overlay = new ui.Overlay();
overlay.class.add('settings');
overlay.class.add('ixion')
overlay.hidden = true;

let root = editor.call('layout.root');
root.append(overlay);

let label = new ui.Label({text: ""})
label.renderChanges = false
overlay.append(label);
m.mount(label._element, Options)

add(Settings)
