import { defineConfig, envField } from "astro/config"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import vercel from "@astrojs/vercel"

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
  site: "https://santiagosaldivar.com",
  integrations: [react()],
})
