const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
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

function getLuminosity(r, g, b) {
  return ((0.2126*r) + (0.7152*g) + (0.0722*b)) / 255;
}

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

class LuminosityGraph {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: number[] = [];
  private maxDataPoints = 300;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 120;
    this.canvas.style.position = 'fixed';
    this.canvas.style.bottom = '80px';
    this.canvas.style.right = '20px';
    this.canvas.style.zIndex = '99999';
    this.canvas.style.background = 'rgba(0, 0, 0, 0.8)';
    this.canvas.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    this.canvas.style.borderRadius = '4px';
    this.canvas.style.padding = '8px';
    this.canvas.style.pointerEvents = 'none';
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    
    console.log('Graph created and appended to body');
  }

  addDataPoint(luminosity: number) {
    this.data.push(luminosity);
    if (this.data.length > this.maxDataPoints) {
      this.data.shift();
    }
    this.render();
  }

  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, width, height);
    
    if (this.data.length < 2) return;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('1.0', 4, 12);
    ctx.fillText('0.5', 4, height / 2 + 4);
    ctx.fillText('0.0', 4, height - 4);

    // Draw luminosity line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const xStep = width / (this.maxDataPoints - 1);
    const startIdx = Math.max(0, this.data.length - this.maxDataPoints);
    
    this.data.slice(startIdx).forEach((val, i) => {
      const x = i * xStep;
      const y = height - (val * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw current value
    const currentVal = this.data[this.data.length - 1];
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${currentVal.toFixed(3)}`, width - 60, 20);
  }

  remove() {
    this.canvas.remove();
  }
}

function setupVideoPipeline(): (() => void) | null {
  console.log('Setting up video pipeline...');
  
  const video = findLargestVideo();
  if (!video || video.videoWidth === 0) {
    console.log('No video found or video not ready');
    return null;
  }

  console.log('Video found:', video.videoWidth, 'x', video.videoHeight);

  // Don't hide video, render on top of it
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Match video's exact position and size
  const videoRect = video.getBoundingClientRect();
  canvas.style.position = 'fixed';
  canvas.style.top = videoRect.top + 'px';
  canvas.style.left = videoRect.left + 'px';
  canvas.style.width = videoRect.width + 'px';
  canvas.style.height = videoRect.height + 'px';
  canvas.style.zIndex = '999999';
  canvas.style.pointerEvents = 'none';
  
  document.body.appendChild(canvas);
  
  // Update position on window resize
  const updatePosition = () => {
    const rect = video.getBoundingClientRect();
    canvas.style.top = rect.top + 'px';
    canvas.style.left = rect.left + 'px';
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  };
  
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);

  console.log('Canvas created and appended');

  const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
  if (!gl) {
    console.error('WebGL context failed');
    return null;
  }

  console.log('WebGL context created');

  const program = createProgram(gl);
  gl.useProgram(program);

  const brightnessLoc = gl.getUniformLocation(program, 'uBrightness')!;
  const texture = createVideoTexture(gl);

  setupFullscreenQuad(gl, program);

  const graph = new LuminosityGraph();

  let running = true;

  function render() {
    if (!running || video.paused || video.ended) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      video
    );

    gl.uniform1f(brightnessLoc, 1.0); // Change 1.0 to change brightness adjustment
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Calculate average luminosity
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let totalLuminosity = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      totalLuminosity += getLuminosity(pixels[i], pixels[i + 1], pixels[i + 2]);
    }

    const frameLuminosity = totalLuminosity / (canvas.width * canvas.height);
    graph.addDataPoint(frameLuminosity);

    video.requestVideoFrameCallback(render);
  }

  video.addEventListener('play', render);
  
  // Trigger initial render if video is already playing
  if (!video.paused) {
    render();
  }

  console.log('Pipeline setup complete');

  return () => {
    running = false;
    canvas.remove();
    graph.remove();
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition);
  };
}

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main() {
    let cleanup: (() => void) | null = null;

    const init = () => {
      console.log('Initializing...');
      cleanup?.();
      cleanup = setupVideoPipeline();
    };

    setTimeout(init, 1000);
    window.addEventListener('yt-navigate-finish', init);
  },
});
