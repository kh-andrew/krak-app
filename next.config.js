/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Reduce memory usage during build
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Static export for simpler deployment
  output: 'standalone',
}

module.exports = nextConfig
