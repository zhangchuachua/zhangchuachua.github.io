遇到的问题：

1. 在 packages 下使用路径别名报错
2. 单独给每个 package 配置环境是很麻烦的事情
3. 将公共逻辑抽取成单独的包，也是麻烦的事情

---

pnpm 中 workspace 中的 peerDependencies  依赖安装方案有点不一样

当 packages 下的 `share-config` 存在 peerDependencies：

```json
{
	"peerDependencies": {
		"xx": "^1.0.0"
	}
}
```

app 的 package.json 中使用了 `share-config`:

```json
{
	"dependencies": {
		"share-config": "workspace:*"
	}
}
```

此时在 app 中执行 `pnpm install` 不会将 xx 自动下载到 app 中，而是将 xx 安装到了 `node_modules/share-config/node_modules` 中。

