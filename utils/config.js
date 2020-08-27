const defaultConifg = {
  defeaultIgnoreArray: [
    /^https?\:\/\/drafts.css/, // filter the drafts website
    /^https?:\/\/github.com/, // filter the github website
    /https?\:\/\/single-spa.js/, // filter the spa website
    /https:\/\/defaultsettings/, // filter vscode file
  ],
  linkesFilter(links, ignores) {
    const ignoreArray = ignores

    return [...new Set(links)].filter((link) => {
      return !ignoreArray.some((regexp) => regexp.test(link))
    })
  },
  linksRegexp: /(?:https?:)?\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+\.(?:png|css|js|json|svg|jp(e)?g|gif|svg|ico)/gi,
  distDir: 'dist',
  publicPath: '/',
  assetsDir: 'assets',
  rejectUnauthorized: true, // if the request Error: Hostname/IP doesn't match certificate's altnames set false
  staticPath: 'dist',
  proxyPort: 9000,
}

module.exports.defaultConifg = defaultConifg
