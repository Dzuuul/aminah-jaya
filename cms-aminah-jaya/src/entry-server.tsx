// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Aminah Jaya — Content Management System</title>
          <meta name="description" content="Content Management System for Aminah Jaya." />
          <link rel="icon" href="/favicon.ico" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
            rel="stylesheet"
          />
          {assets}
        </head>
        <body class="bg-[#fdfcfa]">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
