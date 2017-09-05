!(function () {

    setTimeout(function () {
        let script = document.createElement('script')
        script.src = 'https://localhost:8081/main.build.js'
        script.async = true
        document.body.appendChild(script)
    }, 200)

})()
