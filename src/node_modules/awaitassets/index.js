import Promise from 'bluebird'

const app = pc.Application.getApplication()

function asset(id) {
    return new Promise(resolve=>{
        let asset = app.assets.get(id)
        asset.ready(resolve)
    })
}

export default asset
