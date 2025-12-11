import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Chuyển relative path → full Cloudinary URL
export const normalizeImageUrl = (img) => {
    if (!img || typeof img !== 'string') return null;
    if (img.startsWith('http')) return img;
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${img}`;
};

// Normalize array/string ảnh → array of full URLs
export const normalizeImages = (input) => {
    if (!input) return [];
    return (Array.isArray(input) ? input : [input])
        .map(normalizeImageUrl)
        .filter(Boolean);
};

export default cloudinary;