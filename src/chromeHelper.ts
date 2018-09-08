import { Browser, launch } from "puppeteer";

let browser: Browser = null;

export const launchChrome = async () => {
    browser = await launch({ headless: false });
};

export const declarePage = async () => {
    return browser.newPage();
};
