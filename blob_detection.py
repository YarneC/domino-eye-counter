import cv2
import numpy as np

def preprocess_image_from_array(img, target_height=600):
    h, w = img.shape[:2]
    aspect_ratio = w / h
    new_width = int(aspect_ratio * target_height)
    img_resized = cv2.resize(img, (new_width, target_height))
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    gray_blur = cv2.GaussianBlur(gray, (5,5),0)
    return img_resized, gray_blur

def detect_blobs_from_gray_blur(gray_blur):
    params = cv2.SimpleBlobDetector_Params()
    params.filterByArea = True
    params.minArea = 100
    params.maxArea = 2000
    params.filterByCircularity = False
    params.filterByConvexity = False
    params.filterByInertia = True
    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(gray_blur)
    return keypoints

def visualize_keypoints_on_array(image, keypoints):
    img_copy = image.copy()
    for kp in keypoints:
        x, y = int(kp.pt[0]), int(kp.pt[1])
        radius = int(kp.size / 2) if kp.size > 0 else 10
        cv2.circle(img_copy, (x,y), radius, (0,0,255), 4, lineType=cv2.LINE_AA)
    cv2.putText(img_copy, f"Circles: {len(keypoints)}", (10,30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2, cv2.LINE_AA)
    return img_copy
