/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';

const nextConfig = {
  assetPrefix: isProd ? cdnUrl : undefined,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.js',
  },
};

export default nextConfig;
