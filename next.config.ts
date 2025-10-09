// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */

  
// };

// export default nextConfig;


import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ 仅显示构建错误，不显示警告
  webpack: (config, { isServer }) => {
    config.stats = {
      all: false,
      errors: true, // 仅显示错误
      errorDetails: true, // 显示错误细节
    };
    return config;
  },

  // ✅ 构建时忽略 ESLint 警告
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ 构建时忽略 TypeScript 类型错误（可选）
  // ⚠️ 注意：这会忽略真正的 TS 报错，请谨慎使用
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
