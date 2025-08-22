const { clerkClient } = require('@clerk/clerk-sdk-node');

// Cấu hình Clerk
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY không được cấu hình trong environment variables');
    process.exit(1);
}

if (!CLERK_PUBLISHABLE_KEY) {
    console.error('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY không được cấu hình trong environment variables');
    process.exit(1);
}

// Khởi tạo Clerk client
const clerk = clerkClient;

module.exports = {
    clerk,
    CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY
};
