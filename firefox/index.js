const self = require('sdk/self');
const { PageMod } = require('sdk/page-mod');
const { open } = require('sdk/window/utils');
const { window: { screen } } = require('sdk/addon/window');
const contextMenu = require('sdk/context-menu');
const urlParser = require('js-video-url-parser');

const resizeFactor = 1.15;

function getVideoHTML(videoId, time) {
  time = Math.round(time || 0);
  return `<iframe id="ytplayer" type="text/html"\
    src="https://www.youtube.com/embed/${videoId}?autoplay=1&start=${time}"\
    frameborder="0" allowfullscreen></iframe>`
}

function openVideo(videoId, time, width, height) {
  let aspectRatio = width && height ? width / height : 16/9;

  // Window dimensions for a 16:9 video
  let area = 432 * 243;
  // Width should be at least 350 so that YouTube volume control is shown
  width = Math.max(350, Math.sqrt(area * aspectRatio));
  height = width / aspectRatio;
  width = Math.round(width), height = Math.round(height);

  return open(
    `data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>PiP</title>
        <style>
          body {
            background: black;
            color: white;
            font-family: "Segoe UI", -apple-system, sans-serif;
          }
          ::-moz-selection {
            color: white;
            background: rgba(0, 0, 0, 0);
          }
          iframe {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 100%; height: 100%;
          }
          .controls {
            position: absolute; top: 0; left: 0; width: 100%;
            z-index: 1;
            opacity: 0;
            background: rgba(0, 0, 0, 0.5);
            cursor: pointer;
          }
          .controls:hover {
            opacity: 1;
          }
        </style>
      </head>
      <body>
        <div id="controls" class="controls">
          <span class="close" onclick="window.close()">%26%23x00d7;</span>
          <span id="increase">%26%23x2b;</span>
          <span id="decrease">%26%23x2212;</span>
          <span id="snap">%26%23x2198;</span>
        </div>
        ${getVideoHTML(videoId, time)}
        <script>
          let isDragging = false;
          let startX, startY;
          controls.onmousedown = function(e) {
            isDragging = true;
            startX = e.clientX, startY = e.clientY;
          };
          document.onmousemove = function(e) {
            if (isDragging)
              window.moveTo(e.screenX - startX, e.screenY - startY);
          };
          document.onmouseup = function() {
            isDragging = false;
          };

          let aspectRatio = ${aspectRatio};
          let resizeFactor = ${resizeFactor};

          increase.onclick = function() {
            let width = window.outerWidth * resizeFactor;
            window.resizeTo(Math.round(width),
                            Math.round(width / aspectRatio));
          };
          decrease.onclick = function() {
            let width = window.outerWidth / resizeFactor;
            window.resizeTo(Math.round(width),
                            Math.round(width / aspectRatio));
          };
          snap.onclick = function() {
            window.moveTo(screen.availWidth - window.outerWidth,
                          screen.availHeight - window.outerHeight);
          };

          let snapped = (
            (screen.availWidth - window.outerWidth) - window.screenX < 2 &&
            (screen.availHeight - window.outerHeight) - window.screenY < 2
          );

          let area = window.outerWidth * window.outerHeight;
          let width = Math.sqrt(area * aspectRatio);
          let height = width / aspectRatio;
          width = Math.round(width), height = Math.round(height);

          window.resizeTo(width, height);

          if (snapped)
            snap.onclick();
          else
            window.moveTo(
              Math.max(0, Math.min(window.screenX,
                                   screen.availWidth - window.outerWidth)),
              Math.max(0, Math.min(window.screenY,
                                   screen.availHeight - window.outerHeight))
            );
        </script>
      </body>
    </html>`,

    {
      name: 'PiP',
      features: {
        width: width,
        height: height,
        popup: true,
        // Window position can be off by one
        top: screen.availHeight - height + 1,
        left: screen.availWidth - width + 1
      }
    }
  );
}

let video = null;

PageMod({
  include: 'https://www.youtube.com/*',
  contentScriptFile: './pip.js',
  onAttach: function(worker) {
    worker.port.on('pip', function(videoInfo) {
      let { videoId, time, width, height } = videoInfo;
      let isNew = !video || video.closed;
      video = openVideo(videoId, time, width, height);
      let callback = function() { worker.port.emit('done'); };
      if (isNew) video.onload = callback;
      else video.onunload = callback;
    });
  }
});

contextMenu.Item({
  label: 'Open Video in PiP Window',
  image: self.data.url('icon.png'),
  accesskey: 'd',
  context: contextMenu.PredicateContext(function(context) {
    if (!context.linkURL)
      return false;
    let videoInfo = urlParser.parse(context.linkURL);
    return Boolean(videoInfo && videoInfo.provider == 'youtube');
  }),
  contentScript: `
    self.on('click', function(node) {
      self.postMessage(node.href || node.closest('a').href);
    });
  `,
  onMessage: function(url) {
    let videoInfo = urlParser.parse(url);
    if (videoInfo && videoInfo.provider == 'youtube') {
      video = openVideo(videoInfo.id, (videoInfo.params || {}).start);
    }
  }
});
