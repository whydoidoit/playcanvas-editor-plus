import add from 'ui-container'
import m from 'mithril'
import isNumber from 'lodash/isNumber'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import sha1 from 'sha1'
import Promise from 'bluebird'
import xhr from 'promise-xhr/src'
import sort from 'lodash/sortBy'
import map from 'lodash/map'

let call = Promise.promisify(editor.call.bind(editor))

let selected
let buffer = ""
let isPasting = false

//Wait for a short period
function shortDelay(duration) {
    return new Promise(function (resolve) {
        setTimeout(resolve, duration || 10)
    })
}

//Check on editor selection
editor.on('selector:change', function (type, items) {
    if (type === 'entity') {
        selected = items
    } else {
        selected = null
    }
    m.redraw()
})

//Handle copy buffer between PlayCanvas tabs with
//a shared worker
function sharedWorkerCode() {
    var buffer = ""
    console.log("Starting worker")
    onconnect = function (e) {

        var port = e.ports[0]
        console.log("Worker connected")

        port.addEventListener('message', function (e) {
            console.log("Worker message")
            if (e.data.copy) {
                buffer = e.data.buffer
            }
            port.postMessage(buffer)
        })

        port.onmessage = function (data) {
            console.log("Got message", data)
        }

    }
}

function makeNumber(value) {
    if (Array.isArray(value)) return undefined
    if (isNumber(value)) {
        return value
    }
    if (!isString(value)) return undefined
    let result = parseInt(value)
    if (isNaN(result)) return undefined
    return result
}


//Keys not used to create a hash of an asset
const SKIP = [
    'scope',
    'filename',
    'url',
    'id',
    'migrated_material',
    'user_id',
    'revision',
    'region',
    'path',
    'meta',
    'tags',
    'source_asset_id',
    'task',
    'preload',
    'variants',
    'has_thumbnail',
    'thumbnails',
    'name'
]

//Remove ids, sort properties etc for hashing
//this is a stringify replacer
function removeIds(key, value) {
    if (isObject(value) && !Array.isArray(value)) {
        if (value.ixik !== undefined && value.ixiv !== undefined) return value
        let keys = sort(Object.keys(value).filter(k => SKIP.indexOf(k) === -1), v => v)
        return keys.map(k => ({ixik: k, ixiv: value[k]}))
    }
    if (key.slice(0, 1) === '_') value = undefined
    value = SKIP.indexOf(key) !== -1 ? undefined : value
    return value
}

//Get the hash of an object
function getHash(object) {
    return sha1(JSON.stringify(object, removeIds))
    // let hash = object.type + ":" + object.name + ":"
    // if(object.file) {
    //     hash += object.file.hash + ":"
    // }
    // return hash
}

let copyBufferWorker = new SharedWorker(convertToString(sharedWorkerCode))
copyBufferWorker.port.start()
copyBufferWorker.port.onmessage = function (data) {
    buffer = data.data
    m.redraw()
}

setInterval(function () {
    copyBufferWorker.port.postMessage("Hello")
}, 2000)


function convertToString(fn) {
    let data = fn.toString()
    return "data:text/javascript," + "(" + data + ")()"
}

function tryToGetAsset(id, definition, start, key, scan) {
    id = +id
    //Do we already have it
    if (definition.assets[id]) {
        let value = definition.assets[id]
        if (value._hashed) {
            start[key] = {hash: value._hashed, _map: true}
        }
        return value
    }
    let value = editor.call('assets:get', id)
    if (value) {
        definition.assets[id] = value = value.json()
        scan(value)
        value._hashed = getHash(value)
        if (value._hashed) {
            definition.hashedAssets[value._hashed] = value
            start[key] = {hash: value._hashed, _map: true}
        }
        return value
    }
    return null
}

function handleScripts(scriptComponent, scriptMap, definition) {
    if (config.project.settings.useLegacyScripts) return false
    map(scriptComponent.scripts, (_, key) => {
        definition.hashedAssets[getHash(scriptMap[key])] = scriptMap[key]
    })
    return true
}


function getAssetsFrom(item, definition, scriptMap) {
    if (item.type !== 'animation') {
        item.source_asset_id = null
    }

    function scan(start) {
        if (!start) return start
        if (Array.isArray(start)) {
            for (let i = 0; i < start.length; i++) {
                if (makeNumber(start[i])) {
                    let result = tryToGetAsset(start[i], definition, start, i, scan)
                    if (result && result._hashed) {
                        start[i] = {hash: result._hashed, _map: true}
                    }
                } else {
                    scan(start[i])
                }
            }
        } else if (isObject(start)) {
            for (var key in start) {
                if (key === 'id') continue
                // if (SKIP.indexOf(key) !== -1) continue
                let value = start[key]

                if (key === 'script') {
                    if (!handleScripts(value, scriptMap, definition)) continue
                }
                if (makeNumber(value)) {
                    let result = tryToGetAsset(value, definition, start, key, scan)
                    if (result && result._hashed) {
                        start[key] = {hash: result._hashed, _map: true}
                    }
                }
                if (isObject(value) || Array.isArray(value)) {
                    scan(value)
                }

            }
        }
        return start
    }

    scan(item)

}


function collect(items, definition, container, scriptMap) {
    items.forEach(item => {
        let def = item.json()
        definition.entities[def.resource_id] = def
        getAssetsFrom(def, definition, scriptMap)
        let entry = {def, children: []}
        container.push(entry)
        if (def.children) {
            let children = def.children.map(child => editor.call('entities:get', child))
            collect(children.filter(c => !!c), definition, entry.children, scriptMap)
        } else {
            definition.assets[def.id] = def
            def._hashed = getHash(def)
            definition.hashedAssets[def._hashed] = def
        }

    })
}


function collectScriptAssets(scriptMap) {
    editor.call("assets:list")
        .map(a => a.json())
        .filter(a => a.type === 'script')
        .forEach(s => map(s.data.scripts, (script, key) => {
            scriptMap[key] = s
        }))
}

function copy() {
    let copied = {
        entities: {},
        assets: {},
        roots: [],
        hashedAssets: {}
    }
    let scriptMap = {}
    collectScriptAssets(scriptMap)
    collect(selected, copied, copied.roots, scriptMap)
    delete copied.assets
    delete copied.entities
    console.log(copied)
    storeInBuffer(copied)
    m.redraw()
}

function getAllHashed(item) {
    let dedupe = {}
    let results = []

    function scan(start, path) {
        if (!start) return start
        if (Array.isArray(start)) {
            for (let i = 0; i < start.length; i++) {
                let value = start[i]
                if (isObject(value) && value._map) {
                    if (!dedupe[value.hash]) {
                        dedupe[value.hash] = true
                        results.push({hash: value.hash, ref: start, path: path + "[" + i + "]", root: item, key: i})
                    }

                } else {
                    scan(start[i], path + "[" + i + "]")
                }
            }
        } else if (isObject(start)) {
            for (var key in start) {
                let value = start[key]
                if (isObject(value) && value._map) {
                    if (!dedupe[value.hash]) {
                        dedupe[value.hash] = true
                        results.push({hash: value.hash, ref: start, path: path + "." + key, root: item, key})
                    }

                } else if (isObject(value) || Array.isArray(value)) {
                    scan(value, path + "." + key)
                }
            }
        }
        return start
    }

    scan(item, "")
    return results
}

async function retrieveAsset(id) {
    let asset = null
    do {
        asset = editor.call('assets:get', id)
        if (!asset) await shortDelay()
    } while (!asset)
    return asset
}


function uploadFile(data) {
    return new Promise(function (resolve, reject) {

        editor.call('assets:uploadFile', data, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })

    })
}

function pastingUnloadEventHandler(e) {
    e.preventDefault()
    return e.returnValue = "Paste operation in progress, please stay!"
}

async function waitForTasks(asset) {
    let id = asset.id
    asset = editor.call('assets:get', id)
    console.log("Start Waiting")
    let task = null
    do {
        await shortDelay(100)
        try {
            task = asset.get('task')
        } catch (e) {

        }
    } while (!editor.call('assets:list').filter(a => a.get('source_asset_id') == id).length && !task)
    console.log("Finished Waiting")
}

async function paste() {
    try {

        let sceneRoot = !selected || !selected.length ? editor.call('entities:root') : selected[0]

        window.addEventListener('beforeunload', pastingUnloadEventHandler)
        isPasting = true
        m.redraw()
        let gh = getHash

        //Map all existing assets
        let hashed = {}
        let mapped = {}

        let scanned = {
            entities: {},
            assets: {},
            roots: [],
            hashedAssets: {}
        }
        let definition = JSON.parse(buffer)

        function updateAssetList() {
            let existing = editor.call("assets:list")
            collect(existing, scanned, scanned.roots)
            hashed = scanned.hashedAssets
            for (var key in definition.hashedAssets) {
                if (hashed[key]) {
                    mapped[key] = hashed[key]
                }
            }
        }

        updateAssetList()

        let toLoad = []
        let toDelete = []
        //Get a list of assets to load in order of their
        //requirement
        for (var key in definition.hashedAssets) {
            let item = definition.hashedAssets[key]
            if (item.source_asset_id && !isObject(item.source_asset_id)) {
                console.warn("Missing source asset", item.source_asset_id, item)
                item.source_asset_id = null
            }
            if (hashed[key]) {
                mapped[key] = hashed[key]
            } else {

                let data = definition.hashedAssets[key]
                data._key = key
                if (toLoad.indexOf(data) === -1) toLoad.push(data)
                let required = data._hashedContents = getAllHashed(data)
                required.forEach(r => {
                    if (toLoad.findIndex(l => l._hashed === r.hash) === -1) {
                        toLoad.unshift(definition.hashedAssets[r.hash])
                    }
                })

            }
        }

        // return
        //toLoad contains a list of assets to be created
        for (let i = 0; i < toLoad.length; i++) {
            let item = toLoad[i]

            //Create an asset
            // update any references etc
            if (item._hashedContents) {
                item._hashedContents.forEach(ref => {
                    //We believe the asset exists
                    if (!mapped[ref.hash]) {
                        for (var key in hashed) {
                            let existing = hashed[key]
                            if (existing.type === item.type && existing.name === item.name) {
                                mapped[ref.hash] = hashed[ref.hash] = existing
                            }
                        }
                    }
                    ref.ref[ref.key] = +mapped[ref.hash].id
                })
            }

            if (hashed[item._key]) {
                mapped[item._key] = hashed[item._key]
                continue
            }

            //Make the asset
            let assetId, asset
            if (item.type !== 'animation') {
                if (item.file) {
                    let results
                    if (item.type == 'model') {
                        let download = await xhr(item.file.url, {
                            method: 'GET'
                        })
                        results = JSON.parse(download.body)
                        if (results.model.nodes.length > 10 && results.model.nodes[0].scale[0] == 1) {
                            results.model.nodes[0].scale = [0.01, 0.01, 0.01]
                            results.model.nodes[1].scale = results.model.nodes[1].scale.map(v => v * 100)
                            results.model.nodes[1].position = results.model.nodes[1].position.map(v => v * 100)
                            results.body = new Blob([JSON.stringify(results)], {type: "application/json"})
                        }
                    } else {
                        results = await xhr(item.file.url, {method: 'GET', responseType: 'blob'})
                    }
                    let assetData
                    assetData = await uploadFile({
                        name: item.source ? item.file.filename : item.name,
                        type: item.type,
                        meta: item.meta,
                        source: item.source,
                        preload: true,
                        pipeline: true,
                        data: item.data,
                        parent: editor.call('assets:panel:currentFolder'),
                        filename: item.file.filename,
                        file: results.body //
                    })

                    assetId = assetData.asset.id
                    if (item.source && item.type === 'scene') {
                        await waitForTasks(assetData.asset)
                    }
                    asset = await retrieveAsset(assetId)
                    if (item.source) {
                        toDelete.push(asset)
                    }
                } else {
                    assetId = await call("assets:create", {
                        name: item.name,
                        type: item.type,
                        meta: item.meta,
                        source: item.source,
                        preload: true,
                        scope: {
                            type: 'project',
                            id: config.project.id
                        },
                        data: item.data,
                        parent: editor.call('assets:panel:currentFolder'),
                    })
                    asset = await retrieveAsset(assetId)
                }
                mapped[item._key] = asset.json()
            } else {
                do {
                    updateAssetList()
                    if (!hashed[item._key]) {
                        for (var key in hashed) {
                            let existing = hashed[key]
                            if (existing.type === item.type && (existing.name === item.name || existing.name === item.name + ".json")) {
                                mapped[item._key] = hashed[item._key] = existing
                            }
                        }


                    }

                    await shortDelay(100)
                } while (!hashed[item._key])

            }


        }

        let allDelete = []
        toDelete.forEach(a => {
            editor.call('assets:list').filter(asset => asset.get('source_asset_id') == a.get('id') && asset.get('type') !== 'animation').forEach(asset => {
                allDelete.push(asset)
            })
        })

        editor.call('assets:delete', allDelete)
        editor.call('assets:delete', toDelete)

        let entityMap = {}
        let fixUpList = []

        function recurseCreateEntity(def, parent) {

            let entity = editor.call('entities:new', {
                parent
            })
            let required = getAllHashed(def.def)
            required.forEach(r => r.ref[r.key] = mapped[r.hash].id)
            entity.set('name', def.def.name)

            map(def.def.components, (value, key) => {
                entity.set('components.' + key, value)
            })
            if (def.def.components.script) {
                fixUpList.push(entity.get('components.script'))
            }
            entity.set('position', def.def.position)
            entity.set('rotation', def.def.rotation)
            entity.set('scale', def.def.scale)
            entity.set('enabled', def.def.enabled)
            entityMap[def.def.resource_id] = entity.get('resource_id')
            def.children.forEach(child => {
                recurseCreateEntity(child, entity)
            })

        }


        //Lets start making entities
        definition.roots.forEach(root => {
            recurseCreateEntity(root, sceneRoot)
        })

        fixUpList.forEach(script => {
            map(script.scripts, (script, name) => {
                map(script.attributes, (attribute, attrName) => {
                    if (isString(attribute) && attribute.length > 24) {
                        if (entityMap[attribute]) {
                            script.attributes[attrName] = entityMap[attribute]
                        }
                    }
                })
            })
        })
    } finally {
        isPasting = false
        m.redraw()
        window.removeEventListener('beforeunload', pastingUnloadEventHandler)
    }

}

function canPaste() {
    return !!buffer && (!selected || selected.length == 1)
}


function storeInBuffer(item) {
    let data = JSON.stringify(item)
    copyBufferWorker.port.postMessage({copy: true, buffer: data})
}

function clearBuffer() {
    copyBufferWorker.port.postMessage({copy: true, buffer: ""})
}


const CopyButton = {
    view: function () {
        return isPasting ? m('span.warning.ui-button', "PASTE OPERATION IN PROGRESS...") : [
            !selected ? null : m('span.ui-button', {
                    onclick: copy
                },
                m('i.fa.fa-copy')
            ), (!canPaste() ? null : m('span.ui-button', {
                onclick: paste
            }, m('i.fa.fa-paste'))),
            (!canPaste() ? null : m('span.ui-button', {
                onclick: clearBuffer
            }, m('i.fa.fa-times-circle')))
        ]
    }
}

add(CopyButton)
