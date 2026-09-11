<h1 align="center">Puppeteer Real Browser</h1>

<p align="center">
  This package prevents Puppeteer from being detected as a bot in services like Cloudflare and allows you to pass captchas without any problems. It behaves like a real browser.
</p>

## Installation

If you are using a Linux operating system, xvfb must be installed for the library to work correctly.

```bash
npm i github:rmdni-id/puppeteer-real-browser
```

if you are using linux:

```bash
sudo apt-get install xvfb
```

## Usage

```js
const { connect } = require("puppeteer-real-browser");

async function test() {
  const { browser, page } = await connect({
    headless: false,
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
  });
  await page.goto("<url>");
}

test();
```

**headless**: The default value is false. Values such as "new", true, "shell" can also be sent, but it works most stable when false is used.

**args:** If there is an additional flag you want to add when starting Chromium, you can send it with this string. Supported flags: https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md

**customConfig:** https://github.com/GoogleChrome/chrome-launcher The browser is initialized with this library. What you send with this object is added as a direct initialization argument. You should set the userDataDir option here and if you want to specify a custom chrome path, you should set it with the chromePath value.

**turnstile:** Cloudflare Turnstile automatically clicks on Captchas if set to true.

**connectOption:** The variables you send when connecting to chromium created with puppeteer.connect are added.

**disableXvfb:** In Linux, when headless is false, a virtual screen is created and the browser is run there. You can set this value to true if you want to see the browser.

**ignoreAllFlags:** If true, all initialization arguments are overridden. This includes the let's get started page that appears on the first load.

## Docker

```bash
git clone https://github.com/rmdni-id/puppeteer-real-browser
cd puppeteer-real-browser
docker build -t puppeteer-real-browser-project .
docker run puppeteer-real-browser-project
```

## Quick Questions and Answers

### I Cannot Access Functions in Window Object What Should I Do?

This problem is probably caused by the runtime being closed by the rebrowser used. https://github.com/ZFC-Digital/puppeteer-real-browser/tree/access-window

### page.setViewport method is not working, what should I do?

Set the defaultViewport in connectOption. If you set null, it will take up as much space as the width of the Browser.

### Does the library have any known detection problems?

Using puppeteer-core patched with rebrowser. Tested with the challenging sites in the test file in headless false mode and passed with flying colors.

The ghost-cursor is included in the library. You can use ghost-cursor with page.realCursor. It is recommended to use page.realClick instead of page.click.

### Why can't I pass Recaptcha v3?

https://stackoverflow.com/questions/52546045/how-to-pass-recaptcha-v3

When there is no Google session, no matter how good your browser is, recaptcha identifies you as a bot. It is a common problem.

## Thank You

This project is a fork of [ZFC-Digital/puppeteer-real-browser](https://github.com/ZFC-Digital/puppeteer-real-browser), the original creator of this library.

- **rebrowser™** - [rebrowser™](https://github.com/rebrowser) - Created a patch pack for Runtime. The Puppeteer-core library was patched and added to this repo. A lot of good bot detection systems are not caught thanks to rebrowser. Please star the rebrowser repo. (https://github.com/rebrowser/rebrowser-patches)
- **Skill Issue™** - [TheFalloutOf76](https://github.com/TheFalloutOf76) - He realized that mouse movements could not be simulated accurately and created a solution for this. His solution is used in this library. (https://github.com/TheFalloutOf76/CDP-bug-MouseEvent-.screenX-.screenY-patcher)

## License

Distributed under the MIT License. See [LICENSE](https://github.com/rmdni-id/puppeteer-real-browser/blob/main/LICENSE.md) for more information.
