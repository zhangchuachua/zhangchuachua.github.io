export function isRemoteUrl(url: string) {
  return /^https?:\/\//.test(url) && new URL(url).origin !== import.meta.env.SITE;
}
