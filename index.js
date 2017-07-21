'use strict';

var url = require('url');
var path = require('path');
var fs = require('fs');
var nunjucks = require('nunjucks');
var _ = require('lodash');
var debug = require('debug')('nunjucks');

//
//
function CustomFileLoader(opts) {
  this.baseDir = opts.baseDir || '';
  this.modulesPath = opts.modules;
  this.ext = opts.ext;
  this.currentPath = opts.currentPath;

  if (this.currentPath === '/') {
    this.currentPath = '';
  }

  if (path.extname(this.currentPath) !== '') {
    var pos = this.currentPath.lastIndexOf('/');
    this.currentPath = this.currentPath.substring(0, pos);
  }
}

//
//
CustomFileLoader.prototype.getSource = function(name) {
  var original = name;
  var currentPath = path.join(this.baseDir, this.currentPath);

  // remove current path from name (if present)
  if (name.indexOf(currentPath) === 0) {
    name = name.substr(currentPath.length + 1);
  }

  // distinguish between absolute and relative names
  if (name.charAt(0) === '/') {
    name = path.join(this.baseDir, name);
  } else {
    name = path.join(currentPath, name);
  }

  // add missing extension
  var ext = path.extname(name);
  if (ext === '') {
    name += this.ext;
  }

  debug('get source', original, name);

  return {
    src: fs.readFileSync(name).toString(),
    path: name,
    noCache: true
  };
};

//
//
module.exports = function(opt) {
  opt = opt || {};
  var debugError = opt.debug || false;

  var ext = opt.ext || '.html';
  var context = opt.context || {};
  var baseDir = opt.baseDir || __dirname;
  var currentPath = opt.currentPath || baseDir;
  var bsURL = '';
  var modules = opt.modulesDir || '';

  // allow custom nunjucks filter
  var filters = opt.filters || {};
  
  // {
  //   blockStart: '<%',
  //   blockEnd: '%>',
  //   commentStart: '<#',
  //   commentEnd: '#>'
  // }
  var tags = opt.tags || {};

  return function(req, res, next) {
    var reqPath = url.parse(req.url).pathname;
    var file = (reqPath === '/') ? ('/index' + ext) : reqPath;
    var pathname = path.join(baseDir, file);

    if (path.extname(pathname) === ext && fs.existsSync(pathname)) {
      context.query = url.parse(req.url, true).query;
      context.filename = pathname;
      context.ajax = req.headers['x-requested-with'] === 'XMLHttpRequest';

      var env = new nunjucks.Environment(new CustomFileLoader({
        baseDir: baseDir,
        modules: modules,
        ext: ext,
        currentPath: reqPath
      }), {
        watch: false,
        tags
      });

      for (var filterName in filters) {
        env.addFilter(filterName, filters[filterName]);
      }

      env.render(pathname, context, function(err, result) {
        if (err) {
          debug(err);
          debug(err.stack);
          res.writeHead(500);

          if (debugError === true || debugError === 'browser') {
            res.write(err.stack);
          }

          res.end();
          return;
        }

        res.setHeader('Content-Type', 'text/html');
        res.write(result);
        res.end();
      });
    } else {
      next();
    }
  };
};
