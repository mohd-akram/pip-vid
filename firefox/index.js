const { PageMod } = require('sdk/page-mod');
const { open } = require('sdk/window/utils');
const { window: { screen } } = require('sdk/addon/window');

const resizeFactor = 1.1;

function getVideoHTML(videoId, time) {
  time = Math.round(time);
  return `<iframe id="ytplayer" type="text/html"\
    src="https://www.youtube.com/embed/${videoId}?autoplay=1&start=${time}"\
    frameborder="0" allowfullscreen></iframe>`
}

function openVideo(videoId, time, width, height) {
  let aspectRatio = width / height;
  width = aspectRatio > 1 ? 432 : 350;
  height = width / aspectRatio;

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
          let resizeFactor = ${resizeFactor};
          let isDragging = false;
          let startX, startY;
          controls.onmousedown = function(e) {
            isDragging = true;
            startX = e.pageX, startY = e.pageY;
          };
          increase.onclick = function() {
            window.resizeTo(window.innerWidth * resizeFactor,
                            window.innerHeight * resizeFactor);
          };
          decrease.onclick = function() {
            window.resizeTo(window.innerWidth / resizeFactor,
                            window.innerHeight / resizeFactor);
          };
          snap.onclick = function() {
            window.moveTo(screen.availWidth - window.innerWidth,
                          screen.availHeight - window.innerHeight);
          };
          document.onmousemove = function(e) {
            if (isDragging) {
              window.moveTo(e.screenX - startX, e.screenY - startY);
            }
          };
          document.onmouseup = function() {
            isDragging = false;
          };
          window.resizeTo(window.innerWidth,
                          window.innerWidth / ${aspectRatio});
          window.moveTo(
            Math.max(0, Math.min(screen.availWidth - window.innerWidth,
                                 window.screenX)),
            Math.max(0, Math.min(screen.availHeight - window.innerHeight,
                                 window.screenY))
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
        top: screen.availHeight - height,
        left: screen.availWidth - width
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
