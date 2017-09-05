import Pool from 'pool'

let results = new Pool(() => [], array => array.length = 0)
let dummyArray = [null]
let seq = 0
pc.Entity.prototype.ofType = function (type) {
    let root = this
    var result = results.get();
    seq++

    function check(nodes) {
        nodes.forEach(function (n) {
            if (n.$seq == seq) return;
            n.$seq = seq;
            var t;
            if ((n.script && (t = n.script[type])) || (t = n[type])) {
                result.push(t);
            }
            check(n.getChildren());
        })
    }

    root = root || pc.Application.getApplication().root;
    if (!Array.isArray(root)) {
        dummyArray[0] = root
        check(dummyArray)
    } else {
        check(root)
    }
    return result;
}
