import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: "Successfully logged out" 
    });
    
    // 🔥 Clear standard Supabase auth cookies (if you are using SSR cookies)
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Failed to log out" }, 
      { status: 500 }
    );
  }
}