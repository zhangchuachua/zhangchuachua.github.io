---
title: DNS 解析
description:
tags:
- 网络
create_date: 2025-03-17 17:08
slug: dns
---

DNS → Domain Name System → 域名系统

DNS 简单的来说，就是将「域名」⇒ 「IP 地址」

> 参考：[阮一峰-DNS 原理入门](https://www.ruanyifeng.com/blog/2016/06/dns.html)

---

1. 假设请求网址为： `www.example.com`
2. 浏览器首先会检查本地缓存
    
    > [!tip] 本地缓存包括：1. 浏览器缓存(如果没有过期的话) 2. 操作系统本身的 DNS 缓存，本地的 hosts 文件
    
3. 如果本地没有缓存的话，这个请求会进入「本地 DNS 服务器」，如果「本地 DNS 服务器」，如果有对应的缓存，那么直接返回 IP 地址给浏览器；如果没有对应的缓存就会进入下一步
4. `www.example.com` 真正的域名其实是:  `www.example.com.root` 简写为 `www.example.com.` 因为「根域名」 `.root` 对于所有域名都是一样的；所以平时是忽略的；所以会首先请求 「根域名服务器」

    > [!tip]- Tip
    >「根域名服务器」是 a.root-servers.net. ~ m.root-servers.net. 共 13个  
    >   
    > 「根域名服务器」基本不会变动，所以「本地 DNS 服务器」都内置了「根域名服务器」的 NS 记录 和 A 记录，所以不需要额外的请求去获取 IP 地址；并且缓存的时候非常长，一般 1000 小时才会去重新验证一下；  
    >   
    > NS 记录就是 Name Server  
    > A 记录就是 Address 指的就是 IP 地址  
    
    「本地 DNS 服务器」会向「根域名服务器」发起请求获取 `www.example.com` 的，「根域名服务器」们不负责解析域名，但是会将对应的「顶级域名服务器」作为响应，返回给「本地 DNS 服务器」；
    
    比如 `www.example.com`的顶级域名是 `.com` 那么「根域名服务器」就会将负责 `.com` 的「顶级域名服务器」IP 地址返回给「本地 DNS 服务器」
5. 「本地 DNS 服务器」继续转发 `www.example.com` 到 「顶级域名服务器」；「顶级域名服务器」会将负责 `.example.com` 的「权威域名服务器」IP 地址作为响应返回给「本地 DNS 服务器」
   > [!tip] 在注册 CDN 时，CDN 提供商将会提供一个 CNAME 然后将这个 CNAME 添加到域名中，那么顶级域名服务器此时返回的是 CNAME 的权威域名服务器的 IP 地址；
6. 「本地 DNS 服务器」继续转发 `www.example.com` 到 「权威域名服务器」；获取到 `www.example.com` 的 IP 地址；
   > [tip] 如果被导向了 CDN 那么，CDN 经过分析提供最佳的 IP 地址, 见 [[CDN 如何决策资源请求？]]