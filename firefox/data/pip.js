let player = document.getElementById('player');

function addButton() {
  let controls = player.getElementsByClassName('ytp-right-controls')[0];

  if (!controls)
    return false;

  let button = document.createElement('button');
  button.className = 'ytp-button'
  button.title = 'Picture-in-picture'

  let svgNS = 'http://www.w3.org/2000/svg';

  let svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  let text = document.createElementNS(svgNS, 'text');
  text.textContent = 'PiP';
  text.setAttribute('fill', 'white');
  text.setAttribute('x', '50%');
  text.setAttribute('y', '50%');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');

  svg.appendChild(text);
  button.appendChild(svg);

  button.onclick = function() {
    button.style.cursor = 'progress';
    let ytplayer = player.getElementsByClassName('html5-video-player')[0]
                         .wrappedJSObject;
    let video = player.getElementsByTagName('video')[0];
    ytplayer.pauseVideo();
    self.port.emit('pip', {videoId: ytplayer.getVideoData()['video_id'],
                           time: ytplayer.getCurrentTime(),
                           volume: ytplayer.getVolume(),
                           width: video.offsetWidth,
                           height: video.offsetHeight});
  };

  controls.appendChild(button);

  self.port.on('done', function() { button.style.cursor = ''; });

  return true;
}

if (player && !addButton()) {
  let observer = new MutationObserver(function() {
    if (addButton())
      observer.disconnect();
  });
  observer.observe(player, {childList: true, subtree: true});
  setTimeout(function() { observer.disconnect(); }, 10000);
}
