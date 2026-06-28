'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'auth_token';

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch (error) {
    console.error('Failed to set auth cookie:', error);
  }
}

export async function getAuthCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
  } catch (error) {
    console.error('Failed to get auth cookie:', error);
    return null;
  }
}

export async function removeAuthCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch (error) {
    console.error('Failed to remove auth cookie:', error);
  }
}