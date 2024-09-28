// Function to get the youtube id from url
function getYouTubeVideoID() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v'); // takes everything after the v in url
}

// creates iframe with youtube video
function createYouTubeIframe(videoID) {
  const iframe = document.createElement('iframe');

  iframe.src = `https://www.youtube.com/embed/${videoID}?autoplay=1&controls=1&start=2`; //&start=2 makes it start at 2 seconds
  iframe.width = '640';
  iframe.height = '360';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.zIndex = '1000';
  iframe.style.border = '2px solid green';

  document.body.appendChild(iframe);
}

// get youtube id and generate framework
const videoID = getYouTubeVideoID();
if (videoID) {
  createYouTubeIframe(videoID);
} else {
  console.error('No YouTube video ID found in the URL.');
}
