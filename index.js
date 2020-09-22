const fsExtra   = require('fs-extra');

// Metalsmith
var Metalsmith  = require('metalsmith');
var pug         = require('metalsmith-pug');
var ignore      = require('metalsmith-ignore');
var stylus      = require('metalsmith-stylus');
var serve       = require('metalsmith-serve');
var browserSync = require('metalsmith-browser-sync');
var browserify  = require('metalsmith-browserify');
var babel       = require('metalsmith-babel');

// Empty contents of build
fsExtra.emptyDirSync(__dirname + '/build')

// Metalsmith stuff
Metalsmith(__dirname)
  .metadata({
    title: "Oaklandside voter district tool",
    description: "What is your district?",
    generator: "Metalsmith",
    url: "https://www.oaklandside.org"
  })
  .source('./src')
  .destination('./build')
  .clean(false)
  .use(ignore([
    'includes/*',
    'css/import/*'
  ]))
  .use(pug({useMetadata: true}))
  .use(stylus({
    master: 'site.styl',
    output: 'site.css',
    outputDir: '.'
  }))
  .use(browserSync({
    server: 'build',
    files: ['src/**/*']
  }))
  .use(browserify({
    'entries': [
      'js/app.js'
    ],
    "suppressNotFoundError": true
  }))
  .use(serve())
  .use(babel())
  .build(function(err, files) {
    if (err) { throw err; }
  });
