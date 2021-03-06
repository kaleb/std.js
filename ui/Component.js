var Class = require('std/Class'),
	Publisher = require('std/Publisher'),
	extend = require('std/extend'),
	slice = require('std/slice'),
	remove = require('std/remove'),
	bind = require('std/bind'),
	browser = require('std/browser')

module.exports = Class(Publisher, function(supr) {
	
	this._elTag = 'div'
	this._elType = null
	this._class = null

	var defaults = {
		'class': null
	}
	this._init = function(opts) {
		supr(this, '_init', arguments)
		opts = extend(opts, defaults)
		if (typeof opts['class'] == 'string') { this._class = opts['class'] }
		this._events = {}
	}
	
	this.getElement = function() {
		if (this._el) { return this._el }
		this._el = this.dom({ tag:this._elTag, type:this._elType, 'class':this._class })
		if (this._createContent) { this._createContent() }
		return this._el
	}
	
	/* Dom nodes
	 ***********/
	var domDefaults = {
		tag: 'div'
	}
	this.dom = function(opts) {
		opts = extend(opts, domDefaults)
		var el = document.createElement(opts.tag)
		if (opts.type) { el.type = opts.type }
		if (opts.html) { el.innerHTML = opts.html }
		if (opts['class']) { el.className = opts['class'] }
		if (opts.style) { this.style(el, opts.style) }
		if (opts.value) { el.value = opts.value }
		return el
	}
	this._dom = this.dom // deprecated
	
	this.html = function(el, html1 /*, ..., htmlN */) {
		if (typeof html1 != 'string') {
			this.getElement().innerHTML = el
		} else {
			el.innerHTML = slice(arguments, 1).join('')
		}
		return this
	}

	this.appendTo = function(el) {
		if (typeof el.getElement == 'function') { el = el.getElement() }
		el.appendChild(this.getElement())
		return this
	}

	this.append = function(el) {
		if (typeof el.getElement == 'function') { el = el.getElement() }
		this.getElement().appendChild(el)
		return el
	}
	
	/* Styles
	 ********/
	this.style = function(el, styleProps) {
		if (!styleProps) {
			styleProps = el
			el = this.getElement()
		}
		var elStyle = el.style
		for (var key in styleProps) {
			var value = styleProps[key]
			if (typeof value == 'number') { value += 'px' }
			elStyle[key] = value
		}
		return this
	}
	
	this.remove = function(el) { 
		el = el || this._el
		if (!el || !el.parentNode) { return this } 
		el.parentNode.removeChild(el)
		return this
	}

	this.display = function(el, doShow) {
		if (doShow === undefined) {
			doShow = el
			el = this.getElement()
		}
		el.style.display = doShow ? 'block' : 'none'
		return this
	}

	this.show = function(el) { return this.display(el instanceof Element ? el : true, el instanceof Element ? true : undefined) }
	this.hide = function(el) { return this.display(el instanceof Element ? el : false, el instanceof Element ? false : undefined) }
	
	/* Class names
	 *************/
	this.addClass = function(el, className) { 
		if (typeof el == 'string') {
			className = el
			el = this.getElement()
		}
		if (!(' ' + el.className + ' ').match(' ' + className + ' ')) {
			el.className += ' ' + className + ' '
		}
		return this
	}
	
	this.removeClass = function(el, className) { 
		if (typeof el == 'string') {
			className = el
			el = this.getElement()
		}
		if (el.className) {
			className += ' '
			var current = el.className
			var index = current.indexOf(className)
			if (index != -1) {
				el.className = current.slice(0, index) + current.slice(index + className.length)
			}
		}
		return this
	}
	
	/*
		Example usage:

			this.toggleClass('highlight')
			this.toggleClass('highlight', false)
			this.toggleClass(el, 'highlight')
			this.toggleClass(el, 'highlight', false)
	*/
	this.toggleClass = function(el, className, shouldHave) {
		if (typeof el == 'string') {
			shouldHave = className
			className = el
			el = this.getElement()
		}
		if (shouldHave === undefined) { shouldHave = !this.hasClass(el, className) }
		if (shouldHave == this.hasClass(el, className)) { return this }
		if (shouldHave) { this.addClass(el, className) }
		else { this.removeClass(el, className) }
		return this
	}

	this.hasClass = function(el, className) {
		if (arguments.length == 1) {
			className = el
			el = this.getElement()
		}
		return !!el.className.match(' ' + className + ' ')
	}
	
	/* Events
	 ********/
	// this._on('click', function(e){})
	// this._on(el, 'click', function(e){})
	this._on = function(el, eventName, handler) {
		if (arguments.length == 2) { 
			handler = eventName
			eventName = el
			el = this._el
		}
		
		var handlers = this._events[eventName]
		if (handlers) {
			handlers.push(handler)
		} else {
			this._events[eventName] = [handler]
			var trueHandler = this._events[eventName + '__handler__'] = bind(this, '_onEvent', eventName)
			if (el.addEventListener) {
				el.addEventListener(
					( eventName == 'mousewheel' && browser.isFirefox ? 'MozMousePixelScroll'
					: eventName), trueHandler, false)
			} else if (el.attachEvent) {
				el.attachEvent("on"+eventName, trueHandler)
			}
		}
		return this
	}

	this._onEvent = function(eventName, e) {
		e = e || event
		var eventObj = { keyCode: e.keyCode, metaKey: e.metaKey,
			target: e.target || e.srcElement }

		if (eventName == 'mousewheel') {
			// http://adomas.org/javascript-mouse-wheel/
			// https://developer.mozilla.org/en/Gecko-Specific_DOM_Events
			if (typeof e.wheelDeltaX == 'number') {
				eventObj.dx = -e.wheelDeltaX
				eventObj.dy = -e.wheelDeltaY
			} else if (e.wheelDelta) {
				eventObj.dy = -e.wheelDelta
			} else if (e.detail) {
				if (e.axis == e.HORIZONTAL_AXIS) { eventObj.dx = e.detail }
				if (e.axis == e.VERTICAL_AXIS) { eventObj.dy = e.detail }
			}
		}

		if (typeof e.pageX == 'number')   {
			eventObj.x = e.pageX
			eventObj.y = e.pageY
		} else if (typeof e.clientX == 'number') {
			eventObj.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
			eventObj.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
		}

		eventObj.cancel = function() {
			if (e.preventDefault) { e.preventDefault() }
			else { e.returnValue = false }
		}

		if (e.type == 'keypress') {
			eventObj.charCode = (eventObj.charCode == 13 && eventObj.keyCode == 13) 
			? 0 // in Webkit, return gives a charCode as well as a keyCode. Should only be a keyCode
			: e.charCode
		}

		var handlers = this._events[eventName]
		for (var i=0; i<handlers.length; i++) {
			handlers[i](eventObj)
		}
	}

	this._off = function(el, eventName, handler) {
		if (arguments.length == 2) { 
			handler = eventName
			eventName = el
			el = this._el
		}

		if (handler) {
			remove(this._events[eventName], handler)
		} else {
			var trueHandler = this._events[eventName + '__handler__']
			delete this._events[eventName]
			delete this._events[eventName + '__handler__']
			if (el.removeEventListener) {
				el.removeEventListener(eventName, trueHandler, false)
			} else if (el.detachEvent) {
				el.detachEvent("on"+eventName, trueHandler)
			}
		}
		return this
	}
	
	this._delegateOn = function(el, eventName, handler) {
		if (arguments.length == 2) {
			handler = eventName
			eventName = el
			el = this._el
		}
		this._on(el, eventName, bind(this, '_onDelegatedEvent', handler))
	}
	
	this._onDelegatedEvent = function(handler, e) {
		var target = e.target
		while(target) {
			if (!target.delegateID) {
				target = target.parentNode
				continue
			}
			handler(target.delegateID, target)
			return
		}
	}
	
	/* Positioning
	 *************/
	// dom offset code adopted from jQuery JavaScript Library v1.3.2
	/*!
	 * jQuery JavaScript Library v1.3.2
	 * http://jquery.com/
	 *
	 * Copyright (c) 2009 John Resig
	 * Dual licensed under the MIT and GPL licenses.
	 * http://docs.jquery.com/License
	 *
	 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
	 * Revision: 6246
	 */
	this.layout = function(el) {
		if (!el) { el = this._el }
		var win = window;

		if (el.getBoundingClientRect) {
			var box = el.getBoundingClientRect(), doc = el.ownerDocument, body = doc.body, docElem = doc.documentElement,
				clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
				top  = box.top  + (win.pageYOffset || docElem.scrollTop  || body.scrollTop ) - clientTop,
				left = box.left + (win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
			return { y: top, x: left, w: box.right - box.left, h: box.bottom - box.top };

		} else {
			var offset = arguments.callee.offset;
			if (!offset) {
				var body = document.body, container = document.createElement('div'), innerDiv, checkDiv, table, td, rules, prop, bodyMarginTop = body.style.marginTop,
					html = '<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';

				rules = { position: 'absolute', top: 0, left: 0, margin: 0, border: 0, width: '1px', height: '1px', visibility: 'hidden' };
				for (prop in rules) container.style[prop] = rules[prop];

				container.innerHTML = html;
				body.insertBefore(container, body.firstChild);
				innerDiv = container.firstChild, checkDiv = innerDiv.firstChild, td = innerDiv.nextSibling.firstChild.firstChild;

				var offset = {};
				offset.doesNotAddBorder = (checkDiv.offsetTop !== 5);
				offset.doesAddBorderForTableAndCells = (td.offsetTop === 5);

				innerDiv.style.overflow = 'hidden', innerDiv.style.position = 'relative';
				offset.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

				body.style.marginTop = '1px';
				offset.doesNotIncludeMarginInBodyOffset = (body.offsetTop === 0);
				body.style.marginTop = bodyMarginTop;

				body.removeChild(container);
				arguments.callee.offset = offset;
			}

			var height = el.offsetHeight;
			var width = el.offsetWidth;

			var offsetParent = el.offsetParent, prevOffsetParent = el,
				doc = el.ownerDocument, computedStyle, docElem = doc.documentElement,
				body = doc.body, defaultView = doc.defaultView,
				prevComputedStyle = defaultView.getComputedStyle(el, null),
				top = el.offsetTop, left = el.offsetLeft;

			while ((el = el.parentNode) && el !== body && el !== docElem) {
				computedStyle = defaultView.getComputedStyle(el, null);
				top -= el.scrollTop, left -= el.scrollLeft;
				if (el === offsetParent) {
					top += el.offsetTop, left += el.offsetLeft;
					if (offset.doesNotAddBorder && !(offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(el.tagName))) {
						top += parseInt(computedStyle.borderTopWidth, 10) || 0;
						left += parseInt(computedStyle.borderLeftWidth, 10) || 0;
					}
					prevOffsetParent = offsetParent;
					offsetParent = el.offsetParent;
				}
				if (offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible") {
					top += parseInt(computedStyle.borderTopWidth, 10) || 0;
					left += parseInt(computedStyle.borderLeftWidth, 10) || 0;
				}
				prevComputedStyle = computedStyle;
			}

			if (prevComputedStyle.position === "relative" || prevComputedStyle.position === "static") {
				top += body.offsetTop;
				left += body.offsetLeft;
			}

			if (prevComputedStyle.position === "fixed") {
				top  += Math.max(docElem.scrollTop, body.scrollTop);
				left += Math.max(docElem.scrollLeft, body.scrollLeft);
			}

			return { y: top, x: left, w: width, h: height };
		}
	}
	// end jQuery positioning code

	/* Drag and drop
	 ***************/
	var defaults = { threshold:5 }
	this._makeDraggable = function(opts) {
		opts = extend(opts, defaults)
		this._on('mousedown', bind(this, '_onDragMouseDown', opts))
		return this
	}

	this._onDragMouseDown = function(opts, e) {
		e.cancel()
		this._drag = {
			pastThreshold:false,
			start:{ x:e.x, y:e.y },
			last: { x:e.x, y:e.y }
		}
		this._dragMouseMoveHandler = bind(this, '_onDragMouseMove', opts)
		this._dragMouseUpHandler = bind(this, '_onDragMouseUp')
		this
			._on(document, 'mousemove', this._dragMouseMoveHandler)
			._on(document, 'mouseup', this._dragMouseUpHandler)
	}

	this._onDragMouseMove = function(opts, e) {
		var data = this._getDragData(e)
		if (this._drag.pastThreshold) {
			this._publish('drag', data)
		} else {
			if (data.dx^2 + data.dy^2 > opts.threshold^2) {
				this._drag.pastThreshold = true
				this._publish('drag', data)
			}
		}
	}

	this._onDragMouseUp = function(e) {
		var data = this._getDragData(e)
		delete this._drag
		this
			._off(document, 'mousemove', this._dragMouseMoveHandler)
			._off(document, 'mouseup', this._dragMouseUpHandler)
		this._publish('drop', data)
	}

	this._getDragData = function(e) {
		var drag = this._drag,
			start = drag.start,
			last = drag.last

		var data = {
			src:    { x: start.x,       y: start.y },
			dst:    { x: e.x,           y: e.y },
			offset: { x: e.x - start.x, y: e.y - start.y },
			delta:  { x: e.x - last.x,  y: e.y - last.y }
		}

		last.x = e.x
		last.y = e.y

		return data
	}
})
