#!/bin/bash

# Set Node.js version
export NODE_VERSION=18.17.0
export PATH="/opt/render/project/nodes/node-${NODE_VERSION}/bin:$PATH"

# Clean install
rm -rf node_modules package-lock.json

# Install dependencies
npm install --legacy-peer-deps

# Install specific versions of critical dependencies
npm install dotenv@16.5.0 --save --legacy-peer-deps
npm install express@4.21.2 --save --legacy-peer-deps
npm install mongoose@7.8.7 --save --legacy-peer-deps
npm install cors@2.8.5 --save --legacy-peer-deps
npm install jsonwebtoken@9.0.2 --save --legacy-peer-deps
npm install bcryptjs@2.4.3 --save --legacy-peer-deps
npm install socket.io@4.8.1 --save --legacy-peer-deps
npm install nodemailer@6.10.1 --save --legacy-peer-deps
npm install openai@4.104.0 --save --legacy-peer-deps
npm install twilio@4.23.0 --save --legacy-peer-deps

# Verify installation
ls -la node_modules/dotenv 