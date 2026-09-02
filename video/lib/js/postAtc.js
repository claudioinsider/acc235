/* postAtc.js - behaviour for the sales content revealed under the video.
   Static version: countdowns, FAQ accordion, sticky bar, scroll-to-offer.
   Contains no analytics: tracking is handled exclusively by Google Tag Manager. */
;(function () {
  "use strict"

  function updateTimer(el) {
    var left = parseInt(el.dataset.time, 10)
    if (isNaN(left)) return
    var id = setInterval(function () {
      if (left <= 0) {
        clearInterval(id)
        el.innerHTML = "00:00"
        return
      }
      var m = Math.floor(left / 60),
        s = left % 60
      el.innerHTML = ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2)
      left--
    }, 1000)
  }

  function setupFaq() {
    var list = document.querySelector(".faq__list")
    if (!list) return
    Array.prototype.forEach.call(
      list.querySelectorAll(".faq__item"),
      function (item) {
        var ctrl = item.querySelector(".faq__ctrl"),
          answer = item.querySelector(".faq__answer")
        if (!ctrl || !answer) return
        ctrl.addEventListener("click", function () {
          answer.classList.toggle("opened")
          ctrl.classList.toggle("opened")
          answer.style.height = answer.classList.contains("opened")
            ? answer.scrollHeight + "px"
            : null
        })
      },
    )
  }

  /* Scrolls to the pricing block nearest above the viewport. */
  function orderButtonClick() {
    var blocks = document.querySelectorAll(".section__second")
    if (!blocks.length || !blocks[0].offsetParent) return true
    var lastItem
    Array.prototype.forEach.call(blocks, function (item) {
      var top = item.getBoundingClientRect().top
      if (lastItem && top > 1) return
      lastItem = item
    })
    if (!lastItem) return true
    if (typeof scrollToSmoothly === "function") {
      scrollToSmoothly(
        window.pageYOffset + lastItem.getBoundingClientRect().top,
        1000,
      )
    } else {
      lastItem.scrollIntoView({ behavior: "smooth" })
    }
    return false
  }

  function pausePageVideo() {
    try {
      var vt = document.querySelector("vturb-smartplayer")
      if (vt && typeof vt.pause === "function") return void vt.pause()
      if (
        typeof smartplayer !== "undefined" &&
        smartplayer.instances &&
        smartplayer.instances.length
      ) {
        var wrap = smartplayer.instances[0],
          inst = wrap.instance || wrap
        if (typeof inst.pause === "function") inst.pause()
      }
    } catch (e) {}
  }

  window.initPostAtc = function () {
    if (window.__postAtcReady) return
    window.__postAtcReady = true

    var scrollBtn = document.querySelector(".remider__button"),
      qualBtn = document.querySelector(".qual__btn")
    if (scrollBtn) scrollBtn.onclick = orderButtonClick
    if (qualBtn) qualBtn.onclick = orderButtonClick

    var steper = document.querySelector("#steper"),
      remainder = document.querySelector(".remainder")
    if (steper && remainder) {
      window.addEventListener("scroll", function () {
        if (window.scrollY < steper.offsetTop) remainder.classList.remove("showed")
        else remainder.classList.add("showed")
      })
    }

    /* Pause the video when the visitor heads to checkout. The href is static
       and is decorated with attribution by js/dl.js. */
    Array.prototype.forEach.call(
      document.querySelectorAll(
        ".order-link-1-bottle, .order-link-3-bottle, .order-link-6-bottle",
      ),
      function (link) {
        link.addEventListener("click", pausePageVideo)
      },
    )

    var timers = document.querySelectorAll(".timer")
    Array.prototype.forEach.call(timers, updateTimer)
    if (window.wsFlags && window.wsFlags.nocountdown) {
      Array.prototype.forEach.call(timers, function (t) {
        t.classList.remove("show")
        t.classList.add("hide")
      })
    }

    setupFaq()

    var source = document.querySelector(".footer-logo2"),
      target = document.querySelector(".footer-logo")
    if (source && target) target.innerHTML = source.innerHTML
  }
})()
