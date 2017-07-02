const player = document.getElementById('player');

function addButton() {
  const controls = player.querySelector('.ytp-right-controls');

  if (!controls || !controls.offsetParent)
    return false;

  const button = document.createElement('button');
  button.className = 'ytp-pip-button ytp-button';
  button.title = 'Picture-in-picture';

  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
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
  `;

  button.appendChild(svg);

  button.onclick = () => {
    button.style.cursor = 'progress';
    const ytplayer = player.querySelector('.html5-video-player')
                           .wrappedJSObject;
    const videoData = ytplayer.getVideoData();
    const video = player.querySelector('video');
    ytplayer.pauseVideo();
    self.port.emit('pip', {videoId: videoData.video_id,
                           listId: videoData.list,
                           time: ytplayer.getCurrentTime(),
                           volume: ytplayer.getVolume(),
                           width: video.offsetWidth,
                           height: video.offsetHeight});
  };

  controls.appendChild(button);

  self.port.on('done', () => button.style.cursor = '');

  return true;
}

if (player && !addButton()) {
  const observer = new MutationObserver(() => {
    if (addButton())
      observer.disconnect();
  });
  observer.observe(player, {childList: true, subtree: true});
}
