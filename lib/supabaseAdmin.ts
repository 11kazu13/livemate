// 公式のSoftware Develoment Kitをインポート
import { createClient } from "@supabase/supabase-js";

// .env.localにて設定した環境変数を取得
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; //　管理者権限キー

// Supabaseの管理用クライアントを生成
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
