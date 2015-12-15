var gulp = require('gulp');
var minifyCss = require('gulp-minify-css');
var minifyJs = require('gulp-uglify');
var less = require('gulp-less');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');


var paths = {
    scripts: 'dashboard-src/js/**/*.*',
    styles: 'dashboard-src/less/**/*.*',
    images: 'dashboard-src/img/**/*.*',
    bower_fonts: 'dashboard-src/bower_components/**/*.{ttf,woff,eof,svg}'
};


gulp.task('copy-bower_fonts', function() {
    return gulp.src(paths.bower_fonts)
        .pipe(rename({
            dirname: '/fonts'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('custom-images', function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest('dist/img'));
});

gulp.task('custom-less', function() {
    return gulp.src(paths.styles)
        .pipe(less())
        .pipe(minifyCss())
        .pipe(concat('dashboard.min.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('lib-css', function(){
  var files = [
    'dashboard-src/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'dashboard-src/bower_components/font-awesome/css/font-awesome.min.css',
    'dashboard-src/bower_components/rdash-ui/dist/css/rdash.min.css',
  ];
  return gulp.src(files)
    .pipe(minifyCss())
    .pipe(concat("lib.min.css"))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('lib-js', function(){
  var files = [
    'dashboard-src/cleanUrl.js',
    'dashboard-src/bower_components/jquery/dist/jquery.min.js',
    'dashboard-src/bower_components/bootstrap/dist/bootstrap.min.js'
  ];
  return gulp.src(files)
    .pipe(minifyJs())
    .pipe(concat('lib.min.js'))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('bundle', function(){
  browserify({
    entries : './dashboard-src/index.jsx',
    extensions : ['.jsx'],
    debug : true
  })
  .transform(babelify , {presets : ['es2015', 'react']})
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('dist/js'));
});

gulp.task('build', ['bundle', 'custom-images', 'custom-less', 'lib-css', 'lib-js', 'copy-bower_fonts']);

gulp.task('default', ['build'])
