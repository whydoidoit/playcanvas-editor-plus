!(function () {

    setTimeout(function () {
        let script = document.createElement('script')
        script.innerHTML = _inject.toString() + ";_inject()"
        document.body.appendChild(script)
    }, 200)

})()
