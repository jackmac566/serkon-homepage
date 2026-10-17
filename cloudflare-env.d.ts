declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    ADMIN_EMAIL?: string;
    ADMIN_KEY?: string;
    /** 线上 Pages 项目实际配置的站长密钥名，代码同时接受它与 ADMIN_KEY。 */
    ADMIN_TOKEN?: string;
  }
}

type CloudflareEnv = Cloudflare.Env;
