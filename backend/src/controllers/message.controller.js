// controllers/message.controller.js
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { 
  encryptText, 
  decryptText, 
  encryptAndHide, 
  extractAndDecrypt,
  embedDataInImage 
} from "../lib/encryption.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import sharp from 'sharp';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    const decryptedMessages = await Promise.all(
      messages.map(async (msg) => {
        let decryptedText = '';
        let decryptedImage = null;

        try {
          // Decrypt text messages
          if (msg.text) {
            decryptedText = decryptText(msg.text);
          }

          // Handle encrypted images
          if (msg.image) {
            if (msg.isImageEncrypted) {
              // If image contains hidden data, extract and decrypt
              const imageResponse = await fetch(msg.image);
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              decryptedText = await extractAndDecrypt(imageBuffer);
              decryptedImage = msg.image; // Keep original image URL for display
            } else {
              // Regular encrypted image URL
              decryptedImage = decryptText(msg.image);
            }
          }
        } catch (error) {
          console.error('Error decrypting message:', error);
          decryptedText = '[Decryption Error]';
          decryptedImage = null;
        }

        return {
          ...msg._doc,
          text: decryptedText,
          image: decryptedImage,
        };
      })
    );

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, useAdvancedEncryption } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;
    let isImageEncrypted = false;
    let encryptedText = '';

    if (useAdvancedEncryption && image && text) {
      // Advanced mode: Hide encrypted text in image using steganography
      try {
        // Convert base64 image to buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
        
        // Create stego image with hidden encrypted text
        const stegoImageBuffer = await encryptAndHide(text, imageBuffer);
        
        // Upload stego image to cloudinary
        const stegoImageBase64 = `data:image/png;base64,${stegoImageBuffer.toString('base64')}`;
        const uploadResponse = await cloudinary.uploader.upload(stegoImageBase64, {
          folder: 'stego_images',
          resource_type: 'image'
        });
        
        imageUrl = uploadResponse.secure_url;
        isImageEncrypted = true;
        encryptedText = ''; // Text is hidden in image
        
      } catch (error) {
        console.error('Error in advanced encryption:', error);
        // Fallback to regular encryption
        encryptedText = encryptText(text);
        
        if (image) {
          const uploadResponse = await cloudinary.uploader.upload(image);
          imageUrl = encryptText(uploadResponse.secure_url);
        }
      }
    } else {
      // Regular encryption mode
      if (text) {
        encryptedText = encryptText(text);
      }

      if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = encryptText(uploadResponse.secure_url);
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptedText,
      image: imageUrl,
      isImageEncrypted,
    });

    await newMessage.save();

    // Prepare decrypted message for real-time emission
    let decryptedMessageForSocket = {
      ...newMessage._doc,
      text: '',
      image: null,
    };

    try {
      if (isImageEncrypted && imageUrl) {
        // For stego images, extract the hidden text
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        decryptedMessageForSocket.text = await extractAndDecrypt(imageBuffer);
        decryptedMessageForSocket.image = imageUrl;
      } else {
        // Regular decryption
        if (newMessage.text) {
          decryptedMessageForSocket.text = decryptText(newMessage.text);
        }
        if (newMessage.image) {
          decryptedMessageForSocket.image = decryptText(newMessage.image);
        }
      }
    } catch (error) {
      console.error('Error decrypting message for socket:', error);
      decryptedMessageForSocket.text = '[Decryption Error]';
    }

    // Emit to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", decryptedMessageForSocket);
    }

    res.status(201).json(decryptedMessageForSocket);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    console.error("Error details: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint for testing steganography
export const testSteganography = async (req, res) => {
  try {
    const { text, image } = req.body;
    
    if (!text || !image) {
      return res.status(400).json({ error: "Text and image are required" });
    }

    // Convert base64 image to buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    
    // Hide text in image
    const stegoImageBuffer = await embedDataInImage(imageBuffer, text);
    
    // Convert back to base64
    const stegoImageBase64 = `data:image/png;base64,${stegoImageBuffer.toString('base64')}`;
    
    res.status(200).json({
      success: true,
      stegoImage: stegoImageBase64,
      message: "Text successfully hidden in image"
    });
    
  } catch (error) {
    console.log("Error in testSteganography: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint for extracting hidden data
export const extractHiddenData = async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Convert base64 image to buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    
    // Extract hidden text
    const extractedText = await extractDataFromImage(imageBuffer);
    
    res.status(200).json({
      success: true,
      extractedText,
      message: "Text successfully extracted from image"
    });
    
  } catch (error) {
    console.log("Error in extractHiddenData: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};