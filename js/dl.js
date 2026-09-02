/* dl.js — first-party dataLayer, attribution capture and Google Tag Manager loader.
   Loaded synchronously in the <head> of every page:
     <script src="../js/dl.js" data-page="landing|video|legal|content"></script>
   This is the ONLY tracking code on the site. Everything else is configured in GTM. */
;(function (w, d) {
  "use strict"

  /* ------------------------------------------------------------------ */
  /*  Single place to change the container / loader (Stape custom loader) */
  /* ------------------------------------------------------------------ */
  var GTM_ID = "GTM-XXXXXXX"
  var GTM_SRC = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID

  var FUNNEL = "RetinaClear",
    LEAD_ID = "RC_LEAD_02"
  var COOKIE = "rc_attr",
    COOKIE_DAYS = 90
  var CLICK_IDS = ["gclid", "gbraid", "wbraid"]
  var UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
  var WS_FALLBACK = {
    utm_source: "ws_source",
    utm_medium: "ws_medium",
    utm_campaign: "ws_campaign",
    utm_content: "ws_content",
    utm_term: "ws_term",
  }
  var PAGE =
    (d.currentScript && d.currentScript.getAttribute("data-page")) || "other"

  w.dataLayer = w.dataLayer || []

  /* ---------------------------- helpers ----------------------------- */
  function parseQuery(search) {
    var out = {}
    ;(search || "")
      .replace(/^\?/, "")
      .split("&")
      .forEach(function (pair) {
        if (!pair) return
        var i = pair.indexOf("="),
          k = i < 0 ? pair : pair.slice(0, i),
          v = i < 0 ? "" : pair.slice(i + 1)
        try {
          k = decodeURIComponent(k.replace(/\+/g, " "))
          v = decodeURIComponent(v.replace(/\+/g, " "))
        } catch (e) {}
        if (!(k in out)) out[k] = v
      })
    return out
  }
  function getCookie(name) {
    var m = d.cookie.match(
      new RegExp("(?:^|;\\s*)" + name.replace(/[.$]/g, "\\$&") + "=([^;]*)"),
    )
    return m ? m[1] : ""
  }
  function setCookie(name, value, days) {
    var s =
      name + "=" + value + "; path=/; max-age=" + days * 86400 + "; SameSite=Lax"
    if (location.protocol === "https:") s += "; Secure"
    d.cookie = s
  }
  function readAttr() {
    try {
      return JSON.parse(decodeURIComponent(getCookie(COOKIE)) || "{}")
    } catch (e) {
      return {}
    }
  }
  function writeAttr(a) {
    try {
      setCookie(COOKIE, encodeURIComponent(JSON.stringify(a)), COOKIE_DAYS)
    } catch (e) {}
  }
  function clip(v, n) {
    return v == null ? "" : String(v).slice(0, n)
  }

  /* Last click wins: a URL carrying a new click id / utm set replaces the stored record. */
  function captureAttribution() {
    var q = parseQuery(location.search),
      stored = readAttr(),
      fresh = {},
      hasNew = false
    CLICK_IDS.forEach(function (k) {
      if (q[k]) {
        fresh[k] = clip(q[k], 200)
        hasNew = true
      }
    })
    UTMS.forEach(function (k) {
      var v = q[k] || q[WS_FALLBACK[k]]
      if (v) {
        fresh[k] = clip(v, 100)
        hasNew = true
      }
    })
    if (!hasNew) return stored
    var same = CLICK_IDS.concat(UTMS).every(function (k) {
      return (stored[k] || "") === (fresh[k] || "")
    })
    if (same) return stored
    fresh.landing_ts = Date.now()
    fresh.landing_page = location.pathname
    writeAttr(fresh)
    return fresh
  }

  /* GA4 client_id: "_ga=GA1.1.1234567890.1700000000" -> "1234567890.1700000000" */
  function gaClientId() {
    var m = getCookie("_ga").match(/(\d+\.\d+)$/)
    return m ? m[1] : ""
  }
  /* GA4 session_id from the _ga_<STREAM> cookie (GS1 and GS2 formats). */
  function gaSessionId() {
    var m = d.cookie.match(/_ga_[A-Z0-9]+=GS\d\.\d\.(?:s)?(\d{9,})/)
    return m ? m[1] : ""
  }

  function push(event, params) {
    var evt = { event: event, funnel: FUNNEL, lead_id: LEAD_ID, page_type: PAGE },
      k
    for (k in params)
      if (Object.prototype.hasOwnProperty.call(params, k)) evt[k] = params[k]
    if (evt.ecommerce) w.dataLayer.push({ ecommerce: null })
    w.dataLayer.push(evt)
    return evt
  }

  /* Push, then navigate once GTM has processed the event (or after a timeout). */
  function pushThenGo(event, params, url, timeoutMs) {
    var ms = timeoutMs || 600,
      done = false
    function go() {
      if (done) return
      done = true
      location.href = url
    }
    params = params || {}
    params.eventCallback = go
    params.eventTimeout = ms
    push(event, params)
    setTimeout(go, ms + 200)
  }

  /* Append the current query string to a same-site href (landing -> video pass-through). */
  function withQuery(href) {
    var search = location.search.replace(/^\?/, "")
    if (!search) return href
    var hi = href.indexOf("#"),
      hash = hi > -1 ? href.slice(hi) : "",
      base = hi > -1 ? href.slice(0, hi) : href
    return base + (base.indexOf("?") > -1 ? "&" : "?") + search + hash
  }

  var attribution = captureAttribution()

  /* BuyGoods checkout URL for a package, decorated with sub-IDs that come back
     in the affiliate postback as {SUBID}..{SUBID4}. */
  function checkoutUrl(n) {
    var C = w.RC_CHECKOUT
    if (!C || !C.packages[n]) return ""
    var p = C.packages[n],
      a = attribution
    var clickId = a.gclid
      ? "gclid:" + a.gclid
      : a.gbraid
        ? "gbraid:" + a.gbraid
        : a.wbraid
          ? "wbraid:" + a.wbraid
          : ""
    var utm = [a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content, a.utm_term]
      .map(function (v) {
        return clip(v, 40)
      })
      .join("|")
    if (utm === "||||") utm = ""
    var q = {
      account_id: C.accountId,
      product_codename: p.codename,
      subid: clip(clickId, 120),
      subid2: clip(gaClientId(), 64),
      subid3: clip(gaSessionId(), 32),
      subid4: clip(utm, 200),
    }
    return (
      C.checkoutBase +
      "?" +
      Object.keys(q)
        .filter(function (k) {
          return q[k] !== ""
        })
        .map(function (k) {
          return k + "=" + encodeURIComponent(q[k])
        })
        .join("&")
    )
  }
  function itemFor(n) {
    var p = w.RC_CHECKOUT.packages[n]
    return { item_id: p.item_id, item_name: p.item_name, price: p.price, quantity: p.quantity }
  }

  w.RC = {
    page: PAGE,
    funnel: FUNNEL,
    leadId: LEAD_ID,
    attribution: attribution,
    push: push,
    pushThenGo: pushThenGo,
    withQuery: withQuery,
    checkoutUrl: checkoutUrl,
    gaClientId: gaClientId,
    gaSessionId: gaSessionId,
    getCookie: getCookie,
    parseQuery: parseQuery,
  }

  /* ------------------- page-view event, before gtm.js ------------------ */
  var viewEvents = { landing: "view_landing", video: "view_video" }
  push(viewEvents[PAGE] || "view_page", {
    attribution: attribution,
    has_click_id: !!(attribution.gclid || attribution.gbraid || attribution.wbraid),
    is_mobile: /Mobi|Android/i.test(navigator.userAgent),
  })

  /* ---------------------- GTM loader (official snippet) ---------------- */
  w.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" })
  var gtm = d.createElement("script"),
    first = d.getElementsByTagName("script")[0]
  gtm.async = true
  gtm.src = GTM_SRC
  first.parentNode.insertBefore(gtm, first)

  /* ------------- landing: decorate CTAs, track clicks (new tab) --------- */
  if (PAGE === "landing")
    d.addEventListener("DOMContentLoaded", function () {
      Array.prototype.forEach.call(d.querySelectorAll("a.cta"), function (a, i) {
        a.setAttribute("href", withQuery(a.getAttribute("href")))
        a.addEventListener("click", function () {
          push("click_landing_cta", {
            cta_index: i + 1,
            cta_type: a.classList.contains("image-link") ? "image" : "button",
            link_url: a.href,
          })
        })
      })
    })

  /* --- video: offer content + checkout buttons (config in window.RC_CHECKOUT) --- */
  if (PAGE === "video") {
    /* chamado por atc() em video/index.html quando a oferta e revelada */
    w.RC.offerShown = function (reason, seconds) {
      if (w.RC.__offerShown) return
      w.RC.__offerShown = true
      var p = { cta_reason: reason || "timestamp" }
      if (seconds != null) p.video_seconds = seconds
      push("offer_shown", p)
      var C = w.RC_CHECKOUT
      if (C)
        push("view_item_list", {
          ecommerce: {
            currency: C.currency,
            item_list_name: "video_offer",
            items: [6, 3, 1].map(itemFor),
          },
        })
    }

    d.addEventListener("DOMContentLoaded", function () {
      var C = w.RC_CHECKOUT
      if (!C) return
      var SELECTOR = ".order-link-1-bottle, .order-link-3-bottle, .order-link-6-bottle"
      var ANCHOR_SELECTOR = SELECTOR.split(",")
        .map(function (s) {
          return "a" + s.trim()
        })
        .join(", ")
      function packageOf(el) {
        var m = (el.className || "").match(/order-link-(\d)-bottle/)
        return m ? Number(m[1]) : null
      }
      function decorate() {
        Array.prototype.forEach.call(d.querySelectorAll(ANCHOR_SELECTOR), function (a) {
          var n = packageOf(a)
          if (n) a.setAttribute("href", checkoutUrl(n))
        })
      }
      decorate()

      /* one delegated listener = exactly one begin_checkout per click, whatever is nested */
      d.addEventListener("click", function (e) {
        var el = e.target.closest ? e.target.closest(SELECTOR) : null
        if (!el) return
        var n = packageOf(el)
        if (!n) return
        var url = checkoutUrl(n) /* built at click time so the _ga cookies are fresh */
        if (el.tagName === "A") el.setAttribute("href", url)
        push("begin_checkout", {
          package: n,
          value: C.packages[n].price,
          currency: C.currency,
          link_url: url,
          ecommerce: { currency: C.currency, value: C.packages[n].price, items: [itemFor(n)] },
        })
        /* anchors open the checkout in a new tab (target=_blank); nothing to block */
      })
    })
  }
})(window, document)
