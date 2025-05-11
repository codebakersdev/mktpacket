/*!
 * mktpacket - v0.8.28
 * Copyright (c) 2024 - CodeBakers
 * Licensed under our Custom License.
 * See the LICENSE file in the project root for more information.
 */

window.dataLayer = window.dataLayer || [];
mktpacket = {
  data: {
    page: {},
    client: {},
    user: {}
  },
  ctrl: {
    api_key: document.currentScript.getAttribute('key')??'free-version',
    gtag_id: document.currentScript.getAttribute('gtag')??'',
    persist: ['uuid', 'first_global_page', 'first_session_page']
  }
};

mktpacket.func = {
  
  // Page Data
  getPageLoadTime: function() {
    mktpacket.data.page.load_time = Math.floor(performance.getEntriesByType("navigation")[0].duration);
  },
  getPageStatus: function() {
    mktpacket.data.page.status = performance.getEntriesByType('navigation')[0].responseStatus;
  },
  getPageUrl: function () {
    mktpacket.data.page.url = window.location.href;
  },
  getPageTitle: function () {
    mktpacket.data.page.title = document.title ? document.title : 'no_title';
  },
  getPageLanguage: function () {
    mktpacket.data.page.language = document.documentElement.lang ? document.documentElement.lang : 'no_language';
  },
  getPageReferrer: function () {
    if (localStorage.getItem('mktpacket_referrer') !== null) {
      mktpacket.data.page.referrer = localStorage.getItem('mktpacket_referrer');
    } else {
      mktpacket.data.page.referrer = document.referrer && !document.referrer.includes(document.location.hostname) ? document.referrer : 'no_referrer';
      localStorage.setItem('mktpacket_referrer', mktpacket.data.page.referrer);
    }
  },
  getPageParameters: function () {
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.keys().next().value !== undefined && urlParams.keys().next()) {
      var parameters = {};
      for (var param of urlParams.keys()) {
          parameters[param] = urlParams.get(param);
      }
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

      // Build a descriptor
      let descriptor = el.tagName.toLowerCase();
      if (el.id) {
        descriptor += `#${el.id}`;
      } else if (el.className && typeof el.className === 'string') {
        descriptor += '.' + el.className.trim().split(/\s+/).join('.');
      }

      // Add inner text snippet for generic tags
      if (descriptor === 'div' || descriptor === 'span') {
        descriptor += '[inner="' + el.innerText.trim().slice(0, 20) + '"]';
      }

      // Initialize if needed
      if (!mktpacket.data.page.click_count[descriptor]) {
        mktpacket.data.page.click_count[descriptor] = {
          count: 0,
          last_click_timestamp: null
        };
      }

      // Update values
      const clickData = mktpacket.data.page.click_count[descriptor];
      clickData.count++;
      clickData.last_click_timestamp = Math.floor(Date.now() / 1000); // Unix time in seconds
    });
  },
  
  // Client Data
  getClientIsTouchscreen:function() {
    mktpacket.data.client.is_touchscreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0) ? true : false;;
  },
  getClientIsMobile:function() {
    mktpacket.data.client.is_mobile = navigator.userAgentData.mobile ? true : false;
  },
  getClientScreenOrientation:function() {
    mktpacket.data.client.screen_orientation = screen.orientation.type;
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
    } else {
      mktpacket.data.client.battery = 'Battery API not supported';
    }
  },
  getClientNetwork: function () {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (connection) {
      mktpacket.data.client.network = {
        effective_type: connection.effectiveType || null, // '4g', '3g', etc.
        downlink: connection.downlink || null,           // Mbps estimate
        rtt: connection.rtt || null,                     // Round-trip time in ms
        save_data: connection.saveData || false          // True if user enabled data saver
      };
    } else {
      mktpacket.data.client.network = 'Network Information API not supported';
    }
  },
  
  // User Data
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
  getUserFirstGlobalPage: function() {
    if (localStorage.getItem('mktpacket_' + 'first_global_page') !== null) {
        mktpacket.data.user.first_global_page = localStorage.getItem('mktpacket_' + 'first_global_page');
    } else {
      mktpacket.data.user.first_global_page = document.URL;
      localStorage.setItem('mktpacket_' + 'first_global_page', mktpacket.data.user.first_global_page);
    }
  },
  getUserFirstSessionPage: function() {
    if (sessionStorage.getItem('mktpacket_' + 'first_session_page') !== null) {
        mktpacket.data.user.first_session_page = localStorage.getItem('mktpacket_' + 'first_session_page');
    } else {
      mktpacket.data.user.first_session_page = document.URL;
      localStorage.setItem('mktpacket_' + 'first_session_page', mktpacket.data.user.first_session_page);
    }
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
            return getActiveGroups(); // Dynamic value
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
    api_key = mktpacket.ctrl.api_key;
    //if (api_key !== null && api_key !== '' && api_key !== 'free-version') {
    if (api_key !== null && api_key !== '') {
      const apiUrl = 'https://codebakers.dev/apis/mktpacket/';
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          let jsonResponse = xhr.response;
          mktpacket.func.auxObjectMerge(mktpacket, jsonResponse);
          callback?callback():'';
        }
      };
      xhr.open('POST', apiUrl, true);
      xhr.responseType = 'json';
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({ key: api_key, func: func_name }));
    }
  },
  auxObjectMerge: function (target, source) {
      for (const key of Object.keys(source)) {
          if (source[key] instanceof Object && key in target) {
              mktpacket.func.auxObjectMerge(target[key], source[key]);
          } else {
              if (mktpacket.ctrl.persist.includes(key)) {
                  if (localStorage.getItem('mktpacket_' + key) !== null) {
                      target[key] = localStorage.getItem('mktpacket_' + key);
                  } else {
                      target[key] = source[key];
                      localStorage.setItem('mktpacket_' + key, source[key]);
                  }
              } else {
                  target[key] = source[key];
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
    mktpacket.func.auxAPIConnect(function () { mktpacket.data.user.ip = mktpacket.ctrl.api_response }, 'getUserIP');
  },
  getUserISP: function() {
    mktpacket.func.auxAPIConnect(function () { mktpacket.data.user.isp = mktpacket.ctrl.api_response }, 'getUserISP');
  },
  getUserUniqueID: function() {
    mktpacket.func.auxAPIConnect(function () { 
      mktpacket.data.user.uuid = mktpacket.ctrl.api_response;
      if (mktpacket.ctrl.persist.includes('uuid')) {
        localStorage.setItem('mktpacket_uuid', mktpacket.data.user.uuid);
      }
    }, 'getUserUniqueID');
  },
  
  // Init Layer 1 (script init)
  init: function () {
    this.getPageUrl();
    this.getPageTitle();
    this.getPageLanguage();
    this.getPageParameters();
    this.getPageReferrer();
    this.getPageClickCount();

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
    this.getUserFirstGlobalPage();
    this.getUserFirstSessionPage();
    this.getUserTimeOnPage();
    this.getUserTimeOnWebsite();
    
    this.getAdClick();
    this.getABTasty();
    
    this.auxGTagObserver(() => {
        this.getGAClientId();
        this.getGASessionId();
    });
    this.auxPageURLObserver(() => {
      this.getPageUrl();
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
      mktpacket.func.getABTasty();
      mktpacket.func.getPageColors();
      mktpacket.func.auxReadyEvent();
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
