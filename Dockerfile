# 小学生作业本 · Hugging Face Spaces (Docker) 部署
# HF 会注入 PORT 环境变量（默认 7860），server.js 已支持 process.env.PORT
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev || true
COPY . .
ENV PORT=7860
EXPOSE 7860
CMD ["node", "server.js"]
