import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ? 'Set' : 'Not Set',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'Set' : 'Not Set',
    NODE_ENV: process.env.NODE_ENV,
  });
}

