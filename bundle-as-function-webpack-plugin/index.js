
const _ = require('lodash')
const fs = require('fs')
const Path = require('path')

function BundleAsFunction(options) {
    this.options = _.extend({
        files: {
            'main.build.js': 'main.fn.build.js'
        }
    }, options)
}

BundleAsFunction.prototype.apply = function(compiler) {
    let options = this.options
    compiler.plugin('emit', (compilation, callback)=>{
        Object.keys(compilation.assets)
            .forEach(key=>{
                let asset = compilation.assets[key]
                if(!asset || !asset.children) return
                let filename = options.files[key]
                if(filename) {
                    console.log("Bundle", filename)
                    let path = compiler.options.output.path
                    if (path === '/' &&
                        compiler.options.devServer &&
                        compiler.options.devServer.outputPath) {
                        path = compiler.options.devServer.outputPath;
                    }
                    let content = "function _inject() { " + asset.children.map(c=>c._value ? c._value : c).join('\n') + "\n\n}"
                    fs.writeFileSync(Path.join(path, filename), content, 'utf8')
                    callback()
                }
            })
    })

}

module.exports = BundleAsFunction
