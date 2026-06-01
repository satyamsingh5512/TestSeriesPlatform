export default function imageLoader({ src, width, quality }) {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  if (src.startsWith('http')) {
    return src;
  }
  return `${cdnUrl}${src}?w=${width}&q=${quality || 75}`;
}
