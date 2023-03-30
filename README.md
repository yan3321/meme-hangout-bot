# meme-hangout-bot

![Meme Hangout Bot Header](docs/media/mh-bot-header.png)

## About

Node.JS Discord bot to provide Minecraft server status updates, as well as using RCON to handle server functions such as whitelisting.  

Built with Discord.JS.  

## Requirements

- Node.js (v18+ LTS)
- `pnpm` package manager (`npm i --location=global pnpm`)

## Basic setup guide

- Clone the repository
- Install dependencies `pnpm i`
- Create `.env` file and configure based on `.env.example`
- Start with `pnpm start`
- Alternatively, build to `dist/index.js` with `pnpm build` (e.g. for use with PM2)
