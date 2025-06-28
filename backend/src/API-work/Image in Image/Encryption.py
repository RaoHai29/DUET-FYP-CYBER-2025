from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import cv2
import numpy as np
import base64

def encrypt_image_with_aes(image_path, aes_key):
    """
    Encrypt an image using AES-128.
    """
    # Read the image as bytes
    image = cv2.imread(image_path)
    image_bytes = cv2.imencode('.png', image)[1].tobytes()

    # Initialize AES cipher
    cipher_aes = AES.new(aes_key, AES.MODE_CBC)
    iv = cipher_aes.iv

    # Encrypt the image bytes
    encrypted_image = cipher_aes.encrypt(pad(image_bytes, AES.block_size))
    return encrypted_image, iv

def encrypt_aes_key_with_rsa(aes_key, public_key):
    """
    Encrypt the AES key using RSA public key.
    """
    cipher_rsa = PKCS1_OAEP.new(public_key)
    encrypted_aes_key = cipher_rsa.encrypt(aes_key)
    return encrypted_aes_key

def save_rsa_keys(public_key, private_key):
    """
    Save RSA public and private keys to files.
    """
    with open("public_key.pem", "wb") as pub_file:
        pub_file.write(public_key.export_key())
    with open("private_key.pem", "wb") as priv_file:
        priv_file.write(private_key.export_key())

def embed_data_into_image(stego_image_path, encrypted_data, output_image_path):
    """
    Embed encrypted data into a stego image using LSB steganography.
    """
    # Read the stego image
    stego_image = cv2.imread(stego_image_path)
    if stego_image is None:
        raise FileNotFoundError(f"Stego image '{stego_image_path}' not found.")

    # Flatten the image into a 1D array of bytes
    flat_image = stego_image.flatten()

    # Convert encrypted data to a bit stream
    data_bits = ''.join(format(byte, '08b') for byte in encrypted_data)

    if len(data_bits) > len(flat_image):
        raise ValueError("Encrypted data is too large to embed in the provided image.")

    # Embed data bits into the least significant bit of the image
    for i, bit in enumerate(data_bits):
        flat_image[i] = (flat_image[i] & 0xFE) | int(bit)

    # Reshape the modified flat image back to its original shape
    stego_image_with_data = flat_image.reshape(stego_image.shape)

    # Save the stego image with embedded data
    cv2.imwrite(output_image_path, stego_image_with_data)

def main():
    # Paths and keys
    image_path = "input_image.jpeg"  # Replace with your image file
    stego_image_path = "img.png"  # Replace with your stego carrier image file
    output_image_path = "stego_with_data.png"  # Output stego image with embedded data

    # Generate AES-128 key (16 bytes)
    aes_key = get_random_bytes(16)

    # Generate RSA key pair
    key_pair = RSA.generate(2048)
    public_key = key_pair.publickey()
    private_key = key_pair

    # Save RSA keys
    save_rsa_keys(public_key, private_key)

    # Encrypt the image using AES-128
    encrypted_image, iv = encrypt_image_with_aes(image_path, aes_key)

    # Encrypt the AES key using RSA
    encrypted_aes_key = encrypt_aes_key_with_rsa(aes_key, public_key)

    # Save encrypted image and initialization vector
    with open("encrypted_image.bin", "wb") as img_file:
        img_file.write(encrypted_image)

    with open("iv.bin", "wb") as iv_file:
        iv_file.write(iv)

    with open("encrypted_aes_key.bin", "wb") as key_file:
        key_file.write(encrypted_aes_key)

    print("Encryption completed.")
    print("Encrypted image saved as 'encrypted_image.bin'.")
    print("Encrypted AES key saved as 'encrypted_aes_key.bin'.")
    print("Initialization vector saved as 'iv.bin'.")
    print("RSA keys saved as 'public_key.pem' and 'private_key.pem'.")

    # Embed encrypted image into a stego image
    with open("encrypted_image.bin", "rb") as encrypted_file:
        encrypted_data = encrypted_file.read()

    embed_data_into_image(stego_image_path, encrypted_data, output_image_path)

    print(f"Stego image with embedded data saved as '{output_image_path}'.")

if __name__ == "__main__":
    main()
