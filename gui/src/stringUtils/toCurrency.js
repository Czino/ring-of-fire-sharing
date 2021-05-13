/**
 * @description Method to convert a value to a currency string
 * @param {Number} value the value
 * @param {String} currency the currency (BTC|USD)
 * @returns {String} value expressed as currency string
 */
export const toCurrency = (value, currency) => {
    if (currency === 'BTC') {
        if (value <= 9999) {
            return value + ' sats'
        } else if (value <= 999999) {
            return (Math.floor(value / 1000)) + 'k sats'
        } else if (value <= 999999999) {
            return (Math.floor(value / 10000) / 100) + 'M sats'
        } else {
            return '₿' + Math.floor(value / 100000000 * 1000) / 1000
        }
    }

    if (value <= 9999) {
        return '$' + value
    } else if (value <= 999999) {
        return '$' + (Math.floor(value / 1000)) + 'k'
    } else if (value <= 999999999) {
        return '$' + (Math.floor(value / 1000000)) + 'M'
    }
}

export default toCurrency