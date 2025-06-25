import numpy as np
import wave
import random
import pywt
from Crypto.Cipher import AES
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import struct

# RSA Decryption for AES Key
def decrypt_AES_key_RSA(encrypted_key, private_key_file):
    with open(private_key_file, "rb") as priv_file:
        private_key = RSA.import_key(priv_file.read())
    
    cipher_rsa = PKCS1_OAEP.new(private_key)
    aes_key = cipher_rsa.decrypt(encrypted_key)
    return aes_key

# AES Decryption Function
def decrypt_audio_AES(encrypted_audio, aes_key):
    nonce, tag, ciphertext = encrypted_audio[:16], encrypted_audio[16:32], encrypted_audio[32:]
    cipher = AES.new(aes_key, AES.MODE_EAX, nonce=nonce)
    return cipher.decrypt_and_verify(ciphertext, tag)

# Extract Data from LSB Steganography
def extract_data_LSB(stego_audio_file, data_length):
    with wave.open(stego_audio_file, 'rb') as audio:
        frames = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16)
    
    random.seed(42)  # Use same seed as embedding
    indices = random.sample(range(len(frames)), data_length * 8)
    
    data_bits = ''.join(str(frames[i] & 1) for i in indices)
    encrypted_audio = bytes(int(data_bits[i:i+8], 2) for i in range(0, len(data_bits), 8))
    
    return encrypted_audio

# Example Execution
stego_audio = "stego_audio.wav"
private_key_file = "private_key.pem"

data_length = 1024 * 1024  # Assume we know the original encrypted audio size
encrypted_audio = extract_data_LSB(stego_audio, data_length)

encrypted_key = encrypted_audio[:256]  # Extract RSA encrypted AES key
encrypted_audio = encrypted_audio[256:]  # Remaining data is the AES-encrypted audio

aes_key = decrypt_AES_key_RSA(encrypted_key, private_key_file)
decrypted_audio = decrypt_audio_AES(encrypted_audio, aes_key)

# Save the decrypted audio
with wave.open("decrypted_audio.wav", "wb") as output_audio:
    output_audio.setnchannels(1)
    output_audio.setsampwidth(2)
    output_audio.setframerate(44100)
    output_audio.writeframes(decrypted_audio)

print("Decrypted audio saved as decrypted_audio.wav")
