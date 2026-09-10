import { eq } from "drizzle-orm";
import { getDb, ensureSyncTable } from "@/db";
import { userSync } from "@/db/schema";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    await ensureSyncTable();
    const db = getDb();
    const body = await request.json();

    const action = body.action;
    // Hỗ trợ cả tên gọi mới (username, password) và mã tương thích cũ
    const rawUsername = body.username || body.syncCode || body.customCode || "";
    const rawPassword = body.password || body.pin || "";
    const data = body.data;

    const username = String(rawUsername).trim().toLowerCase();
    const password = String(rawPassword).trim();

    // 1. ĐĂNG KÝ TÀI KHOẢN MỚI
    if (action === "register" || action === "create") {
      if (!username || username.length < 3) {
        return Response.json(
          { error: "Tên tài khoản (hoặc SĐT) phải có ít nhất 3 ký tự." },
          { status: 400 }
        );
      }

      if (!password || password.length < 4) {
        return Response.json(
          { error: "Mật khẩu phải có ít nhất 4 ký tự." },
          { status: 400 }
        );
      }

      // Kiểm tra tài khoản đã tồn tại chưa
      const existing = await db
        .select()
        .from(userSync)
        .where(eq(userSync.syncCode, username))
        .limit(1);

      const passwordHash = await hashPassword(password);
      const initialDataStr = typeof data === "object" ? JSON.stringify(data) : (data || "{}");
      const now = new Date().toISOString();

      if (existing.length > 0) {
        // Nếu đã tồn tại và mật khẩu khớp -> tự động đăng nhập luôn cho tiện
        if (existing[0].pinHash === passwordHash) {
          return Response.json({
            success: true,
            username: existing[0].syncCode,
            data: JSON.parse(existing[0].data || "{}"),
            updatedAt: existing[0].updatedAt,
            message: "Tài khoản đã tồn tại, đã tự động đăng nhập!",
          });
        }
        return Response.json(
          { error: "Tên tài khoản này đã có người đăng ký. Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập." },
          { status: 409 }
        );
      }

      await db.insert(userSync).values({
        syncCode: username,
        pinHash: passwordHash,
        data: initialDataStr,
        createdAt: now,
        updatedAt: now,
      });

      return Response.json({
        success: true,
        username,
        updatedAt: now,
        message: "Đăng ký tài khoản thành công!",
      });
    }

    // 2. ĐĂNG NHẬP TÀI KHOẢN (PULL DỮ LIỆU)
    if (action === "login" || action === "pull" || action === "link") {
      if (!username || !password) {
        return Response.json(
          { error: "Vui lòng nhập đầy đủ tên tài khoản và mật khẩu." },
          { status: 400 }
        );
      }

      const existing = await db
        .select()
        .from(userSync)
        .where(eq(userSync.syncCode, username))
        .limit(1);

      if (existing.length === 0) {
        return Response.json(
          { error: "Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký." },
          { status: 404 }
        );
      }

      const passwordHash = await hashPassword(password);
      if (existing[0].pinHash !== passwordHash) {
        return Response.json(
          { error: "Mật khẩu không chính xác. Vui lòng thử lại!" },
          { status: 401 }
        );
      }

      let parsedData = {};
      try {
        parsedData = JSON.parse(existing[0].data || "{}");
      } catch {
        parsedData = {};
      }

      return Response.json({
        success: true,
        username: existing[0].syncCode,
        data: parsedData,
        updatedAt: existing[0].updatedAt,
        message: "Đăng nhập và đồng bộ thành công!",
      });
    }

    // 3. ĐỒNG BỘ CẬP NHẬT DỮ LIỆU (PUSH)
    if (action === "push") {
      if (!username || !password) {
        return Response.json(
          { error: "Thiếu thông tin xác thực tài khoản." },
          { status: 400 }
        );
      }

      const existing = await db
        .select()
        .from(userSync)
        .where(eq(userSync.syncCode, username))
        .limit(1);

      if (existing.length === 0) {
        return Response.json(
          { error: "Tài khoản không tồn tại." },
          { status: 404 }
        );
      }

      const passwordHash = await hashPassword(password);
      if (existing[0].pinHash !== passwordHash) {
        return Response.json(
          { error: "Xác thực tài khoản thất bại." },
          { status: 401 }
        );
      }

      const dataStr = typeof data === "object" ? JSON.stringify(data) : String(data || "{}");
      const now = new Date().toISOString();

      await db
        .update(userSync)
        .set({
          data: dataStr,
          updatedAt: now,
        })
        .where(eq(userSync.syncCode, username));

      return Response.json({
        success: true,
        updatedAt: now,
      });
    }

    return Response.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (error) {
    console.error("API /api/sync error:", error);
    const msg = error instanceof Error ? error.message : "Lỗi máy chủ";
    return Response.json({ error: msg }, { status: 500 });
  }
}
