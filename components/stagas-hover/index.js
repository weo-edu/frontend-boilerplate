
/**
 * 
 * hover
 * 
 */

/**
 * Module dependencies.
 */

var mouseenter = require('mouseenter')
var mouseleave = require('mouseleave')

/**
 * Export hover.
 */

module.exports = hover

/**
 * Binds `mouseenter` and `mouseleave` events
 * on an `el`.
 *
 * @param {element} el
 * @param {fn} onmouseenter
 * @param {fn} onmouseleave
 * @param {number} leavedelay
 *
 * @return {element} el
 */

function hover (el, onmouseenter, onmouseleave, leavedelay) {
  if (leavedelay) {
    var t
    mouseenter(el, function (ev) {
      clearTimeout(t)
      onmouseenter(ev)
    })
    mouseleave(el, function (ev) {
      clearTimeout(t)
      t = setTimeout(onmouseleave, leavedelay, ev)
    })
  }
  else {
    mouseenter(el, onmouseenter)
    mouseleave(el, onmouseleave)
  }
  return el
}

/**
 * Hovers only once.
 *
 * @param {element} el 
 * @param {fn} onmouseenter 
 * @param {fn} onmouseleave 
 *
 * @return {element} el
 */

hover.once = function (el, onmouseenter, onmouseleave) {
  mouseenter(el, onmouseenter)
  mouseleave(el, function wrapper (ev) {
    mouseenter.unbind(el, onmouseenter)
    mouseleave.unbind(el, wrapper)

    onmouseleave.apply(this, arguments)
  })
}
