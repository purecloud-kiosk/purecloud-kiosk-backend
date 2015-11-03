// gulpfile created by RDash creators
// only slightly modified
var gulp = require('gulp'),
    usemin = require('gulp-usemin'),
    wrap = require('gulp-wrap'),
    connect = require('gulp-connect'),
    watch = require('gulp-watch'),
    minifyCss = require('gulp-minify-css'),
    minifyJs = require('gulp-uglify'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    minifyHTML = require('gulp-minify-html');

var paths = {
    scripts: 'dashboard-src/js/**/*.*',
    styles: 'dashboard-src/less/**/*.*',
    images: 'dashboard-src/img/**/*.*',
    templates: 'dashboard-src/templates/**/*.html',
    index: 'dashboard-src/index.html',
    bower_fonts: 'dashboard-src/bower_components/**/*.{ttf,woff,eof,svg}'
};

/**
 * Handle bower components from index (css)
 */
gulp.task('usemin', function() {
    return gulp.src(paths.index)
        .pipe(usemin({
            css: [minifyCss({keepSpecialComments: 0}), 'concat'],
        }))
        .pipe(gulp.dest('./'));
});

/**
* for some reason, angular files had issue being concatenated after updating to v1.4.3
* so files are just loaded separately, this just moves it to the dist folder
**/
gulp.task('angular', function(){
  var files = [
    'dashboard-src/bower_components/angular/angular.min.js',
    'dashboard-src/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
    'dashboard-src/bower_components/angular-cookies/angular-cookies.min.js',
    'dashboard-src/bower_components/angular-ui-router/release/angular-ui-router.min.js'
  ];
  return gulp.src(files)
    .pipe(gulp.dest('dist/js'));
});
/**
 * Copy assets
 */
gulp.task('build-assets', ['copy-bower_fonts']);

gulp.task('copy-bower_fonts', function() {
    return gulp.src(paths.bower_fonts)
        .pipe(rename({
            dirname: '/fonts'
        }))
        .pipe(gulp.dest('dist/lib'));
});

/**
 * Handle custom files
 */
gulp.task('build-custom', ['custom-images', 'custom-js', 'custom-less', 'custom-templates']);

gulp.task('custom-images', function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest('dist/img'));
});

gulp.task('custom-js', function() {
    return gulp.src(paths.scripts)
        .pipe(minifyJs())
        .pipe(concat('dashboard.min.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('custom-less', function() {
    return gulp.src(paths.styles)
        .pipe(less())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('custom-templates', function() {
    return gulp.src(paths.templates)
        .pipe(minifyHTML())
        .pipe(gulp.dest('dist/templates'));
});

/**
 * Watch custom files
 */
gulp.task('watch', function() {
    gulp.watch([paths.images], ['custom-images']);
    gulp.watch([paths.styles], ['custom-less']);
    gulp.watch([paths.scripts], ['custom-js']);
    gulp.watch([paths.templates], ['custom-templates']);
    gulp.watch([paths.index], ['usemin']);
});

/**
 * Gulp tasks
 */
gulp.task('build', ['usemin', 'build-assets', 'build-custom', 'angular']);
gulp.task('default', ['build', 'watch']);
