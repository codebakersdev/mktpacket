/*!
 * mktpacket - v0.8.33
 * Copyright (c) 2025 - CodeBakers
 * Licensed under our Custom License.
 * See the LICENSE file in the project root for more information.
 */

window.dataLayer = window.dataLayer || [];
mktpacket = {
  data: {
    client: {},
    page: {},
    user: {}
  },
  ctrl: {
    api_key: document.currentScript.getAttribute('key')??'free-version',
    gtag_id: document.currentScript.getAttribute('gtag')??'',
    persist: ['uuid', 'first_page_local', 'first_page_session', 'referrer_local', 'referrer_session']
  }
};

mktpacket.func = {
  
  // Page Data
  getPageStatus: function() {
    mktpacket.data.page.status = (performance.getEntriesByType('navigation')[0]?.responseStatus) ?? 'unsupported';
  },

  getPageLoadTime: function() {
    mktpacket.data.page.load_time = Math.floor(performance.getEntriesByType("navigation")[0].duration) ?? 'unsupported';
  },

  getPageUrl: function () {
    mktpacket.data.page.url = window.location.href;
  },

  getPageAnchor: function () {
      const anchor = window.location.href.split('#')[1];
      anchor && (mktpacket.data.page.anchor = anchor);
  },

  getPageTitle: function () {
    mktpacket.data.page.title = document.title ? document.title : 'no_title';
  },

  getPageLanguage: function () {
    mktpacket.data.page.language = document.documentElement.lang ? document.documentElement.lang : 'no_language';
  },

  getPageMetadata: function() {
    const metadata = {};
    const metaTags = document.getElementsByTagName('meta');
    for (const meta of metaTags) {
      const key = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (key && content) {
        metadata[key] = content;
      }
    }
    if(Object.keys(metadata).length) {
      mktpacket.data.page.metadata = metadata;
    }
  },

  getPageReferrer: function (storageType = 'session') {
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const keySuffix = storageType === 'local' ? 'referrer_local' : 'referrer_session';
    const storageKey = 'mktpacket_' + keySuffix;
    let referrer = storage.getItem(storageKey);
    if (referrer === null) {
      const isExternalRef = document.referrer && !document.referrer.includes(location.hostname);
      referrer = isExternalRef ? document.referrer : 'no_referrer';

      if (mktpacket.ctrl.persist.includes(keySuffix)) {
        storage.setItem(storageKey, referrer);
      }
    }
    mktpacket.data.page[keySuffix] = referrer;
  },

  getPageParameters: function () {
    const urlParams = new URLSearchParams(window.location.search);
    const parameters = {};

    for (const [key, value] of urlParams.entries()) {
      parameters[key] = value;
    }

    if (Object.keys(parameters).length) {
      mktpacket.data.page.parameters = parameters;
    }
  },

  getPageColors: function () {
    let includeZeroWidth = false;
    let allColors = {};
    let props = ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"];
    let skipColors = { "rgb(0, 0, 0)": 1, "rgba(0, 0, 0, 0)": 1, "rgb(255, 255, 255)": 1 };
    [].forEach.call(document.querySelectorAll("*"), function (node) {
        var nodeColors = {};
        props.forEach(function (prop) {
            let color = window.getComputedStyle(node, null).getPropertyValue(prop);
            let isBorder = prop.includes("border");
            let notZeroWidth = isBorder ? window.getComputedStyle(node, null).getPropertyValue(prop.replace("color", "width")) !== "0px" : true;

            if (color && !skipColors[color] && (includeZeroWidth || notZeroWidth)) {
                if (!nodeColors[color]) {
                    allColors[color] = (allColors[color] || { count: 0 });
                    allColors[color].count++;
                    nodeColors[color] = true;
                }
            } 
        });
    });
    mktpacket.data.page.colors = Object.entries(allColors).map(([rgba, { count }]) => {
        var rgb = rgba.match(/\d+/g).slice(0, 3).map(Number);
        var hex = "#" + rgb.map(c => (c < 16 ? "0" : "") + c.toString(16)).join("");
        return { rgba: rgba, hex: hex, elements_count: count };
    }).sort((a, b) => b.elements_count - a.elements_count);
  },

  getPageClickCount: function () {
    if (!mktpacket.data.page.click_count) {
      mktpacket.data.page.click_count = {};
    }

    document.addEventListener('click', function (event) {
      const el = event.target;
      let descriptor = el.tagName.toLowerCase();
      if (el.id) {
        descriptor += `#${el.id}`;
      } else if (el.className && typeof el.className === 'string') {
        descriptor += '.' + el.className.trim().split(/\s+/).join('.');
      }
      if (descriptor === 'div' || descriptor === 'span' || descriptor === 'p' || descriptor === 'a') {
        descriptor += '[inner="' + el.innerText.trim().slice(0, 15) + '"]';
      }
      if (!mktpacket.data.page.click_count[descriptor]) {
        mktpacket.data.page.click_count[descriptor] = {
          count: 0,
          last_click_timestamp: null
        };
      }
      const clickData = mktpacket.data.page.click_count[descriptor];
      clickData.count++;
      clickData.last_click_timestamp = Math.floor(Date.now() / 1000);
    });
  },
  getPageScrollDepth: function () {
    const calculateScrollDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
      const maxScrollable = scrollHeight - viewportHeight;
      const scrollPercent = maxScrollable > 0 ? Math.min((scrollTop / maxScrollable) * 100, 100) : 0;

      if (!mktpacket.data.page) mktpacket.data.page = {};
      mktpacket.data.page.scroll_depth = {
        pixels: scrollTop,
        percent: Math.round(scrollPercent),
        max_scrollable_range: maxScrollable,
        total_page_height: scrollHeight
      };
    };

    calculateScrollDepth();
    setTimeout(window.mktpacket.func.getPageScrollDepth, 1000);
  },

  // Client Data
  getClientViewport: function () {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const zoom = screen.width / window.innerWidth;

    mktpacket.data.client.viewport = {
      width: viewportWidth,
      height: viewportHeight,
      device_pixel_ratio: devicePixelRatio,
      estimated_zoom: parseFloat(zoom.toFixed(2))
    };

    setTimeout(window.mktpacket.func.getClientViewport, 1000);
  },

  getClientIsTouchscreen:function() {
    mktpacket.data.client.is_touchscreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0) ? true : false;
  },

  getClientIsMobile: function() {
    if (navigator.userAgentData && 'mobile' in navigator.userAgentData) {
      mktpacket.data.client.is_mobile = navigator.userAgentData.mobile;
    } else {
      var ua = navigator.userAgent.toLowerCase();
      mktpacket.data.client.is_mobile = /iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua);
    }
  },

  getClientScreenOrientation:function() {
    mktpacket.data.client.screen_orientation = screen.orientation.type;
    setTimeout(window.mktpacket.func.getClientScreenOrientation, 1000);
  },

  getClientPlatform: function() {
      const userAgent = navigator.userAgent;
      const platforms = [
        { name: 'android', pattern: /Android/i },
        { name: 'iphone', pattern: /iPhone/i },
        { name: 'ipad', pattern: /iPad/i },
        { name: 'ipod', pattern: /iPod/i },
        { name: 'windows', pattern: /IEMobile|Windows/i },
        { name: 'macos', pattern: /Macintosh/i },
        { name: 'chromeos', pattern: /CrOS/i },
        { name: 'linux', pattern: /Linux/i },
        { name: 'blackberry', pattern: /BlackBerry/i },
        { name: 'bluebird', pattern: /EF500/i },
        { name: 'datalogic', pattern: /DL-AXIS/i },
        { name: 'honeywell', pattern: /CT50/i },
        { name: 'zebra', pattern: /TC70|TC55/i }
      ];
      let client_platform = 'unknown';
      for (const platform of platforms) {
          if (platform.pattern.test(userAgent)) {
              client_platform = platform.name;
              break;
          }
      }
      mktpacket.data.client.platform = client_platform;
  },

  getClientBrowserName: function() {
      const userAgent = navigator.userAgent;
      const browsers = [
        { name: 'chrome', patterns: ['Chrome'] },
        { name: 'firefox', patterns: ['Firefox'] },
        { name: 'safari', patterns: ['Safari'] },
        { name: 'edge', patterns: ['Edge', 'Edg'] },
        { name: 'opera', patterns: ['Opera', 'Opr'] },
        { name: 'vivaldi', patterns: ['Vivaldi'] },
      ];
      let client_browser_name = 'unknown';
      for (const browser of browsers) {
          if (browser.patterns.some(pattern => userAgent.includes(pattern))) {
              client_browser_name = browser.name;
              break;
          }
      }
      mktpacket.data.client.browser_name = client_browser_name;
  },

  getClientBrowserLanguage: function() {
    mktpacket.data.client.browser_language = navigator.language;
  },

  getClientTimezone: function() {
    mktpacket.data.client.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  getClientBatteryStatus: function() {
    if (navigator.getBattery) {
      navigator.getBattery().then(function(battery) {
        mktpacket.data.client.battery = {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      });
      setTimeout(window.mktpacket.func.getClientBatteryStatus, 1000);
    } else {
      mktpacket.data.client.battery = 'no_information';
    }
  },

  getClientNetwork: function () {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      mktpacket.data.client.network = {
        effective_type: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        save_data: connection.saveData || false
      };
      setTimeout(window.mktpacket.func.getClientNetwork, 1000);
    } else {
      mktpacket.data.client.network = 'no_information';
    }
  },
  
  // User Data
  getUserLocalDatetime: function () {
    const now = new Date();

    if (!mktpacket.data.user) mktpacket.data.user = {};
    mktpacket.data.user.local_datetime = {
      iso: now.toISOString(),
      locale_string: now.toLocaleString(),
      timezone_offset_minutes: now.getTimezoneOffset() * -1,
      timestamp: now.getTime()
    };
  },

  getUserIsBot:function() {
    const is_bot_navigator = !navigator.language || 
                           !navigator.languages || 
                           navigator.languages.length === 0 || 
                           navigator.webdriver || 
                           navigator.doNotTrack !== null || 
                           navigator.hardwareConcurrency === undefined || 
                           navigator.maxTouchPoints === undefined;

    const userAgent = navigator.userAgent.toLowerCase();
    const is_bot_useragent = /bot|crawler|spider|robot|crawling/i.test(userAgent);

    mktpacket.data.user.is_bot = is_bot_navigator || is_bot_useragent;
  },

  getUserHasAdblock: function() {
    fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
        mode: 'no-cors'
    }).then(() => {
      mktpacket.data.user.has_adblock = false;
    }) .catch(() => {
      mktpacket.data.user.has_adblock = true;
    });
  },

  getUserFirstPage: function (storageType = 'session') {
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const keySuffix = storageType === 'local' ? 'first_page_local' : 'first_page_session';
    const storageKey = 'mktpacket_' + keySuffix;

    let firstPage = storage.getItem(storageKey);

    if (firstPage === null) {
      firstPage = document.URL;
      if (mktpacket.ctrl.persist.includes(keySuffix)) {
        storage.setItem(storageKey, firstPage);
      }
    }

    mktpacket.data.user[keySuffix] = firstPage;
  },

  getUserTimeOnPage: function () {
    const startTime = Date.now();
    const updateTime = () => {
      const now = Date.now();
      const timeOnPage = Math.floor((now - startTime) / 1000);
      mktpacket.data.user.time_on_page = timeOnPage;
    };
    const interval = setInterval(updateTime, 1000);
    window.addEventListener('beforeunload', () => {
      updateTime();
      clearInterval(interval);
    });
  },

  getUserTimeOnWebsite: function () {
    const key = 'mktpacket_' + 'time_on_website';
    const savedTime = parseInt(sessionStorage.getItem(key), 10);
    let totalTime = isNaN(savedTime) ? 0 : savedTime;
    const startTime = Date.now();

    const updateTime = () => {
      const now = Date.now();
      const sessionTime = Math.floor((now - startTime) / 1000);
      const currentTotal = totalTime + sessionTime;
      mktpacket.data.user.time_on_website = currentTotal;
      sessionStorage.setItem(key, currentTotal);
    };

    const interval = setInterval(updateTime, 1000);

    window.addEventListener('beforeunload', () => {
      updateTime();
      clearInterval(interval);
    });
  },
  getUserIsReturning: function() {
    const hasVisited = localStorage.getItem('mktpacket_' + 'user_returning') === 'true';
    mktpacket.data.user.is_returning = hasVisited;
    if (!hasVisited) {
      localStorage.setItem('mktpacket_' + 'user_returning', 'true');
    }
  },

  // Marketing Data
  getAdClick: function () {
    const adList = ['click_id', 'li_click_id', 'pinid', 'rid', 'tid', 'scid', 'msclkid', 'dclid', 'twclid', 'ttclid', 'fbclid', 'gclid'];
    for (let key in mktpacket.data.page.parameters) {
      if (adList.includes(key.toLowerCase())) {
        mktpacket.data.ad = {};
        mktpacket.data.ad.click_source = key;
        mktpacket.data.ad.click_value = mktpacket.data.page.parameters[key];
      }
    }
  },
  
  // ABTasty
  getABTasty: function () {
    if (typeof ABTasty !== 'undefined' && typeof ABTasty.getTestsOnPage === 'function') {
      var tests = ABTasty.getTestsOnPage();
      if (tests && Object.keys(tests).length > 0) {
        for (let testId in tests) {
          if (tests.hasOwnProperty(testId)) {
            let test = tests[testId];
            mktpacket.data.abtasty = {};
            mktpacket.data.abtasty.campaign_id = Number(testId);
            mktpacket.data.abtasty.campaign_name = test.name;
            mktpacket.data.abtasty.variation_id = test.variationID;
            mktpacket.data.abtasty.variation_name = test.variationName;
            mktpacket.data.abtasty.type = test.type;
            mktpacket.data.abtasty.sub_type = test.sub_type;
            mktpacket.data.abtasty.status = test.status;
            mktpacket.data.abtasty.trigger_mode = test.triggerMode;
          }
        }
      }
    }
  },
  
  // OneTrust
  getOneTrust: function () {
    if(typeof OneTrust !== undefined){
      function getActiveGroups() {
        return OnetrustActiveGroups;
      }
      mktpacket.data.onetrust = {
        google_consent: OneTrust.GetDomainData().GoogleConsent,
        get active_groups() {
            return getActiveGroups();
        }
      };
    }
  },
  
  // Google Analytics
  getGAClientId: function () {
    if (typeof gtag === 'function' && (mktpacket.ctrl.gtag_id !== null || mktpacket.ctrl.gtag_id !== '')) {
      gtag('get', mktpacket.conf.gtag_id, 'client_id', function (clientId) { 
        if (clientId) {
          mktpacket.data.ga = mktpacket.data.ga || {};
          mktpacket.data.ga.client_id = clientId;
        }
      })
    }
  },
  getGASessionId: function () {
    if (typeof gtag === 'function' && (mktpacket.ctrl.gtag_id !== null || mktpacket.ctrl.gtag_id !== '')) {
      gtag('get', mktpacket.conf.gtag_id, 'session_id', function (sessionId) {
        if (sessionId) {
          mktpacket.data.ga = mktpacket.data.ga || {};
          mktpacket.data.ga.session_id = sessionId;
        }
      })
    }
  },
  
  // Aux Functions
  auxTrackFormSubmissions: function() {
    mktpacket.data.page.form = {};
    const stored = localStorage.getItem('mktpacket_form_data');
    if (stored) {
      try {
        mktpacket.data.page.form = JSON.parse(stored);
      } catch {
        mktpacket.data.page.form = { prev_submitted: false };
      }
    } else {
      mktpacket.data.page.form.prev_submitted = false;
    }

    function storeFormSubmission(form) {
      mktpacket.data.page.form.prev_submitted = true;
      mktpacket.data.page.form.id = form.id || null;
      mktpacket.data.page.form.url = window.location.href || null;
      mktpacket.data.page.form.timestamp = Math.floor(Date.now() / 1000);
      localStorage.setItem('mktpacket_form_data', JSON.stringify(mktpacket.data.page.form));
    }

    document.addEventListener('submit', function(event) {
      const form = event.target;
      if (form.tagName.toLowerCase() === 'form') {
        storeFormSubmission(form);
      }
    }, true);

    document.addEventListener('click', function(event) {
      const btn = event.target.closest('button[type="submit"], input[type="submit"]');
      if (!btn) return;
      const form = btn.closest('form');
      if (form) {
        setTimeout(() => {
          storeFormSubmission(form);
        }, 100);
      }
    }, true);

    if (window.fetch) {
      const origFetch = window.fetch;
      window.fetch = function(...args) {
        const [resource, config] = args;
        if (config && config.method && config.method.toUpperCase() === 'POST') {
          const forms = document.querySelectorAll('form');
          const visibleForm = Array.from(forms).find(f => f.offsetParent !== null);
          if (visibleForm) {
            storeFormSubmission(visibleForm);
          }
        }
        return origFetch.apply(this, args);
      };
    }
  },

  auxGTagObserver: function (callback) {
    if (typeof gtag === 'function') {
        callback();
        return;
    }
    const gtagobserver = new MutationObserver(() => {
        if (typeof gtag === 'function') {
            gtagobserver.disconnect();
            callback();
        }
    });
    gtagobserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
    setTimeout(() => {
        gtagobserver.disconnect();
    }, 5000);
  },

  auxPageURLObserver: function (callback) {
    callback(window.location.href);
    const checkUrlChange = () => {
      callback(window.location.href);
    };
    window.addEventListener('popstate', checkUrlChange);
    window.addEventListener('hashchange', checkUrlChange);

    return () => {
      window.removeEventListener('popstate', checkUrlChange);
      window.removeEventListener('hashchange', checkUrlChange);
    };
  },

  auxAPIConnect: function (callback, func_name = 'getAllData') {
    const api_key = mktpacket.ctrl.api_key;
    if (!api_key) return;
    const apiUrl = 'https://codebakers.dev/apis/mktpacket/';
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      if (xhr.status === 200) {
        const jsonResponse = xhr.response;
        if (jsonResponse) {
          const usePersistedValues = (func_name === 'getAllData');
          mktpacket.func.auxObjectMerge(mktpacket, jsonResponse, usePersistedValues);
          if (callback) callback();
        }
      } else {
        console.error('API call failed: ', xhr.status);
      }
    };

    xhr.open('POST', apiUrl, true);
    xhr.responseType = 'json';
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ key: api_key, func: func_name }));
  },
  auxObjectMerge: function (target, source, usePersistedValues = true) {
    for (const key of Object.keys(source)) {
      const valueFromSource = source[key];
      if (valueFromSource instanceof Object && key in target && typeof target[key] === 'object') {
        mktpacket.func.auxObjectMerge(target[key], valueFromSource, usePersistedValues);
      } else {
        const shouldPersist = mktpacket.ctrl.persist.includes(key);
        if (shouldPersist) {
          const persistedValue = localStorage.getItem('mktpacket_' + key);
          if (usePersistedValues && persistedValue !== null) {
            target[key] = persistedValue;
          } else {
            target[key] = valueFromSource;
            localStorage.setItem('mktpacket_' + key, valueFromSource);
          }
        } else {
          target[key] = valueFromSource;
        }
      }
    }
    return target;
  },
  auxReadyEvent: function () {
    window.dataLayer.push({
      'event': 'mktpacket_ready',
      'license': mktpacket.ctrl.license,
     });
  },
  
  // API Updaters
  getUserIP: function() {
    mktpacket.func.auxAPIConnect(function () {
      mktpacket.data.user.ip = mktpacket.ctrl.api_response;
    }, 'getUserIP');
  },
  getUserISP: function() {
    mktpacket.func.auxAPIConnect(function () {
      mktpacket.data.user.isp = mktpacket.ctrl.api_response;
    }, 'getUserISP');
  },
  getUserUniqueID: function () {
    mktpacket.func.auxAPIConnect(function () {
      mktpacket.data.user.uuid = mktpacket.ctrl.api_response;
      if (mktpacket.ctrl.persist.includes('uuid')) {
        localStorage.setItem('mktpacket_' + 'uuid', mktpacket.data.user.uuid);
      }
    }, 'getUserUniqueID', true);
  },
  
  // Init Layer 1 (script init)
  init: function () {
    this.getPageUrl();
    this.getPageTitle();
    this.getPageLanguage();
    this.getPageParameters();
    this.getPageReferrer('local');
    this.getPageReferrer('session');
    this.getPageClickCount();
    this.getPageMetadata();

    this.getClientViewport();
    this.getClientNetwork();
    this.getClientPlatform();
    this.getClientTimezone();
    this.getClientBrowserName();
    this.getClientBrowserLanguage();
    this.getClientIsMobile();
    this.getClientIsTouchscreen();
    this.getClientScreenOrientation();
    this.getClientBatteryStatus();
    
    this.getUserIsBot();
    this.getUserHasAdblock();
    this.getUserFirstPage('local');
    this.getUserFirstPage('session');
    this.getUserTimeOnPage();
    this.getUserTimeOnWebsite();
    this.getUserIsReturning();
    
    this.getAdClick();
    this.getABTasty();
    
    this.auxGTagObserver(() => {
        this.getGAClientId();
        this.getGASessionId();
    });
    this.auxPageURLObserver(() => {
      this.getPageUrl();
      this.getPageAnchor();
      this.getPageTitle();
      this.getUserHasAdblock();
      this.getABTasty();
    });
    this.auxAPIConnect();
  }
}

// Init layer 2 (document load)
window.addEventListener('load', function(){    
    setTimeout(function(){
      mktpacket.func.getPageLoadTime();
      mktpacket.func.getPageStatus();
      mktpacket.func.getPageScrollDepth();
      mktpacket.func.getABTasty();
      //mktpacket.func.getPageColors();
      mktpacket.func.auxReadyEvent();
      mktpacket.func.auxTrackFormSubmissions();
      console.log(mktpacket.data);
    }, 0);
});

// Cast the spell!
mktpacket.func.init();

/*const eventTarget = new EventTarget();
// API Event listener
eventTarget.addEventListener('mktPacket', (event) => {
  const data = event.detail;
  console.log('IP Address:', data);
  return data;
});*/

//Init Layer 99
/*document.addEventListener('readystatechange', e => {
  if(document.readyState === "complete"){
  
  }
});*/
