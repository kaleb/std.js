/*
	Example usage:

	function Client() {
		this._socket = new Connection()
		this._socket.open()
		this._socket.on('connected', bind(this, '_log', 'connected!'))
		this._socket.on('connected', bind(this, 'disconnect'))
	}

	Client.prototype._log = function(message) {
		console.log('client says:', message)
	}

	Client.prototype.disconnect = function() {
		this._socket.disconnect()
	}

	Example usage:

	var Toolbar = Class(function() {
		
		this._init = function() {
			this._buttonWasClicked = false
		}
		
		this.addButton = function(clickHandler) {
			this._button = new Button()
			this._button.on('Click', bind(this, '_onButtonClick', clickHandler))
		}

		this._onButtonClick = function(clickHandler) {
			this._buttonWasClicked = true
			clickHandler()
		}

	})

*/

module.exports = function bind(context, method /* curry1, curry2, ... curry3 */) {
	if (typeof method == 'string') { method = context[method] }
	var curryArgs = Array.prototype.slice.call(arguments, 2)
	return function bound() {
		var invocationArgs = Array.prototype.slice.call(arguments)
		return method.apply(context, curryArgs.concat(invocationArgs))
	}
}
