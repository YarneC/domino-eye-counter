const placeholder = document.getElementById('placeholder');
const canvas = document.getElementById('snapshot');
const detectionTextEl = document.getElementById('detectionText');
const openCameraBtn = document.getElementById('openCameraBtn');
const captureBtn = document.getElementById('captureBtn');

let stream = null;
let videoEl = null;

// start camera and show video in placeholder
async function startCamera(){
  if (stream) return; // already running

  // remove any previous result image
  const existingResult = document.getElementById('result');
  if (existingResult) {
    existingResult.remove();
    detectionTextEl.textContent = '';
  }

  placeholder.innerHTML = '';
  videoEl = document.createElement('video');
  videoEl.id = 'camera';
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.muted = true; // autoplay policies
  videoEl.style.maxWidth = '100%';
  videoEl.style.maxHeight = '100%';
  placeholder.appendChild(videoEl);

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoEl.srcObject = stream;
    await videoEl.play();
    captureBtn.disabled = false;
    openCameraBtn.disabled = true;
  } catch (err) {
    console.error('Camera start failed', err);
    placeholder.innerHTML = '<div style="color:#ff6b6b">Camera not available</div>';
    stream = null;
    videoEl = null;
    captureBtn.disabled = true;
    openCameraBtn.disabled = false;
  }
}

// stop camera and remove video element
function stopCamera(){
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.remove();
    videoEl = null;
  }
  captureBtn.disabled = true;
  openCameraBtn.disabled = false;
}

openCameraBtn.addEventListener('click', async () => {
  await startCamera();
});

// auto-start camera on load
startCamera();

// capture, send to backend, show returned image in placeholder
captureBtn.addEventListener('click', async () => {
  if (!videoEl) return;
  captureBtn.disabled = true;

  // ensure canvas matches the video actual size
  const w = videoEl.videoWidth || videoEl.clientWidth || 640;
  const h = videoEl.videoHeight || videoEl.clientHeight || 480;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  const dataURL = canvas.toDataURL('image/png');

  try {
    const resp = await fetch('/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataURL })
    });

    if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

    const detectionText = resp.headers.get('X-Detection-Result') || '';
    const blob = await resp.blob();

    // stop live feed and show result in the placeholder
    stopCamera();
    placeholder.innerHTML = '';

    const img = document.createElement('img');
    img.id = 'result';
    img.alt = 'Detection result';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.src = URL.createObjectURL(blob);
    placeholder.appendChild(img);

    detectionTextEl.textContent = detectionText;
  } catch (err) {
    console.error('Detection failed', err);
    alert('Detection failed: ' + err);
  } finally {
    // keep capture disabled unless video is active again
    captureBtn.disabled = !!videoEl ? false : true;
  }
});