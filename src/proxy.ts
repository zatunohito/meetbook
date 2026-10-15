import { NextResponse, type NextRequest } from "next/server";
import { adminConfigured, checkBasicAuth } from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  if (!adminConfigured()) {
    return new NextResponse("管理画面は無効です（ADMIN_USER / ADMIN_PASSWORD を設定してください）", { status: 503 });
  }
  if (!checkBasicAuth(request.headers.get("authorization"))) {
    return new NextResponse("認証が必要です", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="MEET BOOK admin", charset="UTF-8"' },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
