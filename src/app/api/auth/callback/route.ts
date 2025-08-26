import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    console.log(`Callback - 開始處理 OAuth 回調... ${req.url}`);
    
    if (error) {
      console.error(`Callback - 收到OAuth錯誤: ${error}`);
      return NextResponse.redirect(`${req.nextUrl.origin}/login?error=${error}`);
    }
    
    if (!code) {
      console.error('Callback - 缺少授權碼');
      return NextResponse.redirect(`${req.nextUrl.origin}/login?error=missing_code`);
    }
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('授權碼交換失敗:', exchangeError);
      return NextResponse.redirect(`${req.nextUrl.origin}/login?error=auth_error`);
    }
    
    console.log('授權碼交換成功');
    
    if (data.session) {
      console.log(`用戶 ${data.session.user.email} 登入成功`);
    }
    
    return NextResponse.redirect(`${req.nextUrl.origin}/admin`);
  } catch (err) {
    console.error('回調處理錯誤:', err);
    return NextResponse.redirect(`${new URL(req.url).origin}/login?error=callback_error`);
  }
}