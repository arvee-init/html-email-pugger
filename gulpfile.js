const { src, dest, watch, series } = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const inlineCss = require('gulp-inline-css');
const connect = require('gulp-connect');
const cleanCSS = require('gulp-clean-css');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const path = require('path');
const outputDir = 'dist';

function compileSass() {
  return src('src/styles/**/*.scss', { base: 'src/styles' })
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(dest(`${outputDir}/styles`))
}

function compilePug(done) {
  const pugFiles = fs.readdirSync('src/templates').filter(file => path.extname(file) === '.pug');

  Promise.all(
    pugFiles.map(file => {
      const fileName = path.basename(file, '.pug');
      const generalCssContent = fs.readFileSync(`${outputDir}/styles/styles.css`, 'utf8');
      const templateCssPath = `${outputDir}/styles/${fileName}.css`;
      let templateCssContent = '';

      if (fs.existsSync(templateCssPath)) {
        templateCssContent = fs.readFileSync(templateCssPath, 'utf8');
      }

      const combinedCssContent = generalCssContent + templateCssContent;

      return src(`src/templates/${fileName}.pug`)
        .pipe(pug({ locals: { cssContent: combinedCssContent }, pretty: true }))
        .pipe(inlineCss({
          applyStyleTags: true,
          applyLinkTags: true,
          removeStyleTags: false,
          removeLinkTags: true,
          preserveMediaQueries: true,
        }))
        .pipe(dest(`${outputDir}`))
        .pipe(browserSync.stream());
    })
  ).then(() => done());
}

function compileIndexPug() {
  const templates = fs.readdirSync('src/templates').filter(file => path.extname(file) === '.pug');
  return src('src/index.pug')
    .pipe(pug({ locals: { templates }, pretty: true }))
    .pipe(dest(`${outputDir}`))
    .pipe(browserSync.stream());
}

function serve(done) {
  connect.server({
    root: 'dist',
    livereload: true,
  });

  browserSync.init({
    proxy: 'localhost:8080',
  });

  watch('src/templates/**/*.pug', series(compileSass, compilePug, compileIndexPug)).on('change', browserSync.reload);
  watch('src/index.pug', series(compileIndexPug)).on('change', browserSync.reload);
  watch('src/styles/**/*.scss', series(compileSass, compilePug, compileIndexPug)).on('change', browserSync.reload);

  done();
}

exports.default = series(compileSass, compilePug, compileIndexPug, serve);
