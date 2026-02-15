import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { pin } = body;

    // STRICT PASSWORD POLICY
    // Enforce "Freshstart20522!"
    if (pin === 'Freshstart20522!') {
        const response = NextResponse.json({ success: true });
        // Set cookie valid for 30 days (Trusted Device)
        response.cookies.set('noted_access_token', 'session_active', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 Days
            sameSite: 'lax',
            path: '/'
        });
        return response;
    }

    return NextResponse.json({ success: false }, { status: 401 });
}
