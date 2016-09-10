var controls = document.getElementsByClassName('ytp-right-controls')[0];

if (controls) {
  var button = document.createElement('button');
  button.className = 'ytp-button'
  button.title = 'Picture-in-picture'

  var svgNS = 'http://www.w3.org/2000/svg';

  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');

  var text = document.createElementNS(svgNS, 'text');
  text.textContent = 'PiP';
  text.setAttribute('fill', 'white');
  text.setAttribute('x', '50%');
  text.setAttribute('y', '50%');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('dominant-baseline', 'central');

  svg.appendChild(text);
  button.appendChild(svg);

  button.onclick = function() {
    let player = document.getElementById('movie_player').wrappedJSObject;
    player.pauseVideo();
    self.port.emit('pip', {videoId: player.getVideoData()['video_id'],
                           time: player.getCurrentTime(),
                           volume: player.getVolume()});
  };

  controls.appendChild(button);
}
