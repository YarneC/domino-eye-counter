from flask import Flask, request, send_file, render_template
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from blob_detection import preprocess_image_from_array, detect_blobs_from_gray_blur, visualize_keypoints_on_array

app = Flask(__name__)

def process_image_from_dataurl(data_url):
    img_bytes = base64.b64decode(data_url.split(',')[1])
    img = np.array(Image.open(BytesIO(img_bytes)))
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    
    img_resized, gray_blur = preprocess_image_from_array(img)
    keypoints = detect_blobs_from_gray_blur(gray_blur)
    output_img, text = visualize_keypoints_on_array(img_resized, keypoints)
    
    _, buffer = cv2.imencode('.png', output_img)
    return BytesIO(buffer.tobytes()), text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect():
    data = request.json['image']
    processed_img_io, text = process_image_from_dataurl(data)
    processed_img_io.seek(0)
    response = send_file(processed_img_io, mimetype='image/png')
    # attach detection text in a response header so the frontend can display it
    response.headers['X-Detection-Result'] = text
    return response

@app.route('/ping')
def ping():
    return "OK", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
