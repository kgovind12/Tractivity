'use strict'

let addFutureActBtn = document.getElementById('addFutureActivity');
let futureActOverlay = document.getElementById('futureAct-overlay');
let futureOverlayBackground = document.getElementById('future-overlay-bg');

addFutureActBtn.addEventListener('click', function() {
    console.log("open pressed");
    futureActOverlay.classList.remove('hide');
    futureOverlayBackground.classList.remove('hide');
});

document.getElementById('future-close').addEventListener('click', function() {
    futureActOverlay.classList.add('hide');
    futureOverlayBackground.classList.add('hide');
});