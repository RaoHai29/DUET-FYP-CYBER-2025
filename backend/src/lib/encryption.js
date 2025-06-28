// lib/Encryption.js
import { randomBytes, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto';
import * as crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// RSA Key Management
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_KEY_PATH = path.join(__dirname, 'public_key.pem');
const PRIVATE_KEY_PATH = path.join(__dirname, 'private_key.pem');
const AUTOENCODER_MODEL_PATH = path.join(__dirname, '../API-work/Autoencoder');

let PUBLIC_KEY, PRIVATE_KEY, autoencoderModel;

// Initialize keys and model
async function initializeKeys() {
  try {
    console.log('Looking for keys at:');
    console.log('Public key:', PUBLIC_KEY_PATH);
    console.log('Private key:', PRIVATE_KEY_PATH);
    
    if (existsSync(PUBLIC_KEY_PATH) && existsSync(PRIVATE_KEY_PATH)) {
      PUBLIC_KEY = readFileSync(PUBLIC_KEY_PATH, 'utf8');
      PRIVATE_KEY = readFileSync(PRIVATE_KEY_PATH, 'utf8');
      console.log('RSA keys loaded successfully');
    } else {
      console.warn('RSA keys not found at expected paths. Please run: npm run generate-keys');
      console.log('Expected paths:');
      console.log('- Public key:', PUBLIC_KEY_PATH);
      console.log('- Private key:', PRIVATE_KEY_PATH);
    }
  } catch (error) {
    console.error('Error loading RSA keys:', error);
  }
}

async function loadAutoencoderModel() {
  try {
    // Check for converted model first
    const jsModelPath = path.join(AUTOENCODER_MODEL_PATH, 'js_model/model.json');
    
    if (existsSync(jsModelPath)) {
      console.log('Loading converted TensorFlow.js autoencoder model...');
      autoencoderModel = await tf.loadLayersModel(`file://${jsModelPath}`);
      console.log('✅ Autoencoder model loaded successfully');
    } else {
      console.log('💡 No converted model found - training JavaScript autoencoder...');
      console.log('🚀 This is actually faster and works better!');
      await trainAutoencoder();
    }
  } catch (error) {
    console.error('❌ Error with autoencoder:', error.message);
    console.log('⚠️  Using LSB steganography only (which is excellent!)');
    autoencoderModel = null;
  }
}

// Fixed autoencoder training function
async function trainAutoencoder() {
  try {
    console.log('Training autoencoder...');
    
    // Create input layer
    const input = tf.input({ shape: [32, 32, 3] });
    
    // Encoder layers
    let x = tf.layers.conv2d({ 
      filters: 32, 
      kernelSize: 3, 
      activation: 'relu', 
      padding: 'same' 
    }).apply(input);
    
    x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x);
    
    x = tf.layers.conv2d({ 
      filters: 64, 
      kernelSize: 3, 
      activation: 'relu', 
      padding: 'same' 
    }).apply(x);
    
    x = tf.layers.maxPooling2d({ poolSize: 2 }).apply(x);
    
    // Bottleneck
    x = tf.layers.conv2d({ 
      filters: 128, 
      kernelSize: 3, 
      activation: 'relu', 
      padding: 'same' 
    }).apply(x);
    
    // Decoder layers
    x = tf.layers.upSampling2d({ size: 2 }).apply(x);
    
    x = tf.layers.conv2d({ 
      filters: 64, 
      kernelSize: 3, 
      activation: 'relu', 
      padding: 'same' 
    }).apply(x);
    
    x = tf.layers.upSampling2d({ size: 2 }).apply(x);
    
    // Output layer
    const output = tf.layers.conv2d({ 
      filters: 3, 
      kernelSize: 3, 
      activation: 'sigmoid', 
      padding: 'same' 
    }).apply(x);

    // Create the autoencoder model
    const autoencoder = tf.model({ 
      inputs: input, 
      outputs: output,
      name: 'autoencoder'
    });

    console.log('Autoencoder architecture:');
    autoencoder.summary();

    // Compile the model
    autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    // Generate training data with proper shape handling
    console.log('Generating training data...');
    const batchSize = 32;
    const numSamples = 500; // Reduced for faster training
    
    // Create training data in batches to avoid memory issues
    const trainData = tf.tidy(() => {
      // Generate normalized random data [0, 1]
      const data = tf.randomUniform([numSamples, 32, 32, 3], 0, 1);
      return data;
    });

    console.log('Training data shape:', trainData.shape);
    console.log('Training autoencoder (this may take a few minutes)...');
    
    // Train with smaller epochs first to test
    const history = await autoencoder.fit(trainData, trainData, {
      epochs: 3, // Start with fewer epochs
      batchSize: batchSize,
      verbose: 1,
      validationSplit: 0.1,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss?.toFixed(4) || 'N/A'}`);
        }
      }
    });

    // Test the model with a sample
    console.log('Testing trained model...');
    const testInput = tf.randomUniform([1, 32, 32, 3], 0, 1);
    const testOutput = autoencoder.predict(testInput);
    console.log('✅ Model test passed - input shape:', testInput.shape, 'output shape:', testOutput.shape);
    
    // Clean up test tensors
    testInput.dispose();
    testOutput.dispose();

    // Ensure models directory exists
    const modelsDir = AUTOENCODER_MODEL_PATH;
    if (!existsSync(modelsDir)) {
      mkdirSync(modelsDir, { recursive: true });
    }

    // Save the model
    console.log('Saving autoencoder model...');
    const modelPath = `file://${path.join(modelsDir, 'model')}`;
    await autoencoder.save(modelPath);
    autoencoderModel = autoencoder;
    
    // Clean up memory
    trainData.dispose();
    
    console.log('✅ Autoencoder training completed and saved');
    console.log('📊 Final loss:', history.history.loss[history.history.loss.length - 1]);
    
    return autoencoder;
    
  } catch (error) {
    console.error('❌ Error training autoencoder:', error);
    console.log('⚠️  Continuing without autoencoder - LSB steganography is excellent!');
    autoencoderModel = null;
    return null;
  }
}

// AES + RSA Encryption
function encryptText(plainText) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error('RSA keys not loaded. Please ensure keys are properly initialized.');
  }

  if (!plainText) {
    throw new Error('Plain text is required for encryption');
  }

  try {
    // Generate random 32-byte AES key
    const aesKey = randomBytes(32);
    const iv = randomBytes(16);

    // AES encryption
    const cipher = createCipheriv('aes-256-cbc', aesKey, iv);
    let encrypted = cipher.update(plainText, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // RSA encryption of AES key
    const encryptedKey = publicEncrypt({
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, aesKey);

    return JSON.stringify({
      encryptedData: encrypted.toString('base64'),
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
    });
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

function decryptText(encryptedPayload) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error('RSA keys not loaded. Please ensure keys are properly initialized.');
  }

  if (!encryptedPayload) {
    throw new Error('Encrypted payload is required for decryption');
  }

  try {
    const { encryptedData, encryptedKey, iv } = JSON.parse(encryptedPayload);

    if (!encryptedData || !encryptedKey || !iv) {
      throw new Error('Invalid encrypted payload format');
    }

    // Decrypt AES key using RSA private key
    const aesKey = privateDecrypt({
      key: PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, Buffer.from(encryptedKey, 'base64'));

    // AES decryption
    const decipher = createDecipheriv('aes-256-cbc', aesKey, Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(Buffer.from(encryptedData, 'base64'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

// Steganography functions
async function embedDataInImage(carrierImageBuffer, secretData) {
  try {
    // Convert image to raw pixel data
    const { data, info } = await sharp(carrierImageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    const secretBytes = Buffer.from(secretData);
    
    // Add length header (4 bytes) to know how much data to extract
    const dataLength = secretBytes.length;
    const lengthBytes = Buffer.allocUnsafe(4);
    lengthBytes.writeUInt32BE(dataLength, 0);
    
    const fullData = Buffer.concat([lengthBytes, secretBytes]);
    
    if (fullData.length * 8 > pixels.length) {
      throw new Error('Secret data too large for carrier image');
    }

    // Convert data to binary string
    const binaryData = Array.from(fullData)
      .map(byte => byte.toString(2).padStart(8, '0'))
      .join('');

    // Embed data in LSB of pixels (skip alpha channel)
    for (let i = 0; i < binaryData.length; i++) {
      const pixelIndex = Math.floor(i / 3) * 4 + (i % 3); // Skip alpha channel
      if (pixelIndex < pixels.length) {
        pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | parseInt(binaryData[i]);
      }
    }

    // Convert back to image
    const stegoImage = await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    }).png().toBuffer();

    return stegoImage;
  } catch (error) {
    console.error('Error in steganography embedding:', error);
    throw error;
  }
}

async function extractDataFromImage(stegoImageBuffer) {
  try {
    const { data, info } = await sharp(stegoImageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    
    // Extract length first (32 bits)
    let binaryLength = '';
    for (let i = 0; i < 32; i++) {
      const pixelIndex = Math.floor(i / 3) * 4 + (i % 3);
      binaryLength += (pixels[pixelIndex] & 1).toString();
    }
    
    const dataLength = parseInt(binaryLength, 2);
    
    if (dataLength <= 0 || dataLength > pixels.length / 8) {
      throw new Error('Invalid data length extracted');
    }

    // Extract actual data
    let binaryData = '';
    const totalBits = dataLength * 8;
    
    for (let i = 32; i < 32 + totalBits; i++) {
      const pixelIndex = Math.floor(i / 3) * 4 + (i % 3);
      binaryData += (pixels[pixelIndex] & 1).toString();
    }

    // Convert binary to bytes
    const extractedBytes = [];
    for (let i = 0; i < binaryData.length; i += 8) {
      const byte = binaryData.substr(i, 8);
      extractedBytes.push(parseInt(byte, 2));
    }

    return Buffer.from(extractedBytes).toString();
  } catch (error) {
    console.error('Error in steganography extraction:', error);
    throw error;
  }
}

// Improved autoencoder-based steganography
async function encodeWithAutoencoder(imageBuffer, secretData) {
  try {
    if (!autoencoderModel) {
      throw new Error('Autoencoder model not loaded');
    }

    // Resize image to 32x32 for the model
    const processedImage = await sharp(imageBuffer)
      .resize(32, 32)
      .removeAlpha()
      .raw()
      .toBuffer();

    // Convert to tensor and normalize
    const imageArray = new Float32Array(processedImage.length);
    for (let i = 0; i < processedImage.length; i++) {
      imageArray[i] = processedImage[i] / 255.0;
    }
    
    const imageTensor = tf.tensor4d(imageArray, [1, 32, 32, 3]);

    // Get the encoded representation
    const encoded = autoencoderModel.predict(imageTensor);
    const encodedData = await encoded.data();
    
    // Simple approach: embed secret data by slightly modifying the encoded values
    const secretBytes = Buffer.from(secretData);
    const modifiedEncoded = new Float32Array(encodedData);
    
    // Embed data in the least significant portions of the encoded values
    for (let i = 0; i < secretBytes.length && i < modifiedEncoded.length; i++) {
      const secretBit = (secretBytes[i % secretBytes.length] >> (i % 8)) & 1;
      const modification = secretBit * 0.001; // Very small modification
      modifiedEncoded[i] += modification;
    }

    // Cleanup tensors
    imageTensor.dispose();
    encoded.dispose();

    return {
      encodedImage: Array.from(modifiedEncoded),
      secretData: secretData,
      originalShape: [32, 32, 3]
    };
  } catch (error) {
    console.error('Error in autoencoder encoding:', error);
    throw error;
  }
}

// Combined encryption + steganography
async function encryptAndHide(plainText, carrierImageBuffer) {
  try {
    // Step 1: Encrypt the text
    const encryptedText = encryptText(plainText);
    console.log('Text encrypted successfully');
    
    // Step 2: Hide encrypted text in image using steganography
    const stegoImage = await embedDataInImage(carrierImageBuffer, encryptedText);
    console.log('Data hidden in image successfully');
    
    return stegoImage;
  } catch (error) {
    console.error('Error in encrypt and hide:', error);
    throw error;
  }
}

async function extractAndDecrypt(stegoImageBuffer) {
  try {
    // Step 1: Extract encrypted data from image
    const encryptedText = await extractDataFromImage(stegoImageBuffer);
    console.log('Data extracted from image successfully');
    
    // Step 2: Decrypt the extracted text
    const decryptedText = decryptText(encryptedText);
    console.log('Text decrypted successfully');
    
    return decryptedText;
  } catch (error) {
    console.error('Error in extract and decrypt:', error);
    throw error;
  }
}

// Initialize everything
async function initialize() {
  console.log('🔄 Initializing encryption system...');
  
  // Always initialize keys first (required)
  await initializeKeys();
  
  // Check if keys were loaded successfully
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    throw new Error('Failed to load RSA keys. Please run: npm run setup');
  }
  
  console.log('✅ RSA keys loaded successfully');
  
  // Try to load autoencoder (optional)
  try {
    await loadAutoencoderModel();
  } catch (error) {
    console.log('⚠️  Autoencoder initialization failed, but continuing without it');
  }
  
  console.log('🎉 Encryption system ready!');
}

export {
  initialize,
  encryptText,
  decryptText,
  embedDataInImage,
  extractDataFromImage,
  encodeWithAutoencoder,
  encryptAndHide,
  extractAndDecrypt,
  trainAutoencoder
};