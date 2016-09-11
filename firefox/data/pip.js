function addButton() {
  let controls = document.getElementsByClassName('ytp-right-controls')[0];

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
    let player = document.getElementById('movie_player').wrappedJSObject;
    player.pauseVideo();
    self.port.emit('pip', {videoId: player.getVideoData()['video_id'],
                           time: player.getCurrentTime(),
                           volume: player.getVolume()});
  };

  controls.appendChild(button);

  self.port.on('done', function() { button.style.cursor = ''; });

  return true;
}

if (!addButton()) {
  let player = document.getElementById('player');
  if (player) {
    let observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.id == 'movie_player') {
            observer.disconnect();
            addButton();
          }
        });
      });  
    });
    observer.observe(player, {childList: true, subtree: true});
    setTimeout(function() { observer.disconnect(); }, 10000);
  }
}
