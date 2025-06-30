# TaskTurtle Discord Bot

Discord.jsを使用したDiscordボットです。Denoで動作します。

## 機能

- `/play` - YouTubeの音声を再生
- `/stop` - 音声再生を停止してVCから退出

## 環境変数

以下の環境変数を設定してください：

- `TOKEN` - Discord Bot Token
- `APPLICATION_ID` - Discord Application ID

## ローカル実行

```bash
deno task start
```

## Deno Deploy

1. [Deno Deploy](https://deno.com/deploy)にプロジェクトを接続
2. 環境変数を設定
3. デプロイ

## 注意事項

- Deno Deployでは音声機能が制限される可能性があります
- 音声機能を使用する場合は、VPSや他のホスティングサービスを検討してください 