const self = require('sdk/self');
const { PageMod } = require('sdk/page-mod');
const { open } = require('sdk/window/utils');
const { window: { screen } } = require('sdk/addon/window');
const contextMenu = require('sdk/context-menu');
const ss = require('sdk/simple-storage');
const urlParser = require('js-video-url-parser');

const resizeFactor = 1.15;

function getVideoHTML(videoId, listId, time) {
  time = Math.round(time || 0);
  let url =
    `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${time}`;
  if (listId) url += `&list=${listId}`;
  return `<iframe id="ytplayer" type="text/html" src="${url}"
                  frameborder="0" allowfullscreen></iframe>`;
}

function openVideo(videoId, listId, time, width, height) {
  const aspectRatio = width && height ? width / height : 16/9;

  const windowSize = ss.storage.windowSize;

  // Window dimensions for a 16:9 video
  const area = windowSize ? windowSize.width * windowSize.height : 432 * 243;
  // Width should be at least 350 so that YouTube volume control is shown
  width = Math.max(350, Math.sqrt(area * aspectRatio));
  width = Math.round(width);
  height = Math.round(width / aspectRatio);

  const windowPosition = ss.storage.windowPosition || {
    // Window position can be off by one
    x: screen.availWidth - width + 1,
    y: screen.availHeight - height + 1
  };

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
        ${getVideoHTML(videoId, listId, time)}
        <script>
          let isDragging = false;
          let startX, startY;
          controls.onmousedown = e => {
            isDragging = true;
            startX = e.clientX, startY = e.clientY;
          };
          document.onmousemove = e => {
            if (isDragging)
              window.moveTo(e.screenX - startX, e.screenY - startY);
          };
          document.onmouseup = () => {
            isDragging = false;
          };

          const aspectRatio = ${aspectRatio};
          const resizeFactor = ${resizeFactor};

          increase.onclick = () => {
            const width = window.outerWidth * resizeFactor;
            window.resizeTo(Math.round(width),
                            Math.round(width / aspectRatio));
          };
          decrease.onclick = () => {
            const width = window.outerWidth / resizeFactor;
            window.resizeTo(Math.round(width),
                            Math.round(width / aspectRatio));
          };
          snap.onclick = () => {
            window.moveTo(screen.availWidth - window.outerWidth,
                          screen.availHeight - window.outerHeight);
          };

          const snapped = (
            (screen.availWidth - window.outerWidth) - window.screenX < 2 &&
            (screen.availHeight - window.outerHeight) - window.screenY < 2
          );

          const area = window.outerWidth * window.outerHeight;
          let width = Math.sqrt(area * aspectRatio);
          let height = width / aspectRatio;
          width = Math.round(width), height = Math.round(height);

          window.resizeTo(width, height);

          if (snapped)
            snap.onclick();
          else if (window.screenX || window.screenY)
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
        popup: true,
        width,
        height,
        left: windowPosition.x,
        top: windowPosition.y
      }
    }
  );
}

let video = null;

function saveWindowBounds() {
  ss.storage.windowPosition = {x: video.screenX, y: video.screenY};
  ss.storage.windowSize = {width: video.outerWidth, height: video.outerHeight};
}

PageMod({
  include: 'https://www.youtube.com/*',
  contentScriptFile: './pip.js',
  onAttach: worker => {
    worker.port.on('pip', videoInfo => {
      const { videoId, listId, time, width, height } = videoInfo;
      const isNew = !video || video.closed;
      video = openVideo(videoId, listId, time, width, height);
      const callback = () => worker.port.emit('done');
      if (isNew) video.onload = callback;
      else video.onunload = callback;
      video.onbeforeunload = saveWindowBounds;
    });
  }
});

contextMenu.Item({
  label: 'Open Video in PiP Window',
  image: self.data.url('icon.png'),
  accesskey: 'd',
  context: contextMenu.PredicateContext(context => {
    if (!context.linkURL)
      return false;
    const videoInfo = urlParser.parse(context.linkURL);
    return Boolean(videoInfo && videoInfo.provider == 'youtube');
  }),
  contentScript: `
    self.on('click', node => {
      self.postMessage(node.href || node.closest('a').href);
    });
  `,
  onMessage: url => {
    const videoInfo = urlParser.parse(url);
    if (videoInfo && videoInfo.provider == 'youtube') {
      video = openVideo(videoInfo.id, videoInfo.list,
                        (videoInfo.params || {}).start);
      video.onbeforeunload = saveWindowBounds;
    }
  }
});
