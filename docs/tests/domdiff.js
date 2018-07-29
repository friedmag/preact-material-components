// eslint-env node, mocha

const {Builder} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const chrome = require('selenium-webdriver/chrome');
const {join} = require('path');
const mkdirp = require('mkdirp');
const serve = require('serve');
const pretty = require('pretty');
const {writeFileSync, readFileSync, unlinkSync} = require('fs');
const {expect} = require('chai');
require('geckodriver');
require('chromedriver');

const goldenDir = 'golden';
const testDir = 'generated';

describe('docs site dom diff', async function() {
  this.timeout(30000);

  let server,
    drivers = [];

  before(async function() {
    // noinspection JSPotentiallyInvalidUsageOfThis
    this.timeout(15000);

    const serveDir = join(__dirname, '../build');
    server = serve(serveDir, {
      port: 8080,
      ignore: ['node_modules']
    });

    const ffoptions = new firefox.Options().headless();
    const choptions = new chrome.Options().headless();

    drivers.push({
      driver: new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(ffoptions)
        .build(),
      name: 'firefox'
    });
    drivers.push({
      driver: new Builder()
        .forBrowser('chrome')
        .setChromeOptions(choptions)
        .build(),
      name: 'chrome'
    });

    // And its wide screen/small screen subdirectories.
    for (const dd of drivers) {
      mkdirp.sync(join(__dirname, testDir, 'dom', dd.name, 'component'));
    }

    // Artificial wait as serve takes time to boot sometimes
    await new Promise(resolve => {
      setTimeout(() => resolve(), 2000);
    });
  });

  after(() => {
    server.stop();
    for (const dd of drivers) {
      dd.driver.quit();
    }
  });

  this.slow(20000);

  it("should match the Home page's dom against the golden directory", function() {
    return compare_doms(drivers, '/');
  });

  it("should match the Card page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/card');
  });

  it("should match the Chips page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/chips');
  });

  it("should match the Checkbox page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/checkbox');
  });

  it("should match the Dialog page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/dialog');
  });

  it("should match the Drawer page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/drawer');
  });

  it("should match the Elevation page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/elevation');
  });

  it("should match the Fab page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/fab');
  });

  it("should match the FormField page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/form-field');
  });

  it("should match the GridList page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/grid-list');
  });

  it("should match the Icon page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/icon');
  });

  it("should match the IconButton page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/icon-button');
  });

  it("should match the IconToggle page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/icon-toggle');
  });

  it("should match the ImageList page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/image-list');
  });

  it("should match the LayoutGrid page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/layout-grid');
  });

  it("should match the LinearProgress page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/linear-progress');
  });

  it("should match the Menu page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/menu');
  });

  it("should match the Radio page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/radio');
  });

  it("should match the Select page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/select');
  });

  it("should match the Slider page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/slider');
  });

  it("should match the Snackbar page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/snackbar');
  });

  it("should match the Switch page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/switch');
  });

  it("should match the Tabs page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/tabs');
  });

  it("should match the TextField page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/textfield');
  });

  it("should match the Theme page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/theme');
  });

  it("should match the Toolbar page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/toolbar');
  });

  it("should match the TopAppBar page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/top-app-bar');
  });

  it("should match the Typography page's dom against the golden directory", function() {
    return compare_doms(drivers, 'component/typography');
  });
});

const dynamic_js = ['bundle', 'polyfills', 'route'];
const dynamic_css = ['style'];

async function compare_doms(drivers, page) {
  const generated = [];
  for (const driver_desc of drivers) {
    console.log(`Testing ${page} using ${driver_desc.name}`);
    const {driver, name} = driver_desc;
    await driver.get(`http://localhost:8080/${page}`);
    await driver.sleep(2000);
    const gen_dom = pretty(await driver.getPageSource(), {
      ocd: true
    })
      .replace(
        new RegExp(
          `src="/(${dynamic_js.join('|')})([.]|-)[.a-zA-Z0-9]+[.]js`,
          'g'
        ),
        'src="<dynamic generated>.js"'
      )
      .replace(
        new RegExp(
          `href="/(${dynamic_css.join('|')})([.]|-)[.a-zA-Z01-9]+[.]css`,
          'g'
        ),
        'href="<dynamic generated>.css"'
      );
    let formatted_page;
    if (page.endsWith('/')) {
      formatted_page = `${page}index`;
    } else {
      formatted_page = page;
    }
    const gen_fn = join(
      __dirname,
      testDir,
      'dom',
      name,
      `${formatted_page}.html`
    );
    writeFileSync(gen_fn, gen_dom);

    const expected = readFileSync(
      join(
        __dirname,
        goldenDir,
        'dom',
        driver_desc.name,
        `${formatted_page}.html`
      ),
      'utf8'
    );

    if (gen_dom === expected) {
      unlinkSync(gen_fn);
    }

    generated.push({
      browser: driver_desc.name,
      dom: gen_dom,
      expected: expected
    });
  }

  for (const result of generated) {
    expect(
      result.expected,
      `DOMs should be the same (${result.browser})`
    ).equals(result.dom);
  }
}
