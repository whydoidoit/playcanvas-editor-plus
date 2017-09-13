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
    if (isNumber(value)) {
        return value
    }
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
    'source_asset_id',
    'path',
    'tags',
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
        if(value._hashed) {
            start[key] = {hash: value._hashed, _map: true}
        }
        return value
    }
    let value = editor.call('assets:get', id)
    if (value) {
        definition.assets[id] = value = value.json()
        scan(value)
        value._hashed = getHash(value)
        if(value._hashed) {
            definition.hashedAssets[value._hashed] = value
            start[key] = {hash: value._hashed, _map: true}
        }
        return value
    }
    return null
}

function handleScripts(scriptComponent, scriptMap, definition) {
    if(config.project.settings.useLegacyScripts) return false
    map(scriptComponent.scripts, (_, key) => {
        definition.hashedAssets[getHash(scriptMap[key])] = scriptMap[key]
    })
    return true
}


function getAssetsFrom(item, definition, scriptMap) {

    function scan(start) {
        if (!start) return start
        if (Array.isArray(start)) {
            for (let i = 0; i < start.length; i++) {
                if(makeNumber(start[i])) {
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
                // if (SKIP.indexOf(key) !== -1) continue
                let value = start[key]

                if (key === 'script') {
                    if(!handleScripts(value, scriptMap, definition)) continue
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

function convertScene(asset) {
    return new Promise(function(resolve) {

        asset.on('task:set', checkRunning)
        asset.on('taskInfo:set', checkRunning)
        asset.on('taskInfo:unset', checkRunning)

        function checkRunning() {
            let status = asset.get('task')
            console.log(asset.get('taskInfo'))
            if (status != 'running') {
                resolve()
                asset.off('task:set', checkRunning)
                asset.off('taskInfo:set', checkRunning)
                asset.off('taskInfo:unset', checkRunning)
            }
        }

    }).then(function() {
        if (asset.get('meta.animation.available')) {
            editor.call('assets:jobs:convert', asset)
        }
        return new Promise(function (resolve) {
            asset.on('task:set', checkRunning)
            asset.on('taskInfo:set', checkRunning)
            asset.on('taskInfo:unset', checkRunning)

            function checkRunning() {
                let status = asset.get('task')
                console.log(asset.get('taskInfo'))
                if (status != 'running') {
                    resolve()
                    asset.off('task:set', checkRunning)
                    asset.off('taskInfo:set', checkRunning)
                    asset.off('taskInfo:unset', checkRunning)
                }
            }
        })
    })
}

function uploadFile(data) {
    return new Promise(function(resolve, reject) {

        editor.call('assets:uploadFile', data, (err, data)=>{
            if(err) reject(err)
            resolve(data)
        })

    })
}

async function paste() {
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
    //Get a list of assets to load in order of their
    //requirement
    for (var key in definition.hashedAssets) {
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
    //toLoad contains a list of assets to be created
    for (let i = 0; i < toLoad.length; i++) {
        let item = toLoad[i]

        //Create an asset
        // update any references etc
        if (item._hashedContents) {
            item._hashedContents.forEach(ref => {
                ref.ref[ref.key] = +mapped[ref.hash].id
            })
        }

        if (hashed[item._key]) {
            mapped[item._key] = hashed[item._key]
            continue
        }

        //Make the asset
        let assetId, asset
        if(item.type !== 'animation') {
            if (item.file) {
                let results = await xhr(item.file.url, {method: 'GET', responseType: 'blob'})
                let assetData = await uploadFile({
                    name: item.name,
                    type: item.type,
                    meta: item.meta,
                    source: false,
                    preload: true,
                    pipeline: true,
                    data: item.data,
                    parent: editor.call('assets:panel:currentFolder'),
                    filename: item.file.filename,
                    file: results.body //
                })
                assetId = assetData.asset.id
                await shortDelay(500)
                asset = await retrieveAsset(assetId)

            } else {
                assetId = await call("assets:create", {
                    name: item.name,
                    type: item.type,
                    meta: item.meta,
                    source: false,
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
                await shortDelay(1000)
            } while(!hashed[item._key])

        }


    }
    let entityMap = {}
    let sceneRoot = !selected || !selected.length ? editor.call('entities:root') : selected[0]
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
        return [
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
