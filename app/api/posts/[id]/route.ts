// URLの一部を変数として扱うために[id]とする

// HTTPレスポンスを返すためのもの
import { NextResponse } from "next/server";

// Node.js標準の暗号ライブラリ
import crypto from "crypto";

// Supabaseへの接続口
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 削除キーをハッシュ化するための関数
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// DELETEリクエストを処理する関数
export async function DELETE(
  req: Request, // HTTPリクエスト本体
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const postId = Number(id); // idは文字列なので数値に変換
  if (!Number.isFinite(postId)) { // NaNや無限大のチェック
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  // リクエストのボディを取得
  const body = await req.json().catch(() => ({}));

  // 削除キーの取得とバリデーション
  const deleteToken = String(body.deleteToken ?? "").trim();

  // 削除キーが未入力の場合はクライアント側のエラーとして処理
  if (!deleteToken) {
    return NextResponse.json(
      { ok: false, error: "DELETE_TOKEN_REQUIRED" },
      { status: 400 }
    );
  }

  // 削除キーをハッシュ化
  const delete_token_hash = hashToken(deleteToken);

  // 該当投稿を取得
  const { data: post, error: fetchErr } = await supabaseAdmin
    .from("posts") // postsテーブルを指定
    .select("id, delete_token_hash") // idと削除キーのハッシュを取得
    .eq("id", postId) // id=postIdの行を絞り込む
    .single(); // 一つのオブジェクトとして扱う

  // 取得エラー、もしくは該当投稿がない場合の処理
  if (fetchErr || !post) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // 削除キー（ハッシュ値）の照合作業
  if (post.delete_token_hash // DBに保存されているハッシュ値
  !== delete_token_hash) { // 今回入力された削除キーのハッシュ値
    return NextResponse.json(
      { ok: false, error: "INVALID_DELETE_TOKEN" },
      { status: 403 }
    );
  }

  // 削除キーのハッシュ値が一致した場合に削除を実行
  const { error: delErr } = await supabaseAdmin
    .from("posts") // postsテーブルを指定
    .delete() // 削除操作を実行
    .eq("id", postId); // 削除する条件を指定

  // 削除の際にエラーが起きた時の処理
  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  }

  // 削除が正常に完了できた時のレスポンス
  return NextResponse.json({ ok: true });
}
