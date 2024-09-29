const video = document.querySelector('video');
let lastTime = 0;
let frameCount = 0;

// When the video starts playing
video.addEventListener('play', () => {
  frameCount = 0; // Reset frame count
  lastTime = performance.now(); // Store the initial time
  
  function countFrames() {
    if (video.paused || video.ended) return;

    frameCount++; // Increment frame count

    const currentTime = performance.now();
    const timeElapsed = (currentTime - lastTime) / 1000; // Time in seconds

    // Calculate frame rate every second
    if (timeElapsed >= 1) {
      console.log(`FPS: ${frameCount / timeElapsed}`);
      frameCount = 0; // Reset frame count
      lastTime = currentTime; // Reset time
    }

    requestAnimationFrame(countFrames);
  }

  requestAnimationFrame(countFrames); // Start the frame counting
});
