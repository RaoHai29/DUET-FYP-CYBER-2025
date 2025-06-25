import numpy as np
import wave
import random
import pywt
from Crypto.Cipher import AES
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import PKCS1_OAEP
import struct

# Generate RSA Key Pair and Save to Files
def generate_RSA_keys():
    key = RSA.generate(2048)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    
    with open("private_key.pem", "wb") as priv_file:
        priv_file.write(private_key)
    
    with open("public_key.pem", "wb") as pub_file:
        pub_file.write(public_key)
    
    return private_key, public_key

# AES Encryption Function
def encrypt_audio_AES(audio_data, key):
    cipher = AES.new(key, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(audio_data)
    return cipher.nonce + tag + ciphertext

# RSA Encryption for AES Key
def encrypt_AES_key_RSA(aes_key, public_key):
    rsa_key = RSA.import_key(public_key)
    cipher_rsa = PKCS1_OAEP.new(rsa_key)
    encrypted_key = cipher_rsa.encrypt(aes_key)
    return encrypted_key

# AI-Powered LSB Steganography - Randomized LSB Embedding
def embed_data_LSB(audio_file, encrypted_audio, output_file):
    with wave.open(audio_file, 'rb') as audio:
        params = audio.getparams()
        frames = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16).copy()
    
    data_bits = ''.join(format(byte, '08b') for byte in encrypted_audio)
    random.seed(42)  # Secure seed for reproducibility
    indices = random.sample(range(len(frames)), len(data_bits))
    
    for i, bit in zip(indices, data_bits):
        frames[i] = (frames[i] & ~1) | int(bit)  # Modify LSB
    
    with wave.open(output_file, 'wb') as stego_audio:
        stego_audio.setparams(params)
        stego_audio.writeframes(frames.tobytes())
    
    return output_file

# AI-based Noise Analysis (Future Integration with ML Model)
def find_high_energy_regions(audio_file):
    with wave.open(audio_file, 'rb') as audio:
        frames = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16)
    
    coeffs = pywt.wavedec(frames, 'haar')
    power = np.abs(coeffs[1])
    return np.argsort(power)[-len(frames)//10:]

# Example Execution
private_key, public_key = generate_RSA_keys()

audio_file = "input.wav"  # Original stego audio
secret_audio = "secret.wav"  # Audio to be hidden
output_stego = "stego_audio.wav"

# Read and encrypt the secret audio
with wave.open(secret_audio, 'rb') as secret:
    secret_frames = secret.readframes(secret.getnframes())

aes_key = get_random_bytes(16)
encrypted_audio = encrypt_audio_AES(secret_frames, aes_key)
encrypted_key = encrypt_AES_key_RSA(aes_key, public_key)

# Embed encrypted audio into stego audio
embed_data_LSB(audio_file, encrypted_audio, output_stego)
print("Stego audio saved as", output_stego)