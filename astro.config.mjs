import { defineConfig, envField } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import vercel from "@astrojs/vercel"

const SERVER_PORT = 3000
const LOCALHOST = `http://localhost:${SERVER_PORT}`
const LIVE_URL = "https://santiagosaldivar.com"
const SCRIPT = process.env.npm_lifecycle_script || ""
const isBuild = SCRIPT.includes("astro build")
let BASE_URL = LOCALHOST

if (isBuild) {
  BASE_URL = LIVE_URL
}

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
      MY_EMAIL: envField.string({ context: "server", access: "secret" }),
    },
  },
  output: "server",
  adapter: vercel(),
  site: BASE_URL,
  base: "",
})
