#!/bin/bash
cd "$(dirname "$0")"
npm install prisma@5.22.0 @prisma/client@5.22.0
npx prisma generate

