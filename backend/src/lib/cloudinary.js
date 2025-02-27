import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: 'dyvxnkbal',
  api_key: 948752477918889,
  api_secret: 'K4s5LoMi2tJYG-kJYAvF2U0c84A',
});

export default cloudinary;
