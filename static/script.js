const video = document.getElementById('camera');
const canvas = document.getElementById('snapshot');
const resultImg = document.getElementById('result');

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => video.srcObject = stream)
  .catch(err => alert("Camera not accessible: " + err));

document.getElementById('snap').onclick = async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/png');

    const resp = await fetch('/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
    });

    const blob = await resp.blob();
    resultImg.src = URL.createObjectURL(blob);
};
