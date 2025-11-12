import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Cannot change email for OAuth accounts' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email },
    });

    return NextResponse.json({
      message: 'Email updated successfully',
    });
  } catch (error) {
    console.error('Email update error:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
