const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;  // Flip vertically
  gl_Position = vec4(position, 0, 1);
}
`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D uTex;
uniform float uBrightness;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTex, vUv);
  gl_FragColor = vec4(c.rgb * uBrightness, c.a);
}
`;

function findLargestVideo(): HTMLVideoElement | null {
  const videos = Array.from(document.querySelectorAll('video'));
  return videos.reduce<HTMLVideoElement | null>((best, v) => {
    if (!best) return v;
    return v.videoWidth * v.videoHeight >
      best.videoWidth * best.videoHeight
      ? v
      : best;
  }, null);
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  return program;
}

function createVideoTexture(gl: WebGLRenderingContext) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}


function setupFullscreenQuad(
  gl: WebGLRenderingContext,
  program: WebGLProgram
) {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const loc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}


function setupVideoPipeline(): (() => void) | null {
  const video = findLargestVideo();
  if (!video || video.videoWidth === 0) return null;

  // Hide original video (keep audio + playback)
  video.style.visibility = 'hidden';

  // Canvas overlay
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.zIndex = '9999';
  video.parentElement!.appendChild(canvas);

  const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
  if (!gl) return null;

  const program = createProgram(gl);
  gl.useProgram(program);

  const brightnessLoc = gl.getUniformLocation(program, 'uBrightness')!;
  const texture = createVideoTexture(gl);

  setupFullscreenQuad(gl, program);

  let running = true;
  // let bright = false;

  var lastTimestamp = performance.now();
  var frameCount = 0;

  function render() {
    if (!running || video.paused || video.ended) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      video
    );

    gl.uniform1f(brightnessLoc, 0.5);
    // bright = !bright;

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // FPS counter (for debugging)
    frameCount++;
    const now = performance.now();
    if (now - lastTimestamp >= 1000) {
      console.log(`WebGL Video FPS: ${frameCount}`);
      frameCount = 0;
      lastTimestamp = now;
    }

    requestAnimationFrame(render);
  }

  video.addEventListener('play', render);

  return () => {
    running = false;
    canvas.remove();
    video.style.visibility = '';
  };
}

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main() {
    let cleanup: (() => void) | null = null;

    const init = () => {
      cleanup?.();
      cleanup = setupVideoPipeline();
    };

    // Initial load
    init();

    // YouTube SPA navigation
    window.addEventListener('yt-navigate-finish', init);
  },
});
