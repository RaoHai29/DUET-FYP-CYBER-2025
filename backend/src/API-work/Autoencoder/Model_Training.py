import tensorflow as tf
from tensorflow.keras import layers, models

# Define & train a simple autoencoder
def build_and_train_autoencoder():
    # Example using CIFAR10 dataset
    (x_train, _), _ = tf.keras.datasets.cifar10.load_data()
    x_train = x_train.astype('float32') / 255.0

    # Simple autoencoder
    autoencoder = models.Sequential([
        layers.Input(shape=(32, 32, 3)),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),  # Bottleneck
        layers.UpSampling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.UpSampling2D((2, 2)),
        layers.Conv2D(3, (3, 3), activation='sigmoid', padding='same')
    ])
    autoencoder.compile(optimizer='adam', loss='mse')
    autoencoder.fit(x_train, x_train, epochs=10, batch_size=32)
    autoencoder.save('autoencoder_model.h5')  # Save the model

build_and_train_autoencoder()  # Run this once to train and save the model