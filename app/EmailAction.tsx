"use client";

type EmailActionProps = {
  variant: "nav" | "main" | "card" | "privacy";
  subject?: string;
};

const addressParts = ["shikanghou4", "gmail", "com"];

export default function EmailAction({ variant, subject = "来自个人网站的联系" }: EmailActionProps) {
  const openEmail = () => {
    const address = `${addressParts[0]}@${addressParts[1]}.${addressParts[2]}`;
    window.location.href = `mailto:${address}?subject=${encodeURIComponent(subject)}`;
  };

  if (variant === "nav") return <button className="nav-contact" type="button" onClick={openEmail}>联系我 <span aria-hidden="true">↗</span></button>;
  if (variant === "main") return <button className="email-link email-action" type="button" onClick={openEmail}>shikanghou4@gmail.com <span aria-hidden="true">↗</span></button>;
  if (variant === "privacy") return <button className="privacy-email" type="button" onClick={openEmail}>发送删除或隐私请求 ↗</button>;
  return <button className="contact-email-action" type="button" onClick={openEmail}><b>EMAIL</b><span>首选 · 写封邮件 ↗</span></button>;
}
