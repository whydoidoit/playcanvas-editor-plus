import isFunction from 'lodash/isFunction'

function value(value) {
    if(isFunction(value)) {
        return value()
    } else {
        return value
    }
}

export default value
