/*!
 * CaptureKit widget — visual bug reports & feedback into Jira.
 * Self-contained, framework-free, style-isolated via Shadow DOM.
 * Config: window.CaptureKit = { endpoint, token, buttonText?, accent?, position? }
 */
(function () {
  'use strict';

  var cfg = window.CaptureKit || {};
  var script = document.currentScript;
  if (script) {
    cfg.endpoint = cfg.endpoint || script.getAttribute('data-endpoint');
    cfg.token = cfg.token || script.getAttribute('data-token');
  }
  if (!cfg.endpoint || !cfg.token) {
    console.warn('[CaptureKit] missing endpoint/token — widget not started');
    return;
  }
  var ACCENT = cfg.accent || '#1868DB';
  var BTN_TEXT = cfg.buttonText || 'Report a bug';
  var POSITION = cfg.position === 'left' ? 'left' : 'right';
  var MAX_BODY = 900 * 1024; // keep POST bodies well under invocation limits

  // ---------------- context recorders ----------------

  var consoleBuf = [];
  var networkBuf = [];
  function pushConsole(level, args) {
    try {
      var msg = Array.prototype.map
        .call(args, function (a) {
          if (typeof a === 'string') return a;
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        })
        .join(' ');
      consoleBuf.push({ level: level, msg: msg.slice(0, 500), ts: new Date().toISOString() });
      if (consoleBuf.length > 100) consoleBuf.shift();
    } catch (e) { /* never break the host page */ }
  }
  ['log', 'warn', 'error', 'info'].forEach(function (level) {
    var orig = console[level];
    console[level] = function () {
      if (level !== 'log' && level !== 'info') pushConsole(level, arguments); // keep noise down: warn+error only
      return orig.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (e) {
    pushConsole('error', [e.message + ' (' + (e.filename || '') + ':' + (e.lineno || '') + ')']);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    pushConsole('error', ['Unhandled rejection: ' + (r && (r.message || r.toString()))]);
  });

  function pushNetwork(entry) {
    networkBuf.push(entry);
    if (networkBuf.length > 50) networkBuf.shift();
  }
  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var method = (init && init.method) || (input && input.method) || 'GET';
      var t0 = Date.now();
      return origFetch.apply(window, arguments).then(
        function (res) {
          if (!res.ok && url.indexOf(cfg.endpoint) === -1)
            pushNetwork({ url: String(url).slice(0, 300), method: method, status: res.status, ms: Date.now() - t0, ts: new Date().toISOString() });
          return res;
        },
        function (err) {
          if (String(url).indexOf(cfg.endpoint) === -1)
            pushNetwork({ url: String(url).slice(0, 300), method: method, status: 'network-error', ms: Date.now() - t0, ts: new Date().toISOString() });
          throw err;
        }
      );
    };
  }
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__ck = { method: method, url: String(url).slice(0, 300) };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var self = this;
    var t0 = Date.now();
    this.addEventListener('loadend', function () {
      if (self.__ck && (self.status === 0 || self.status >= 400) && self.__ck.url.indexOf(cfg.endpoint) === -1)
        pushNetwork({ url: self.__ck.url, method: self.__ck.method, status: self.status || 'network-error', ms: Date.now() - t0, ts: new Date().toISOString() });
    });
    return origSend.apply(this, arguments);
  };

  function detectEnv() {
    var ua = navigator.userAgent;
    var browser = 'Unknown';
    var m;
    if ((m = ua.match(/Edg\/([\d.]+)/))) browser = 'Edge ' + m[1];
    else if ((m = ua.match(/OPR\/([\d.]+)/))) browser = 'Opera ' + m[1];
    else if ((m = ua.match(/Chrome\/([\d.]+)/))) browser = 'Chrome ' + m[1];
    else if ((m = ua.match(/Firefox\/([\d.]+)/))) browser = 'Firefox ' + m[1];
    else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) browser = 'Safari ' + m[1];
    var os = 'Unknown';
    if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua)) os = 'Linux';
    return {
      browser: browser,
      os: os,
      userAgent: ua,
      viewport: window.innerWidth + '×' + window.innerHeight,
      screen: screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x',
      language: navigator.language,
      timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',
    };
  }

  // ---------------- shadow-DOM UI ----------------

  var host = document.createElement('div');
  host.id = 'capturekit-host';
  var shadow = host.attachShadow({ mode: 'open' });
  var css =
    ':host{all:initial}' +
    '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.ck-btn{position:fixed;bottom:20px;' + POSITION + ':20px;z-index:2147483000;background:' + ACCENT + ';color:#fff;border:none;border-radius:24px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px}' +
    '.ck-btn:hover{filter:brightness(1.08)}' +
    '.ck-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(9,30,66,.72);display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.ck-modal{background:#fff;border-radius:12px;max-width:1200px;width:100%;max-height:92vh;display:flex;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}' +
    '.ck-shot{flex:1.6;background:#F1F2F4;display:flex;flex-direction:column;min-width:0}' +
    '.ck-tools{display:flex;gap:6px;padding:10px 12px;background:#fff;border-bottom:1px solid #DCDFE4;align-items:center}' +
    '.ck-tool{border:1px solid #DCDFE4;background:#fff;border-radius:6px;padding:6px 10px;font-size:13px;cursor:pointer;color:#172B4D}' +
    '.ck-tool.on{background:' + ACCENT + ';color:#fff;border-color:' + ACCENT + '}' +
    '.ck-canvas-wrap{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:14px}' +
    'canvas.ck-canvas{max-width:100%;height:auto;border:1px solid #DCDFE4;border-radius:6px;background:#fff;cursor:crosshair;display:block}' +
    '.ck-form{width:360px;min-width:320px;padding:22px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;border-left:1px solid #DCDFE4}' +
    '.ck-form h2{margin:0;font-size:18px;color:#172B4D}' +
    '.ck-form label{font-size:12px;font-weight:600;color:#44546F;display:block;margin-bottom:4px}' +
    '.ck-form input,.ck-form textarea,.ck-form select{width:100%;border:2px solid #DCDFE4;border-radius:6px;padding:8px 10px;font-size:14px;color:#172B4D;background:#fff}' +
    '.ck-form input:focus,.ck-form textarea:focus,.ck-form select:focus{outline:none;border-color:' + ACCENT + '}' +
    '.ck-form textarea{min-height:96px;resize:vertical}' +
    '.ck-ctx{background:#F1F2F4;border-radius:6px;padding:10px;font-size:12px;color:#44546F;display:flex;gap:8px;align-items:flex-start}' +
    '.ck-actions{display:flex;gap:8px;margin-top:auto}' +
    '.ck-primary{flex:1;background:' + ACCENT + ';border:none;color:#fff;border-radius:6px;padding:10px;font-size:14px;font-weight:600;cursor:pointer}' +
    '.ck-primary:disabled{opacity:.6;cursor:default}' +
    '.ck-secondary{background:#fff;border:1px solid #DCDFE4;color:#172B4D;border-radius:6px;padding:10px 14px;font-size:14px;cursor:pointer}' +
    '.ck-error{background:#FFECEB;color:#AE2A19;border-radius:6px;padding:10px;font-size:13px}' +
    '.ck-success{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px;text-align:center}' +
    '.ck-success h2{color:#172B4D;margin:0}' +
    '.ck-success a{color:' + ACCENT + ';font-weight:600;font-size:15px}' +
    '.ck-check{width:56px;height:56px;border-radius:50%;background:#DCFFF1;color:#216E4E;font-size:30px;display:flex;align-items:center;justify-content:center}' +
    '.ck-textinput{position:absolute;z-index:10;border:2px solid ' + ACCENT + ';border-radius:4px;font-size:16px;padding:4px 6px;background:rgba(255,255,255,.95);color:#B32432}';
  var style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'ck-btn';
  btn.type = 'button';
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0v-4a4 4 0 0 1 4-4Zm0 0V5m-6 9H3m18 0h-3M7 7 5 5m14 0-2 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>' +
    BTN_TEXT;
  shadow.appendChild(btn);

  function ready(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () { document.body.appendChild(host); });

  // ---------------- screenshot ----------------

  var h2cPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (h2cPromise) return h2cPromise;
    h2cPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = function () { resolve(window.html2canvas); };
      s.onerror = function () { reject(new Error('html2canvas failed to load')); };
      document.head.appendChild(s);
    });
    return h2cPromise;
  }

  function takeScreenshot() {
    return loadHtml2Canvas().then(function (h2c) {
      return h2c(document.documentElement, {
        useCORS: true,
        logging: false,
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scale: 1,
        ignoreElements: function (el) { return el === host; },
      });
    });
  }

  // ---------------- annotation + form overlay ----------------

  var overlay = null;

  function openOverlay(shotCanvas, shotFailed) {
    overlay = document.createElement('div');
    overlay.className = 'ck-overlay';
    overlay.innerHTML =
      '<div class="ck-modal">' +
      '<div class="ck-shot">' +
      '<div class="ck-tools">' +
      '<button class="ck-tool on" data-tool="pen">✏️ Draw</button>' +
      '<button class="ck-tool" data-tool="rect">▭ Box</button>' +
      '<button class="ck-tool" data-tool="arrow">↗ Arrow</button>' +
      '<button class="ck-tool" data-tool="text">T Text</button>' +
      '<button class="ck-tool" data-act="undo">↩ Undo</button>' +
      '<span style="margin-left:auto;font-size:12px;color:#626F86">Annotate the screenshot, then describe the problem →</span>' +
      '</div>' +
      '<div class="ck-canvas-wrap" style="position:relative"><canvas class="ck-canvas"></canvas></div>' +
      '</div>' +
      '<div class="ck-form">' +
      '<h2>Report a problem</h2>' +
      '<div><label>Title</label><input class="ck-title" maxlength="140" placeholder="Short summary"></div>' +
      '<div><label>What happened?</label><textarea class="ck-desc" placeholder="What did you expect, what went wrong?"></textarea></div>' +
      '<div><label>Severity</label><select class="ck-sev"><option>Minor</option><option selected>Major</option><option>Blocker</option><option>Feedback</option></select></div>' +
      '<div><label>Your name</label><input class="ck-name" maxlength="80" placeholder="Optional"></div>' +
      '<div><label>Your email</label><input class="ck-email" type="email" maxlength="120" placeholder="Optional — for follow-up"></div>' +
      '<div class="ck-ctx"><input type="checkbox" class="ck-inc" checked style="width:auto;margin-top:1px">' +
      '<span>Attach technical context: <b class="ck-ctx-sum"></b>. Helps developers reproduce the problem.</span></div>' +
      '<div class="ck-error" style="display:none"></div>' +
      '<div class="ck-actions"><button class="ck-secondary ck-cancel" type="button">Cancel</button>' +
      '<button class="ck-primary ck-submit" type="button">Send to Jira</button></div>' +
      '</div>' +
      '</div>';
    shadow.appendChild(overlay);
    btn.style.display = 'none';

    var q = function (sel) { return overlay.querySelector(sel); };
    q('.ck-ctx-sum').textContent =
      consoleBuf.length + ' console entries, ' + networkBuf.length + ' failed requests, browser info';

    // canvas setup
    var canvas = q('canvas.ck-canvas');
    var cx = canvas.getContext('2d');
    var W, H;
    if (shotCanvas) {
      W = shotCanvas.width; H = shotCanvas.height;
    } else {
      W = 1200; H = 750;
    }
    canvas.width = W; canvas.height = H;

    var ops = [];
    var tool = 'pen';
    var drawing = null;

    function redraw() {
      if (shotCanvas) cx.drawImage(shotCanvas, 0, 0);
      else {
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
        cx.fillStyle = '#626F86'; cx.font = '20px sans-serif'; cx.textAlign = 'center';
        cx.fillText('Screenshot unavailable on this page — your report is still sent with full context.', W / 2, H / 2);
        cx.textAlign = 'start';
      }
      cx.strokeStyle = '#E2483D'; cx.fillStyle = '#E2483D'; cx.lineWidth = Math.max(3, W / 500); cx.lineCap = 'round'; cx.lineJoin = 'round';
      ops.concat(drawing ? [drawing] : []).forEach(function (op) {
        if (op.type === 'pen') {
          cx.beginPath();
          op.pts.forEach(function (p, i) { i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); });
          cx.stroke();
        } else if (op.type === 'rect') {
          cx.strokeRect(Math.min(op.x0, op.x1), Math.min(op.y0, op.y1), Math.abs(op.x1 - op.x0), Math.abs(op.y1 - op.y0));
        } else if (op.type === 'arrow') {
          cx.beginPath(); cx.moveTo(op.x0, op.y0); cx.lineTo(op.x1, op.y1); cx.stroke();
          var ang = Math.atan2(op.y1 - op.y0, op.x1 - op.x0);
          var hl = Math.max(12, W / 100);
          cx.beginPath();
          cx.moveTo(op.x1, op.y1);
          cx.lineTo(op.x1 - hl * Math.cos(ang - 0.5), op.y1 - hl * Math.sin(ang - 0.5));
          cx.moveTo(op.x1, op.y1);
          cx.lineTo(op.x1 - hl * Math.cos(ang + 0.5), op.y1 - hl * Math.sin(ang + 0.5));
          cx.stroke();
        } else if (op.type === 'text') {
          cx.font = 'bold ' + Math.max(18, W / 60) + 'px sans-serif';
          cx.fillText(op.str, op.x, op.y);
        }
      });
    }
    redraw();

    function coords(e) {
      var r = canvas.getBoundingClientRect();
      var sx = canvas.width / r.width, sy = canvas.height / r.height;
      var pt = e.touches ? e.touches[0] : e;
      return [(pt.clientX - r.left) * sx, (pt.clientY - r.top) * sy];
    }

    canvas.addEventListener('pointerdown', function (e) {
      var c = coords(e);
      if (tool === 'text') {
        var wrap = q('.ck-canvas-wrap');
        var input = document.createElement('input');
        input.className = 'ck-textinput';
        var r = canvas.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
        input.style.left = e.clientX - wr.left + wrap.scrollLeft + 'px';
        input.style.top = e.clientY - wr.top + wrap.scrollTop + 'px';
        wrap.appendChild(input);
        setTimeout(function () { input.focus(); }, 0);
        var done = function () {
          if (input.value.trim()) { ops.push({ type: 'text', x: c[0], y: c[1], str: input.value.trim().slice(0, 80) }); redraw(); }
          input.remove();
        };
        input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') done(); if (ev.key === 'Escape') input.remove(); });
        input.addEventListener('blur', done);
        return;
      }
      drawing = tool === 'pen' ? { type: 'pen', pts: [c] } : { type: tool, x0: c[0], y0: c[1], x1: c[0], y1: c[1] };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var c = coords(e);
      if (drawing.type === 'pen') drawing.pts.push(c);
      else { drawing.x1 = c[0]; drawing.y1 = c[1]; }
      redraw();
    });
    canvas.addEventListener('pointerup', function () {
      if (drawing) { ops.push(drawing); drawing = null; redraw(); }
    });

    overlay.querySelectorAll('.ck-tool').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.act === 'undo') { ops.pop(); redraw(); return; }
        tool = b.dataset.tool;
        overlay.querySelectorAll('.ck-tool[data-tool]').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });

    function close() {
      overlay.remove(); overlay = null; btn.style.display = 'flex';
      document.removeEventListener('keydown', escHandler);
    }
    function escHandler(e) { if (e.key === 'Escape' && overlay) close(); }
    document.addEventListener('keydown', escHandler);
    q('.ck-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    q('.ck-submit').addEventListener('click', function () {
      var submitBtn = q('.ck-submit');
      var errBox = q('.ck-error');
      errBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var include = q('.ck-inc').checked;
      var payload = {
        token: cfg.token,
        title: q('.ck-title').value.trim(),
        description: q('.ck-desc').value.trim(),
        severity: q('.ck-sev').value,
        reporter: { name: q('.ck-name').value.trim(), email: q('.ck-email').value.trim() },
        page: { url: location.href, title: document.title },
        env: detectEnv(),
        console: include ? consoleBuf.slice() : [],
        network: include ? networkBuf.slice() : [],
        capturedAt: new Date().toISOString(),
      };

      // adaptive screenshot compression to stay under the body budget
      if (shotCanvas) {
        var quality = 0.85;
        var data = canvas.toDataURL('image/jpeg', quality);
        while (data.length > MAX_BODY * 0.85 && quality > 0.35) {
          quality -= 0.15;
          data = canvas.toDataURL('image/jpeg', quality);
        }
        if (data.length > MAX_BODY * 0.85) {
          var small = document.createElement('canvas');
          small.width = Math.round(canvas.width * 0.6);
          small.height = Math.round(canvas.height * 0.6);
          small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
          data = small.toDataURL('image/jpeg', 0.6);
        }
        payload.screenshot = data;
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', cfg.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 30000;
      xhr.onload = function () {
        var res = {};
        try { res = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
        if (xhr.status >= 200 && xhr.status < 300) {
          var modal = overlay.querySelector('.ck-modal');
          modal.innerHTML =
            '<div class="ck-success" style="width:100%">' +
            '<div class="ck-check">✓</div>' +
            '<h2>Report sent — thank you!</h2>' +
            (res.issueKey
              ? '<div>Tracked as ' + (res.issueUrl ? '<a href="' + res.issueUrl + '" target="_blank" rel="noopener">' + res.issueKey + '</a>' : '<b>' + res.issueKey + '</b>') + '</div>'
              : '') +
            '<button class="ck-secondary" type="button">Close</button>' +
            '</div>';
          modal.querySelector('button').addEventListener('click', close);
          setTimeout(function () { if (overlay) close(); }, 6000);
        } else {
          errBox.textContent = (res && res.error) || 'Sending failed (HTTP ' + xhr.status + '). Please try again.';
          errBox.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send to Jira';
        }
      };
      xhr.onerror = xhr.ontimeout = function () {
        errBox.textContent = 'Network problem while sending. Your report was not lost — try again.';
        errBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send to Jira';
      };
      xhr.send(JSON.stringify(payload));
    });
  }

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.style.opacity = '0.7';
    takeScreenshot()
      .then(function (canvas) { openOverlay(canvas, false); })
      .catch(function (err) {
        console.warn('[CaptureKit] screenshot failed:', err && err.message);
        openOverlay(null, true);
      })
      .finally(function () {
        btn.disabled = false;
        btn.style.opacity = '1';
      });
  });
})();
