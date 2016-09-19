let player = document.getElementById('player');

function addButton() {
  let controls = player.getElementsByClassName('ytp-right-controls')[0];

  if (!controls)
    return false;

  let button = document.createElement('button');
  button.className = 'ytp-pip-button ytp-button'
  button.title = 'Picture-in-picture'

  let svgNS = 'http://www.w3.org/2000/svg';

  let svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('version', '1.1');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.innerHTML = `
    <g class="ytp-pip-button-back">
      <use class="ytp-svg-shadow" xlink:href="#ytp-svg-pip-back" />
      <path id="ytp-svg-pip-back"
        d="m 28,11 0,7 -2,0 0,-5 -16,0 0,10 8,0 0,2 -10,0 0,-14 z"
        fill="#fff" fill-rule="evenodd" />
    </g>
    <g class="ytp-pip-button-front">
      <use class="ytp-svg-shadow" xlink:href="#ytp-svg-pip-front" />
      <path id="ytp-svg-pip-front"
        d="m 29,19 0,7 -10,0 0,-7 z  m -8,2 6,0 0,3 -6,0 z"
        fill="#fff" fill-rule="evenodd" />
    </g>
  `

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
