import tensorflowjs as tfjs
from tensorflow.keras.models import load_model

# Load the model
model = load_model("autoencoder_model.h5")

# Convert and save to a directory
tfjs.converters.save_keras_model(model, "web_model")
