var gulp = require("gulp");
var cssnano = require("gulp-cssnano");
var watchify = require("watchify");
var minifyJs = require("gulp-uglify");
var less = require("gulp-less");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");

var watch;

var paths = {
    scripts: "dashboard-src/js/**/*.*",
    styles: "dashboard-src/less/**/*.*",
    images: "dashboard-src/img/**/*.*",
    bower_fonts: "dashboard-src/bower_components/**/*.{ttf,woff,eof,svg}"
};

gulp.task("copy-bower_fonts", function() {
    return gulp.src(paths.bower_fonts)
        .pipe(rename({
            dirname: "/fonts"
        }))
        .pipe(gulp.dest("dist"));
});

gulp.task("custom-images", function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest("dist/img"));
});

gulp.task("compile-less", function() {
    return gulp.src(paths.styles)
        .pipe(less())
        .pipe(cssnano())
        .pipe(concat("dashboard.min.css"))
        .pipe(gulp.dest("dist/css"));
});

gulp.task("lib-css", function(){
  var files = [
    "dashboard-src/bower_components/bootstrap/dist/css/bootstrap.min.css",
    "dashboard-src/bower_components/font-awesome/css/font-awesome.min.css",
    "dashboard-src/bower_components/rdash-ui/dist/css/rdash.min.css",
  ];
  return gulp.src(files)
    .pipe(cssnano())
    .pipe(concat("lib.min.css"))
    .pipe(gulp.dest("dist/css"));
});

gulp.task("lib-js", function(){
  var files = [
    "dashboard-src/cleanUrl.js",
    "dashboard-src/bower_components/jquery/dist/jquery.min.js",
    "dashboard-src/bower_components/bootstrap/dist/js/bootstrap.min.js"
  ];
  return gulp.src(files)
    .pipe(minifyJs())
    .pipe(concat("lib.min.js"))
    .pipe(gulp.dest("dist/js"));
});

// handle file watching

gulp.task("browserify-watch", function(){
  watch = true;
  return browserifyApp();
});

gulp.task("browserify-no-watch", function(){
  watch = false;
  return browserifyApp().once("end", function(){
    process.exit();
  });
})

function browserifyApp(){
  var b = browserify({
    cache : {},
    packageCache : {},
    plugin : [watchify],
    entries : "./dashboard-src/index.jsx",
    extensions : [".jsx"],
    debug : true
  });
  if(watch){
    b = watchify(b);
    bundle(b);
    b.on("update", function(){
      console.log("rebundling...");
      bundle(b);
    });
    b.on("log", function(msg){
      console.log("bundle created");
      console.log(msg);
    });
  }
  else{
    return bundle(b);
  }
}
function bundle(b){
  return b.transform(babelify , {presets : ["es2015", "react"]})
    .bundle()
    .pipe(source("bundle.min.js"))
    .pipe(buffer())
    .pipe(minifyJs())
    .pipe(gulp.dest("dist/js"));
}

gulp.task("compile-external", ["custom-images", "lib-css", "lib-js", "copy-bower_fonts"]);
gulp.task("build", ["compile-external", "compile-less", "browserify-no-watch"]);
gulp.task("watch", ["compile-external", "compile-less", "browserify-watch"], function(){
  gulp.watch(paths.styles, ["compile-less"]);
});
gulp.task("default", ["build"]);
