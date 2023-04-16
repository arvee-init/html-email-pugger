const { src, dest, watch, series } = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const inlineCss = require('gulp-inline-css');
const connect = require('gulp-connect');
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const path = require('path');
const outputDir = 'dist';

function loadJsonData(jsonPath) {
    if (fs.existsSync(jsonPath)) {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawData);
    }
    return {};
}

function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object') {
        Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
        acc[pre + k] = obj[k];
    }
    return acc;
    }, {});
}


function copyAssets() {
    return src('src/assets/**/*')
      .pipe(dest(`${outputDir}/assets`))
  }
  

function compileSass() {
  return src('src/styles/**/*.scss', { base: 'src/styles' })
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(dest(`${outputDir}/styles`))
}

function compilePug(done) {
        const pugFiles = fs.readdirSync('src/templates').filter(file => path.extname(file) === '.pug');
        const useJsonData = true; // Set this to false to keep variables in the HTML
    
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

            // Load JSON data
            const jsonData = useJsonData ? flattenObject(loadJsonData(`src/data/${fileName}.json`)) : {};

        let pugStream = src(`src/templates/${fileName}.pug`)
            .pipe(pug({ locals: { cssContent: combinedCssContent }, pretty: true }))
            .pipe(inlineCss({
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: false,
            removeLinkTags: true,
            preserveMediaQueries: true,
            }));

        // Replace variables with JSON data if useJsonData is true
        if (useJsonData) {
            Object.entries(jsonData).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            pugStream = pugStream.pipe(replace(regex, value));
            });
        }

        return pugStream
            .pipe(dest(`${outputDir}`))
            .pipe(browserSync.stream());
        })
    ).then(() => done());
}

function compileIndexPug() {
    const templates = fs.readdirSync('src/templates').filter(file => path.extname(file) === '.pug').map(file => {
      const fileName = file.replace('.pug', '');
      const fileStats = fs.statSync(`src/templates/${file}`);
      const creationDate = fileStats.birthtime.toISOString().split('T')[0];
      const hasCss = fs.existsSync(`src/styles/${fileName}.scss`);
      const hasData = fs.existsSync(`src/data/${fileName}.json`);
  
      return {
        name: fileName,
        fileDateCreation: creationDate,
        hasCss,
        hasData,
      };
    });
  
    const useJsonData = true; // Set this to false to keep variables in the HTML
  
    // Load JSON data
    const jsonData = useJsonData ? loadJsonData('src/data/index.json') : {};
  
    return src('src/index.pug')
      .pipe(pug({ locals: { templates, ...jsonData }, pretty: true }))
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

  watch('src/data/**/*.json', series(compileSass, compilePug, compileIndexPug)).on('change', browserSync.reload);
  watch('src/templates/**/*.pug', series(compileSass, compilePug, compileIndexPug)).on('change', browserSync.reload);
  watch('src/index.pug', series(compileIndexPug)).on('change', browserSync.reload);
  watch('src/styles/**/*.scss', series(compileSass, compilePug, compileIndexPug)).on('change', browserSync.reload);
  watch('src/assets/**/*', series(copyAssets)).on('change', browserSync.reload);
  

  done();
}

exports.default = series(compileSass, compilePug, compileIndexPug, copyAssets, serve);
