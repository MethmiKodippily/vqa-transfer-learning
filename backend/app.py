import joblib
import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import numpy as np
import tensorflow as tf

from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
from sentence_transformers import SentenceTransformer
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import xception
from tensorflow.keras.preprocessing import image as keras_image
from utils import clean_text

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load your models and encoders
print("[INFO] Loading models...")
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Load Xception featurizer
IMG_TARGET_SIZE = (299, 299)

base_xception_model = xception.Xception(weights='imagenet', input_shape=IMG_TARGET_SIZE + (3,))
base_xception_model.trainable = False

xception_featurizer = tf.keras.Model(inputs=base_xception_model.input, outputs=base_xception_model.layers[-2].output)
xception_featurizer.trainable = False

# Load the trained VQA model and OHE
vqa_model = load_model('./model/exported_saved_model', compile=False)
ohe = joblib.load('./model/ohe.joblib')


# Helper: Preprocess the uploaded image
def preprocess_image(img_path, target_size):
    img = keras_image.load_img(img_path, target_size=target_size)
    img_arr = keras_image.img_to_array(img)
    img_arr = xception.preprocess_input(img_arr)
    return np.expand_dims(img_arr, axis=0)


# Helper: Encode a question
def encode_question(question):
    cleaned_question = clean_text(question)
    sbert_embedding = sbert_model.encode([cleaned_question])  # shape: (1, 384)
    return sbert_embedding


# API route to handle predictions
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files or 'question' not in request.form:
            return jsonify({'error': 'Image file and question are required!'}), 400

        file = request.files['image']
        question_text = request.form['question']

        if not question_text.strip():
            return jsonify({'error': 'Question cannot be empty!'}), 400

        # Preprocess question
        question_embedding = encode_question(question_text)  # shape: (1, 384)

        # Instead of saving the file, load it directly
        img_bytes = file.read()
        img = keras_image.load_img(BytesIO(img_bytes), target_size=IMG_TARGET_SIZE)
        img_arr = keras_image.img_to_array(img)
        img_arr = xception.preprocess_input(img_arr)
        img_features_encoded = xception_featurizer.predict(np.expand_dims(img_arr, axis=0))

        # Predict answer
        prediction = vqa_model.predict([question_embedding, img_features_encoded])
        pred_onehot = tf.one_hot(tf.argmax(prediction, axis=1), depth=len(ohe.categories_[0]))
        predicted_answer = ohe.inverse_transform(pred_onehot)[0][0]

        return jsonify({
            'question': question_text,
            'predicted_answer': predicted_answer
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
