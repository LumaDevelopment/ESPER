// import {getLuminosity, luminosityAdjustment} from './luminosity.js';

/**
 * Given an RGB value set (where each value
 * ranges from [0, 255])
 */
function getLuminosity(r, g, b) {
    return ((0.2126*r) + (0.7152*g) + (0.0722*b)) / 255;
}

/**
 * Derives a percentage by which we should adjust the real luminosity
 * of this frame to ensure it does not differ too much from the 
 * previous frame, which also had its luminosity adjusted.
 *
 * @param prevRealLum      The real luminosity of the previous frame.
 * @param prevLumAdjPerc   The percentage that the previous frame's
 *                         luminosity was adjusted by (i.e.
 *                         prevRealLum + (prevRealLum * prevLumAdjPerc
 *                         was the previous frame's adjusted
 *                         luminosity).
 * @param currRealLum      The real luminosity of the current frame.
 * @param lumAdjPercThresh The maximum percentage that the luminosity
 *                         can change from the previous (adjusted)
 *                         luminosity to the current frame (post
 *                         adjustment).
 *
 * @return The percentage which this frame's real luminosity should
 * be adjusted by to get an adjusted luminosity which does not
 * differ from the last frame's adjusted luminosity more than the
 * threshold allows.
 */
function luminosityAdjustment(
    prevRealLum, prevLumAdjPerc,
    currRealLum, lumAdjPercThresh
) {

    // Dodge divide by zero issues
    if (prevRealLum < Number.EPSILON) {
        prevRealLum = 0.000001;
    }

    if (currRealLum < Number.EPSILON) {
        currRealLum = 0.000001;
    }

    // console.log("prevRealLum: " + prevRealLum + ", prevLumAdjPerc: " + prevLumAdjPerc + ", currRealLum: " + currRealLum + ", lumAdjPercThresh: " + lumAdjPercThresh);

    /**
     * The luminosity of the previous frame after adjustment.
     */
    let prevAdjLum = prevRealLum + (prevRealLum * prevLumAdjPerc);

    /**
     * If we didn't change anything, the percentage change in 
     * luminosity from the previous frame to the current.
     */
    let lumDeltaPercentage = (currRealLum / prevAdjLum) - 1;

    /**
     * The percentage by which we will adjust this frame's 
     * luminosity.
     */
    let currLumAdjPerc = 0;

    if (Math.abs(lumDeltaPercentage) > lumAdjPercThresh) {

        // The adjustment in luminosity is too intense.
        // Tamper.

        /**
         * The amount by which we will adjust the luminosity 
         * of the previous frame (adjusted).
         */
        let offset = (prevAdjLum * lumAdjPercThresh);
        
        /**
         * The luminosity of the current frame after adjustment.
         */
        let currentAdjLum;

        if ((currRealLum - prevAdjLum) > 0) {
            // Want to get brighter
            currentAdjLum = prevAdjLum + offset;
        } else {
            // Want to get more dim
            currentAdjLum = prevAdjLum - offset;
        }

        /**
         * Finally, the percentage by which we must adjust 
         * the current real luminosity to get the desired 
         * post-adjustment luminosity.
         */
        currLumAdjPerc = (currentAdjLum / currRealLum) - 1;

    }

    return currLumAdjPerc;
}

const lumAdjPercThresh = 0.05;

// Function to change brightness based on frame
function activateFlashMitigation(videoElement, videoNum) {
    if (!videoElement) {
        console.log("Video " + videoNum + " does not exist!");
        return;
    }

    // Create a canvas to draw video frames
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    // Set canvas size to video size
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    // Per frame stuff
    const realLuminances = []
    const luminanceAdjustments = []

    // Update brightness every time the video plays
    videoElement.addEventListener('timeupdate', ()=> {
    // videoElement.addEventListener('play', () => { 
        const updateFrame = () => {
            if (videoElement.paused || videoElement.ended) {
                return;
            }

            // Draw the current frame on the canvas
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Get the frame data
            const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = frameData.data;

            // Get brightness of frame
            let totalBrightness = 0;

            for (let i = 0; i < data.length; i += 4) {
                totalBrightness += getLuminosity(
                    data[i],     // r
                    data[i + 1], // g
                    data[i + 2]  // b
                );
            }
            const currRealLum = totalBrightness / (data.length / 4);
            // console.log("Brightness for frame: " + currRealLum);

            // Add luminance of this frame to array
            realLuminances.push(currRealLum);

            if (luminanceAdjustments.length == 0) {
                // First frame, don't change anything
                console.log("First frame.");
                luminanceAdjustments.push(0);
            } else {
                const lumAdjPerc = luminosityAdjustment(
                    realLuminances[realLuminances.length - 2],
                    luminanceAdjustments[luminanceAdjustments.length - 1],
                    currRealLum,
                    lumAdjPercThresh
                );
                luminanceAdjustments.push(lumAdjPerc);

                const brightnessPercentage = (1 + lumAdjPerc) * 100;
                const roundedBP = Math.round(brightnessPercentage);

                if (!(roundedBP === 100)) {
                    console.log("Rounded BP: " + roundedBP);
                    console.log("~");
                    videoElement.style.filter = `brightness(${roundedBP}%)`;
                } else {
                    videoElement.style.filter = `none`;
                }
                
            }

            // Request the next frame
            // console.log("~");
            requestAnimationFrame(updateFrame);
        };
        requestAnimationFrame(updateFrame);
    });
}
  
// Find video elements and apply brightness adjustment
const videos = document.querySelectorAll('video');
var videoIterator = 1;
videos.forEach(video => {
    console.log("Activating flash mitigation for video " + videoIterator);
    activateFlashMitigation(video, videoIterator);
    videoIterator += 1;
});