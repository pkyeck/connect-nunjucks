# connect-nunjucks

this middleware is based on the [browser-sync-nunjucks](https://github.com/pkyeck/browser-sync-nunjucks) package.

[nunjucks](https://mozilla.github.io/nunjucks/) works with expressjs out of the box, but we wanted to use the module as a middleware for [browser-sync](http://www.browsersync.io/) - so here you go.

## Example use

```javascript
var nunjucksMiddleware = require('connect-nunjucks');

express.use(
  nunjucksMiddleware({
    baseDir: 'src',
    // default extension if non is supplied
    ext: '.html',
    // possible debug values: true, false, 'browser', 'console'
    debug: true,
    // custom nunjuck filters
    filters: require('./custom-filters'),
    context: {
      dataInTemplates: {
        value1: 'whatever'
      }
    }
  })
);

```