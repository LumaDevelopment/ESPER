const apiKey = 'AIzaSyDoU2ZThEJXzRRS6VlYJRaEXP6hcKmCC2g';

function getYoutubeVideoID () {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

const videoId = getYoutubeVideoID (); 

const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`;

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    if (data.items && data.items.length > 0) {
      const videoData = data.items[0];

      // Access metadata
      const title = videoData.snippet.title;
      const description = videoData.snippet.description;
      const channelTitle = videoData.snippet.channelTitle;
      const publishedAt = videoData.snippet.publishedAt;
      const viewCount = videoData.statistics.viewCount;
      const likeCount = videoData.statistics.likeCount;
      const duration = videoData.contentDetails.duration;
      const tags = videoData.snippet.tags || []; // If no tags are available, use an empty array
      const resolution = videoData.contentDetails.definition; // Resolution (hd or sd)

      console.log(`Title: ${title}`);
      console.log(`Description: ${description}`);
      console.log(`Channel: ${channelTitle}`);
      console.log(`Published At: ${publishedAt}`);
      console.log(`Views: ${viewCount}`);
      console.log(`Likes: ${likeCount}`);
      console.log(`Duration: ${duration}`);
      console.log(`Tags: ${tags.join(', ')}`); // Join tags into a string for display
      console.log(`Resolution: ${resolution}`); // Outputs the resolution (hd or sd)
    } else {
      console.log('No video found');
    }
  })
  .catch(error => {
    console.error('Error fetching video data:', error);
  });

  