import Promise from 'bluebird'

function Defer() {
    this.promise = new Promise((resolve, reject)=>{
        this.resolve = resolve
        this.reject = reject
    })
}

export default Defer
