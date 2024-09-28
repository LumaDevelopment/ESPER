// Function to get the YouTube video ID from the current URL
function getYouTubeVideoID() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v'); // Extract the 'v' parameter from the URL
}

// Function to create an iframe with the YouTube video
function createYouTubeIframe(videoID) {
  const iframe = document.createElement('iframe');

  iframe.src = `https://www.youtube.com/embed/${videoID}?autoplay=1&controls=1`;
  iframe.width = '640';
  iframe.height = '360';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.zIndex = '1000';
  iframe.style.border = '2px solid green';

  document.body.appendChild(iframe);
}

// Get the video ID and create the iframe
const videoID = getYouTubeVideoID();
if (videoID) {
  createYouTubeIframe(videoID);
} else {
  console.error('No YouTube video ID found in the URL.');
}
